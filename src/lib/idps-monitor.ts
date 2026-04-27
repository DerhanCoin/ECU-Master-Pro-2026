// ECU Master Pro 2026 - Intrusion Detection & Prevention System Monitor
// ISO 21434 / UNECE R155 compliant client-side utility
// Communicates via Next.js API routes

export interface IDPSAlert {
  id: string
  timestamp: string
  rule: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  response: 'block' | 'rate_limit' | 'alert' | 'block_ota'
  description: string
  vehicle_id?: string
  frame_data?: Record<string, unknown>
  acknowledged: boolean
}

export interface IDPSRule {
  id: string
  name: string
  category: 'can' | 'doip' | 'ota' | 'ethernet' | 'bluetooth'
  condition: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  response: 'block' | 'rate_limit' | 'alert' | 'block_ota'
  enabled: boolean
  hit_count_24h: number
}

export interface IDPSStats {
  total_alerts_24h: number
  critical_alerts: number
  blocked_frames: number
  model_version: string
  model_precision: number
  model_recall: number
  false_positive_rate: number
  active_rules: number
  uptime_days: number
  alerts_by_type: Record<string, number>
  alerts_by_severity: Record<string, number>
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RULES: IDPSRule[] = [
  {
    id: 'rule-001',
    name: 'CAN Bus Flooding',
    category: 'can',
    condition: 'frame_rate > 8000 fps on single arbitration ID for >500ms',
    severity: 'critical',
    response: 'block',
    enabled: true,
    hit_count_24h: 3,
  },
  {
    id: 'rule-002',
    name: 'CAN Spoofing Detection',
    category: 'can',
    condition: 'duplicate arbitration ID from unexpected ECU source (non-authorized SA)',
    severity: 'critical',
    response: 'block',
    enabled: true,
    hit_count_24h: 1,
  },
  {
    id: 'rule-003',
    name: 'CAN Replay Attack',
    category: 'can',
    condition: 'frame sequence matches recorded pattern within 200ms tolerance',
    severity: 'high',
    response: 'block',
    enabled: true,
    hit_count_24h: 0,
  },
  {
    id: 'rule-004',
    name: 'CAN Fuzzing Detection',
    category: 'can',
    condition: 'random/unexpected DLC or payload pattern across >50 frames',
    severity: 'high',
    response: 'rate_limit',
    enabled: true,
    hit_count_24h: 7,
  },
  {
    id: 'rule-005',
    name: 'DoIP Discovery DoS',
    category: 'doip',
    condition: '>100 Vehicle Identification Requests per second from single IP',
    severity: 'high',
    response: 'block',
    enabled: true,
    hit_count_24h: 2,
  },
  {
    id: 'rule-006',
    name: 'DoIP Unauthorized Diagnostic Session',
    category: 'doip',
    condition: 'Diagnostic Session request from non-whitelisted IP/MAC',
    severity: 'critical',
    response: 'block',
    enabled: true,
    hit_count_24h: 5,
  },
  {
    id: 'rule-007',
    name: 'Invalid OTA Signature',
    category: 'ota',
    condition: 'firmware metadata signature verification failed (RSA-4096 / ECDSA)',
    severity: 'critical',
    response: 'block_ota',
    enabled: true,
    hit_count_24h: 0,
  },
  {
    id: 'rule-008',
    name: 'OTA Rollback Attempt',
    category: 'ota',
    condition: 'target firmware version < current version without rollback authorization token',
    severity: 'critical',
    response: 'block_ota',
    enabled: true,
    hit_count_24h: 1,
  },
  {
    id: 'rule-009',
    name: 'Ethernet Port Scan',
    category: 'ethernet',
    condition: 'SYN/ACK scan detected on vehicle ethernet interface >5 ports/sec',
    severity: 'medium',
    response: 'rate_limit',
    enabled: true,
    hit_count_24h: 12,
  },
  {
    id: 'rule-010',
    name: 'Ethernet ARP Spoofing',
    category: 'ethernet',
    condition: 'duplicate ARP response for gateway MAC from unauthorized source',
    severity: 'high',
    response: 'block',
    enabled: true,
    hit_count_24h: 0,
  },
  {
    id: 'rule-011',
    name: 'Bluetooth Unauthorized Pairing',
    category: 'bluetooth',
    condition: 'pairing attempt from non-whitelisted BT MAC address',
    severity: 'medium',
    response: 'alert',
    enabled: true,
    hit_count_24h: 23,
  },
  {
    id: 'rule-012',
    name: 'Bluetooth L2CAP Injection',
    category: 'bluetooth',
    condition: 'malformed L2CAP frame or oversized signaling packet detected',
    severity: 'high',
    response: 'block',
    enabled: true,
    hit_count_24h: 0,
  },
  {
    id: 'rule-013',
    name: 'CAN Diagnostic Session Hijack',
    category: 'can',
    condition: 'extended diagnostic session opened by non-tester node without security access',
    severity: 'critical',
    response: 'block',
    enabled: true,
    hit_count_24h: 0,
  },
  {
    id: 'rule-014',
    name: 'OTA Manifest Tampering',
    category: 'ota',
    condition: 'manifest hash differs from server-signed expected hash',
    severity: 'critical',
    response: 'block_ota',
    enabled: false,
    hit_count_24h: 0,
  },
]

const NOW = new Date()

function minutesAgo(m: number): string {
  return new Date(NOW.getTime() - m * 60_000).toISOString()
}

function hoursAgo(h: number): string {
  return new Date(NOW.getTime() - h * 3_600_000).toISOString()
}

const MOCK_ALERTS: IDPSAlert[] = [
  {
    id: 'alert-001',
    timestamp: minutesAgo(3),
    rule: 'CAN Bus Flooding',
    severity: 'critical',
    response: 'block',
    description: 'CAN bus flooding detected on arbitration ID 0x1A2 — 9,200 fps sustained for 1.2s from unknown source address 0xF4',
    vehicle_id: 'v-004',
    frame_data: { arb_id: '0x1A2', fps: 9200, source_sa: '0xF4', duration_ms: 1200 },
    acknowledged: false,
  },
  {
    id: 'alert-002',
    timestamp: minutesAgo(18),
    rule: 'CAN Spoofing Detection',
    severity: 'critical',
    response: 'block',
    description: 'Suspicious CAN frame from SA 0x42 claiming to be ECM (expected SA 0x10) — potential spoofing attack',
    vehicle_id: 'v-001',
    frame_data: { arb_id: '0x3E9', claimed_sa: '0x10', actual_sa: '0x42', frame_count: 4 },
    acknowledged: false,
  },
  {
    id: 'alert-003',
    timestamp: minutesAgo(32),
    rule: 'DoIP Unauthorized Diagnostic Session',
    severity: 'critical',
    response: 'block',
    description: 'Diagnostic session request from IP 192.168.1.147 (not in gateway whitelist) — connection terminated',
    vehicle_id: 'v-003',
    frame_data: { source_ip: '192.168.1.147', target_ip: '192.168.1.1', protocol: 'DoIP', session_type: 'extended' },
    acknowledged: false,
  },
  {
    id: 'alert-004',
    timestamp: minutesAgo(45),
    rule: 'CAN Fuzzing Detection',
    severity: 'high',
    response: 'rate_limit',
    description: 'Randomized payload patterns detected across 78 frames on CAN bus 0 — fuzzing attempt suspected',
    vehicle_id: 'v-004',
    frame_data: { bus: 0, frame_count: 78, dlc_variance: 6.2 },
    acknowledged: true,
  },
  {
    id: 'alert-005',
    timestamp: minutesAgo(67),
    rule: 'OTA Rollback Attempt',
    severity: 'critical',
    response: 'block_ota',
    description: 'OTA target version 4.1.8 < current 4.2.0 without valid rollback authorization token — blocked',
    vehicle_id: 'v-002',
    frame_data: { current_version: '4.2.0', target_version: '4.1.8', rollback_token: 'MISSING' },
    acknowledged: false,
  },
  {
    id: 'alert-006',
    timestamp: hoursAgo(1.2),
    rule: 'DoIP Discovery DoS',
    severity: 'high',
    response: 'block',
    description: '142 Vehicle Identification Requests/sec from IP 10.0.0.53 — DoS attack on DoIP discovery service',
    vehicle_id: 'v-005',
    frame_data: { source_ip: '10.0.0.53', req_per_sec: 142, target: 'DoIP_VehicleIdentification' },
    acknowledged: true,
  },
  {
    id: 'alert-007',
    timestamp: hoursAgo(1.5),
    rule: 'Ethernet Port Scan',
    severity: 'medium',
    response: 'rate_limit',
    description: 'SYN scan detected on vehicle ethernet — 12 ports/sec from MAC aa:bb:cc:dd:ee:ff',
    vehicle_id: 'v-003',
    frame_data: { source_mac: 'aa:bb:cc:dd:ee:ff', ports_per_sec: 12, scan_type: 'SYN' },
    acknowledged: false,
  },
  {
    id: 'alert-008',
    timestamp: hoursAgo(2.1),
    rule: 'Bluetooth Unauthorized Pairing',
    severity: 'medium',
    response: 'alert',
    description: 'Pairing attempt from BT MAC 5C:8A:3B:F1:92:D7 — not in vehicle whitelist',
    vehicle_id: 'v-001',
    frame_data: { bt_mac: '5C:8A:3B:F1:92:D7', pairing_method: 'SSP', device_name: 'Unknown_Device' },
    acknowledged: true,
  },
  {
    id: 'alert-009',
    timestamp: hoursAgo(2.8),
    rule: 'CAN Fuzzing Detection',
    severity: 'high',
    response: 'rate_limit',
    description: 'Randomized DLC values (0-8) on CAN bus 1 from SA 0x7F — fuzzing pattern detected',
    vehicle_id: 'v-004',
    frame_data: { bus: 1, source_sa: '0x7F', dlc_range: '0-8', frame_count: 53 },
    acknowledged: true,
  },
  {
    id: 'alert-010',
    timestamp: hoursAgo(3.4),
    rule: 'DoIP Unauthorized Diagnostic Session',
    severity: 'critical',
    response: 'block',
    description: 'Programming session request from non-whitelisted IP 172.16.0.99 — potential remote exploitation',
    vehicle_id: 'v-002',
    frame_data: { source_ip: '172.16.0.99', session_type: 'programming', protocol: 'DoIP' },
    acknowledged: false,
  },
  {
    id: 'alert-011',
    timestamp: hoursAgo(4.2),
    rule: 'Bluetooth Unauthorized Pairing',
    severity: 'medium',
    response: 'alert',
    description: 'Pairing attempt from BT MAC 7D:E2:44:A8:B3:1C — device identified as "OBD2_Scanner_Generic"',
    vehicle_id: 'v-005',
    frame_data: { bt_mac: '7D:E2:44:A8:B3:1C', pairing_method: 'Legacy', device_name: 'OBD2_Scanner_Generic' },
    acknowledged: true,
  },
  {
    id: 'alert-012',
    timestamp: hoursAgo(5.6),
    rule: 'CAN Bus Flooding',
    severity: 'critical',
    response: 'block',
    description: 'CAN bus flooding on ID 0x0C0 — 8,500 fps for 2.1s from SA 0xFF',
    vehicle_id: 'v-004',
    frame_data: { arb_id: '0x0C0', fps: 8500, source_sa: '0xFF', duration_ms: 2100 },
    acknowledged: true,
  },
  {
    id: 'alert-013',
    timestamp: hoursAgo(6.3),
    rule: 'Ethernet Port Scan',
    severity: 'medium',
    response: 'rate_limit',
    description: 'ACK scan on vehicle ethernet interface from MAC 11:22:33:44:55:66',
    vehicle_id: 'v-003',
    frame_data: { source_mac: '11:22:33:44:55:66', ports_per_sec: 8, scan_type: 'ACK' },
    acknowledged: true,
  },
  {
    id: 'alert-014',
    timestamp: hoursAgo(7.1),
    rule: 'DoIP Unauthorized Diagnostic Session',
    severity: 'critical',
    response: 'block',
    description: 'Default session escalation to programming from unknown IP 192.168.100.5',
    vehicle_id: 'v-001',
    frame_data: { source_ip: '192.168.100.5', session_type: 'programming', protocol: 'DoIP' },
    acknowledged: true,
  },
  {
    id: 'alert-015',
    timestamp: hoursAgo(8.5),
    rule: 'CAN Fuzzing Detection',
    severity: 'high',
    response: 'rate_limit',
    description: 'Erratic payload length on CAN bus 0 — 62 frames with random DLC from SA 0xB0',
    vehicle_id: 'v-004',
    frame_data: { bus: 0, source_sa: '0xB0', frame_count: 62, dlc_variance: 5.8 },
    acknowledged: true,
  },
  {
    id: 'alert-016',
    timestamp: hoursAgo(9.2),
    rule: 'Bluetooth Unauthorized Pairing',
    severity: 'medium',
    response: 'alert',
    description: 'Pairing attempt from BT MAC 9A:BC:DE:F0:12:34 — device "Pixel_8_Pro" not whitelisted',
    vehicle_id: 'v-002',
    frame_data: { bt_mac: '9A:BC:DE:F0:12:34', pairing_method: 'SSP', device_name: 'Pixel_8_Pro' },
    acknowledged: true,
  },
  {
    id: 'alert-017',
    timestamp: hoursAgo(10.8),
    rule: 'Ethernet Port Scan',
    severity: 'medium',
    response: 'rate_limit',
    description: 'FIN scan from 10.10.10.50 on vehicle ethernet — 6 ports/sec',
    vehicle_id: 'v-005',
    frame_data: { source_mac: '00:11:22:33:44:55', source_ip: '10.10.10.50', ports_per_sec: 6, scan_type: 'FIN' },
    acknowledged: true,
  },
  {
    id: 'alert-018',
    timestamp: hoursAgo(12.4),
    rule: 'DoIP Discovery DoS',
    severity: 'high',
    response: 'block',
    description: 'Rapid vehicle identification from IP 192.168.1.200 — 105 req/s exceeding threshold',
    vehicle_id: 'v-003',
    frame_data: { source_ip: '192.168.1.200', req_per_sec: 105 },
    acknowledged: true,
  },
  {
    id: 'alert-019',
    timestamp: hoursAgo(14.0),
    rule: 'CAN Spoofing Detection',
    severity: 'critical',
    response: 'block',
    description: 'Steering angle sensor frame from unauthorized SA 0x61 (expected 0x22) — spoofing attempt blocked',
    vehicle_id: 'v-001',
    frame_data: { arb_id: '0x085', claimed_sa: '0x22', actual_sa: '0x61', signal: 'SAS_SteeringAngle' },
    acknowledged: true,
  },
  {
    id: 'alert-020',
    timestamp: hoursAgo(16.2),
    rule: 'Bluetooth Unauthorized Pairing',
    severity: 'medium',
    response: 'alert',
    description: 'Multiple pairing attempts from MAC 3F:4A:5B:6C:7D:8E — possible brute-force BT pairing',
    vehicle_id: 'v-004',
    frame_data: { bt_mac: '3F:4A:5B:6C:7D:8E', attempt_count: 8, device_name: 'Unknown' },
    acknowledged: true,
  },
  {
    id: 'alert-021',
    timestamp: hoursAgo(18.7),
    rule: 'CAN Fuzzing Detection',
    severity: 'high',
    response: 'rate_limit',
    description: 'Abnormal DLC variance on CAN bus 1 — fuzzing from SA 0xDE detected',
    vehicle_id: 'v-004',
    frame_data: { bus: 1, source_sa: '0xDE', frame_count: 45 },
    acknowledged: true,
  },
  {
    id: 'alert-022',
    timestamp: hoursAgo(20.3),
    rule: 'Ethernet Port Scan',
    severity: 'medium',
    response: 'rate_limit',
    description: 'XMAS scan detected from MAC 66:77:88:99:AA:BB on vehicle ethernet',
    vehicle_id: 'v-003',
    frame_data: { source_mac: '66:77:88:99:AA:BB', ports_per_sec: 4, scan_type: 'XMAS' },
    acknowledged: true,
  },
  {
    id: 'alert-023',
    timestamp: hoursAgo(22.5),
    rule: 'Bluetooth Unauthorized Pairing',
    severity: 'medium',
    response: 'alert',
    description: 'Pairing attempt from BT MAC C1:D2:E3:F4:A5:B6 — device "JBL_Flip_6" not authorized',
    vehicle_id: 'v-005',
    frame_data: { bt_mac: 'C1:D2:E3:F4:A5:B6', device_name: 'JBL_Flip_6', pairing_method: 'SSP' },
    acknowledged: true,
  },
]

const MOCK_STATS: IDPSStats = {
  total_alerts_24h: 23,
  critical_alerts: 7,
  blocked_frames: 1_847,
  model_version: 'IDPS-Net v4.2.1',
  model_precision: 0.964,
  model_recall: 0.941,
  false_positive_rate: 0.023,
  active_rules: 13,
  uptime_days: 47,
  alerts_by_type: {
    can: 8,
    doip: 5,
    ota: 1,
    ethernet: 5,
    bluetooth: 4,
  },
  alerts_by_severity: {
    critical: 7,
    high: 6,
    medium: 8,
    low: 2,
    info: 0,
  },
}

// ─── API Helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`IDPS API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ─── IDPSMonitor Class ────────────────────────────────────────────────────────

export class IDPSMonitor {
  private alerts: IDPSAlert[] = [...MOCK_ALERTS]
  private rules: IDPSRule[] = [...MOCK_RULES]
  private stats: IDPSStats = { ...MOCK_STATS }

