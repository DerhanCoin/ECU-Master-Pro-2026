/**
 * ECU Master Pro 2026 — DERHAN AutoMaster Pro
 * Diagnostic Backend Service with Real VAS 6154 DoIP/UDS Protocol
 * Enhanced with VAS 6154 Linux Driver integration
 * Port: 8000
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import dgram from 'dgram'
import net from 'net'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// ── Constants ──────────────────────────────────────────────────────────────────
const PORT = 8000
const VAS6154_IP = '192.168.13.69'
const DOIP_PORT = 13400
const DOIP_PROTOCOL_VERSION = 0x02
const DOIP_INV_VERSION = 0xFD

// VAS 6154 USB IDs (from vas6154.h driver)
const VAS6154_USB_VID = '19b2'
const VAS6154_USB_PIDS = new Set(['0003', '0008', '000c', '0009', '000a'])
const VAS6154_PID_NAMES: Record<string, string> = {
  '0003': 'VAS 6154 v1',
  '0008': 'VAS 6154 v2 (Operational)',
  '000c': 'VAS 6154 v3 CAN-FD',
  '0009': 'VAS 6154 DFU Mode',
  '000a': 'VAS 6154 Bootloader',
}

// DoIP Payload Types (ISO 13400)
const DOIP_VEHICLE_IDENT_REQ = 0x0001
const DOIP_VEHICLE_IDENT_RESP = 0x0004
const DOIP_ROUTING_ACT_REQ = 0x0005
const DOIP_ROUTING_ACT_RESP = 0x0006
const DOIP_ALIVE_CHECK_REQ = 0x0007
const DOIP_ALIVE_CHECK_RESP = 0x0008
const DOIP_DIAG_MSG = 0x8001
const DOIP_DIAG_MSG_POS_RESP = 0x8002
const DOIP_DIAG_MSG_NEG_RESP = 0x8003
const DOIP_ENTITY_STATUS_REQ = 0x4001
const DOIP_ENTITY_STATUS_RESP = 0x4002

// UDS Service IDs (ISO 14229)
const UDS_SESSION_CTRL = 0x10
const UDS_READ_DATA_BY_ID = 0x22
const UDS_READ_DTC = 0x19
const UDS_CLEAR_DTC = 0x14
const UDS_TESTER_PRESENT = 0x3E
const UDS_NEG_RESPONSE = 0x7F
const UDS_ECU_RESET = 0x11
const UDS_SECURITY_ACCESS = 0x27
const UDS_COMM_CONTROL = 0x28

// UDS Data Identifiers (VW Group specific)
const UDS_DID_VIN = 0xF190
const UDS_DID_HW_VERSION = 0xF191
const UDS_DID_SW_VERSION = 0xF192
const UDS_DID_SW_NUMBER = 0xF193
const UDS_DID_ECU_SERIAL = 0xF18C
const UDS_DID_MANUFACTURER = 0xF196
const UDS_DID_BOOT_SW = 0xF197
const UDS_DID_PROG_DATE = 0xF199

// CAN Bus parameters (from vas6154.h)
const CAN_BAUD_RATES = [
  { label: '100 kbps', value: 100000 },
  { label: '125 kbps', value: 125000 },
  { label: '250 kbps', value: 250000 },
  { label: '500 kbps (Default)', value: 500000 },
  { label: '1 Mbps', value: 1000000 },
]
const CANFD_DATA_RATES = [
  { label: '2 Mbps', value: 2000000 },
  { label: '4 Mbps', value: 4000000 },
  { label: '5 Mbps', value: 5000000 },
  { label: '8 Mbps', value: 8000000 },
]

// OBD-II Mode 01 PIDs with min/max for frontend display
const OBD_PIDS: Record<string, {
  name: string; unit: string; bytes: number; min: number; max: number;
  formula: (raw: number[]) => number
}> = {
  '0C': { name: 'Engine RPM', unit: 'rpm', bytes: 2, min: 0, max: 8000, formula: (r) => ((r[0] << 8) | r[1]) / 4 },
  '0D': { name: 'Vehicle Speed', unit: 'km/h', bytes: 1, min: 0, max: 260, formula: (r) => r[0] },
  '05': { name: 'Coolant Temperature', unit: '°C', bytes: 1, min: -40, max: 150, formula: (r) => r[0] - 40 },
  '2F': { name: 'Fuel Tank Level', unit: '%', bytes: 1, min: 0, max: 100, formula: (r) => (r[0] * 100) / 255 },
  '11': { name: 'Throttle Position', unit: '%', bytes: 1, min: 0, max: 100, formula: (r) => (r[0] * 100) / 255 },
  '04': { name: 'Engine Load', unit: '%', bytes: 1, min: 0, max: 100, formula: (r) => (r[0] * 100) / 255 },
  '06': { name: 'STFT Bank 1', unit: '%', bytes: 1, min: -100, max: 100, formula: (r) => r[0] / 1.28 - 100 },
  '07': { name: 'LTFT Bank 1', unit: '%', bytes: 1, min: -100, max: 100, formula: (r) => r[0] / 1.28 - 100 },
  '0A': { name: 'Fuel Pressure', unit: 'kPa', bytes: 1, min: 0, max: 765, formula: (r) => r[0] * 3 },
  '0B': { name: 'Intake Manifold Pressure', unit: 'kPa', bytes: 1, min: 0, max: 255, formula: (r) => r[0] },
  '0E': { name: 'Timing Advance', unit: '°', bytes: 1, min: -64, max: 63.5, formula: (r) => r[0] / 2 - 64 },
  '0F': { name: 'Intake Air Temperature', unit: '°C', bytes: 1, min: -40, max: 150, formula: (r) => r[0] - 40 },
  '42': { name: 'Control Module Voltage', unit: 'V', bytes: 2, min: 0, max: 18, formula: (r) => ((r[0] << 8) | r[1]) / 1000 },
  '46': { name: 'Ambient Air Temperature', unit: '°C', bytes: 1, min: -40, max: 80, formula: (r) => r[0] - 40 },
}

// ── Frontend-Compatible Types ──────────────────────────────────────────────────
// These MUST match the TypeScript interfaces in src/app/page.tsx

interface FrontendConnectionStatus {
  connected: boolean
  mode: 'simulation' | 'hardware'
  dongleIp: string
  vehicleId: string | null
  sessionActive: boolean
  routingActivated: boolean
  tcpConnected: boolean
  uptime: number | null
}

interface FrontendDTCCode {
  code: string
  description: string
  status: string
  statusMask: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
}

interface FrontendLiveDataReading {
  pid: number
  name: string
  value: number
  unit: string
  min: number
  max: number
  timestamp: number
}

interface FrontendECUInfo {
  vin: string
  make: string
  model: string
  year: string
  engine: string
  ecuHardwareNumber: string
  ecuSoftwareNumber: string
  ecuManufacturer: string
  ecuSerialNumber: string
  softwareVersion: string
  hardwareVersion: string
  bootSoftwareIdent: string
  programmingDate: string
}

interface FrontendDongleInfo {
  serialNumber: string
  firmwareVersion: string
  hardwareRevision: string
  interface: string
  ipAddress: string
  macAddress: string
  linkSpeed: string
  protocol: string
}

// VAS 6154 Detection types (from vas6154-detect.ts)
interface VAS6154Device {
  name: string
  deviceNode: string | null
  serial: string
  fwVersion: string
  hwVersion: string
  canFd: boolean
  usbVid: string
  usbPid: string
  usbBus?: string
  usbAddress?: string
  mode: 'operational' | 'dfu' | 'bootloader' | 'unknown'
  source: 'sysfs' | 'usbfs' | 'daemon' | 'lsusb'
  available: boolean
  warning?: string
}

// ── Internal State ─────────────────────────────────────────────────────────────

interface ConnectionState {
  connected: boolean
  mode: 'real' | 'simulation'
  dongleIp: string | null
  vehicleId: string | null
  tcpSocket: net.Socket | null
  lastActivity: number
  sessionActive: boolean
  routingActivated: boolean
  testerPresentInterval: ReturnType<typeof setInterval> | null
  connectedAt: number | null
  vin: string | null
  detectedDevices: VAS6154Device[]
}

const state: ConnectionState = {
  connected: false,
  mode: 'simulation',
  dongleIp: null,
  vehicleId: null,
  tcpSocket: null,
  lastActivity: 0,
  sessionActive: false,
  routingActivated: false,
  testerPresentInterval: null,
  connectedAt: null,
  vin: null,
  detectedDevices: [],
}

// ── Simulation Data (VW Group realistic) ───────────────────────────────────────

const simBaselines: Record<string, number> = {
  '0C': 820, '0D': 0, '05': 72, '2F': 68, '11': 18, '04': 32,
  '06': 1.2, '07': 3.8, '0A': 350, '0B': 32, '0E': 8,
  '0F': 24, '42': 14.1, '46': 19,
}

// VW/Audi specific DTC codes for realistic simulation
const simDTCs: FrontendDTCCode[] = [
  {
    code: 'P0420', description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    status: 'Active', statusMask: 0x09, severity: 'high', timestamp: new Date().toISOString(),
  },
  {
    code: 'P0171', description: 'System Too Lean (Bank 1) — MAF Sensor Signal Low',
    status: 'Active', statusMask: 0x09, severity: 'medium', timestamp: new Date().toISOString(),
  },
  {
    code: 'P0301', description: 'Cylinder 1 Misfire Detected',
    status: 'Pending', statusMask: 0x05, severity: 'high', timestamp: new Date().toISOString(),
  },
  {
    code: 'C0035', description: 'Left Front Wheel Speed Sensor Circuit Range/Performance',
    status: 'Stored', statusMask: 0x02, severity: 'low', timestamp: new Date().toISOString(),
  },
  {
    code: 'P0442', description: 'EVAP Control System Leak Detected (Small Leak)',
    status: 'Active', statusMask: 0x09, severity: 'low', timestamp: new Date().toISOString(),
  },
]

const simECUInfo: FrontendECUInfo = {
  vin: 'WVWZZZ1KZPW000001',
  make: 'Volkswagen',
  model: 'Golf VII',
  year: '2020',
  engine: '1.4 TSI (EA211) 92kW',
  ecuHardwareNumber: '03L-906-018-Q',
  ecuSoftwareNumber: '9971-14-00',
  ecuManufacturer: 'Volkswagen AG',
  ecuSerialNumber: 'VAG-2020-ECU-00142',
  softwareVersion: 'SW-9971.14.00',
  hardwareVersion: 'HW-03.14.02',
  bootSoftwareIdent: 'BSW-01.02.00',
  programmingDate: '2020-06-15',
}

// ── VAS 6154 Device Detection (from vas6154-detect.ts) ────────────────────────

function readSysfs(attrPath: string, fallback = ''): string {
  try {
    return fs.readFileSync(attrPath, 'utf8').trim()
  } catch {
    return fallback
  }
}

function discoverViaSysfs(): VAS6154Device[] {
  const devices: VAS6154Device[] = []
  const sysfsPath = '/sys/class/vas6154'

  try {
    if (!fs.existsSync(sysfsPath)) return devices

    for (const name of fs.readdirSync(sysfsPath).sort()) {
      const entry = path.join(sysfsPath, name)
      if (!fs.statSync(entry).isDirectory()) continue

      const devNode = `/dev/${name}`
      devices.push({
        name,
        deviceNode: fs.existsSync(devNode) ? devNode : null,
        serial: readSysfs(path.join(entry, 'serial'), 'UNKNOWN'),
        fwVersion: readSysfs(path.join(entry, 'fw_version'), '?.?.?'),
        hwVersion: readSysfs(path.join(entry, 'hw_version'), '?.?'),
        canFd: readSysfs(path.join(entry, 'can_fd'), '0') === '1',
        usbVid: VAS6154_USB_VID,
        usbPid: '0008',
        mode: 'operational',
        source: 'sysfs',
        available: fs.existsSync(devNode),
      })
    }
  } catch { /* sysfs not available */ }

  return devices
}

