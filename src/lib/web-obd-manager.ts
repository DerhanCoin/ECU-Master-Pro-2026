// ECU Master Pro 2026 - Web OBD Connection Manager
// Handles Web Serial, WebUSB, and Web Bluetooth connections

export type ConnectionType = 'usb' | 'bluetooth' | 'wifi' | 'ethernet' | 'lan'
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'
export type EngineState = 'off' | 'accessory' | 'running'

export interface LiveSensorData {
  rpm: number
  speed: number
  coolantTemp: number
  intakeTemp: number
  maf: number
  throttlePos: number
  engineLoad: number
  fuelPressure: number
  batteryVoltage: number
  timingAdvance: number
}

export interface VINData {
  vin: string
  wmi: string
  vds: string
  vis: string
  manufacturer: string
  country: string
  modelYear: number
}

export interface DTCCode {
  code: string
  description: string
  status: 'active' | 'pending' | 'stored'
  severity: 'critical' | 'warning' | 'info'
  module: string
  timestamp: string
}

export interface ConnectionStatus {
  state: ConnectionState
  type: ConnectionType | null
  dongleName: string | null
  baudRate: number
  connectedAt: string | null
  engineState: EngineState
  protocol: string | null
  lastError: string | null
}

const OBD_REQUESTS: Record<string, string> = {
  VIN: '0902',
  RPM: '010C',
  SPEED: '010D',
  COOLANT_TEMP: '0105',
  INTAKE_TEMP: '010F',
  MAF: '0110',
  THROTTLE_POS: '0111',
  ENGINE_LOAD: '0104',
  FUEL_PRESSURE: '010A',
  TIMING_ADVANCE: '010E',
  BATTERY_VOLTAGE: 'ATRV',
  DTC_COUNT: '0101',
  CLEAR_DTC: '04',
  DTC_CODES: '03',
}

function parseOBDResponse(raw: string, pid: string): number {
  const clean = raw.replace(/\s/g, '')
  const bytes = clean.match(/.{2}/g)?.map(h => parseInt(h, 16)) || []
  if (bytes.length < 4) return 0

  switch (pid) {
    case '010C': return ((bytes[2] * 256 + bytes[3]) / 4) // RPM
    case '010D': return bytes[2] // Speed km/h
    case '0105': return bytes[2] - 40 // Coolant temp
    case '010F': return bytes[2] - 40 // Intake temp
    case '0110': return (bytes[2] * 256 + bytes[3]) / 100 // MAF g/s
    case '0111': return (bytes[2] * 255) / 100 // Throttle %
    case '0104': return bytes[2] * 100 / 255 // Engine load %
    case '010A': return bytes[2] * 3 // Fuel pressure kPa
    case '010E': return (bytes[2] - 128) / 2 // Timing advance deg
    default: return 0
  }
}

const VIN_MANUFACTURERS: Record<string, string> = {
  'W': 'Volkswagen/Audi', '1': 'USA', 'J': 'Japan', 'K': 'Korea',
  'Z': 'Italy', 'S': 'UK', '3': 'Mexico',
  '5': 'USA', 'Y': 'Sweden', 'L': 'China', 'M': 'India',
  '6': 'Australia', 'T': 'Czech', 'V': 'France',
}

export class WebOBDManager {
  private port: any = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private _status: ConnectionStatus = {
    state: 'disconnected', type: null, dongleName: null,
    baudRate: 115200, connectedAt: null, engineState: 'off',
    protocol: null, lastError: null,
  }
  private listeners: Set<(status: ConnectionStatus) => void> = new Set()
  private dataListeners: Set<(data: LiveSensorData) => void> = new Set()
  private dtcListeners: Set<(codes: DTCCode[]) => void> = new Set()
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null
  private pollingInterval: ReturnType<typeof setInterval> | null = null
  private buffer = ''

  get status(): ConnectionStatus { return { ...this._status } }

