// ECU Master Pro 2026 - Digital Twin Engine
// Vehicle virtual replica engine for simulation & pre-validation
// Communicates via Next.js API routes

export interface DigitalTwinState {
  vehicle_id: string
  vin: string
  last_sync: string
  sync_staleness_ms: number
  ecu_sw_map: Record<string, string>
  sensors: Record<string, number>
  active_faults: string[]
  predictions: Record<string, { days_to_failure: number; confidence: number }>
  pending_updates: string[]
  firmware_versions: Record<string, string>
  health_score: number
  mileage_km: number
  last_service_date: string | null
  is_sdv: boolean
  sovd_capable: boolean
}

export interface OTASimulationResult {
  compatible: boolean
  estimated_duration_min: number
  risk_level: 'low' | 'medium' | 'high'
  predicted_health_delta: number
  warnings: string[]
  simulated_state: DigitalTwinState
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const NOW_MS = Date.now()

const MOCK_TWINS: DigitalTwinState[] = [
  {
    vehicle_id: 'v-001',
    vin: 'WBAJV2C08PWL12345',
    last_sync: new Date(NOW_MS - 45_000).toISOString(),
    sync_staleness_ms: 45_000,
    ecu_sw_map: {
      ECM: '4.2.0',
      TCM: '3.7.2',
      BCM: '6.0.1',
      ADAS: '2.1.3',
      HU: '12.3.0',
    },
    sensors: {
      battery_voltage: 12.6,
      coolant_temp: 88,
      oil_temp: 92,
      intake_temp: 34,
      boost_pressure: 1.15,
    },
    active_faults: ['P0420'],
    predictions: {
      DPF: { days_to_failure: 45, confidence: 0.82 },
      battery_12v: { days_to_failure: 120, confidence: 0.71 },
    },
    pending_updates: ['ECM:4.2.1', 'ADAS:2.1.4'],
    firmware_versions: {
      ECM: '4.2.0',
      TCM: '3.7.2',
      BCM: '6.0.1',
      ADAS: '2.1.3',
      HU: '12.3.0',
    },
    health_score: 78,
    mileage_km: 87_420,
    last_service_date: '2026-01-15',
    is_sdv: true,
    sovd_capable: true,
  },
  {
    vehicle_id: 'v-002',
    vin: 'WBAJV2C08PWL67890',
    last_sync: new Date(NOW_MS - 12_000).toISOString(),
    sync_staleness_ms: 12_000,
    ecu_sw_map: {
      ECM: '4.2.0',
      TCM: '3.7.2',
      BCM: '6.0.1',
      ADAS: '2.1.3',
      HU: '12.3.0',
    },
    sensors: {
      battery_voltage: 12.8,
      coolant_temp: 82,
      oil_temp: 85,
      intake_temp: 28,
      boost_pressure: 1.05,
    },
    active_faults: [],
    predictions: {
      brake_pads_front: { days_to_failure: 200, confidence: 0.65 },
    },
    pending_updates: ['ECM:4.2.1'],
    firmware_versions: {
      ECM: '4.2.0',
      TCM: '3.7.2',
      BCM: '6.0.1',
      ADAS: '2.1.3',
      HU: '12.3.0',
    },
    health_score: 95,
    mileage_km: 12_800,
    last_service_date: '2026-02-10',
    is_sdv: true,
    sovd_capable: true,
  },
  {
    vehicle_id: 'v-003',
    vin: 'WBAJV2C08PWL11111',
    last_sync: new Date(NOW_MS - 180_000).toISOString(),
    sync_staleness_ms: 180_000,
    ecu_sw_map: {
      ECM: '4.1.8',
      TCM: '3.6.5',
      BCM: '5.9.3',
      ADAS: '2.0.9',
      HU: '12.2.0',
    },
    sensors: {
      battery_voltage: 12.4,
      coolant_temp: 95,
      oil_temp: 104,
      intake_temp: 41,
      boost_pressure: 1.22,
    },
    active_faults: ['P0171', 'P0440', 'U0100'],
    predictions: {
      O2_sensor_bank1: { days_to_failure: 8, confidence: 0.93 },
      EVAP_canister: { days_to_failure: 30, confidence: 0.77 },
      CAN_bus_gateway: { days_to_failure: 15, confidence: 0.68 },
    },
    pending_updates: ['ECM:4.2.1', 'TCM:3.8.0', 'BCM:6.0.2', 'ADAS:2.1.4', 'HU:12.4.0'],
    firmware_versions: {
      ECM: '4.1.8',
      TCM: '3.6.5',
      BCM: '5.9.3',
      ADAS: '2.0.9',
      HU: '12.2.0',
    },
    health_score: 88,
    mileage_km: 145_600,
    last_service_date: '2025-11-22',
    is_sdv: true,
    sovd_capable: true,
  },
  {
    vehicle_id: 'v-004',
    vin: 'WBAJV2C08PWL22222',
    last_sync: new Date(NOW_MS - 600_000).toISOString(),
    sync_staleness_ms: 600_000,
    ecu_sw_map: {
      ECM: '3.9.2',
      TCM: '3.4.1',
      BCM: '5.7.0',
      ADAS: '1.8.6',
      HU: '11.5.0',
    },
    sensors: {
      battery_voltage: 11.8,
      coolant_temp: 102,
      oil_temp: 112,
      intake_temp: 48,
      boost_pressure: 0.88,
    },
    active_faults: ['P0300', 'P0301', 'P0172', 'P0500', 'C0035', 'U0100', 'U0140'],
    predictions: {
      ignition_coil_1: { days_to_failure: 3, confidence: 0.96 },
      MAF_sensor: { days_to_failure: 12, confidence: 0.88 },
      VSS_rear_left: { days_to_failure: 20, confidence: 0.74 },
      battery_12v: { days_to_failure: 5, confidence: 0.91 },
      throttle_body: { days_to_failure: 35, confidence: 0.62 },
    },
    pending_updates: ['ECM:4.2.1', 'TCM:3.8.0', 'BCM:6.0.2', 'ADAS:2.1.4', 'HU:12.4.0'],
    firmware_versions: {
      ECM: '3.9.2',
      TCM: '3.4.1',
      BCM: '5.7.0',
      ADAS: '1.8.6',
      HU: '11.5.0',
    },
    health_score: 62,
    mileage_km: 234_100,
    last_service_date: '2025-08-05',
    is_sdv: false,
    sovd_capable: false,
  },
  {
    vehicle_id: 'v-005',
    vin: 'WBAJV2C08PWL33333',
    last_sync: new Date(NOW_MS - 8_000).toISOString(),
    sync_staleness_ms: 8_000,
    ecu_sw_map: {
      ECM: '4.2.0',
      TCM: '3.7.2',
      BCM: '6.0.1',
      ADAS: '2.1.3',
      HU: '12.3.0',
      EPS: '1.4.2',
      SRS: '2.0.0',
    },
    sensors: {
      battery_voltage: 12.9,
      coolant_temp: 80,
      oil_temp: 83,
      intake_temp: 25,
      boost_pressure: 1.02,
    },
    active_faults: [],
    predictions: {
      brake_pads_rear: { days_to_failure: 280, confidence: 0.58 },
      cabin_filter: { days_to_failure: 90, confidence: 0.82 },
    },
    pending_updates: ['ADAS:2.1.4'],
    firmware_versions: {
      ECM: '4.2.0',
      TCM: '3.7.2',
      BCM: '6.0.1',
      ADAS: '2.1.3',
      HU: '12.3.0',
      EPS: '1.4.2',
      SRS: '2.0.0',
    },
    health_score: 91,
    mileage_km: 34_200,
    last_service_date: '2026-02-20',
    is_sdv: true,
    sovd_capable: true,
  },
]

// ─── API Helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`Digital Twin API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ─── DigitalTwinEngine Class ──────────────────────────────────────────────────

export class DigitalTwinEngine {
  private twins: DigitalTwinState[] = [...MOCK_TWINS]

