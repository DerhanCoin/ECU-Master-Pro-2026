/**
 * SOVD Client — ISO 17978-3 / ASAM SOVD v1.0
 * Service-Oriented Vehicle Diagnostics client library
 *
 * This is a CLIENT-SIDE (browser) library that communicates with Next.js API routes
 * which proxy requests to the vehicle's SOVD server.
 *
 * Design system: dark navy (#0f1923) with cyan (#00d4ff) accents
 */

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface SOVDComponent {
  id: string
  name: string
  type: 'ecu' | 'hpc' | 'application' | 'gateway'
  protocol: 'sovd' | 'uds' | 'someip'
  status: 'online' | 'offline' | 'degraded'
  capabilities: string[]
  sw_version: string
  hardware_id: string
}

export interface SOVDFault {
  fault_id: string
  dtc_id: string
  description: string
  severity: 'critical' | 'error' | 'warning' | 'info'
  symptom: string
  occurrence_count: number
  first_occurrence: string
  last_occurrence: string
  environment_data: Record<string, number>
  status: { test_failed: boolean; confirmed: boolean; mil_on: boolean }
}

export interface SOVDDataGroup {
  group: string
  name: string
  values: Record<string, { value: number; unit: string; timestamp: string }>
}

export interface SOVDOperation {
  id: string
  name: string
  description: string
  parameters: Array<{ name: string; type: string; required: boolean }>
  status: 'available' | 'running' | 'completed' | 'failed'
}

export interface SOVDSwPackage {
  id: string
  name: string
  version: string
  hash_blake3: string
  install_date: string
  signature_valid: boolean
}

// ── Internal / supporting types ─────────────────────────────────────────────

export interface SOVDAuthTokens {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  acquired_at: number
}

export interface SOVDApiError {
  status: number
  title: string
  detail: string
  instance: string
}

export interface SOVDExecutionResult {
  execution_id: string
  status: 'running' | 'completed' | 'failed'
  progress: number
  result: Record<string, unknown> | null
  error: string | null
}

export interface SOVDExecutionStatus {
  execution_id: string
  component_id: string
  operation_id: string
  status: 'running' | 'completed' | 'failed'
  progress: number
  started_at: string
  completed_at: string | null
}

export interface SOVDOtaStatus {
  update_id: string
  component_id: string
  status: 'pending' | 'downloading' | 'verifying' | 'installing' | 'completed' | 'failed' | 'rolled_back'
  progress: number
  current_version: string
  target_version: string
}

export interface SOVDOpenApiSpec {
  openapi: string
  info: { title: string; version: string; description: string }
  paths: Record<string, unknown>
}

export type VehicleProtocol = 'sovd' | 'uds' | 'someip'

export interface CapabilityCheckResult {
  sovdAvailable: boolean
  udsAvailable: boolean
  someipAvailable: boolean
  preferred: VehicleProtocol
  latency: { sovd: number | null; uds: number | null }
}

export interface SOVDClientConfig {
  /** Base path for our API routes that proxy to SOVD server */
  basePath: string
  /** Request timeout in milliseconds */
  timeout: number
  /** Max poll attempts for long-running operations */
  maxPollAttempts: number
  /** Interval between poll attempts in milliseconds */
  pollInterval: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: SOVDClient
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SOVDClientConfig = {
  basePath: '/api/v1/sovd',
  timeout: 15000,
  maxPollAttempts: 60,
  pollInterval: 2000,
}

export class SOVDClient {
  private config: SOVDClientConfig
  private tokens: SOVDAuthTokens | null = null

  constructor(config: Partial<SOVDClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ── Authentication ──────────────────────────────────────────────────────

  async authenticate(
    clientId: string,
    clientSecret: string,
    scope: string = 'sovd:read sovd:write sovd:execute'
  ): Promise<SOVDAuthTokens> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    })

    const response = await this.request<{ access_token: string; token_type: string; expires_in: number; scope: string }>(
      'POST',
      '/auth/token',
      body.toString(),
      { 'Content-Type': 'application/x-www-form-urlencoded' },
      false
    )

    this.tokens = {
      access_token: response.access_token,
      token_type: response.token_type,
      expires_in: response.expires_in,
      scope: response.scope,
      acquired_at: Date.now(),
    }