  onStatusChange(fn: (status: ConnectionStatus) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  onData(fn: (data: LiveSensorData) => void) {
    this.dataListeners.add(fn)
    return () => this.dataListeners.delete(fn)
  }

  onDTC(fn: (codes: DTCCode[]) => void) {
    this.dtcListeners.add(fn)
    return () => this.dtcListeners.delete(fn)
  }

  private update(partial: Partial<ConnectionStatus>) {
    this._status = { ...this._status, ...partial }
    this.listeners.forEach(fn => fn(this._status))
  }

  private notifyData(data: LiveSensorData) {
    this.dataListeners.forEach(fn => fn(data))
  }

  async connectSerial(baudRate = 115200): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        this.update({ lastError: 'Web Serial API not supported in this browser' })
        return false
      }

      this.update({ state: 'connecting', type: 'usb', baudRate })

      this.port = await (navigator as any).serial.requestPort()
      await this.port.open({ baudRate })

      this.writer = this.port.writable?.getWriter() || null
      this.reader = this.port.readable?.getReader() || null

      // Initialize ELM327
      await this.sendCommand('ATZ') // Reset
      await this.delay(500)
      await this.sendCommand('ATE0') // Echo off
      await this.sendCommand('ATL0') // Linefeeds off
      await this.sendCommand('ATSP0') // Auto protocol

      // Check if connected to vehicle
      const voltStr = await this.sendCommand('ATRV')
      const voltage = parseFloat(voltStr?.replace(/[^\d.]/g, '') || '0')

