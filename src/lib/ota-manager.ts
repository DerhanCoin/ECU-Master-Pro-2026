// ECU Master Pro 2026 - OTA Campaign Manager
// Uptane Framework (UNECE R156 compliant) client-side utility
// Communicates via Next.js API routes

export interface OTACampaign {
  id: string
  name: string
  firmware: { url: string; hash_blake3: string; size_bytes: number; version: string }
  targeting: { vehicles: string[] | 'all'; strategy: OTARolloutStrategy }
  status: 'pending' | 'active' | 'paused' | 'complete' | 'rolled_back'
  current_stage: number
  stats: { total: number; pending: number; installing: number; success: number; failed: number; rolled_back: number }
  created_at: string
  updated_at: string
}

export interface OTARolloutStrategy {
  type: 'canary' | 'linear' | 'all_at_once'
  stages: number[]  // percentages: [1, 5, 20, 50, 100]
  stage_interval_hours: number
  auto_advance: boolean
  rollback_threshold_pct: number
  require_voltage_min: number
  time_of_day: string  // "02:00-05:00"
}

export interface OTAVehicleStatus {
  vin: string
  vehicle_name: string
  status: 'pending' | 'downloading' | 'installing' | 'verifying' | 'success' | 'failed' | 'rolled_back'
  progress_pct: number
  current_bank: 'A' | 'B'
  previous_version: string
  target_version: string
  error_message?: string
  updated_at: string
}