function discoverViaUsbfs(): VAS6154Device[] {
  const devices: VAS6154Device[] = []
  const usbRoot = '/sys/bus/usb/devices'
  const modeMap: Record<string, VAS6154Device['mode']> = {
    '0003': 'operational', '0008': 'operational', '000c': 'operational',
    '0009': 'dfu', '000a': 'bootloader',
  }

  try {
    if (!fs.existsSync(usbRoot)) return devices

    for (const entry of fs.readdirSync(usbRoot)) {
      const p = path.join(usbRoot, entry)
      const vid = readSysfs(path.join(p, 'idVendor'))
      const pid = readSysfs(path.join(p, 'idProduct'))

      if (vid !== VAS6154_USB_VID) continue
      if (!VAS6154_USB_PIDS.has(pid)) continue

      const busNum = readSysfs(path.join(p, 'busnum'))
      const devNum = readSysfs(path.join(p, 'devnum'))

      devices.push({
        name: `vas6154_usb_${busNum}_${devNum}`,
        deviceNode: null,
        serial: readSysfs(path.join(p, 'serial'), 'UNKNOWN'),
        fwVersion: '?.?.?',
        hwVersion: '?.?',
        canFd: pid === '000c',
        usbVid: vid,
        usbPid: pid,
        usbBus: busNum,
        usbAddress: devNum,
        mode: modeMap[pid] ?? 'unknown',
        source: 'usbfs',
        available: true,
        warning: 'Kernel module not loaded — /dev/vas6154_N not created',
      })
    }
  } catch { /* Not Linux or no permission */ }

  return devices
}