      if (voltage > 8) {
        const engineState: EngineState = voltage > 13.2 ? 'running' : voltage > 11.5 ? 'accessory' : 'off'
        this.update({
          state: 'connected', dongleName: 'ELM327/OBD-II',
          connectedAt: new Date().toISOString(), engineState,
          protocol: 'OBD-II (Auto)',
        })

        this.startKeepAlive()
        this.startPolling()
        return true
      } else {
        this.update({
          state: 'connected', dongleName: 'ELM327/OBD-II',
          connectedAt: new Date().toISOString(), engineState: 'off',
          protocol: 'OBD-II',
        })
        return true
      }
    } catch (err) {
      this.update({
        state: 'error', lastError: err instanceof Error ? err.message : 'Connection failed',
      })
      return false
    }
  }

  async connectBluetooth(): Promise<boolean> {
    try {
      if (!('bluetooth' in navigator)) {
        this.update({ lastError: 'Web Bluetooth API not supported' })
        return false
      }

      this.update({ state: 'connecting', type: 'bluetooth' })

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      })

      const server = await device.gatt?.connect()
      if (!server) throw new Error('GATT connection failed')

      this.update({
        state: 'connected', type: 'bluetooth', dongleName: device.name || 'Bluetooth OBD',
        connectedAt: new Date().toISOString(), protocol: 'OBD-II (BT)',
      })

      this.startPolling()
      return true
    } catch (err) {
      this.update({
        state: 'error', lastError: err instanceof Error ? err.message : 'BT connection failed',
      })
      return false
    }
  }

  async disconnect() {
    try {
      this.stopKeepAlive()
      this.stopPolling()

      this.reader?.cancel()
      this.writer?.close()
      await this.port?.close()

      this.reader = null
      this.writer = null
      this.port = null

      this.update({
        state: 'disconnected', type: null, dongleName: null,
        connectedAt: null, engineState: 'off', protocol: null, lastError: null,
      })
    } catch {
      // Ignore disconnect errors
    }
  }

  async sendCommand(cmd: string): Promise<string> {
    if (!this.writer || !this.reader) return ''

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    this.buffer = ''
    await this.writer.write(encoder.encode(cmd + '\r'))

    // Wait for response
    let response = ''
    const startTime = Date.now()
    const timeout = 2000

    while (Date.now() - startTime < timeout) {
      try {
        const { value, done } = await this.reader.read()
        if (done) break

        const text = decoder.decode(value)
        this.buffer += text

        if (this.buffer.includes('>')) {
          response = this.buffer.replace('>', '').trim()
          break
        }
      } catch {
        break
      }
    }

    return response
  }

  async readVIN(): Promise<VINData | null> {
    try {
      const response = await this.sendCommand(OBD_REQUESTS.VIN)
      if (!response) return null

      const clean = response.replace(/[\s\r\n>]/g, '')
      const bytes = clean.match(/.{2}/g)?.map(h => parseInt(h, 16)) || []

      if (bytes.length < 5) return null

      // Skip header bytes (typically 4-5 bytes)
      const vinStart = bytes.length > 20 ? 5 : 4
      const vinBytes = bytes.slice(vinStart)
      const vin = vinBytes.map(b => String.fromCharCode(b)).join('').replace(/[^A-HJ-NPR-Z0-9]/g, '')

      if (vin.length < 17) return null

      return {
        vin,
        wmi: vin.substring(0, 3),
        vds: vin.substring(3, 9),
        vis: vin.substring(9, 17),
        manufacturer: VIN_MANUFACTURERS[vin[0]] || 'Unknown',
        country: VIN_MANUFACTURERS[vin[0]] || 'Unknown',
        modelYear: 2000 + 'ABCDEFGHJKLMNPRSTVWXY123456789'.indexOf(vin[9]),
      }
    } catch {
      return null
    }
  }

  async readLiveSensor(): Promise<LiveSensorData> {
    const data: LiveSensorData = {
      rpm: 0, speed: 0, coolantTemp: 0, intakeTemp: 0,
      maf: 0, throttlePos: 0, engineLoad: 0, fuelPressure: 0,
      batteryVoltage: 0, timingAdvance: 0,
    }

    try {
      // Battery voltage
      const voltStr = await this.sendCommand(OBD_REQUESTS.BATTERY_VOLTAGE)
      data.batteryVoltage = parseFloat(voltStr?.replace(/[^\d.]/g, '') || '0')

      // RPM
      const rpmResp = await this.sendCommand(OBD_REQUESTS.RPM)
      data.rpm = parseOBDResponse(rpmResp, '010C')

      // Speed
      const speedResp = await this.sendCommand(OBD_REQUESTS.SPEED)
      data.speed = parseOBDResponse(speedResp, '010D')

      // Coolant temp
      const coolResp = await this.sendCommand(OBD_REQUESTS.COOLANT_TEMP)
      data.coolantTemp = parseOBDResponse(coolResp, '0105')

      // Intake temp
      const intResp = await this.sendCommand(OBD_REQUESTS.INTAKE_TEMP)
      data.intakeTemp = parseOBDResponse(intResp, '010F')

      // MAF
      const mafResp = await this.sendCommand(OBD_REQUESTS.MAF)
      data.maf = parseOBDResponse(mafResp, '0110')

      // Throttle
      const thrResp = await this.sendCommand(OBD_REQUESTS.THROTTLE_POS)
      data.throttlePos = parseOBDResponse(thrResp, '0111')

      // Engine load
      const loadResp = await this.sendCommand(OBD_REQUESTS.ENGINE_LOAD)
      data.engineLoad = parseOBDResponse(loadResp, '0104')

      // Update engine state based on RPM
      if (data.rpm > 0) {
        this.update({ engineState: 'running' })
      } else if (data.batteryVoltage > 11.5) {
        this.update({ engineState: 'accessory' })
      } else {
        this.update({ engineState: 'off' })
      }
    } catch {
      // Partial data is ok
    }

    this.notifyData(data)
    return data
  }

  async readDTCs(): Promise<DTCCode[]> {
    try {
      const response = await this.sendCommand(OBD_REQUESTS.DTC_CODES)
      if (!response) return []

      const codes: DTCCode[] = []
      const clean = response.replace(/[\s\r\n>]/g, '')
      const bytes = clean.match(/.{2}/g)?.map(h => parseInt(h, 16)) || []

      for (let i = 0; i < bytes.length - 1; i += 2) {
        const first = bytes[i]
        const second = bytes[i + 1]
        if (first === 0 && second === 0) continue

        const typeChar = ['P', 'C', 'B', 'U'][(first >> 6) & 0x03]
        const code = `${typeChar}${((first >> 4) & 0x03)}${(first & 0x0F).toString(16).toUpperCase()}${second.toString(16).toUpperCase().padStart(2, '0')}`

        codes.push({
          code,
          description: this.getDTCDescription(code),
          status: 'active',
          severity: this.getDTCSeverity(code),
          module: 'ECU',
          timestamp: new Date().toISOString(),
        })
      }

      this.dtcListeners.forEach(fn => fn(codes))
      return codes
    } catch {
      return []
    }
  }

  async clearDTCs(): Promise<boolean> {
    try {
      await this.sendCommand(OBD_REQUESTS.CLEAR_DTC)
      await this.delay(1000)
      return true
    } catch {
      return false
    }
  }

  // UDS Flash Engine
  async enterProgrammingSession(): Promise<boolean> {
    try {
      await this.sendCommand('1002') // Programming Session
      await this.delay(500)
      return true
    } catch {
      return false
    }
  }

  async requestSecurityAccess(): Promise<string | null> {
    try {
      const seed = await this.sendCommand('2701') // Request Seed
      return seed
    } catch {
      return null
    }
  }

  async sendSecurityKey(key: string): Promise<boolean> {
    try {
      const response = await this.sendCommand(`2702${key}`)
      return response.includes('6702') // Positive response
    } catch {
      return false
    }
  }

  async requestDownload(startAddr: string, size: string): Promise<boolean> {
    try {
      const response = await this.sendCommand(`34${startAddr}${size}`)
      return response.includes('74') // Positive response
    } catch {
      return false
    }
  }

  async transferData(blockNumber: number, data: string): Promise<boolean> {
    try {
      const blockHex = blockNumber.toString(16).padStart(2, '0').toUpperCase()
      const response = await this.sendCommand(`36${blockHex}${data}`)
      return response.includes('76') // Positive response
    } catch {
      return false
    }
  }

  async requestTransferExit(): Promise<boolean> {
    try {
      const response = await this.sendCommand('37')
      return response.includes('77') // Positive response
    } catch {
      return false
    }
  }

  async verifyChecksum(data: string): Promise<boolean> {
    try {
      const response = await this.sendCommand('3101FF01')
      return response.includes('71') // Positive response
    } catch {
      return false
    }
  }

  async ecuReset(): Promise<boolean> {
    try {
      await this.sendCommand('1101') // Hard Reset
      return true
    } catch {
      return false
    }
  }

  private startKeepAlive() {
    this.keepAliveInterval = setInterval(async () => {
      if (this._status.state === 'connected') {
        await this.sendCommand('3E80') // Tester Present
      }
    }, 2000)
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }
  }

  private startPolling() {
    this.pollingInterval = setInterval(async () => {
      if (this._status.state === 'connected') {
        await this.readLiveSensor()
      }
    }, 1000)
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  private getDTCDescription(code: string): string {
    const descriptions: Record<string, string> = {
      'P0100': 'MAF Circuit Malfunction', 'P0101': 'MAF Circuit Range/Performance',
      'P0171': 'System Too Lean (Bank 1)', 'P0172': 'System Too Rich (Bank 1)',
      'P0300': 'Random/Multiple Cylinder Misfire', 'P0301': 'Cylinder 1 Misfire',
      'P0420': 'Catalyst System Efficiency Below Threshold', 'P0440': 'EVAP System Malfunction',
      'P0500': 'Vehicle Speed Sensor Malfunction', 'P0700': 'Transmission Control System',
      'C0035': 'Left Front Wheel Speed Sensor', 'C0040': 'Right Front Wheel Speed Sensor',
      'B0001': 'Driver Airbag Circuit', 'U0100': 'Lost Communication With ECM',
    }
    return descriptions[code] || `${code} - Diagnostic Trouble Code`
  }

  private getDTCSeverity(code: string): 'critical' | 'warning' | 'info' {
    if (code.startsWith('P0') && ['P0300', 'P0301', 'P0302', 'P0303', 'P0304', 'P0700'].includes(code)) return 'critical'
    if (code.startsWith('P0')) return 'warning'
    if (code.startsWith('C')) return 'warning'
    if (code.startsWith('B')) return 'warning'
    if (code.startsWith('U')) return 'critical'
    return 'info'
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const webOBD = new WebOBDManager()