    return this.tokens
  }

  /** Returns true if we have a valid (non-expired) token */
  isAuthenticated(): boolean {
    if (!this.tokens) return false
    const elapsed = Date.now() - this.tokens.acquired_at
    const remaining = this.tokens.expires_in * 1000 - elapsed
    return remaining > 5000 // 5 s buffer
  }

  // ── Components ──────────────────────────────────────────────────────────

  async listComponents(): Promise<SOVDComponent[]> {
    const response = await this.request<{ items: SOVDComponent[] }>('GET', '/components')
    return response.items
  }

  async getComponent(id: string): Promise<SOVDComponent> {
    return this.request<SOVDComponent>('GET', `/components/${encodeURIComponent(id)}`)
  }

  // ── Faults ──────────────────────────────────────────────────────────────

  async getFaults(componentId: string): Promise<SOVDFault[]> {
    const response = await this.request<{ items: SOVDFault[] }>(
      'GET',
      `/components/${encodeURIComponent(componentId)}/faults`
    )
    return response.items
  }

  async clearFaults(componentId: string, faultIds?: string[]): Promise<{ cleared: number }> {
    const path = `/components/${encodeURIComponent(componentId)}/faults`
    if (faultIds && faultIds.length > 0) {
      return this.request<{ cleared: number }>('DELETE', path, JSON.stringify({ fault_ids: faultIds }), {
        'Content-Type': 'application/json',
      })
    }
    return this.request<{ cleared: number }>('DELETE', path)
  }

  // ── Data Groups ─────────────────────────────────────────────────────────

  async listDataGroups(componentId: string): Promise<Array<{ group: string; name: string }>> {
    const response = await this.request<{ items: Array<{ group: string; name: string }> }>(
      'GET',
      `/components/${encodeURIComponent(componentId)}/data-groups`
    )
    return response.items
  }

  async readDataGroup(componentId: string, group: string): Promise<SOVDDataGroup> {
    return this.request<SOVDDataGroup>(
      'GET',
      `/components/${encodeURIComponent(componentId)}/data-groups/${encodeURIComponent(group)}`
    )
  }

  async writeDataGroup(
    componentId: string,
    group: string,
    values: Record<string, number>
  ): Promise<SOVDDataGroup> {
    return this.request<SOVDDataGroup>(
      'PUT',
      `/components/${encodeURIComponent(componentId)}/data-groups/${encodeURIComponent(group)}`,
      JSON.stringify({ values }),
      { 'Content-Type': 'application/json' }
    )
  }

  // ── Operations ──────────────────────────────────────────────────────────

  async listOperations(componentId: string): Promise<SOVDOperation[]> {
    const response = await this.request<{ items: SOVDOperation[] }>(
      'GET',
      `/components/${encodeURIComponent(componentId)}/operations`
    )
    return response.items
  }

  async executeOperation(
    componentId: string,
    operationId: string,
    params: Record<string, unknown> = {}
  ): Promise<SOVDExecutionResult> {
    // Initiate execution
    const execution = await this.request<{ execution_id: string; status: string }>(
      'POST',
      `/components/${encodeURIComponent(componentId)}/operations/${encodeURIComponent(operationId)}/executions`,
      JSON.stringify({ parameters: params }),
      { 'Content-Type': 'application/json' }
    )

    const executionId = execution.execution_id

    // Poll until completion
    let attempts = 0
    while (attempts < this.config.maxPollAttempts) {
      await this.sleep(this.config.pollInterval)

      const status = await this.request<SOVDExecutionStatus>(
        'GET',
        `/components/${encodeURIComponent(componentId)}/operations/${encodeURIComponent(operationId)}/executions/${encodeURIComponent(executionId)}`
      )

      if (status.status === 'completed') {
        return {
          execution_id: executionId,
          status: 'completed',
          progress: 100,
          result: { status: 'success', operation: operationId },
          error: null,
        }
      }

      if (status.status === 'failed') {
        return {
          execution_id: executionId,
          status: 'failed',
          progress: status.progress,
          result: null,
          error: `Operation ${operationId} failed on component ${componentId}`,
        }
      }

      attempts++
    }

    return {
      execution_id: executionId,
      status: 'failed',
      progress: 0,
      result: null,
      error: `Operation timed out after ${this.config.maxPollAttempts} poll attempts`,
    }
  }

  // ── Software Packages & OTA ─────────────────────────────────────────────

  async getSwPackages(componentId: string): Promise<SOVDSwPackage[]> {
    const response = await this.request<{ items: SOVDSwPackage[] }>(
      'GET',
      `/components/${encodeURIComponent(componentId)}/sw-packages`
    )
    return response.items
  }

  async initiateOta(
    componentId: string,
    packageUrl: string,
    signature: string,
    version: string
  ): Promise<SOVDOtaStatus> {
    return this.request<SOVDOtaStatus>(
      'POST',
      `/components/${encodeURIComponent(componentId)}/sw-updates`,
      JSON.stringify({
        package_url: packageUrl,
        signature,
        target_version: version,
      }),
      { 'Content-Type': 'application/json' }
    )
  }

  async getOtaStatus(componentId: string, updateId: string): Promise<SOVDOtaStatus> {
    return this.request<SOVDOtaStatus>(
      'GET',
      `/components/${encodeURIComponent(componentId)}/sw-updates/${encodeURIComponent(updateId)}`
    )
  }

  // ── API Documentation ───────────────────────────────────────────────────

  async getApiDocs(): Promise<SOVDOpenApiSpec> {
    return this.request<SOVDOpenApiSpec>('GET', '/api-docs')
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: string,
    extraHeaders?: Record<string, string>,
    requireAuth: boolean = true
  ): Promise<T> {
    const url = `${this.config.basePath}${path}`

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...extraHeaders,
    }

    if (requireAuth && this.tokens) {
      headers['Authorization'] = `${this.tokens.token_type} ${this.tokens.access_token}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ?? undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`
        try {
          const errorBody = (await response.json()) as Partial<SOVDApiError>
          errorDetail = errorBody.detail ?? errorBody.title ?? errorDetail
        } catch {
          // response body was not JSON — keep generic message
        }
        throw new SOVDClientError(response.status, errorDetail, path)
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T
      }

      return (await response.json()) as T
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      if (err instanceof SOVDClientError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new SOVDClientError(408, `Request timed out: ${method} ${path}`, path)
      }
      throw new SOVDClientError(0, `Network error: ${err instanceof Error ? err.message : String(err)}`, path)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: SOVDClientError