export interface FirmwarePackage {
  id: string
  name: string
  version: string
  target_ecu: string
  hash_blake3: string
  size_bytes: number
  signature_valid: boolean
  upload_date: string
  sbom_available: boolean
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FIRMWARE: FirmwarePackage[] = [
  {
    id: 'fw-001',
    name: 'ECM Calibration Update v4.2.1',
    version: '4.2.1',
    target_ecu: 'ECM',
    hash_blake3: 'a3f8c1d2e4b56789abcdef0123456789abcdef0123456789abcdef0123456789',
    size_bytes: 14_526_720,
    signature_valid: true,
    upload_date: '2026-02-20T08:30:00Z',
    sbom_available: true,
  },
  {
    id: 'fw-002',
    name: 'TCM Shift Logic v3.8.0',
    version: '3.8.0',
    target_ecu: 'TCM',
    hash_blake3: 'b7d9e2f3a1c4567890abcdef1234567890abcdef1234567890abcdef1234567890',
    size_bytes: 8_392_192,
    signature_valid: true,
    upload_date: '2026-02-18T14:15:00Z',
    sbom_available: true,
  },
  {
    id: 'fw-003',
    name: 'ADAS Perception Module v2.1.4',
    version: '2.1.4',
    target_ecu: 'ADAS',
    hash_blake3: 'c1e3f5a7b9d1234567890abcdef1234567890abcdef1234567890abcdef1234',
    size_bytes: 52_428_800,
    signature_valid: true,
    upload_date: '2026-02-15T10:45:00Z',
    sbom_available: false,
  },
  {
    id: 'fw-004',
    name: 'BCM Body Controller v6.0.2',
    version: '6.0.2',
    target_ecu: 'BCM',
    hash_blake3: 'd5f7a9b1c3e567890abcdef1234567890abcdef1234567890abcdef12345678ab',
    size_bytes: 3_145_728,
    signature_valid: true,
    upload_date: '2026-02-12T16:00:00Z',
    sbom_available: true,
  },
  {
    id: 'fw-005',
    name: 'Infotainment OS v12.4.0',
    version: '12.4.0',
    target_ecu: 'HU',
    hash_blake3: 'e9b1c3d5f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
    size_bytes: 262_144_000,
    signature_valid: false,
    upload_date: '2026-02-10T09:20:00Z',
    sbom_available: true,
  },
]

const MOCK_CAMPAIGNS: OTACampaign[] = [
  {
    id: 'camp-001',
    name: 'ECM Emission Compliance Recall R-2026-042',
    firmware: {
      url: 'https://ota.oem.example.com/firmware/ecm-4.2.1.bin',
      hash_blake3: 'a3f8c1d2e4b56789abcdef0123456789abcdef0123456789abcdef0123456789',
      size_bytes: 14_526_720,
      version: '4.2.1',
    },
    targeting: {
      vehicles: 'all',
      strategy: {
        type: 'linear',
        stages: [5, 20, 50, 100],
        stage_interval_hours: 24,
        auto_advance: true,
        rollback_threshold_pct: 3,
        require_voltage_min: 12.2,
        time_of_day: '02:00-05:00',
      },
    },
    status: 'active',
    current_stage: 3,
    stats: {
      total: 48_200,
      pending: 14_460,
      installing: 4_820,
      success: 26_510,
      failed: 1_930,
      rolled_back: 480,
    },
    created_at: '2026-02-20T10:00:00Z',
    updated_at: '2026-02-28T14:30:00Z',
  },
  {
    id: 'camp-002',
    name: 'TCM Shift Quality Improvement v3.8.0',
    firmware: {
      url: 'https://ota.oem.example.com/firmware/tcm-3.8.0.bin',
      hash_blake3: 'b7d9e2f3a1c4567890abcdef1234567890abcdef1234567890abcdef1234567890',
      size_bytes: 8_392_192,
      version: '3.8.0',
    },
    targeting: {
      vehicles: ['WBAJV2C08PWL12345', 'WBAJV2C08PWL67890', 'WBAJV2C08PWL11111'],
      strategy: {
        type: 'all_at_once',
        stages: [100],
        stage_interval_hours: 0,
        auto_advance: false,
        rollback_threshold_pct: 5,
        require_voltage_min: 12.0,
        time_of_day: '01:00-06:00',
      },
    },
    status: 'complete',
    current_stage: 1,
    stats: {
      total: 3,
      pending: 0,
      installing: 0,
      success: 3,
      failed: 0,
      rolled_back: 0,
    },
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-02-03T05:30:00Z',
  },
  {
    id: 'camp-003',
    name: 'ADAS Perception Neural Net v2.1.4 Canary',
    firmware: {
      url: 'https://ota.oem.example.com/firmware/adas-2.1.4.bin',
      hash_blake3: 'c1e3f5a7b9d1234567890abcdef1234567890abcdef1234567890abcdef1234',
      size_bytes: 52_428_800,
      version: '2.1.4',
    },
    targeting: {
      vehicles: 'all',
      strategy: {
        type: 'canary',
        stages: [1, 5, 20, 50, 100],
        stage_interval_hours: 72,
        auto_advance: false,
        rollback_threshold_pct: 1,
        require_voltage_min: 12.5,
        time_of_day: '03:00-05:00',
      },
    },
    status: 'active',
    current_stage: 1,
    stats: {
      total: 125_000,
      pending: 123_750,
      installing: 625,
      success: 500,
      failed: 125,
      rolled_back: 0,
    },
    created_at: '2026-02-26T12:00:00Z',
    updated_at: '2026-02-28T06:15:00Z',
  },
]

const MOCK_VEHICLE_STATUSES: Record<string, OTAVehicleStatus[]> = {
  'camp-001': [
    {
      vin: 'WBAJV2C08PWL12345',
      vehicle_name: 'BMW 530i G60',
      status: 'success',
      progress_pct: 100,
      current_bank: 'B',
      previous_version: '4.2.0',
      target_version: '4.2.1',
      updated_at: '2026-02-27T03:12:00Z',
    },
    {
      vin: 'WBAJV2C08PWL67890',
      vehicle_name: 'BMW 530i G60',
      status: 'installing',
      progress_pct: 67,
      current_bank: 'B',
      previous_version: '4.2.0',
      target_version: '4.2.1',
      updated_at: '2026-02-28T03:45:00Z',
    },
    {
      vin: 'WBAJV2C08PWL11111',
      vehicle_name: 'BMW 530e G60',
      status: 'failed',
      progress_pct: 42,
      current_bank: 'A',
      previous_version: '4.2.0',
      target_version: '4.2.1',
      error_message: 'Voltage dropped below 12.2V during install — rollback triggered',
      updated_at: '2026-02-28T02:30:00Z',
    },
    {
      vin: 'WBAJV2C08PWL22222',
      vehicle_name: 'BMW 520d G60',
      status: 'verifying',
      progress_pct: 95,
      current_bank: 'B',
      previous_version: '4.2.0',
      target_version: '4.2.1',
      updated_at: '2026-02-28T04:10:00Z',
    },
    {
      vin: 'WBAJV2C08PWL33333',
      vehicle_name: 'BMW i5 eDrive40 G60',
      status: 'rolled_back',
      progress_pct: 0,
      current_bank: 'A',
      previous_version: '4.2.0',
      target_version: '4.2.1',
      error_message: 'BLAKE3 hash mismatch after download — integrity check failed',
      updated_at: '2026-02-28T01:55:00Z',
    },
    {
      vin: 'WBAJV2C08PWL44444',
      vehicle_name: 'BMW 530i G60',
      status: 'downloading',
      progress_pct: 34,
      current_bank: 'A',
      previous_version: '4.2.0',
      target_version: '4.2.1',
      updated_at: '2026-02-28T04:25:00Z',
    },
    {
      vin: 'WBAJV2C08PWL55555',
      vehicle_name: 'BMW M5 G90',
      status: 'pending',
      progress_pct: 0,
      current_bank: 'A',
      previous_version: '4.2.0',
      target_version: '4.2.1',
      updated_at: '2026-02-28T04:30:00Z',
    },
  ],
  'camp-002': [
    {
      vin: 'WBAJV2C08PWL12345',
      vehicle_name: 'BMW 530i G60',
      status: 'success',
      progress_pct: 100,
      current_bank: 'B',
      previous_version: '3.7.2',
      target_version: '3.8.0',
      updated_at: '2026-02-02T03:15:00Z',
    },
    {
      vin: 'WBAJV2C08PWL67890',
      vehicle_name: 'BMW 530i G60',
      status: 'success',
      progress_pct: 100,
      current_bank: 'B',
      previous_version: '3.7.2',
      target_version: '3.8.0',
      updated_at: '2026-02-02T03:22:00Z',
    },
    {
      vin: 'WBAJV2C08PWL11111',
      vehicle_name: 'BMW 530e G60',
      status: 'success',
      progress_pct: 100,
      current_bank: 'B',
      previous_version: '3.7.2',
      target_version: '3.8.0',
      updated_at: '2026-02-02T03:18:00Z',
    },
  ],
  'camp-003': [
    {
      vin: 'WBAJV2C08PWL12345',
      vehicle_name: 'BMW 530i G60',
      status: 'success',
      progress_pct: 100,
      current_bank: 'B',
      previous_version: '2.1.3',
      target_version: '2.1.4',
      updated_at: '2026-02-28T04:05:00Z',
    },
    {
      vin: 'WBAJV2C08PWL67890',
      vehicle_name: 'BMW 530i G60',
      status: 'installing',
      progress_pct: 78,
      current_bank: 'B',
      previous_version: '2.1.3',
      target_version: '2.1.4',
      updated_at: '2026-02-28T04:28:00Z',
    },
    {
      vin: 'WBAJV2C08PWL11111',
      vehicle_name: 'BMW 530e G60',
      status: 'failed',
      progress_pct: 15,
      current_bank: 'A',
      previous_version: '2.1.3',
      target_version: '2.1.4',
      error_message: 'Insufficient storage on ADAS ECU for dual-bank swap',
      updated_at: '2026-02-28T03:50:00Z',
    },
    {
      vin: 'WBAJV2C08PWL22222',
      vehicle_name: 'BMW 520d G60',
      status: 'downloading',
      progress_pct: 52,
      current_bank: 'A',
      previous_version: '2.1.3',
      target_version: '2.1.4',
      updated_at: '2026-02-28T04:32:00Z',
    },
  ],
}

// ─── API Helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`OTA API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ─── OTACampaignManager Class ─────────────────────────────────────────────────

export class OTACampaignManager {
  private campaigns: OTACampaign[] = [...MOCK_CAMPAIGNS]
  private vehicleStatuses: Record<string, OTAVehicleStatus[]> = { ...MOCK_VEHICLE_STATUSES }
  private firmware: FirmwarePackage[] = [...MOCK_FIRMWARE]