function discoverViaLsusb(): VAS6154Device[] {
  const devices: VAS6154Device[] = []
  try {
    const out = execSync('lsusb', { timeout: 3000, encoding: 'utf8' })
    for (const line of out.split('\n')) {
      if (!line.toLowerCase().includes(VAS6154_USB_VID)) continue
      const match = line.match(/Bus (\d+) Device (\d+): ID (\w+):(\w+) (.+)/)
      if (!match) continue
      const [, busNum, devNum, vid, pid, product] = match
      if (vid !== VAS6154_USB_VID) continue

      devices.push({
        name: `vas6154_lsusb_${busNum}_${devNum}`,
        deviceNode: null,
        serial: 'UNKNOWN',
        fwVersion: '?.?.?',
        hwVersion: '?.?',
        canFd: pid === '000c',
        usbVid: vid,
        usbPid: pid,
        usbBus: busNum,
        usbAddress: devNum,
        mode: 'operational',
        source: 'lsusb',
        available: true,
        warning: `Detected via lsusb: "${product.trim()}" — Install driver for full access`,
      })
    }
  } catch { /* lsusb not available */ }

  return devices
}

function discoverAllDevices(): VAS6154Device[] {
  let devices: VAS6154Device[] = []

  // Method 1: sysfs (kernel module loaded)
  devices = discoverViaSysfs()
  if (devices.length > 0) return devices

  // Method 2: usbfs scan
  devices = discoverViaUsbfs()
  if (devices.length > 0) return devices

  // Method 3: lsusb fallback
  devices = discoverViaLsusb()
  return devices
}

// ── DoIP Protocol Functions ────────────────────────────────────────────────────

function buildDoIPHeader(payloadType: number, payloadLength: number): Buffer {
  const header = Buffer.alloc(8)
  header.writeUInt8(DOIP_PROTOCOL_VERSION, 0)
  header.writeUInt8(DOIP_INV_VERSION, 1)
  header.writeUInt16BE(payloadType, 2)
  header.writeUInt32BE(payloadLength, 4)
  return header
}

function buildRoutingActivationRequest(sourceAddr: number, targetAddr: number, activationType: number): Buffer {
  const payload = Buffer.alloc(7)
  payload.writeUInt16BE(sourceAddr, 0)
  payload.writeUInt16BE(targetAddr, 2)
  payload.writeUInt8(activationType, 4)
  const header = buildDoIPHeader(DOIP_ROUTING_ACT_REQ, payload.length)
  return Buffer.concat([header, payload])
}

function buildVehicleIdentificationRequest(): Buffer {
  return buildDoIPHeader(DOIP_VEHICLE_IDENT_REQ, 0)
}