// ─────────────────────────────────────────────────────────────────────────────

export class SOVDClientError extends Error {
  public readonly status: number
  public readonly path: string

  constructor(status: number, message: string, path: string) {
    super(message)
    this.name = 'SOVDClientError'
    this.status = status
    this.path = path
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: DiagnosticRouter — smart SOVD/UDS/SOME/IP routing
// ─────────────────────────────────────────────────────────────────────────────

type UDSFallbackHandler = {
  readFaults: (componentId: string) => Promise<SOVDFault[]>
  readLiveData: (componentId: string, group: string) => Promise<SOVDDataGroup>
  executeRoutine: (componentId: string, routineId: string, params: Record<string, unknown>) => Promise<SOVDExecutionResult>
}

export class DiagnosticRouter {
  private client: SOVDClient
  private udsFallback: UDSFallbackHandler | null
  private capabilityCache: Map<string, CapabilityCheckResult>

  constructor(client: SOVDClient, udsFallback?: UDSFallbackHandler) {
    this.client = client
    this.udsFallback = udsFallback ?? null
    this.capabilityCache = new Map()
  }

  // ── Capability Detection ────────────────────────────────────────────────

  /**
   * Auto-detect vehicle capability by checking:
   *  1. DoIP discovery (via our API route)
   *  2. SOVD endpoint availability
   * Results are cached per component.
   */
  async detectCapability(componentId: string): Promise<CapabilityCheckResult> {
    const cached = this.capabilityCache.get(componentId)
    if (cached) return cached

    const result: CapabilityCheckResult = {
      sovdAvailable: false,
      udsAvailable: false,
      someipAvailable: false,
      preferred: 'uds',
      latency: { sovd: null, uds: null },
    }

    // Check SOVD endpoint
    try {
      const sovdStart = performance.now()
      await this.client.getComponent(componentId)
      result.sovdAvailable = true
      result.latency.sovd = Math.round(performance.now() - sovdStart)
    } catch {
      result.sovdAvailable = false
    }

    // Check UDS/DoIP endpoint
    try {
      const udsStart = performance.now()
      const doipResponse = await fetch(
        `${DEFAULT_CONFIG.basePath}/components/${encodeURIComponent(componentId)}/doip-ping`
      )
      if (doipResponse.ok) {
        result.udsAvailable = true
        result.latency.uds = Math.round(performance.now() - udsStart)
      }
    } catch {
      result.udsAvailable = false
    }

    // SOME/IP is typically available on HPCs
    if (componentId.includes('hpc') || componentId.includes('adas')) {
      result.someipAvailable = true
    }

    // Prefer SOVD when available (modern protocol)
    if (result.sovdAvailable) {
      result.preferred = 'sovd'
    } else if (result.udsAvailable) {
      result.preferred = 'uds'
    } else if (result.someipAvailable) {
      result.preferred = 'someip'
    }

    this.capabilityCache.set(componentId, result)
    return result
  }

  /** Clear cached capability info for a component or all components */
  clearCapabilityCache(componentId?: string): void {
    if (componentId) {
      this.capabilityCache.delete(componentId)
    } else {
      this.capabilityCache.clear()
    }
  }

  // ── Faults ──────────────────────────────────────────────────────────────

  async readFaults(component: SOVDComponent): Promise<SOVDFault[]> {
    if (component.protocol === 'sovd' || component.protocol === 'someip') {
      try {
        return await this.client.getFaults(component.id)
      } catch (err) {
        if (this.udsFallback && component.protocol !== 'sovd') {
          console.warn(`[SOVDRouter] SOVD faults failed for ${component.id}, falling back to UDS`, err)
          return this.udsFallback.readFaults(component.id)
        }
        throw err
      }
    }

    // UDS-native component
    if (this.udsFallback) {
      return this.udsFallback.readFaults(component.id)
    }

    // Last resort: try SOVD anyway
    return this.client.getFaults(component.id)
  }

  // ── Live Data ───────────────────────────────────────────────────────────

  async readLiveData(component: SOVDComponent, group: string): Promise<SOVDDataGroup> {
    if (component.protocol === 'sovd' || component.protocol === 'someip') {
      try {
        return await this.client.readDataGroup(component.id, group)
      } catch (err) {
        if (this.udsFallback) {
          console.warn(`[SOVDRouter] SOVD data-group failed for ${component.id}, falling back to UDS PID polling`, err)
          return this.udsFallback.readLiveData(component.id, group)
        }
        throw err
      }
    }

    if (this.udsFallback) {
      return this.udsFallback.readLiveData(component.id, group)
    }

    return this.client.readDataGroup(component.id, group)
  }

  // ── Routines / Operations ───────────────────────────────────────────────

  async executeRoutine(
    component: SOVDComponent,
    routine: string,
    params: Record<string, unknown> = {}
  ): Promise<SOVDExecutionResult> {
    if (component.protocol === 'sovd' || component.protocol === 'someip') {
      try {
        return await this.client.executeOperation(component.id, routine, params)
      } catch (err) {
        if (this.udsFallback) {
          console.warn(`[SOVDRouter] SOVD operation failed for ${component.id}, falling back to UDS routine`, err)
          return this.udsFallback.executeRoutine(component.id, routine, params)
        }
        throw err
      }
    }

    if (this.udsFallback) {
      return this.udsFallback.executeRoutine(component.id, routine, params)
    }

    return this.client.executeOperation(component.id, routine, params)
  }

  // ── Bulk convenience methods ────────────────────────────────────────────

  /** Read faults from all online components */
  async readAllFaults(): Promise<Array<{ component: SOVDComponent; faults: SOVDFault[] }>> {
    const components = await this.client.listComponents()
    const onlineComponents = components.filter((c) => c.status !== 'offline')

    const results = await Promise.allSettled(
      onlineComponents.map(async (comp) => ({
        component: comp,
        faults: await this.readFaults(comp),
      }))
    )

    return results
      .filter((r): r is PromiseFulfilledResult<{ component: SOVDComponent; faults: SOVDFault[] }> => r.status === 'fulfilled')
      .map((r) => r.value)
  }

  /** Read a specific data group from all online components */
  async readAllLiveData(group: string): Promise<Array<{ component: SOVDComponent; data: SOVDDataGroup }>> {
    const components = await this.client.listComponents()
    const onlineComponents = components.filter((c) => c.status !== 'offline')

    const results = await Promise.allSettled(
      onlineComponents.map(async (comp) => ({
        component: comp,
        data: await this.readLiveData(comp, group),
      }))
    )

    return results
      .filter((r): r is PromiseFulfilledResult<{ component: SOVDComponent; data: SOVDDataGroup }> => r.status === 'fulfilled')
      .map((r) => r.value)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: Mock / Demo Data
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_COMPONENTS: SOVDComponent[] = [
  {
    id: 'engine-hpc-01',
    name: 'Engine HPC',
    type: 'hpc',
    protocol: 'sovd',
    status: 'online',
    capabilities: ['faults', 'data-groups', 'operations', 'sw-packages', 'sw-updates'],
    sw_version: '4.2.1-rc3',
    hardware_id: 'ENG-HPC-2024-A',
  },
  {
    id: 'adas-hpc-01',
    name: 'ADAS HPC',
    type: 'hpc',
    protocol: 'sovd',
    status: 'online',
    capabilities: ['faults', 'data-groups', 'operations', 'sw-packages', 'sw-updates'],
    sw_version: '3.8.0-stable',
    hardware_id: 'ADAS-HPC-2024-B',
  },
  {
    id: 'infotainment-hpc-01',
    name: 'Infotainment HPC',
    type: 'hpc',
    protocol: 'someip',
    status: 'degraded',
    capabilities: ['faults', 'data-groups', 'sw-packages'],
    sw_version: '5.1.2',
    hardware_id: 'INFO-HPC-2024-C',
  },
  {
    id: 'gateway-ecu-01',
    name: 'Gateway ECU',
    type: 'gateway',
    protocol: 'uds',
    status: 'online',
    capabilities: ['faults', 'data-groups'],
    sw_version: '2.0.4',
    hardware_id: 'GW-ECU-2024-A',
  },
  {
    id: 'body-controller-01',
    name: 'Body Controller',
    type: 'ecu',
    protocol: 'uds',
    status: 'online',
    capabilities: ['faults', 'data-groups', 'operations'],
    sw_version: '1.9.7',
    hardware_id: 'BODY-ECU-2024-D',
  },
  {
    id: 'transmission-ecu-01',
    name: 'Transmission ECU',
    type: 'ecu',
    protocol: 'sovd',
    status: 'online',
    capabilities: ['faults', 'data-groups', 'operations', 'sw-packages'],
    sw_version: '3.3.1',
    hardware_id: 'TRANS-ECU-2024-E',
  },
]

export const DEMO_FAULTS: Record<string, SOVDFault[]> = {
  'engine-hpc-01': [
    {
      fault_id: 'FLT-ENG-001',
      dtc_id: 'P0299',
      description: 'Turbocharger Underboost Condition',
      severity: 'error',
      symptom: 'Reduced engine power, slow acceleration',
      occurrence_count: 14,
      first_occurrence: '2025-11-02T08:17:00Z',
      last_occurrence: '2026-03-14T06:42:00Z',
      environment_data: { rpm: 2800, boost_psi: 8.2, coolant_temp_c: 94, intake_temp_c: 42 },
      status: { test_failed: true, confirmed: true, mil_on: true },
    },
    {
      fault_id: 'FLT-ENG-002',
      dtc_id: 'P0420',
      description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
      severity: 'warning',
      symptom: 'Slight increase in fuel consumption',
      occurrence_count: 3,
      first_occurrence: '2026-01-15T12:30:00Z',
      last_occurrence: '2026-02-28T19:05:00Z',
      environment_data: { rpm: 1800, exhaust_temp_c: 620, o2_voltage: 0.45, load_pct: 42 },
      status: { test_failed: true, confirmed: false, mil_on: false },
    },
    {
      fault_id: 'FLT-ENG-003',
      dtc_id: 'P0301',
      description: 'Cylinder 1 Misfire Detected',
      severity: 'critical',
      symptom: 'Engine vibration, rough idle',
      occurrence_count: 27,
      first_occurrence: '2026-02-10T04:22:00Z',
      last_occurrence: '2026-03-14T09:11:00Z',
      environment_data: { rpm: 720, misfire_count: 27, fuel_trimm_pct: -8.5, coolant_temp_c: 88 },
      status: { test_failed: true, confirmed: true, mil_on: true },
    },
  ],
  'adas-hpc-01': [
    {
      fault_id: 'FLT-ADAS-001',
      dtc_id: 'C1106',
      description: 'Front Radar Sensor Misalignment',
      severity: 'warning',
      symptom: 'Adaptive cruise control intermittently unavailable',
      occurrence_count: 5,
      first_occurrence: '2026-02-20T15:10:00Z',
      last_occurrence: '2026-03-10T11:45:00Z',
      environment_data: { sensor_temp_c: 28, alignment_offset_deg: 1.8, signal_dbm: -62 },
      status: { test_failed: true, confirmed: false, mil_on: false },
    },
    {
      fault_id: 'FLT-ADAS-002',
      dtc_id: 'U0415',
      description: 'Invalid Data Received from Vehicle Speed Control Module',
      severity: 'error',
      symptom: 'Lane keeping assist disabled',
      occurrence_count: 2,
      first_occurrence: '2026-03-01T09:30:00Z',
      last_occurrence: '2026-03-12T14:20:00Z',
      environment_data: { canbus_errors: 3, packet_loss_pct: 0.12, bus_load_pct: 38 },
      status: { test_failed: true, confirmed: true, mil_on: false },
    },
  ],
  'infotainment-hpc-01': [
    {
      fault_id: 'FLT-INFO-001',
      dtc_id: 'B10AA',
      description: 'Display Unit Communication Lost',
      severity: 'warning',
      symptom: 'Infotainment screen goes black intermittently',
      occurrence_count: 8,
      first_occurrence: '2026-01-05T16:45:00Z',
      last_occurrence: '2026-03-13T20:30:00Z',
      environment_data: { display_temp_c: 52, vbat_v: 11.8, uptime_s: 86400 },
      status: { test_failed: true, confirmed: false, mil_on: false },
    },
  ],
  'gateway-ecu-01': [
    {
      fault_id: 'FLT-GW-001',
      dtc_id: 'U0100',
      description: 'Lost Communication with ECM/PCM',
      severity: 'critical',
      symptom: 'Multiple system warnings, reduced vehicle functionality',
      occurrence_count: 1,
      first_occurrence: '2026-03-14T02:15:00Z',
      last_occurrence: '2026-03-14T02:15:00Z',
      environment_data: { can0_errors: 0, can1_errors: 47, can2_errors: 0, bus_load_pct: 92 },
      status: { test_failed: true, confirmed: true, mil_on: true },
    },
  ],
  'body-controller-01': [
    {
      fault_id: 'FLT-BODY-001',
      dtc_id: 'B1200',
      description: 'Driver Door Module Supply Voltage Low',
      severity: 'warning',
      symptom: 'Power window operation slow',
      occurrence_count: 6,
      first_occurrence: '2026-02-01T07:00:00Z',
      last_occurrence: '2026-03-11T13:15:00Z',
      environment_data: { vbat_v: 10.9, door_current_ma: 3200, switch_resistance_ohm: 0.8 },
      status: { test_failed: true, confirmed: false, mil_on: false },
    },
  ],
  'transmission-ecu-01': [
    {
      fault_id: 'FLT-TRANS-001',
      dtc_id: 'P0700',
      description: 'Transmission Control System Malfunction',
      severity: 'error',
      symptom: 'Harsh shifting, torque converter lock-up issues',
      occurrence_count: 9,
      first_occurrence: '2025-12-20T10:00:00Z',
      last_occurrence: '2026-03-13T16:40:00Z',
      environment_data: { fluid_temp_c: 108, slip_rpm: 120, line_pressure_psi: 185, tc_slip_pct: 4.2 },
      status: { test_failed: true, confirmed: true, mil_on: true },
    },
    {
      fault_id: 'FLT-TRANS-002',
      dtc_id: 'P0730',
      description: 'Incorrect Gear Ratio',
      severity: 'warning',
      symptom: 'Occasional gear ratio deviation on 3→4 upshift',
      occurrence_count: 4,
      first_occurrence: '2026-02-14T08:20:00Z',
      last_occurrence: '2026-03-09T11:55:00Z',
      environment_data: { input_rpm: 3200, output_rpm: 1200, gear_ratio_actual: 2.68, gear_ratio_expected: 2.64 },
      status: { test_failed: true, confirmed: false, mil_on: false },
    },
  ],
}

const now = (): string => new Date().toISOString()

export const DEMO_DATA_GROUPS: Record<string, SOVDDataGroup[]> = {
  'engine-hpc-01': [
    {
      group: 'engine-performance',
      name: 'Engine Performance',
      values: {
        rpm: { value: 2847, unit: 'rpm', timestamp: now() },
        load_pct: { value: 67.3, unit: '%', timestamp: now() },
        maf_rate: { value: 142.8, unit: 'g/s', timestamp: now() },
        throttle_pos: { value: 38.2, unit: '%', timestamp: now() },
        boost_psi: { value: 18.4, unit: 'psi', timestamp: now() },
        fuel_rate: { value: 2.41, unit: 'L/h', timestamp: now() },
        ignition_advance: { value: 22.5, unit: '°', timestamp: now() },
      },
    },
    {
      group: 'engine-temperatures',
      name: 'Engine Temperatures',
      values: {
        coolant_temp: { value: 92, unit: '°C', timestamp: now() },
        oil_temp: { value: 104, unit: '°C', timestamp: now() },
        intake_temp: { value: 38, unit: '°C', timestamp: now() },
        exhaust_temp_bank1: { value: 645, unit: '°C', timestamp: now() },
        exhaust_temp_bank2: { value: 638, unit: '°C', timestamp: now() },
        catalyst_temp: { value: 412, unit: '°C', timestamp: now() },
      },
    },
    {
      group: 'engine-fuel',
      name: 'Fuel System',
      values: {
        fuel_pressure: { value: 3500, unit: 'kPa', timestamp: now() },
        fuel_trimm_stft_b1: { value: -3.2, unit: '%', timestamp: now() },
        fuel_trimm_ltft_b1: { value: 1.8, unit: '%', timestamp: now() },
        fuel_trimm_stft_b2: { value: -2.9, unit: '%', timestamp: now() },
        fuel_trimm_ltft_b2: { value: 2.1, unit: '%', timestamp: now() },
        injector_pulse: { value: 3.8, unit: 'ms', timestamp: now() },
      },
    },
  ],
  'adas-hpc-01': [
    {
      group: 'adas-sensors',
      name: 'ADAS Sensor Suite',
      values: {
        front_radar_distance: { value: 42.5, unit: 'm', timestamp: now() },
        front_radar_speed: { value: -8.3, unit: 'm/s', timestamp: now() },
        front_camera_confidence: { value: 98.2, unit: '%', timestamp: now() },
        side_radar_left: { value: 12.8, unit: 'm', timestamp: now() },
        side_radar_right: { value: 0, unit: 'm', timestamp: now() },
        rear_radar_distance: { value: 28.1, unit: 'm', timestamp: now() },
        lidar_points: { value: 128000, unit: 'pts', timestamp: now() },
      },
    },
  ],
  'infotainment-hpc-01': [
    {
      group: 'infotainment-system',
      name: 'Infotainment System',
      values: {
        cpu_usage: { value: 45.2, unit: '%', timestamp: now() },
        mem_usage: { value: 72.8, unit: '%', timestamp: now() },
        gpu_temp: { value: 58, unit: '°C', timestamp: now() },
        display_brightness: { value: 80, unit: '%', timestamp: now() },
        audio_latency: { value: 12, unit: 'ms', timestamp: now() },
        nav_accuracy: { value: 1.2, unit: 'm', timestamp: now() },
      },
    },
  ],
  'gateway-ecu-01': [
    {
      group: 'gateway-network',
      name: 'Network Status',
      values: {
        can0_load: { value: 38.5, unit: '%', timestamp: now() },
        can1_load: { value: 52.1, unit: '%', timestamp: now() },
        can2_load: { value: 22.7, unit: '%', timestamp: now() },
        ethernet_load: { value: 15.3, unit: '%', timestamp: now() },
        routed_msgs_per_sec: { value: 12480, unit: 'msg/s', timestamp: now() },
        error_frames: { value: 0, unit: 'frames', timestamp: now() },
      },
    },
  ],
  'body-controller-01': [
    {
      group: 'body-electrical',
      name: 'Body Electrical',
      values: {
        battery_voltage: { value: 12.4, unit: 'V', timestamp: now() },
        alternator_output: { value: 14.2, unit: 'V', timestamp: now() },
        total_current_draw: { value: 18.5, unit: 'A', timestamp: now() },
        driver_door_current: { value: 3.2, unit: 'A', timestamp: now() },
        cabin_temp: { value: 22, unit: '°C', timestamp: now() },
        ambient_light: { value: 450, unit: 'lux', timestamp: now() },
      },
    },
  ],
  'transmission-ecu-01': [
    {
      group: 'transmission-status',
      name: 'Transmission Status',
      values: {
        current_gear: { value: 4, unit: 'gear', timestamp: now() },
        fluid_temp: { value: 96, unit: '°C', timestamp: now() },
        input_shaft_rpm: { value: 3200, unit: 'rpm', timestamp: now() },
        output_shaft_rpm: { value: 1200, unit: 'rpm', timestamp: now() },
        torque_converter_slip: { value: 45, unit: 'rpm', timestamp: now() },
        line_pressure: { value: 890, unit: 'kPa', timestamp: now() },
        shift_solenoid_a: { value: 1, unit: 'state', timestamp: now() },
        shift_solenoid_b: { value: 0, unit: 'state', timestamp: now() },
      },
    },
  ],
}

export const DEMO_OPERATIONS: Record<string, SOVDOperation[]> = {
  'engine-hpc-01': [
    {
      id: 'op-dpf-regen',
      name: 'DPF Regeneration',
      description: 'Initiate diesel particulate filter active regeneration cycle. Engine must be at operating temperature.',
      parameters: [
        { name: 'target_temp', type: 'number', required: false },
        { name: 'duration_min', type: 'number', required: false },
      ],
      status: 'available',
    },
    {
      id: 'op-throttle-adapt',
      name: 'Throttle Adaptation',
      description: 'Reset and relearn throttle body position adaptation values.',
      parameters: [],
      status: 'available',
    },
    {
      id: 'op-injector-coding',
      name: 'Injector Coding',
      description: 'Write new injector correction codes after injector replacement.',
      parameters: [
        { name: 'cylinder', type: 'number', required: true },
        { name: 'correction_code', type: 'string', required: true },
      ],
      status: 'available',
    },
    {
      id: 'op-compression-test',
      name: 'Compression Test',
      description: 'Run cylinder compression test via starter motor cranking analysis.',
      parameters: [
        { name: 'cylinders', type: 'string', required: false },
      ],
      status: 'available',
    },
  ],
  'adas-hpc-01': [
    {
      id: 'op-radar-calibrate',
      name: 'Front Radar Calibration',
      description: 'Perform static radar calibration using calibration target at specified distance.',
      parameters: [
        { name: 'target_distance_m', type: 'number', required: true },
        { name: 'target_offset_deg', type: 'number', required: false },
      ],
      status: 'available',
    },
    {
      id: 'op-camera-calibrate',
      name: 'Camera Calibration',
      description: 'Initiate front camera static calibration procedure.',
      parameters: [
        { name: 'pattern_type', type: 'string', required: true },
      ],
      status: 'available',
    },
  ],
  'body-controller-01': [
    {
      id: 'op-window-init',
      name: 'Power Window Initialization',
      description: 'Reinitialize power window motor end-stop positions.',
      parameters: [
        { name: 'door', type: 'string', required: true },
      ],
      status: 'available',
    },
  ],
  'transmission-ecu-01': [
    {
      id: 'op-adaptation-reset',
      name: 'Adaptation Reset',
      description: 'Clear all learned transmission adaptation values and reset to factory defaults.',
      parameters: [],
      status: 'available',
    },
    {
      id: 'op-solenoid-test',
      name: 'Solenoid Function Test',
      description: 'Activate individual shift solenoids for diagnostic verification.',
      parameters: [
        { name: 'solenoid_id', type: 'string', required: true },
        { name: 'duration_ms', type: 'number', required: false },
      ],
      status: 'available',
    },
    {
      id: 'op-tc-stall-test',
      name: 'Torque Converter Stall Test',
      description: 'Perform stall speed test (CAUTION: high load operation).',
      parameters: [
        { name: 'max_duration_s', type: 'number', required: false },
      ],
      status: 'available',
    },
  ],
}

export const DEMO_SW_PACKAGES: Record<string, SOVDSwPackage[]> = {
  'engine-hpc-01': [
    {
      id: 'sw-eng-base-4.2.1',
      name: 'Engine Control Base',
      version: '4.2.1-rc3',
      hash_blake3: 'a3f7c2e1b8d94f60e5a2c1b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
      install_date: '2025-09-15T10:30:00Z',
      signature_valid: true,
    },
    {
      id: 'sw-eng-emissions-2.1.0',
      name: 'Emissions Control Module',
      version: '2.1.0',
      hash_blake3: 'b4d8e3f2c1a09785e6d7c8b9a0f1e2d3c4b5a6978899aabbccddeeff00112233',
      install_date: '2025-11-20T14:00:00Z',
      signature_valid: true,
    },
  ],
  'adas-hpc-01': [
    {
      id: 'sw-adas-perception-3.8.0',
      name: 'ADAS Perception Stack',
      version: '3.8.0-stable',
      hash_blake3: 'c5e9f4a3b2d18097e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
      install_date: '2025-12-01T08:00:00Z',
      signature_valid: true,
    },
    {
      id: 'sw-adas-mapping-1.4.2',
      name: 'HD Mapping Module',
      version: '1.4.2',
      hash_blake3: 'd6f0a5b4c3e29108f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
      install_date: '2026-01-10T12:00:00Z',
      signature_valid: true,
    },
  ],
  'infotainment-hpc-01': [
    {
      id: 'sw-info-nav-5.1.2',
      name: 'Navigation & HMI',
      version: '5.1.2',
      hash_blake3: 'e7a1b6c5d4f30219a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      install_date: '2026-02-05T16:30:00Z',
      signature_valid: true,
    },
  ],
  'transmission-ecu-01': [
    {
      id: 'sw-trans-shift-3.3.1',
      name: 'Shift Logic Controller',
      version: '3.3.1',
      hash_blake3: 'f8b2c7d6e5a41320b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
      install_date: '2025-10-22T09:15:00Z',
      signature_valid: true,
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6: Theme constants for the design system
// ─────────────────────────────────────────────────────────────────────────────

export const SOVD_THEME = {
  /** Dark navy background */
  bg: '#0f1923',
  /** Cyan accent */
  accent: '#00d4ff',
  /** Severity colors */
  severity: {
    critical: '#ff2d55',
    error: '#ff6b35',
    warning: '#ffcc00',
    info: '#00d4ff',
  },
  /** Status colors */
  status: {
    online: '#34c759',
    offline: '#8e8e93',
    degraded: '#ff9500',
  },
  /** Protocol badge colors */
  protocol: {
    sovd: '#00d4ff',
    uds: '#af52de',
    someip: '#30d158',
  },
  /** Component type colors */
  componentType: {
    ecu: '#ff6b35',
    hpc: '#00d4ff',
    application: '#ffcc00',
    gateway: '#af52de',
  },
  /** Tailwind-compatible CSS class mappings */
  css: {
    bg: 'bg-[#0f1923]',
    accent: 'text-[#00d4ff]',
    accentBg: 'bg-[#00d4ff]',
    accentBorder: 'border-[#00d4ff]',
    surface: 'bg-[#162030]',
    surfaceHover: 'hover:bg-[#1a2840]',
    text: 'text-[#e0e8f0]',
    textMuted: 'text-[#6b7f95]',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Section 7: Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format a DTC code for display */
export function formatDtc(dtcId: string): string {
  return dtcId.toUpperCase()
}

/** Get severity badge color from the theme */
export function severityColor(severity: SOVDFault['severity']): string {
  return SOVD_THEME.severity[severity]
}

/** Get status badge color from the theme */
export function statusColor(status: SOVDComponent['status']): string {
  return SOVD_THEME.status[status]
}

/** Get protocol badge color from the theme */
export function protocolColor(protocol: SOVDComponent['protocol']): string {
  return SOVD_THEME.protocol[protocol]
}

/** Format an ISO timestamp for display */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Count total faults across all components in demo data */
export function countDemoFaults(): { total: number; critical: number; error: number; warning: number; info: number } {
  let total = 0
  let critical = 0
  let error = 0
  let warning = 0
  let info = 0

  for (const faults of Object.values(DEMO_FAULTS)) {
    for (const fault of faults) {
      total++
      switch (fault.severity) {
        case 'critical': critical++; break
        case 'error': error++; break
        case 'warning': warning++; break
        case 'info': info++; break
      }
    }
  }

  return { total, critical, error, warning, info }
}

/** Check if an auth token is expired or about to expire */
export function isTokenExpired(tokens: SOVDAuthTokens, bufferMs: number = 5000): boolean {
  const elapsed = Date.now() - tokens.acquired_at
  return elapsed >= (tokens.expires_in * 1000 - bufferMs)
}

/** Create a simulated SSE-like data stream for live values */
export function createLiveDataSimulator(
  componentId: string,
  group: string,
  onUpdate: (data: SOVDDataGroup) => void,
  intervalMs: number = 1000
): { start: () => void; stop: () => void } {
  let timerId: ReturnType<typeof setInterval> | null = null

  const start = (): void => {
    const groups = DEMO_DATA_GROUPS[componentId]
    if (!groups) return

    const dataGroup = groups.find((g) => g.group === group)
    if (!dataGroup) return

    timerId = setInterval(() => {
      // Simulate small fluctuations in live values
      const updated: SOVDDataGroup = {
        group: dataGroup.group,
        name: dataGroup.name,
        values: Object.fromEntries(
          Object.entries(dataGroup.values).map(([key, entry]) => {
            // Add ±2% random noise to simulate live sensor data
            const noise = 1 + (Math.random() - 0.5) * 0.04
            const jitter = entry.value * noise
            const rounded = Math.round(jitter * 100) / 100
            return [key, { value: rounded, unit: entry.unit, timestamp: new Date().toISOString() }]
          })
        ),
      }
      onUpdate(updated)
    }, intervalMs)
  }

  const stop = (): void => {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  return { start, stop }
}
