/**
 * ECU Master Pro — Diagnostic API Client
 * Connects to the diagnostic backend service on port 8000
 * Falls back to simulation data if backend is unreachable
 */

const DIAG_SERVICE_PORT = 8000

function diagUrl(path: string): string {
  return `/api${path}?XTransformPort=${DIAG_SERVICE_PORT}`
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DiagnosticStatus {
  service: string
  version: string
  connected: boolean
  mode: 'real' | 'simulation'
  dongleIp: string | null
  vehicleId: string | null
  sessionActive: boolean
  uptime: number
  vas6154Target: string
}

export interface SensorReading {
  pid: string
  name: string
  value: number
  unit: string
  timestamp: number
}

export interface DTCCode {
  code: string
  description: string
  status: string
  severity: 'critical' | 'warning' | 'info'
}

export interface ECUInfo {
  source: string
  vin: string
  hardwareVersion: string
  softwareVersion: string
  ecuName?: string
  manufacturer?: string
  protocol: string
  sourceAddress: string
  targetAddress: string
}

export interface DongleInfo {
  source: string
  device?: string
  firmware?: string
  serial?: string
  ip?: string
  protocol?: string
  status?: string
  [key: string]: string | undefined
}

export interface ScanResult {
  source: string
  timestamp: number
  dtcs: DTCCode[]
  sensors: SensorReading[]
  ecu: ECUInfo
  healthScore: number
}

export interface ConnectResult {
  mode: 'real' | 'simulation'
  dongleIp: string
  vehicleId: string
  vin?: string
  message: string
}

// ── API Functions ──────────────────────────────────────────────────────────────

async function apiCall<T>(path: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(diagUrl(path), {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    return await response.json()
  } catch {
    return { success: false, error: 'Diagnostic service unavailable' }
  }
}

export const diagnosticApi = {
  /** Get diagnostic service status */
  getStatus: () => apiCall<DiagnosticStatus>('/status'),

  /** Connect to VAS 6154 dongle */
  connect: () => apiCall<ConnectResult>('/connect', { method: 'POST' }),

  /** Disconnect from dongle */
  disconnect: () => apiCall<{ message: string }>('/disconnect', { method: 'POST' }),

  /** Get VAS 6154 dongle info */
  getDongleInfo: () => apiCall<DongleInfo>('/dongle/info'),

  /** Read all DTC codes */
  getDTCs: () => apiCall<{ source: string; dtcs: DTCCode[] }>('/dtc'),

  /** Clear all DTC codes */
  clearDTCs: () => apiCall<{ source: string; message: string }>('/dtc', { method: 'DELETE' }),

  /** Read live sensor data */
  getLiveData: () => apiCall<{ source: string; sensors: SensorReading[] }>('/live-data'),

  /** Read ECU identification info */
  getECUInfo: () => apiCall<ECUInfo>('/ecu/info'),

  /** Start/stop diagnostic session */
  setSession: (action: 'start' | 'stop') =>
    apiCall<{ sessionActive: boolean; mode: string }>('/session', {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  /** Send tester present keepalive */
  testerPresent: () => apiCall<{ message: string; source: string }>('/tester-present', { method: 'POST' }),

  /** Full diagnostic scan */
  scan: () => apiCall<ScanResult>('/scan', { method: 'POST' }),
}