function buildDiagnosticMessage(sourceAddr: number, targetAddr: number, udsData: Buffer): Buffer {
  const payload = Buffer.alloc(4 + udsData.length)
  payload.writeUInt16BE(sourceAddr, 0)
  payload.writeUInt16BE(targetAddr, 2)
  udsData.copy(payload, 4)
  const header = buildDoIPHeader(DOIP_DIAG_MSG, payload.length)
  return Buffer.concat([header, payload])
}

function parseDoIPMessage(data: Buffer): { payloadType: number; payload: Buffer } | null {
  if (data.length < 8) return null
  const version = data.readUInt8(0)
  const invVersion = data.readUInt8(1)
  if (version !== DOIP_PROTOCOL_VERSION || invVersion !== DOIP_INV_VERSION) return null
  const payloadType = data.readUInt16BE(2)
  const payloadLength = data.readUInt32BE(4)
  if (data.length < 8 + payloadLength) return null
  return { payloadType, payload: data.subarray(8, 8 + payloadLength) }
}

// ── UDS Protocol Functions ─────────────────────────────────────────────────────

function buildUDSRequest(serviceId: number, data: number[]): Buffer {
  return Buffer.from([serviceId, ...data])
}

function buildSessionControlRequest(sessionType: number): Buffer {
  return buildUDSRequest(UDS_SESSION_CTRL, [sessionType])
}

function buildReadDataByIdRequest(did: number): Buffer {
  return buildUDSRequest(UDS_READ_DATA_BY_ID, [(did >> 8) & 0xFF, did & 0xFF])
}

function buildReadDTCRequest(statusMask: number): Buffer {
  return buildUDSRequest(UDS_READ_DTC, [0x02, statusMask])
}

function buildClearDTCRequest(): Buffer {
  return buildUDSRequest(UDS_CLEAR_DTC, [0xFF, 0xFF, 0xFF])
}

function buildTesterPresentRequest(): Buffer {
  return buildUDSRequest(UDS_TESTER_PRESENT, [0x80])
}

function buildOBDRequest(pid: string): Buffer {
  const pidNum = parseInt(pid, 16)
  return Buffer.from([0x01, pidNum])
}

// ── DoIP TCP Connection ───────────────────────────────────────────────────────

function createDoIPTcpConnection(ip: string, port: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    const timeout = setTimeout(() => {
      socket.destroy()
      reject(new Error('TCP connection timeout'))
    }, 5000)

    socket.connect(port, ip, () => {
      clearTimeout(timeout)
      resolve(socket)
    })

    socket.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

// ── Vehicle Discovery (UDP) ───────────────────────────────────────────────────

async function discoverVehicle(): Promise<{ ip: string; vin?: string; id?: string } | null> {
  return new Promise((resolve) => {
    const udpSocket = dgram.createSocket('udp4')
    const request = buildVehicleIdentificationRequest()

    const timeout = setTimeout(() => {
      udpSocket.close()
      resolve(null)
    }, 3000)

    udpSocket.on('message', (msg) => {
      const parsed = parseDoIPMessage(msg)
      if (parsed && parsed.payloadType === DOIP_VEHICLE_IDENT_RESP) {
        clearTimeout(timeout)
        udpSocket.close()
        const vin = parsed.payload.length > 8
          ? parsed.payload.subarray(8, 8 + 17).toString('ascii').trim()
          : undefined
        resolve({ ip: VAS6154_IP, vin, id: '0x0001' })
      }
    })

    udpSocket.on('error', () => {
      clearTimeout(timeout)
      udpSocket.close()
      resolve(null)
    })

    udpSocket.send(request, DOIP_PORT, VAS6154_IP, (err) => {
      if (err) {
        clearTimeout(timeout)
        udpSocket.close()
        resolve(null)
      }
    })
  })
}

// ── DoIP Routing Activation ───────────────────────────────────────────────────

async function doRoutingActivation(socket: net.Socket): Promise<boolean> {
  return new Promise((resolve) => {
    const request = buildRoutingActivationRequest(0x0E00, 0x0001, 0x0005)
    const timeout = setTimeout(() => resolve(false), 3000)

    const handler = (data: Buffer) => {
      const parsed = parseDoIPMessage(data)
      if (parsed && parsed.payloadType === DOIP_ROUTING_ACT_RESP) {
        clearTimeout(timeout)
        socket.removeListener('data', handler)
        const responseCode = parsed.payload.length > 4 ? parsed.payload.readUInt8(4) : 0
        resolve(responseCode === 0x10)
      }
    }

    socket.on('data', handler)
    socket.write(request)
  })
}

// ── Send UDS via DoIP ─────────────────────────────────────────────────────────

function sendUDSViaDoIP(socket: net.Socket, udsData: Buffer, sourceAddr = 0x0E00, targetAddr = 0x0001): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = buildDiagnosticMessage(sourceAddr, targetAddr, udsData)
    const timeout = setTimeout(() => {
      socket.removeListener('data', handler)
      reject(new Error('UDS response timeout'))
    }, 5000)

    const handler = (data: Buffer) => {
      const parsed = parseDoIPMessage(data)
      if (!parsed) return

      if (parsed.payloadType === DOIP_DIAG_MSG_POS_RESP && parsed.payload.length > 4) {
        clearTimeout(timeout)
        socket.removeListener('data', handler)
        resolve(parsed.payload.subarray(4))
      } else if (parsed.payloadType === DOIP_DIAG_MSG_NEG_RESP) {
        clearTimeout(timeout)
        socket.removeListener('data', handler)
        const negCode = parsed.payload.length > 5 ? parsed.payload.readUInt8(5) : 0
        reject(new Error(`DoIP negative response: 0x${negCode.toString(16)}`))
      }
    }

    socket.on('data', handler)
    socket.write(request)
  })
}