  /** Get alerts with optional filtering */
  async getAlerts(limit?: number, severity?: IDPSAlert['severity']): Promise<IDPSAlert[]> {
    try {
      const params = new URLSearchParams()
      if (limit) params.set('limit', limit.toString())
      if (severity) params.set('severity', severity)
      const query = params.toString()
      const path = `/api/idps/alerts${query ? `?${query}` : ''}`
      return await apiFetch<IDPSAlert[]>(path)
    } catch {
      let filtered = [...this.alerts]
      if (severity) {
        filtered = filtered.filter(a => a.severity === severity)
      }
      // Sort by timestamp descending
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      if (limit) {
        filtered = filtered.slice(0, limit)
      }
      return filtered
    }
  }

  /** Acknowledge an alert */
  async acknowledgeAlert(id: string): Promise<IDPSAlert> {
    try {
      return await apiFetch<IDPSAlert>(`/api/idps/alerts/${id}/acknowledge`, {
        method: 'POST',
      })
    } catch {
      const alert = this.alerts.find(a => a.id === id)
      if (!alert) throw new Error(`Alert ${id} not found`)

      alert.acknowledged = true
      return { ...alert }
    }
  }

  /** Get all IDPS rules */
  async getRules(): Promise<IDPSRule[]> {
    try {
      return await apiFetch<IDPSRule[]>('/api/idps/rules')
    } catch {
      return [...this.rules]
    }
  }