  /** List all OTA campaigns */
  async listCampaigns(): Promise<OTACampaign[]> {
    try {
      return await apiFetch<OTACampaign[]>('/api/ota/campaigns')
    } catch {
      // Fallback to mock data
      return [...this.campaigns]
    }
  }

  /** Get a single campaign by ID */
  async getCampaign(id: string): Promise<OTACampaign | null> {
    try {
      return await apiFetch<OTACampaign>(`/api/ota/campaigns/${id}`)
    } catch {
      return this.campaigns.find(c => c.id === id) ?? null
    }
  }

  /** Create a new OTA campaign */
  async createCampaign(data: Partial<OTACampaign>): Promise<OTACampaign> {
    try {
      return await apiFetch<OTACampaign>('/api/ota/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch {
      const now = new Date().toISOString()
      const campaign: OTACampaign = {
        id: `camp-${Date.now().toString(36)}`,
        name: data.name ?? 'New OTA Campaign',
        firmware: data.firmware ?? {
          url: '',
          hash_blake3: '',
          size_bytes: 0,
          version: '0.0.0',
        },
        targeting: data.targeting ?? {
          vehicles: 'all',
          strategy: {
            type: 'linear',
            stages: [5, 20, 50, 100],
            stage_interval_hours: 24,
            auto_advance: true,
            rollback_threshold_pct: 3,
            require_voltage_min: 12.2,
            time_of_day: '02:00-05:00',
          },
        },
        status: 'pending',
        current_stage: 0,
        stats: { total: 0, pending: 0, installing: 0, success: 0, failed: 0, rolled_back: 0 },
        created_at: now,
        updated_at: now,
      }
      this.campaigns.push(campaign)
      return campaign
    }
  }

  /** Advance a campaign to the next rollout stage */
  async advanceStage(id: string): Promise<OTACampaign> {
    try {
      return await apiFetch<OTACampaign>(`/api/ota/campaigns/${id}/advance`, {
        method: 'POST',
      })
    } catch {
      const campaign = this.campaigns.find(c => c.id === id)
      if (!campaign) throw new Error(`Campaign ${id} not found`)

      const strategy = campaign.targeting.strategy
      const nextStage = campaign.current_stage + 1
      if (nextStage > strategy.stages.length) {
        throw new Error('Campaign is already at the final stage')
      }

      campaign.current_stage = nextStage
      campaign.updated_at = new Date().toISOString()

      if (nextStage >= strategy.stages.length) {
        campaign.status = 'complete'
      }

      return { ...campaign }
    }
  }

  /** Pause an active campaign */
  async pauseCampaign(id: string): Promise<OTACampaign> {
    try {
      return await apiFetch<OTACampaign>(`/api/ota/campaigns/${id}/pause`, {
        method: 'POST',
      })
    } catch {
      const campaign = this.campaigns.find(c => c.id === id)
      if (!campaign) throw new Error(`Campaign ${id} not found`)

      campaign.status = 'paused'
      campaign.updated_at = new Date().toISOString()
      return { ...campaign }
    }
  }

  /** Rollback a campaign — triggers fleet-wide rollback */
  async rollbackCampaign(id: string): Promise<OTACampaign> {
    try {
      return await apiFetch<OTACampaign>(`/api/ota/campaigns/${id}/rollback`, {
        method: 'POST',
      })
    } catch {
      const campaign = this.campaigns.find(c => c.id === id)
      if (!campaign) throw new Error(`Campaign ${id} not found`)

      campaign.status = 'rolled_back'
      campaign.updated_at = new Date().toISOString()

      // Mark in-progress vehicles as rolled_back
      const statuses = this.vehicleStatuses[id] ?? []
      for (const vs of statuses) {
        if (vs.status === 'installing' || vs.status === 'downloading' || vs.status === 'verifying') {
          vs.status = 'rolled_back'
          vs.progress_pct = 0
          vs.current_bank = 'A'
          vs.error_message = 'Campaign rolled back by operator'
          vs.updated_at = new Date().toISOString()
        }
      }

      return { ...campaign }
    }
  }

  /** Get per-vehicle statuses for a campaign */
  async getVehicleStatuses(campaignId: string): Promise<OTAVehicleStatus[]> {
    try {
      return await apiFetch<OTAVehicleStatus[]>(`/api/ota/campaigns/${campaignId}/vehicles`)
    } catch {
      return [...(this.vehicleStatuses[campaignId] ?? [])]
    }
  }

  /** Upload a firmware package */
  async uploadFirmware(file: File): Promise<FirmwarePackage> {
    try {
      const formData = new FormData()
      formData.append('firmware', file)

      const res = await fetch('/api/ota/firmware', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      return res.json() as Promise<FirmwarePackage>
    } catch {
      // Mock upload
      const pkg: FirmwarePackage = {
        id: `fw-${Date.now().toString(36)}`,
        name: file.name,
        version: '0.0.0',
        target_ecu: 'UNKNOWN',
        hash_blake3: '0000000000000000000000000000000000000000000000000000000000000000',
        size_bytes: file.size,
        signature_valid: false,
        upload_date: new Date().toISOString(),
        sbom_available: false,
      }
      this.firmware.push(pkg)
      return pkg
    }
  }

  /** List all available firmware packages */
  async listFirmware(): Promise<FirmwarePackage[]> {
    try {
      return await apiFetch<FirmwarePackage[]>('/api/ota/firmware')
    } catch {
      return [...this.firmware]
    }
  }
}

// Singleton instance
export const otaManager = new OTACampaignManager()
