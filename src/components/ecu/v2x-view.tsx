'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Globe,
  Radio,
  Activity,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Search,
  Wifi,
  Shield,
  Zap,
  X,
  ArrowRight,
  Clock,
  Car,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface V2XMessage {
  id: string
  timestamp: string
  type: 'CAM' | 'DENM' | 'SPAT' | 'CPM' | 'IVIM'
  station_id: number
  direction: 'rx' | 'tx'
  data: Record<string, unknown>
}

interface V2XStats {
  cam_per_sec: number
  denm_per_sec: number
  spat_per_sec: number
  total_messages: number
  error_rate: number
  latency_ms: number
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_MESSAGES: V2XMessage[] = [
  {
    id: 'v2x-001',
    timestamp: '2026-03-15T14:32:01.142Z',
    type: 'CAM',
    station_id: 4096,
    direction: 'rx',
    data: { speed_kmh: 82.4, heading_deg: 187.3, lat: 48.1351, lon: 11.5820, vehicle_length: 4.5, lane_position: 2 },
  },
  {
    id: 'v2x-002',
    timestamp: '2026-03-15T14:32:01.248Z',
    type: 'DENM',
    station_id: 8192,
    direction: 'rx',
    data: { cause_code: 97, sub_cause: 1, event_lat: 48.1355, event_lon: 11.5830, severity: 'collisionRisk', validity_dur_s: 30 },
  },
  {
    id: 'v2x-003',
    timestamp: '2026-03-15T14:32:01.356Z',
    type: 'SPAT',
    station_id: 2048,
    direction: 'rx',
    data: { intersection_id: 4701, phase: 'protectedAllClear', time_to_change_ms: 12400, signal_group: 7 },
  },
  {
    id: 'v2x-004',
    timestamp: '2026-03-15T14:32:01.478Z',
    type: 'CAM',
    station_id: 4097,
    direction: 'rx',
    data: { speed_kmh: 45.1, heading_deg: 12.8, lat: 48.1360, lon: 11.5810, vehicle_length: 4.8, lane_position: 1 },
  },
  {
    id: 'v2x-005',
    timestamp: '2026-03-15T14:32:01.512Z',
    type: 'CAM',
    station_id: 4100,
    direction: 'tx',
    data: { speed_kmh: 67.3, heading_deg: 270.0, lat: 48.1348, lon: 11.5815, vehicle_length: 4.2, lane_position: 3 },
  },
  {
    id: 'v2x-006',
    timestamp: '2026-03-15T14:32:01.634Z',
    type: 'CPM',
    station_id: 3072,
    direction: 'rx',
    data: { sensor_id: 'lidar_front', object_count: 3, objects: [{ type: 'vehicle', dist_m: 42.1 }, { type: 'pedestrian', dist_m: 18.7 }, { type: 'cyclist', dist_m: 31.5 }] },
  },
  {
    id: 'v2x-007',
    timestamp: '2026-03-15T14:32:01.789Z',
    type: 'SPAT',
    station_id: 2049,
    direction: 'rx',
    data: { intersection_id: 4702, phase: 'permissive', time_to_change_ms: 5600, signal_group: 3 },
  },
  {
    id: 'v2x-008',
    timestamp: '2026-03-15T14:32:01.901Z',
    type: 'DENM',
    station_id: 8193,
    direction: 'rx',
    data: { cause_code: 14, sub_cause: 1, event_lat: 48.1370, event_lon: 11.5840, severity: 'warning', validity_dur_s: 60 },
  },
  {
    id: 'v2x-009',
    timestamp: '2026-03-15T14:32:02.012Z',
    type: 'IVIM',
    station_id: 5120,
    direction: 'rx',
    data: { zone_id: 'DE-BY-A9-42', zone_type: 'roadworks', speed_limit_kmh: 80, direction: 'southbound' },
  },
  {
    id: 'v2x-010',
    timestamp: '2026-03-15T14:32:02.145Z',
    type: 'CAM',
    station_id: 4102,
    direction: 'rx',
    data: { speed_kmh: 110.7, heading_deg: 355.2, lat: 48.1380, lon: 11.5800, vehicle_length: 5.1, lane_position: 1 },
  },
  {
    id: 'v2x-011',
    timestamp: '2026-03-15T14:32:02.278Z',
    type: 'CAM',
    station_id: 4103,
    direction: 'tx',
    data: { speed_kmh: 67.5, heading_deg: 270.1, lat: 48.1347, lon: 11.5813, vehicle_length: 4.2, lane_position: 3 },
  },
  {
    id: 'v2x-012',
    timestamp: '2026-03-15T14:32:02.390Z',
    type: 'DENM',
    station_id: 8194,
    direction: 'rx',
    data: { cause_code: 97, sub_cause: 2, event_lat: 48.1390, event_lon: 11.5850, severity: 'collisionRisk', validity_dur_s: 15 },
  },
  {
    id: 'v2x-013',
    timestamp: '2026-03-15T14:32:02.501Z',
    type: 'SPAT',
    station_id: 2048,
    direction: 'rx',
    data: { intersection_id: 4701, phase: 'permissive', time_to_change_ms: 22000, signal_group: 7 },
  },
  {
    id: 'v2x-014',
    timestamp: '2026-03-15T14:32:02.623Z',
    type: 'CPM',
    station_id: 3073,
    direction: 'rx',
    data: { sensor_id: 'radar_front', object_count: 2, objects: [{ type: 'vehicle', dist_m: 65.3 }, { type: 'vehicle', dist_m: 88.1 }] },
  },
  {
    id: 'v2x-015',
    timestamp: '2026-03-15T14:32:02.756Z',
    type: 'CAM',
    station_id: 4105,
    direction: 'rx',
    data: { speed_kmh: 22.0, heading_deg: 90.0, lat: 48.1340, lon: 11.5860, vehicle_length: 3.8, lane_position: 1 },
  },
]

const MOCK_STATS: V2XStats = {
  cam_per_sec: 12.4,
  denm_per_sec: 1.8,
  spat_per_sec: 3.2,
  total_messages: 48721,
  error_rate: 0.003,
  latency_ms: 18.7,
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<V2XMessage['type'], string> = {
  CAM: '#00d4ff',
  DENM: '#ef4444',
  SPAT: '#10b981',
  CPM: '#f59e0b',
  IVIM: '#8b5cf6',
}

const TYPE_LABELS: Record<V2XMessage['type'], string> = {
  CAM: 'Cooperative Awareness',
  DENM: 'Decentralized Environmental',
  SPAT: 'Signal Phase & Timing',
  CPM: 'Collective Perception',
  IVIM: 'In-Vehicle Information',
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    '.' + String(d.getMilliseconds()).padStart(3, '0')
}

function getKeyDataFields(msg: V2XMessage): string {
  const d = msg.data
  switch (msg.type) {
    case 'CAM':
      return `${d.speed_kmh ?? '--'} km/h · ${(d.heading_deg as number ?? 0).toFixed(0)}°`
    case 'DENM':
      return `Cause: ${d.cause_code} · ${String(d.severity ?? '--')}`
    case 'SPAT':
      return `Phase: ${String(d.phase ?? '--')} · ${d.time_to_change_ms ?? '--'}ms`
    case 'CPM':
      return `Objects: ${d.object_count ?? 0} · ${String((d.objects as Array<{ type: string }> ?? []).map(o => o.type).join(', '))}`
    case 'IVIM':
      return `${String(d.zone_type ?? '--')} · ${d.speed_limit_kmh ?? '--'} km/h`
    default:
      return '--'
  }
}

// ── HUD Card ───────────────────────────────────────────────────────────────

function HudCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative rounded-lg border border-[#1e2a3a] bg-[#151d2b] p-4', className)}>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00d4ff]" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00d4ff]" />
      {children}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function V2XView() {
  const [isLive, setIsLive] = useState(false)
  const [messages] = useState<V2XMessage[]>(MOCK_MESSAGES)
  const [stats] = useState<V2XStats>(MOCK_STATS)
  const [selectedMessage, setSelectedMessage] = useState<V2XMessage | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<V2XMessage['type'] | 'ALL'>('ALL')
  const [expandedDetail, setExpandedDetail] = useState(true)

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = !searchQuery ||
      msg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(msg.station_id).includes(searchQuery)
    const matchesType = typeFilter === 'ALL' || msg.type === typeFilter
    return matchesSearch && matchesType
  })

  const overallScore = 97.2

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center">
              <Globe className="h-5 w-5 text-[#00d4ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#e2e8f0]">V2X Communication Monitor</h1>
                {isLive && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]" />
                    <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">Live</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#00d4ff]/15 text-[#00d4ff]">
                  ETSI ITS
                </Badge>
                <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#8b5cf6]/15 text-[#8b5cf6]">
                  SAE J2735
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={cn(
                'h-8 text-xs font-semibold gap-1.5',
                isLive
                  ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                  : 'bg-[#10b981] text-[#0f1923] hover:bg-[#059669]'
              )}
            >
              {isLive ? (
                <><Pause className="h-3 w-3" /> Stop</>
              ) : (
                <><Play className="h-3 w-3" /> Go Live</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
              onClick={() => setSelectedMessage(null)}
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Stats Bar ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Car className="h-3 w-3 text-[#00d4ff]" />
              <span className="text-[10px] text-[#64748b] font-medium">CAM/s</span>
            </div>
            <span className="text-lg font-bold text-[#00d4ff] font-mono tabular-nums">{stats.cam_per_sec}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-[#ef4444]" />
              <span className="text-[10px] text-[#64748b] font-medium">DENM/s</span>
            </div>
            <span className="text-lg font-bold text-[#ef4444] font-mono tabular-nums">{stats.denm_per_sec}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3 w-3 text-[#10b981]" />
              <span className="text-[10px] text-[#64748b] font-medium">SPAT/s</span>
            </div>
            <span className="text-lg font-bold text-[#10b981] font-mono tabular-nums">{stats.spat_per_sec}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Radio className="h-3 w-3 text-[#f59e0b]" />
              <span className="text-[10px] text-[#64748b] font-medium">Total Msgs</span>
            </div>
            <span className="text-lg font-bold text-[#e2e8f0] font-mono tabular-nums">{stats.total_messages.toLocaleString()}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3 w-3 text-[#f59e0b]" />
              <span className="text-[10px] text-[#64748b] font-medium">Error Rate</span>
            </div>
            <span className="text-lg font-bold text-[#10b981] font-mono tabular-nums">{(stats.error_rate * 100).toFixed(1)}%</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 text-[#8b5cf6]" />
              <span className="text-[10px] text-[#64748b] font-medium">Latency</span>
            </div>
            <span className="text-lg font-bold text-[#8b5cf6] font-mono tabular-nums">{stats.latency_ms.toFixed(1)}ms</span>
          </HudCard>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
            <Input
              placeholder="Search by ID or Station ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:border-[#00d4ff] focus-visible:ring-[#00d4ff]/20"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'CAM', 'DENM', 'SPAT', 'CPM', 'IVIM'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'h-7 px-2.5 rounded text-[10px] font-semibold transition-colors',
                  typeFilter === type
                    ? 'text-[#0f1923]'
                    : 'bg-[#151d2b] border border-[#1e2a3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55]'
                )}
                style={typeFilter === type ? { backgroundColor: type === 'ALL' ? '#00d4ff' : TYPE_COLORS[type as V2XMessage['type']] } : undefined}
              >
                {type}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        </div>

        {/* ── Main Content: Message Feed + Detail Panel ───────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Message Feed */}
          <div className={cn('xl:col-span-2', selectedMessage ? 'xl:col-span-2' : 'xl:col-span-3')}>
            <HudCard className="p-0 overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a]">
                <div className="flex items-center gap-2">
                  <Wifi className="h-3.5 w-3.5 text-[#00d4ff]" />
                  <span className="text-xs font-semibold text-[#e2e8f0]">V2X Message Feed</span>
                  <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#00d4ff]/15 text-[#00d4ff]">
                    {filteredMessages.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[#64748b]">Quality Score</span>
                  <span className="text-[11px] font-bold text-[#10b981] font-mono">{overallScore}%</span>
                </div>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-[100px_55px_70px_1fr_80px_45px] gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#475569] border-b border-[#1e2a3a]">
                <span>Timestamp</span>
                <span>Type</span>
                <span>Station</span>
                <span>Key Data</span>
                <span>Direction</span>
                <span></span>
              </div>

              {/* Message Rows */}
              <div
                className="max-h-[440px] overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}
              >
                {filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(selectedMessage?.id === msg.id ? null : msg)
                      setExpandedDetail(true)
                    }}
                    className={cn(
                      'w-full grid grid-cols-[100px_55px_70px_1fr_80px_45px] gap-2 px-4 py-2 text-[11px] border-b border-[#1e2a3a]/50 transition-colors text-left',
                      selectedMessage?.id === msg.id
                        ? 'bg-[#00d4ff]/5 border-l-2 border-l-[#00d4ff]'
                        : 'hover:bg-[#1e2a3a]/30 border-l-2 border-l-transparent'
                    )}
                  >
                    <span className="text-[#64748b] font-mono tabular-nums text-[10px]">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                    <span>
                      <Badge
                        className="text-[9px] border-0 px-1.5 py-0 h-4 font-bold"
                        style={{
                          backgroundColor: `${TYPE_COLORS[msg.type]}20`,
                          color: TYPE_COLORS[msg.type],
                        }}
                      >
                        {msg.type}
                      </Badge>
                    </span>
                    <span className="text-[#94a3b8] font-mono tabular-nums">{msg.station_id}</span>
                    <span className="text-[#94a3b8] truncate text-[10px]">{getKeyDataFields(msg)}</span>
                    <span>
                      <Badge
                        className={cn(
                          'text-[9px] border-0 px-1.5 py-0 h-4 font-bold',
                          msg.direction === 'rx'
                            ? 'bg-[#10b981]/15 text-[#10b981]'
                            : 'bg-[#00d4ff]/15 text-[#00d4ff]'
                        )}
                      >
                        {msg.direction.toUpperCase()}
                      </Badge>
                    </span>
                    <span className="flex items-center justify-center">
                      <Eye className="h-3 w-3 text-[#475569]" />
                    </span>
                  </button>
                ))}
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[#1e2a3a] bg-[#0f1923]/50">
                <span className="text-[10px] text-[#475569]">
                  Showing {filteredMessages.length} of {messages.length} messages
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px]">
                    <ArrowRight className="h-3 w-3 text-[#10b981]" />
                    <span className="text-[#10b981] font-semibold">{messages.filter(m => m.direction === 'rx').length}</span>
                    <span className="text-[#475569]">RX</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px]">
                    <ArrowRight className="h-3 w-3 text-[#00d4ff] rotate-180" />
                    <span className="text-[#00d4ff] font-semibold">{messages.filter(m => m.direction === 'tx').length}</span>
                    <span className="text-[#475569]">TX</span>
                  </span>
                </div>
              </div>
            </HudCard>
          </div>

          {/* Detail Panel */}
          {selectedMessage && expandedDetail && (
            <div className="xl:col-span-1">
              <HudCard className="p-0 overflow-hidden">
                {/* Detail Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a]">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#00d4ff]" />
                    <span className="text-xs font-semibold text-[#e2e8f0]">Message Detail</span>
                  </div>
                  <button
                    onClick={() => setExpandedDetail(false)}
                    className="p-1 rounded hover:bg-[#1e2a3a] transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-[#64748b]" />
                  </button>
                </div>

                <div className="p-4 space-y-3 max-h-[440px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
                  {/* Message Meta */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#64748b]">Message ID</span>
                      <span className="text-[11px] text-[#e2e8f0] font-mono">{selectedMessage.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#64748b]">Type</span>
                      <Badge
                        className="text-[9px] border-0 px-1.5 py-0 h-4 font-bold"
                        style={{
                          backgroundColor: `${TYPE_COLORS[selectedMessage.type]}20`,
                          color: TYPE_COLORS[selectedMessage.type],
                        }}
                      >
                        {selectedMessage.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#64748b]">Description</span>
                      <span className="text-[10px] text-[#94a3b8]">{TYPE_LABELS[selectedMessage.type]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#64748b]">Station ID</span>
                      <span className="text-[11px] text-[#e2e8f0] font-mono">{selectedMessage.station_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#64748b]">Direction</span>
                      <Badge
                        className={cn(
                          'text-[9px] border-0 px-1.5 py-0 h-4 font-bold',
                          selectedMessage.direction === 'rx'
                            ? 'bg-[#10b981]/15 text-[#10b981]'
                            : 'bg-[#00d4ff]/15 text-[#00d4ff]'
                        )}
                      >
                        {selectedMessage.direction.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#64748b]">Timestamp</span>
                      <span className="text-[11px] text-[#e2e8f0] font-mono">{formatTimestamp(selectedMessage.timestamp)}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#1e2a3a] pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-2 block">
                      Decoded Payload
                    </span>
                    <div className="bg-[#0c1219] border border-[#1e2a3a] rounded-md p-3 space-y-1.5">
                      {Object.entries(selectedMessage.data).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-2">
                          <span className="text-[10px] text-[#64748b] font-mono shrink-0">{key}</span>
                          <span className="text-[10px] text-[#00d4ff] font-mono text-right break-all">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div className="border-t border-[#1e2a3a] pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-2 block">
                      Validation
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                        <span className="text-[10px] text-[#94a3b8]">ASN.1 Structure Valid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                        <span className="text-[10px] text-[#94a3b8]">Signature Verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                        <span className="text-[10px] text-[#94a3b8]">Timestamp Fresh</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                        <span className="text-[10px] text-[#94a3b8]">Station ID in CRL</span>
                      </div>
                    </div>
                  </div>

                  {/* Latency Bar */}
                  <div className="border-t border-[#1e2a3a] pt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-[#64748b]">Latency</span>
                      <span className="text-[10px] text-[#8b5cf6] font-mono font-bold">{stats.latency_ms.toFixed(1)} ms</span>
                    </div>
                    <Progress value={Math.min((stats.latency_ms / 100) * 100, 100)} className="h-1.5 bg-[#0c1219]" />
                  </div>
                </div>
              </HudCard>
            </div>
          )}
        </div>

        {/* ── Protocol Distribution ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(['CAM', 'DENM', 'SPAT', 'CPM', 'IVIM'] as const).map((type) => {
            const count = messages.filter(m => m.type === type).length
            const pct = (count / messages.length) * 100
            return (
              <HudCard key={type} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-4 font-bold"
                    style={{
                      backgroundColor: `${TYPE_COLORS[type]}20`,
                      color: TYPE_COLORS[type],
                    }}
                  >
                    {type}
                  </Badge>
                  <span className="text-[10px] text-[#64748b]">{count} msgs</span>
                </div>
                <div className="h-1.5 w-full bg-[#0c1219] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[type] }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-[#475569]">{TYPE_LABELS[type]}</span>
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: TYPE_COLORS[type] }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </HudCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}
