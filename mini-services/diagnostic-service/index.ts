/**
 * ECU Master Pro 2026 — Diagnostic Backend Service
 * Real VAS 6154 DoIP/UDS protocol communication
 * Port: 8000
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import dgram from 'dgram'
import net from 'net'

// ── Constants ──────────────────────────────────────────────────────────────────
const PORT = 8000
const VAS6154_IP = '192.168.13.69'
const DOIP_PORT = 13400
const DOIP_PROTOCOL_VERSION = 0x02
const DOIP_INV_VERSION = 0xFD

// DoIP Payload Types
const DOIP_VEHICLE_IDENT_REQ = 0x0001
const DOIP_VEHICLE_IDENT_RESP = 0x0004
const DOIP_ROUTING_ACT_REQ = 0x0005
const DOIP_ROUTING_ACT_RESP = 0x0006
const DOIP_ALIVE_CHECK_REQ = 0x0007
const DOIP_ALIVE_CHECK_RESP = 0x0008
const DOIP_DIAG_MSG = 0x8001
const DOIP_DIAG_MSG_POS_RESP = 0x8002
const DOIP_DIAG_MSG_NEG_RESP = 0x8003

// UDS Service IDs
const UDS_SESSION_CTRL = 0x10
const UDS_READ_DATA_BY_ID = 0x22
const UDS_READ_DTC = 0x19
const UDS_CLEAR_DTC = 0x14
const UDS_TESTER_PRESENT = 0x3E
const UDS_NEG_RESPONSE = 0x7F

// UDS Data Identifiers
const UDS_DID_VIN = 0xF190
const UDS_DID_HW_VERSION = 0xF191
const UDS_DID_SW_VERSION = 0xF192

// OBD-II Mode 01 PIDs
const OBD_PIDS: Record<string, { name: string; unit: string; bytes: number; formula: (raw: number[]) => number }> = {
  '0C': { name: 'Engine RPM', unit: 'rpm', bytes: 2, formula: (r) => ((r[0] << 8) | r[1]) / 4 },
  '0D': { name: 'Vehicle Speed', unit: 'km/h', bytes: 1, formula: (r) => r[0] },
  '05': { name: 'Coolant Temp', unit: '°C', bytes: 1, formula: (r) => r[0] - 40 },
  '2F': { name: 'Fuel Level', unit: '%', bytes: 1, formula: (r) => (r[0] * 100) / 255 },
  '11': { name: 'Throttle Position', unit: '%', bytes: 1, formula: (r) => (r[0] * 100) / 255 },
  '04': { name: 'Engine Load', unit: '%', bytes: 1, formula: (r) => (r[0] * 100) / 255 },
  '06': { name: 'STFT B1', unit: '%', bytes: 1, formula: (r) => r[0] / 1.28 - 100 },
  '07': { name: 'LTFT B1', unit: '%', bytes: 1, formula: (r) => r[0] / 1.28 - 100 },
  '0A': { name: 'Fuel Pressure', unit: 'kPa', bytes: 1, formula: (r) => r[0] * 3 },
  '0B': { name: 'MAP', unit: 'kPa', bytes: 1, formula: (r) => r[0] },
  '0E': { name: 'Timing Advance', unit: '°', bytes: 1, formula: (r) => r[0] / 2 - 64 },
  '0F': { name: 'Intake Air Temp', unit: '°C', bytes: 1, formula: (r) => r[0] - 40 },
  '42': { name: 'Module Voltage', unit: 'V', bytes: 2, formula: (r) => ((r[0] << 8) | r[1]) / 1000 },
  '46': { name: 'Ambient Temp', unit: '°C', bytes: 1, formula: (r) => r[0] - 40 },
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ConnectionState {
  connected: boolean
  mode: 'real' | 'simulation'
  dongleIp: string | null
  vehicleId: string | null
  tcpSocket: net.Socket | null
  lastActivity: number
  sessionActive: boolean
  testerPresentInterval: ReturnType<typeof setInterval> | null
}

interface SensorReading {
  pid: string
  name: string
  value: number
  unit: string
  timestamp: number
}

interface DTCCode {
  code: string
  description: string
  status: string
  severity: 'critical' | 'warning' | 'info'
}

// ── State ──────────────────────────────────────────────────────────────────────
const state: ConnectionState = {
  connected: false,
  mode: 'simulation',
  dongleIp: null,
  vehicleId: null,
  tcpSocket: null,
  lastActivity: 0,
  sessionActive: false,
  testerPresentInterval: null,
}

// Simulation baseline values
const simBaselines: Record<string, number> = {
  '0C': 3240, '0D': 87, '05': 89, '2F': 72, '11': 34, '04': 45,
  '06': 2.4, '07': 5.2, '0A': 350, '0B': 98, '0E': 12,
  '0F': 38, '42': 14.2, '46': 22,
}

const simDTCs: DTCCode[] = [
  { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold (Bank 1)', status: 'Active', severity: 'critical' },
  { code: 'P0171', description: 'System Too Lean (Bank 1)', status: 'Active', severity: 'warning' },
  { code: 'C0035', description: 'Left Front Wheel Speed Sensor Circuit', status: 'Pending', severity: 'warning' },
  { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', status: 'Active', severity: 'critical' },
]

// ── DoIP Protocol ──────────────────────────────────────────────────────────────

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
  // Reserved 4 bytes = 0
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

// ── UDS Protocol ───────────────────────────────────────────────────────────────

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
  return Buffer.from([0x01, pidNum]) // Mode 01 + PID
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
        resolve({
          ip: VAS6154_IP,
          vin,
          id: '0x0001',
        })
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
        resolve(responseCode === 0x10) // Routing successfully activated
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
        resolve(parsed.payload.subarray(4)) // UDS response data
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

// ── Dongle Info Fetch ─────────────────────────────────────────────────────────

async function fetchDongleInfo(): Promise<Record<string, string> | null> {
  try {
    const resp = await fetch(`http://${VAS6154_IP}/framesetup.xml`, {
      signal: AbortSignal.timeout(3000),
    })
    const text = await resp.text()
    const info: Record<string, string> = {}
    // Parse simple XML key-value pairs
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

function simulateSensorReading(pid: string): SensorReading {
  const pidInfo = OBD_PIDS[pid]
  if (!pidInfo) {
    return { pid, name: `PID 0x${pid}`, value: 0, unit: '', timestamp: Date.now() }
  }
  const baseline = simBaselines[pid] ?? 0
  const fluctuation = (Math.random() - 0.5) * baseline * 0.04
  const value = Math.round((baseline + fluctuation) * 100) / 100
  return {
    pid,
    name: pidInfo.name,
    value,
    unit: pidInfo.unit,
    timestamp: Date.now(),
  }
}

// ── API Server ─────────────────────────────────────────────────────────────────

const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ── Status ─────────────────────────────────────────────────────────────────────

app.get('/api/status', (c) => {
  return c.json({
    success: true,
    data: {
      service: 'ECU Master Pro Diagnostic Service',
      version: '1.0.0',
      connected: state.connected,
      mode: state.mode,
      dongleIp: state.dongleIp,
      vehicleId: state.vehicleId,
      sessionActive: state.sessionActive,
      uptime: process.uptime(),
      vas6154Target: `${VAS6154_IP}:${DOIP_PORT}`,
    },
  })
})

// ── Connect ────────────────────────────────────────────────────────────────────

app.post('/api/connect', async (c) => {
  if (state.connected) {
    return c.json({ success: false, error: 'Already connected' }, 400)
  }

  // Try real connection first
  try {
    // Step 1: Vehicle discovery via UDP
    const vehicle = await discoverVehicle()

    if (vehicle) {
      // Step 2: TCP connection + Routing Activation
      const socket = await createDoIPTcpConnection(VAS6154_IP, DOIP_PORT)
      const activated = await doRoutingActivation(socket)

      if (activated) {
        state.connected = true
        state.mode = 'real'
        state.dongleIp = VAS6154_IP
        state.vehicleId = vehicle.id ?? '0x0001'
        state.tcpSocket = socket
        state.lastActivity = Date.now()

        // Handle socket close
        socket.on('close', () => {
          state.connected = false
          state.mode = 'simulation'
          state.tcpSocket = null
          state.sessionActive = false
          if (state.testerPresentInterval) {
            clearInterval(state.testerPresentInterval)
            state.testerPresentInterval = null
          }
        })

        return c.json({
          success: true,
          data: {
            mode: 'real',
            dongleIp: state.dongleIp,
            vehicleId: state.vehicleId,
            vin: vehicle.vin,
            message: 'Connected to VAS 6154 via DoIP protocol',
          },
        })
      }

      socket.destroy()
    }
  } catch (err) {
    console.log('[DoIP] Real connection failed, falling back to simulation:', (err as Error).message)
  }

  // Fallback to simulation mode
  state.connected = true
  state.mode = 'simulation'
  state.dongleIp = VAS6154_IP
  state.vehicleId = '0x0001'
  state.lastActivity = Date.now()

  return c.json({
    success: true,
    data: {
      mode: 'simulation',
      dongleIp: state.dongleIp,
      vehicleId: state.vehicleId,
      message: 'VAS 6154 not reachable — connected in simulation mode',
    },
  })
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

  return c.json({ success: true, data: { message: 'Disconnected' } })
})

// ── Dongle Info ────────────────────────────────────────────────────────────────

app.get('/api/dongle/info', async (c) => {
  const info = await fetchDongleInfo()
  if (info) {
    return c.json({ success: true, data: { source: 'real', ...info } })
  }
  // Return simulation dongle info
  return c.json({
    success: true,
    data: {
      source: 'simulation',
      device: 'VAS 6154',
      firmware: '2.4.1',
      serial: 'VAG-6154-SIM-001',
      ip: VAS6154_IP,
      protocol: 'DoIP (ISO 13400)',
      status: 'Simulation Mode',
    },
  })
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
        // Send Extended Diagnostic Session (0x03)
        const udsReq = buildSessionControlRequest(0x03)
        await sendUDSViaDoIP(state.tcpSocket, udsReq)
        state.sessionActive = true

        // Start tester present keepalive
        state.testerPresentInterval = setInterval(() => {
          if (state.tcpSocket && state.connected) {
            const tp = buildTesterPresentRequest()
            buildDiagnosticMessage(0x0E00, 0x0001, tp)
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
    // Stop session
    if (state.testerPresentInterval) {
      clearInterval(state.testerPresentInterval)
      state.testerPresentInterval = null
    }
    state.sessionActive = false
    return c.json({ success: true, data: { sessionActive: false } })
  }
})

// ── Read DTCs ──────────────────────────────────────────────────────────────────

app.get('/api/dtc', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket && state.sessionActive) {
    try {
      const udsReq = buildReadDTCRequest(0x09) // All DTCs
      const response = await sendUDSViaDoIP(state.tcpSocket, udsReq)

      // Parse UDS DTC response
      if (response[0] === 0x59) {
        const dtcs: DTCCode[] = []
        let offset = 2 // Skip service ID + status mask
        while (offset + 3 <= response.length) {
          const dtcHigh = response[offset]
          const dtcMid = response[offset + 1]
          const dtcLow = response[offset + 2]
          const code = `P${dtcHigh.toString(16).padStart(2, '0')}${dtcMid.toString(16).padStart(2, '0')}`
          dtcs.push({
            code,
            description: `DTC 0x${dtcHigh.toString(16)}${dtcMid.toString(16)}${dtcLow.toString(16)}`,
            status: 'Active',
            severity: dtcHigh >= 0x40 ? 'critical' : 'warning',
          })
          offset += 4
        }
        return c.json({ success: true, data: { source: 'real', dtcs } })
      }
    } catch (err) {
      console.log('[UDS] DTC read failed:', (err as Error).message)
    }
  }

  // Simulation
  return c.json({
    success: true,
    data: {
      source: 'simulation',
      dtcs: simDTCs.map(d => ({ ...d })),
    },
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
      return c.json({ success: true, data: { message: 'DTCs cleared', source: 'real' } })
    } catch (err) {
      return c.json({ success: false, error: `Clear DTC failed: ${(err as Error).message}` }, 500)
    }
  }

  // Simulation
  simDTCs.length = 0
  return c.json({ success: true, data: { message: 'DTCs cleared (simulation)', source: 'simulation' } })
})

// ── Live Sensor Data ───────────────────────────────────────────────────────────

app.get('/api/live-data', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket && state.sessionActive) {
    try {
      const readings: SensorReading[] = []
      for (const pid of Object.keys(OBD_PIDS)) {
        try {
          const udsReq = buildOBDRequest(pid)
          const response = await sendUDSViaDoIP(state.tcpSocket, udsReq)

          if (response.length > 2 && response[0] === 0x41) {
            const pidInfo = OBD_PIDS[pid]
            const rawBytes = Array.from(response.subarray(2, 2 + pidInfo.bytes))
            const value = pidInfo.formula(rawBytes)
            readings.push({
              pid,
              name: pidInfo.name,
              value: Math.round(value * 100) / 100,
              unit: pidInfo.unit,
              timestamp: Date.now(),
            })
          }
        } catch {
          // Skip failed PID reads
        }
      }

      if (readings.length > 0) {
        return c.json({ success: true, data: { source: 'real', sensors: readings } })
      }
    } catch (err) {
      console.log('[UDS] Live data read failed:', (err as Error).message)
    }
  }

  // Simulation
  const readings = Object.keys(OBD_PIDS).map(pid => simulateSensorReading(pid))
  return c.json({
    success: true,
    data: { source: 'simulation', sensors: readings },
  })
})

// ── ECU Info ───────────────────────────────────────────────────────────────────

app.get('/api/ecu/info', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  if (state.mode === 'real' && state.tcpSocket && state.sessionActive) {
    try {
      // Read VIN
      const vinReq = buildReadDataByIdRequest(UDS_DID_VIN)
      const vinResp = await sendUDSViaDoIP(state.tcpSocket, vinReq)
      const vin = vinResp.length > 4 ? vinResp.subarray(4).toString('ascii').trim() : 'UNKNOWN'

      // Read HW version
      const hwReq = buildReadDataByIdRequest(UDS_DID_HW_VERSION)
      const hwResp = await sendUDSViaDoIP(state.tcpSocket, hwReq)
      const hwVersion = hwResp.length > 4 ? hwResp.subarray(4).toString('ascii').trim() : 'UNKNOWN'

      // Read SW version
      const swReq = buildReadDataByIdRequest(UDS_DID_SW_VERSION)
      const swResp = await sendUDSViaDoIP(state.tcpSocket, swReq)
      const swVersion = swResp.length > 4 ? swResp.subarray(4).toString('ascii').trim() : 'UNKNOWN'

      return c.json({
        success: true,
        data: {
          source: 'real',
          vin,
          hardwareVersion: hwVersion,
          softwareVersion: swVersion,
          protocol: 'DoIP / UDS',
          sourceAddress: '0x0E00',
          targetAddress: '0x0001',
        },
      })
    } catch (err) {
      console.log('[UDS] ECU info read failed:', (err as Error).message)
    }
  }

  // Simulation
  return c.json({
    success: true,
    data: {
      source: 'simulation',
      vin: 'WVWZZZ1KZPW000001',
      hardwareVersion: 'HW-03.14.02',
      softwareVersion: 'SW-9971.14.00',
      ecuName: 'MED17.5',
      manufacturer: 'Volkswagen AG',
      protocol: 'DoIP / UDS (Simulated)',
      sourceAddress: '0x0E00',
      targetAddress: '0x0001',
    },
  })
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
      return c.json({ success: true, data: { message: 'Tester present sent', source: 'real' } })
    } catch (err) {
      return c.json({ success: false, error: `Tester present failed: ${(err as Error).message}` }, 500)
    }
  }

  state.lastActivity = Date.now()
  return c.json({ success: true, data: { message: 'Tester present (simulation)', source: 'simulation' } })
})

// ── Scan Vehicle (Full Diagnostic Scan) ────────────────────────────────────────

app.post('/api/scan', async (c) => {
  if (!state.connected) {
    return c.json({ success: false, error: 'Not connected' }, 400)
  }

  // Start session if not active
  if (!state.sessionActive) {
    state.sessionActive = true
  }

  const [dtcResult, liveResult, ecuResult] = await Promise.allSettled([
    fetch(`${c.req.url.replace('/api/scan', '/api/dtc')}`),
    fetch(`${c.req.url.replace('/api/scan', '/api/live-data')}`),
    fetch(`${c.req.url.replace('/api/scan', '/api/ecu/info')}`),
  ])

  const dtcs = dtcResult.status === 'fulfilled' ? await dtcResult.value.json() : { data: { dtcs: [], source: state.mode } }
  const liveData = liveResult.status === 'fulfilled' ? await liveResult.value.json() : { data: { sensors: [], source: state.mode } }
  const ecuInfo = ecuResult.status === 'fulfilled' ? await ecuResult.value.json() : { data: { source: state.mode } }

  return c.json({
    success: true,
    data: {
      source: state.mode,
      timestamp: Date.now(),
      dtcs: dtcs.data?.dtcs ?? [],
      sensors: liveData.data?.sensors ?? [],
      ecu: ecuInfo.data ?? {},
      healthScore: calculateHealthScore(dtcs.data?.dtcs ?? [], liveData.data?.sensors ?? []),
    },
  })
})

function calculateHealthScore(dtcs: DTCCode[], sensors: SensorReading[]): number {
  let score = 100
  // Deduct for DTCs
  for (const dtc of dtcs) {
    if (dtc.severity === 'critical') score -= 15
    else if (dtc.severity === 'warning') score -= 5
    else score -= 2
  }
  // Deduct for sensor anomalies (simplified)
  const criticalSensors = sensors.filter(s => {
    if (s.pid === '05' && s.value > 105) return true // Overheating
    if (s.pid === '42' && s.value < 11.5) return true // Low voltage
    return false
  })
  score -= criticalSensors.length * 10
  return Math.max(0, Math.min(100, score))
}

// ── Start Server ───────────────────────────────────────────────────────────────

console.log(`\n🔧 ECU Master Pro Diagnostic Service`)
console.log(`   Port: ${PORT}`)
console.log(`   VAS 6154 Target: ${VAS6154_IP}:${DOIP_PORT}`)
console.log(`   Protocol: DoIP (ISO 13400) / UDS (ISO 14229)`)
console.log(`   Mode: Auto-detect (real → simulation fallback)\n`)

export default {
  port: PORT,
  fetch: app.fetch,
}