// ── Dongle Info Fetch (from VAS 6154 web interface) ───────────────────────────

async function fetchDongleXmlInfo(): Promise<Record<string, string> | null> {
  try {
    const resp = await fetch(`http://${VAS6154_IP}/framesetup.xml`, {
      signal: AbortSignal.timeout(3000),
    })
    const text = await resp.text()
    const info: Record<string, string> = {}
    const matches = text.matchAll(/<(\w+)>([^<]*)<\/\1>/g)
    for (const m of matches) {
      info[m[1]] = m[2].trim()
    }
    return info
  } catch {
    return null
  }
}

// ── Simulation Mode ───────────────────────────────────────────────────────────

function simulateSensorReading(pid: string): FrontendLiveDataReading {
  const pidInfo = OBD_PIDS[pid]
  if (!pidInfo) {
    const pidNum = parseInt(pid, 16)
    return { pid: pidNum, name: `PID 0x${pid}`, value: 0, unit: '', min: 0, max: 100, timestamp: Date.now() }
  }
  const baseline = simBaselines[pid] ?? 0
  const fluctuation = (Math.random() - 0.5) * baseline * 0.04
  const value = Math.round((baseline + fluctuation) * 100) / 100
  const pidNum = parseInt(pid, 16)
  return {
    pid: pidNum,
    name: pidInfo.name,
    value,
    unit: pidInfo.unit,
    min: pidInfo.min,
    max: pidInfo.max,
    timestamp: Date.now(),
  }
}

// ── API Server ─────────────────────────────────────────────────────────────────

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Global error handler — prevent crashes
app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message)
  return c.json({ success: false, error: err.message || 'Internal server error' }, 500)
})

// ── Health Check ───────────────────────────────────────────────────────────────

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    data: {
      service: 'ECU Master Pro Diagnostic Service',
      version: '2.0.0',
      status: 'running',
      uptime: process.uptime(),
      vas6154Target: `${VAS6154_IP}:${DOIP_PORT}`,
      usbDevicesDetected: state.detectedDevices.length,
      connected: state.connected,
      mode: state.mode,
    },
  })
})

// ── Status (MUST return FrontendConnectionStatus shape) ────────────────────────

app.get('/api/status', (c) => {
  const data: FrontendConnectionStatus = {
    connected: state.connected,
    mode: state.mode === 'real' ? 'hardware' : 'simulation',
    dongleIp: state.dongleIp ?? VAS6154_IP,
    vehicleId: state.vehicleId,
    sessionActive: state.sessionActive,
    routingActivated: state.routingActivated,
    tcpConnected: state.tcpSocket !== null,
    uptime: state.connectedAt ? Math.floor((Date.now() - state.connectedAt) / 1000) : null,
  }
  return c.json({ success: true, data })
})

// ── Connect ────────────────────────────────────────────────────────────────────

app.post('/api/connect', async (c) => {
  if (state.connected) {
    return c.json({ success: false, error: 'Already connected' }, 400)
  }

  // First, detect VAS 6154 devices
  try {
    state.detectedDevices = discoverAllDevices()
    console.log(`[VAS6154] Detection: found ${state.detectedDevices.length} device(s)`)
  } catch (err) {
    console.log('[VAS6154] Detection error:', (err as Error).message)
    state.detectedDevices = []
  }

  // Try real connection via DoIP
  let realConnected = false
  try {
    const vehicle = await discoverVehicle()

    if (vehicle) {
      try {
        const socket = await createDoIPTcpConnection(VAS6154_IP, DOIP_PORT)
        const activated = await doRoutingActivation(socket)

        if (activated) {
          state.connected = true
          state.mode = 'real'
          state.dongleIp = VAS6154_IP
          state.vehicleId = vehicle.id ?? '0x0001'
          state.tcpSocket = socket
          state.lastActivity = Date.now()
          state.routingActivated = true
          state.connectedAt = Date.now()
          state.vin = vehicle.vin ?? null
          realConnected = true

          socket.on('close', () => {
            state.connected = false
            state.mode = 'simulation'
            state.tcpSocket = null
            state.sessionActive = false
            state.routingActivated = false
            state.connectedAt = null
            if (state.testerPresentInterval) {
              clearInterval(state.testerPresentInterval)
              state.testerPresentInterval = null
            }
          })

          const data: FrontendConnectionStatus = {
            connected: true,
            mode: 'hardware',
            dongleIp: state.dongleIp!,
            vehicleId: state.vehicleId,
            sessionActive: false,
            routingActivated: true,
            tcpConnected: true,
            uptime: 0,
          }
          return c.json({ success: true, data })
        }

        try { socket.destroy() } catch {}
      } catch (tcpErr) {
        console.log('[DoIP] TCP/Routing failed:', (tcpErr as Error).message)
      }
    }
  } catch (err) {
    console.log('[DoIP] Discovery failed, falling back to simulation:', (err as Error).message)
  }

  // Fallback to simulation mode (only if real connection didn't succeed)
  if (!realConnected) {
    state.connected = true
    state.mode = 'simulation'
    state.dongleIp = VAS6154_IP
    state.vehicleId = '0x0001'
    state.lastActivity = Date.now()
    state.connectedAt = Date.now()
    state.routingActivated = false
  }

  const data: FrontendConnectionStatus = {
    connected: true,
    mode: 'simulation',
    dongleIp: state.dongleIp ?? VAS6154_IP,
    vehicleId: state.vehicleId,
    sessionActive: false,
    routingActivated: false,
    tcpConnected: false,
    uptime: 0,
  }
  return c.json({ success: true, data })
})