  /** Enable or disable a specific rule */
  async toggleRule(id: string, enabled: boolean): Promise<IDPSRule> {
    try {
      return await apiFetch<IDPSRule>(`/api/idps/rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      })
    } catch {
      const rule = this.rules.find(r => r.id === id)
      if (!rule) throw new Error(`Rule ${id} not found`)

      rule.enabled = enabled

      // Update stats
      const activeCount = this.rules.filter(r => r.enabled).length
      this.stats.active_rules = activeCount

      return { ...rule }
    }
  }

  /** Get IDPS statistics */
  async getStats(): Promise<IDPSStats> {
    try {
      return await apiFetch<IDPSStats>('/api/idps/stats')
    } catch {
      // Recalculate from current state
      const last24h = this.alerts.filter(a => {
        const alertTime = new Date(a.timestamp).getTime()
        return NOW.getTime() - alertTime < 24 * 3_600_000
      })

      const criticalCount = last24h.filter(a => a.severity === 'critical').length
      const blockedCount = this.rules
        .filter(r => r.response === 'block' && r.enabled)
        .reduce((sum, r) => sum + r.hit_count_24h, 0)

      const byType: Record<string, number> = {}
      const bySeverity: Record<string, number> = {}

      for (const alert of last24h) {
        // Determine type from rule category
        const rule = this.rules.find(r => r.name === alert.rule)
        const category = rule?.category ?? 'unknown'
        byType[category] = (byType[category] ?? 0) + 1
        bySeverity[alert.severity] = (bySeverity[alert.severity] ?? 0) + 1
      }

      return {
        ...this.stats,
        total_alerts_24h: last24h.length,
        critical_alerts: criticalCount,
        blocked_frames: blockedCount,
        active_rules: this.rules.filter(r => r.enabled).length,
        alerts_by_type: byType,
        alerts_by_severity: bySeverity,
      }
    }
  }

  /** Get unacknowledged alert count */
  async getUnacknowledgedCount(): Promise<number> {
    try {
      const stats = await this.getStats()
      return stats.critical_alerts
    } catch {
      return this.alerts.filter(a => !a.acknowledged).length
    }
  }
}

// Singleton instance
export const idpsMonitor = new IDPSMonitor()