  /** List all digital twins */
  async listTwins(): Promise<DigitalTwinState[]> {
    try {
      return await apiFetch<DigitalTwinState[]>('/api/digital-twin')
    } catch {
      return [...this.twins]
    }
  }

  /** Get a specific twin by vehicle ID */
  async getTwin(vehicleId: string): Promise<DigitalTwinState | null> {
    try {
      return await apiFetch<DigitalTwinState>(`/api/digital-twin/${vehicleId}`)
    } catch {
      return this.twins.find(t => t.vehicle_id === vehicleId) ?? null
    }
  }

  /** Simulate an OTA update on a digital twin and return pre-validation result */
  async simulateOta(vin: string, firmware: { ecu: string; version: string }): Promise<OTASimulationResult> {
    try {
      return await apiFetch<OTASimulationResult>('/api/digital-twin/simulate-ota', {
        method: 'POST',
        body: JSON.stringify({ vin, firmware }),
      })
    } catch {
      return this.runLocalSimulation(vin, firmware)
    }
  }

  /** Force-sync a digital twin with its physical vehicle */
  async syncTwin(vehicleId: string): Promise<DigitalTwinState> {
    try {
      return await apiFetch<DigitalTwinState>(`/api/digital-twin/${vehicleId}/sync`, {
        method: 'POST',
      })
    } catch {
      const twin = this.twins.find(t => t.vehicle_id === vehicleId)
      if (!twin) throw new Error(`Twin ${vehicleId} not found`)

      // Simulate sync by updating timestamps
      const now = new Date()
      twin.last_sync = now.toISOString()
      twin.sync_staleness_ms = 0
      return { ...twin }
    }
  }