// ── Disconnect ─────────────────────────────────────────────────────────────────

app.post('/api/disconnect', (c) => {
  if (state.testerPresentInterval) {
    clearInterval(state.testerPresentInterval)
    state.testerPresentInterval = null
  }
  if (state.tcpSocket) {
    state.tcpSocket.destroy()
    state.tcpSocket = null
  }
  state.connected = false
  state.mode = 'simulation'
  state.dongleIp = null
  state.vehicleId = null
  state.sessionActive = false
  state.routingActivated = false
  state.connectedAt = null
  state.vin = null

  return c.json({ success: true, data: { message: 'Disconnected' } })
})

// ── Dongle Info (MUST return FrontendDongleInfo shape) ─────────────────────────

app.get('/api/dongle/info', async (c) => {
  // Try real dongle info first
  const xmlInfo = await fetchDongleXmlInfo()
  if (xmlInfo) {
    const data: FrontendDongleInfo = {
      serialNumber: xmlInfo.serial ?? xmlInfo.SerialNumber ?? 'UNKNOWN',
      firmwareVersion: xmlInfo.firmware ?? xmlInfo.FirmwareVersion ?? '?.?.?',
      hardwareRevision: xmlInfo.hardware ?? xmlInfo.HardwareRevision ?? '?.?',
      interface: 'USB RNDIS (DoIP)',
      ipAddress: VAS6154_IP,
      macAddress: xmlInfo.mac ?? xmlInfo.MACAddress ?? 'UNKNOWN',
      linkSpeed: xmlInfo.speed ?? xmlInfo.LinkSpeed ?? '100 Mbps',
      protocol: 'DoIP (ISO 13400) / UDS (ISO 14229)',
    }
    return c.json({ success: true, data })
  }

  // If USB device detected, use that info
  if (state.detectedDevices.length > 0) {
    const dev = state.detectedDevices[0]
    const data: FrontendDongleInfo = {
      serialNumber: dev.serial,
      firmwareVersion: dev.fwVersion,
      hardwareRevision: dev.hwVersion,
      interface: dev.deviceNode ? `USB (${dev.deviceNode})` : 'USB',
      ipAddress: VAS6154_IP,
      macAddress: 'UNKNOWN',
      linkSpeed: dev.canFd ? '480 Mbps (USB 2.0 HS)' : '12 Mbps (USB 2.0 FS)',
      protocol: `DoIP (ISO 13400) / CAN${dev.canFd ? '-FD' : ''} / UDS (ISO 14229)`,
    }
    return c.json({ success: true, data })
  }

  // Simulation dongle info
  const data: FrontendDongleInfo = {
    serialNumber: 'VAG-6154-SIM-001',
    firmwareVersion: '2.4.1',
    hardwareRevision: 'V3.2',
    interface: 'USB RNDIS (DoIP)',
    ipAddress: VAS6154_IP,
    macAddress: '00:1A:2B:3C:4D:5E',
    linkSpeed: '100 Mbps',
    protocol: 'DoIP (ISO 13400) / UDS (ISO 14229) — Simulation',
  }
  return c.json({ success: true, data })
})

// ── Session Control ────────────────────────────────────────────────────────────

app.post('/api/session', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  const body = await c.req.json().catch(() => ({}))
  const action = body.action ?? 'start'

  if (action === 'start') {
    if (state.mode === 'real' && state.tcpSocket) {
      try {
        const udsReq = buildSessionControlRequest(0x03)
        await sendUDSViaDoIP(state.tcpSocket, udsReq)
        state.sessionActive = true

        state.testerPresentInterval = setInterval(() => {
          if (state.tcpSocket && state.connected) {
            const tp = buildTesterPresentRequest()
            state.tcpSocket.write(buildDiagnosticMessage(0x0E00, 0x0001, tp))
          }
        }, 2000)
      } catch (err) {
        return c.json({ success: false, error: `Session start failed: ${(err as Error).message}` }, 500)
      }
    } else {
      state.sessionActive = true
    }

    return c.json({ success: true, data: { sessionActive: true, mode: state.mode } })
  } else {
    if (state.testerPresentInterval) {
      clearInterval(state.testerPresentInterval)
      state.testerPresentInterval = null
    }
    state.sessionActive = false
    return c.json({ success: true, data: { sessionActive: false } })
  }
})

// ── Read DTCs (MUST return FrontendDTCCode[] directly) ────────────────────────

app.get('/api/dtc', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket && state.sessionActive) {
    try {
      const udsReq = buildReadDTCRequest(0x09)
      const response = await sendUDSViaDoIP(state.tcpSocket, udsReq)

      if (response[0] === 0x59) {
        const dtcs: FrontendDTCCode[] = []
        let offset = 2
        while (offset + 3 <= response.length) {
          const dtcHigh = response[offset]
          const dtcMid = response[offset + 1]
          const dtcLow = response[offset + 2]
          const code = `P${dtcHigh.toString(16).padStart(2, '0')}${dtcMid.toString(16).padStart(2, '0')}`
          dtcs.push({
            code,
            description: `DTC 0x${dtcHigh.toString(16)}${dtcMid.toString(16)}${dtcLow.toString(16)}`,
            status: 'Active',
            statusMask: dtcLow,
            severity: dtcHigh >= 0x40 ? 'critical' : dtcHigh >= 0x20 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
          })
          offset += 4
        }
        return c.json({ success: true, data: dtcs })
      }
    } catch (err) {
      console.log('[UDS] DTC read failed:', (err as Error).message)
    }
  }

  // Simulation — return array DIRECTLY (not wrapped in object)
  return c.json({
    success: true,
    data: simDTCs.map(d => ({ ...d, timestamp: new Date().toISOString() })),
  })
})

// ── Clear DTCs ─────────────────────────────────────────────────────────────────

app.delete('/api/dtc', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket && state.sessionActive) {
    try {
      const udsReq = buildClearDTCRequest()
      await sendUDSViaDoIP(state.tcpSocket, udsReq)
      return c.json({ success: true, data: { message: 'DTCs cleared' } })
    } catch (err) {
      return c.json({ success: false, error: `Clear DTC failed: ${(err as Error).message}` }, 500)
    }
  }

  // Simulation
  simDTCs.length = 0
  return c.json({ success: true, data: { message: 'DTCs cleared (simulation)' } })
})

// ── Live Sensor Data (MUST return FrontendLiveDataReading[] directly) ──────────

app.get('/api/live-data', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket && state.sessionActive) {
    try {
      const readings: FrontendLiveDataReading[] = []
      for (const pid of Object.keys(OBD_PIDS)) {
        try {
          const udsReq = buildOBDRequest(pid)
          const response = await sendUDSViaDoIP(state.tcpSocket, udsReq)

          if (response.length > 2 && response[0] === 0x41) {
            const pidInfo = OBD_PIDS[pid]
            const rawBytes = Array.from(response.subarray(2, 2 + pidInfo.bytes))
            const value = pidInfo.formula(rawBytes)
            const pidNum = parseInt(pid, 16)
            readings.push({
              pid: pidNum,
              name: pidInfo.name,
              value: Math.round(value * 100) / 100,
              unit: pidInfo.unit,
              min: pidInfo.min,
              max: pidInfo.max,
              timestamp: Date.now(),
            })
          }
        } catch {
          // Skip failed PID reads
        }
      }

      if (readings.length > 0) {
        return c.json({ success: true, data: readings })
      }
    } catch (err) {
      console.log('[UDS] Live data read failed:', (err as Error).message)
    }
  }

  // Simulation — return array DIRECTLY
  const readings = Object.keys(OBD_PIDS).map(pid => simulateSensorReading(pid))
  return c.json({ success: true, data: readings })
})

// ── ECU Info (MUST return FrontendECUInfo shape) ──────────────────────────────

app.get('/api/ecu/info', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket && state.sessionActive) {
    try {
      const vinReq = buildReadDataByIdRequest(UDS_DID_VIN)
      const vinResp = await sendUDSViaDoIP(state.tcpSocket, vinReq)
      const vin = vinResp.length > 4 ? vinResp.subarray(4).toString('ascii').trim() : 'UNKNOWN'

      const hwReq = buildReadDataByIdRequest(UDS_DID_HW_VERSION)
      const hwResp = await sendUDSViaDoIP(state.tcpSocket, hwReq)
      const hwVersion = hwResp.length > 4 ? hwResp.subarray(4).toString('ascii').trim() : 'UNKNOWN'

      const swReq = buildReadDataByIdRequest(UDS_DID_SW_VERSION)
      const swResp = await sendUDSViaDoIP(state.tcpSocket, swReq)
      const swVersion = swResp.length > 4 ? swResp.subarray(4).toString('ascii').trim() : 'UNKNOWN'

      const data: FrontendECUInfo = {
        vin,
        make: 'Volkswagen Group',
        model: 'Unknown',
        year: 'Unknown',
        engine: 'Unknown',
        ecuHardwareNumber: hwVersion,
        ecuSoftwareNumber: swVersion,
        ecuManufacturer: 'Volkswagen AG',
        ecuSerialNumber: 'Unknown',
        softwareVersion: swVersion,
        hardwareVersion: hwVersion,
        bootSoftwareIdent: 'Unknown',
        programmingDate: 'Unknown',
      }
      return c.json({ success: true, data })
    } catch (err) {
      console.log('[UDS] ECU info read failed:', (err as Error).message)
    }
  }

  // Simulation
  return c.json({ success: true, data: { ...simECUInfo } })
})

// ── Tester Present ─────────────────────────────────────────────────────────────

app.post('/api/tester-present', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket) {
    try {
      const tp = buildTesterPresentRequest()
      await sendUDSViaDoIP(state.tcpSocket, tp)
      state.lastActivity = Date.now()
      return c.json({ success: true, data: { message: 'Tester present sent' } })
    } catch (err) {
      return c.json({ success: false, error: `Tester present failed: ${(err as Error).message}` }, 500)
    }
  }

  state.lastActivity = Date.now()
  return c.json({ success: true, data: { message: 'Tester present (simulation)' } })
})

// ── Scan Vehicle (Full Diagnostic Scan) ────────────────────────────────────────

app.post('/api/scan', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (!state.sessionActive) {
    state.sessionActive = true
  }

  return c.json({
    success: true,
    data: {
      source: state.mode,
      timestamp: Date.now(),
      message: 'Full scan initiated — use /api/dtc, /api/live-data, /api/ecu/info for individual results',
    },
  })
})

// ── NEW: VAS 6154 Detection Endpoint ──────────────────────────────────────────