  /** Find a twin by VIN */
  async getTwinByVin(vin: string): Promise<DigitalTwinState | null> {
    try {
      return await apiFetch<DigitalTwinState>(`/api/digital-twin/vin/${vin}`)
    } catch {
      return this.twins.find(t => t.vin === vin) ?? null
    }
  }

  // ─── Local Simulation Logic ──────────────────────────────────────────────

  private runLocalSimulation(
    vin: string,
    firmware: { ecu: string; version: string },
  ): OTASimulationResult {
    const twin = this.twins.find(t => t.vin === vin)
    if (!twin) {
      throw new Error(`No digital twin found for VIN ${vin}`)
    }

    const warnings: string[] = []
    let compatible = true
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let healthDelta = 0
    let estimatedDuration = 15

    // Check battery voltage
    const battery = twin.sensors.battery_voltage ?? 0
    if (battery < 12.0) {
      compatible = false
      warnings.push(`Battery voltage too low (${battery.toFixed(1)}V) — minimum 12.2V required for OTA`)
      riskLevel = 'high'
    } else if (battery < 12.2) {
      warnings.push(`Battery voltage marginal (${battery.toFixed(1)}V) — recommend charging before OTA`)
      riskLevel = 'medium'
    }

    // Check active faults
    const criticalFaults = twin.active_faults.filter(f =>
      f.startsWith('P030') || f.startsWith('U0') || f.startsWith('P0172')
    )
    if (criticalFaults.length > 0) {
      warnings.push(`${criticalFaults.length} critical fault(s) active: ${criticalFaults.join(', ')} — resolve before OTA`)
      riskLevel = 'high'
      compatible = false
    } else if (twin.active_faults.length > 0) {
      warnings.push(`${twin.active_faults.length} non-critical fault(s) active — OTA possible but monitor closely`)
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Check health score
    if (twin.health_score < 65) {
      warnings.push(`Health score critically low (${twin.health_score}) — vehicle may not complete OTA reliably`)
      riskLevel = 'high'
      compatible = false
    } else if (twin.health_score < 80) {
      warnings.push(`Health score below optimal (${twin.health_score}) — increased risk of OTA interruption`)
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Check for existing firmware compatibility
    const currentVersion = twin.firmware_versions[firmware.ecu]
    if (!currentVersion) {
      warnings.push(`Target ECU "${firmware.ecu}" not found in vehicle firmware map`)
      compatible = false
      riskLevel = 'high'
    }

    // Estimate duration based on firmware size
    if (firmware.ecu === 'ADAS') {
      estimatedDuration = 45
    } else if (firmware.ecu === 'HU') {
      estimatedDuration = 35
    } else if (firmware.ecu === 'ECM') {
      estimatedDuration = 20
    } else if (firmware.ecu === 'TCM') {
      estimatedDuration = 15
    } else {
      estimatedDuration = 10
    }

    // Add staleness warning
    if (twin.sync_staleness_ms > 300_000) {
      warnings.push(`Twin data is stale (${Math.round(twin.sync_staleness_ms / 60_000)} min) — sync before relying on simulation`)
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Check for pending predictions
    const urgentPredictions = Object.entries(twin.predictions).filter(
      ([, pred]) => pred.days_to_failure <= 14 && pred.confidence >= 0.8
    )
    if (urgentPredictions.length > 0) {
      const names = urgentPredictions.map(([name]) => name).join(', ')
      warnings.push(`Imminent failure predicted for: ${names} — OTA may exacerbate conditions`)
      if (riskLevel !== 'high') riskLevel = 'medium'
    }

    // Compute health delta
    if (compatible) {
      healthDelta = Math.min(5, Math.max(0, 100 - twin.health_score) * 0.1)
      if (twin.active_faults.length > 0) {
        healthDelta += 1
      }
    } else {
      healthDelta = -5
    }

    // Build simulated post-OTA state
    const simulatedState: DigitalTwinState = {
      ...twin,
      firmware_versions: {
        ...twin.firmware_versions,
        ...(currentVersion ? { [firmware.ecu]: firmware.version } : {}),
      },
      ecu_sw_map: {
        ...twin.ecu_sw_map,
        ...(currentVersion ? { [firmware.ecu]: firmware.version } : {}),
      },
      pending_updates: twin.pending_updates.filter(
        u => !u.startsWith(`${firmware.ecu}:`)
      ),
      health_score: Math.max(0, Math.min(100, twin.health_score + Math.round(healthDelta))),
      last_sync: new Date().toISOString(),
      sync_staleness_ms: 0,
    }

    return {
      compatible,
      estimated_duration_min: estimatedDuration,
      risk_level: riskLevel,
      predicted_health_delta: Math.round(healthDelta * 10) / 10,
      warnings,
      simulated_state: simulatedState,
    }
  }
}

// Singleton instance
export const digitalTwinEngine = new DigitalTwinEngine()