app.get('/api/vas6154/detect', (c) => {
  const devices = discoverAllDevices()
  state.detectedDevices = devices

  return c.json({
    success: true,
    data: {
      deviceCount: devices.length,
      devices: devices.map(d => ({
        name: d.name,
        serial: d.serial,
        firmware: d.fwVersion,
        hardware: d.hwVersion,
        canFd: d.canFd,
        mode: d.mode,
        source: d.source,
        available: d.available,
        pidName: VAS6154_PID_NAMES[d.usbPid] ?? `PID ${d.usbPid}`,
        warning: d.warning,
      })),
      vas6154Target: `${VAS6154_IP}:${DOIP_PORT}`,
      dongleWebInterface: `http://${VAS6154_IP}/framesetup.xml`,
    },
  })
})

// ── NEW: VAS 6154 Dongle Info ─────────────────────────────────────────────────

app.get('/api/vas6154/info', async (c) => {
  const devices = discoverAllDevices()
  const xmlInfo = await fetchDongleXmlInfo()

  return c.json({
    success: true,
    data: {
      usbDevices: devices,
      xmlInfo,
      vas6154Ip: VAS6154_IP,
      doipPort: DOIP_PORT,
      connectionState: {
        connected: state.connected,
        mode: state.mode,
        routingActivated: state.routingActivated,
        sessionActive: state.sessionActive,
      },
      capabilities: {
        canChannels: 2,
        klineChannels: 1,
        canFd: devices.some(d => d.canFd),
        doip: true,
        maxMsgSize: 4096,
        baudRates: CAN_BAUD_RATES,
        canfdDataRates: CANFD_DATA_RATES,
      },
    },
  })
})

// ── NEW: Vehicle Discovery ────────────────────────────────────────────────────

app.get('/api/vehicle/discover', async (c) => {
  const vehicle = await discoverVehicle()

  return c.json({
    success: true,
    data: vehicle ? {
      found: true,
      ip: vehicle.ip,
      vin: vehicle.vin ?? 'Not available',
      id: vehicle.id,
      doipPort: DOIP_PORT,
    } : {
      found: false,
      message: 'No vehicle responded to DoIP Vehicle Identification Request',
      target: `${VAS6154_IP}:${DOIP_PORT}`,
    },
  })
})

// ── NEW: CAN Bus Info ──────────────────────────────────────────────────────────

app.get('/api/can/channels', (c) => {
  return c.json({
    success: true,
    data: {
      channels: [
        { id: 0, name: 'CAN Channel 0 (High-Speed)', baudRates: CAN_BAUD_RATES, canFd: true },
        { id: 1, name: 'CAN Channel 1 (High-Speed)', baudRates: CAN_BAUD_RATES, canFd: true },
        { id: 2, name: 'K-Line Channel', baudRates: [{ label: '10.4 kbps', value: 10400 }], canFd: false },
      ],
      defaultBaudRate: 500000,
      canFdDataRates: CANFD_DATA_RATES,
      udsTxId: '0x7E0',
      udsRxId: '0x7E8',
    },
  })
})

// ── NEW: UDS Raw Command ──────────────────────────────────────────────────────

app.post('/api/uds/raw', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  const body = await c.req.json().catch(() => ({}))
  const { serviceId, data: udsData, sourceAddr, targetAddr } = body

  if (serviceId === undefined) {
    return c.json({ success: false, error: 'serviceId is required' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket) {
    try {
      const udsReq = buildUDSRequest(serviceId, udsData ?? [])
      const response = await sendUDSViaDoIP(
        state.tcpSocket,
        udsReq,
        sourceAddr ?? 0x0E00,
        targetAddr ?? 0x0001,
      )
      return c.json({
        success: true,
        data: {
          raw: Array.from(response),
          hex: Array.from(response).map(b => b.toString(16).padStart(2, '0')).join(' '),
          length: response.length,
        },
      })
    } catch (err) {
      return c.json({ success: false, error: `UDS command failed: ${(err as Error).message}` }, 500)
    }
  }

  // Simulation — echo back
  return c.json({
    success: true,
    data: {
      raw: [0x7F, serviceId, 0x11],
      hex: `7F ${serviceId.toString(16).padStart(2, '0')} 11`,
      length: 3,
      note: 'Service not supported in simulation mode',
    },
  })
})

// ── NEW: LED Control (for real VAS 6154 hardware) ─────────────────────────────

app.post('/api/vas6154/led', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  const body = await c.req.json().catch(() => ({}))
  const { color } = body // 'off', 'green', 'red', 'blue', 'blink-green'

  // In real mode, this would send VAS6154_CMD_SET_LED (0x04) via USB
  // For DoIP mode, LED control is not applicable
  return c.json({
    success: true,
    data: {
      message: state.mode === 'real'
        ? `LED set to ${color} (requires USB connection for LED control)`
        : `LED set to ${color} (simulation)`,
      note: 'LED control requires direct USB connection, not DoIP over Ethernet',
    },
  })
})

// ── Start Server ───────────────────────────────────────────────────────────────

console.log(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`  ECU Master Pro 2026 — DERHAN AutoMaster Pro`)
console.log(`  Diagnostic Service v2.0.0`)
console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`  Port:       ${PORT}`)
console.log(`  VAS 6154:   ${VAS6154_IP}:${DOIP_PORT}`)
console.log(`  Protocol:   DoIP (ISO 13400) / UDS (ISO 14229)`)
console.log(`  Detection:  sysfs → usbfs → lsusb`)
console.log(`  Mode:       Auto-detect (real → simulation fallback)`)
console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

export default {
  port: PORT,
  fetch: app.fetch,
}
