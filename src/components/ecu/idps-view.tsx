'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  idpsMonitor,
  type IDPSAlert,
  type IDPSRule,
  type IDPSStats,
} from '@/lib/idps-monitor'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
  Search,
  Zap,
  Bell,
  Bug,
  Eye,
  Lock,
  Globe,
  Server,
  FileText,
  Clock,
  Cpu,
  Microchip,
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  ExternalLink,
  Wifi,
  ArrowRight,
} from 'lucide-react'

// ── Severity Helpers ────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { color: string; label: string; icon: typeof AlertTriangle }> = {
  critical: { color: '#ef4444', label: 'CRITICAL', icon: XCircle },
  high:     { color: '#f59e0b', label: 'HIGH',     icon: AlertTriangle },
  medium:   { color: '#00d4ff', label: 'MEDIUM',   icon: Bell },
  low:      { color: '#8b5cf6', label: 'LOW',      icon: Zap },
  info:     { color: '#64748b', label: 'INFO',     icon: Activity },
}

const RESPONSE_CONFIG: Record<string, { color: string; label: string }> = {
  block:      { color: '#ef4444', label: 'BLOCK' },
  rate_limit: { color: '#f59e0b', label: 'RATE LIMIT' },
  alert:      { color: '#00d4ff', label: 'ALERT' },
  block_ota:  { color: '#8b5cf6', label: 'BLOCK OTA' },
}

const CATEGORY_CONFIG: Record<string, { color: string; label: string; icon: typeof Shield }> = {
  can:      { color: '#00d4ff', label: 'CAN',      icon: Microchip },
  doip:     { color: '#8b5cf6', label: 'DoIP',     icon: Globe },
  ota:      { color: '#f59e0b', label: 'OTA',      icon: Lock },
  ethernet: { color: '#10b981', label: 'Ethernet', icon: Wifi },
  bluetooth:{ color: '#ef4444', label: 'Bluetooth',icon: Zap },
}

// ── HUD Card Wrapper ────────────────────────────────────────────────────────────

function HudCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative rounded-lg border border-[#1e2a3a] bg-[#151d2b] p-4', className)}>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00d4ff]" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00d4ff]" />
      {children}
    </div>
  )
}

// ── Time Formatting ─────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ── Mini Bar Chart (no external chart lib needed) ──────────────────────────────

function MiniBarChart({ data, colorMap }: { data: Record<string, number>; colorMap: Record<string, string> }) {
  const maxVal = Math.max(...Object.values(data), 1)
  return (
    <div className="flex items-end gap-2 h-20">
      {Object.entries(data).map(([key, value]) => {
        const color = colorMap[key] ?? '#64748b'
        const heightPct = (value / maxVal) * 100
        return (
          <div key={key} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono font-semibold" style={{ color }}>
              {value}
            </span>
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${Math.max(4, heightPct)}%`,
                backgroundColor: color,
                opacity: 0.8,
              }}
            />
            <span className="text-[8px] text-[#475569] uppercase truncate w-full text-center">
              {key}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────────

export function IdpsView() {
  const [alerts, setAlerts] = useState<IDPSAlert[]>([])
  const [rules, setRules] = useState<IDPSRule[]>([])
  const [stats, setStats] = useState<IDPSStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [alertData, ruleData, statsData] = await Promise.all([
        idpsMonitor.getAlerts(),
        idpsMonitor.getRules(),
        idpsMonitor.getStats(),
      ])
      setAlerts(alertData)
      setRules(ruleData)
      setStats(statsData)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Acknowledge alert
  const handleAcknowledge = useCallback(async (id: string) => {
    setAcknowledgingId(id)
    try {
      const updated = await idpsMonitor.acknowledgeAlert(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: updated.acknowledged } : a))
    } catch {
      // silent
    } finally {
      setAcknowledgingId(null)
    }
  }, [])

  // Toggle rule
  const handleToggleRule = useCallback(async (id: string, enabled: boolean) => {
    try {
      const updated = await idpsMonitor.toggleRule(id, enabled)
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: updated.enabled } : r))
      // Refresh stats since active_rules count changes
      const newStats = await idpsMonitor.getStats()
      setStats(newStats)
    } catch {
      // silent
    }
  }, [])

  // Filter alerts
  const filteredAlerts = alerts.filter(a => {
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter
    const matchesSearch = searchTerm === '' ||
      a.rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.vehicle_id ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  const unackedCount = alerts.filter(a => !a.acknowledged).length

  // Severity color map for chart
  const severityColorMap: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#00d4ff',
    low: '#8b5cf6',
    info: '#64748b',
  }

  const categoryColorMap: Record<string, string> = {
    can: '#00d4ff',
    doip: '#8b5cf6',
    ota: '#f59e0b',
    ethernet: '#10b981',
    bluetooth: '#ef4444',
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">IDPS Monitor</h1>
              <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-[#64748b]">
              Intrusion Detection &amp; Prevention — ISO 21434 / UNECE R155
            </p>
          </div>

          {/* Header stats */}
          {stats && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
                <Cpu className="h-3.5 w-3.5 text-[#8b5cf6]" />
                <span className="text-[10px] text-[#64748b]">Model</span>
                <span className="text-[11px] font-mono text-[#8b5cf6]">{stats.model_version}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
                <Eye className="h-3.5 w-3.5 text-[#00d4ff]" />
                <span className="text-[10px] text-[#64748b]">Rules</span>
                <span className="text-[11px] font-mono text-[#00d4ff]">{stats.active_rules}/{rules.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
                <Clock className="h-3.5 w-3.5 text-[#10b981]" />
                <span className="text-[10px] text-[#64748b]">Uptime</span>
                <span className="text-[11px] font-mono text-[#10b981]">{stats.uptime_days}d</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] gap-1"
                onClick={loadData}
              >
                <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          )}
        </div>

        {/* ── Model Metrics Row ────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HudCard className="!p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wide font-medium">Precision</span>
                <Activity className="h-3.5 w-3.5 text-[#10b981]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#10b981]">
                {(stats.model_precision * 100).toFixed(1)}%
              </div>
              <div className="w-full h-1 bg-[#1e2a3a] rounded-full overflow-hidden mt-1.5">
                <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${stats.model_precision * 100}%` }} />
              </div>
            </HudCard>

            <HudCard className="!p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wide font-medium">Recall</span>
                <Shield className="h-3.5 w-3.5 text-[#00d4ff]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#00d4ff]">
                {(stats.model_recall * 100).toFixed(1)}%
              </div>
              <div className="w-full h-1 bg-[#1e2a3a] rounded-full overflow-hidden mt-1.5">
                <div className="h-full rounded-full bg-[#00d4ff]" style={{ width: `${stats.model_recall * 100}%` }} />
              </div>
            </HudCard>

            <HudCard className="!p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wide font-medium">False Positive</span>
                <Bug className="h-3.5 w-3.5 text-[#f59e0b]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#f59e0b]">
                {(stats.false_positive_rate * 100).toFixed(1)}%
              </div>
              <div className="w-full h-1 bg-[#1e2a3a] rounded-full overflow-hidden mt-1.5">
                <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: `${stats.false_positive_rate * 100}%` }} />
              </div>
            </HudCard>

            <HudCard className="!p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wide font-medium">Blocked Frames</span>
                <XCircle className="h-3.5 w-3.5 text-[#ef4444]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#ef4444]">
                {stats.blocked_frames.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#475569] mt-1.5">24h total</div>
            </HudCard>
          </div>
        )}

        {/* ── Main Grid ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ── Left Column: Alert Stream + Threat Stats ──────────────────────── */}
          <div className="lg:col-span-8 space-y-4">

            {/* ── Alert Stream ──────────────────────────────────────────────────── */}
            <HudCard>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#ef4444]" />
                    Alert Stream
                    {unackedCount > 0 && (
                      <Badge className="text-[9px] bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 animate-pulse">
                        {unackedCount} Unacked
                      </Badge>
                    )}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
                      {filteredAlerts.length} alerts
                    </Badge>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#475569]" />
                    <Input
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="h-8 pl-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['all', 'critical', 'high', 'medium', 'low', 'info'].map(sev => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-medium border transition-all capitalize',
                          severityFilter === sev
                            ? sev === 'all'
                              ? 'bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff]'
                              : 'border-transparent'
                            : 'bg-[#0f1923] border-[#1e2a3a] text-[#64748b] hover:text-[#94a3b8] hover:border-[#2d3f55]'
                        )}
                        style={
                          severityFilter === sev && sev !== 'all'
                            ? {
                                backgroundColor: `${SEVERITY_CONFIG[sev].color}20`,
                                borderColor: `${SEVERITY_CONFIG[sev].color}40`,
                                color: SEVERITY_CONFIG[sev].color,
                              }
                            : undefined
                        }
                      >
                        {sev === 'all' ? 'All' : SEVERITY_CONFIG[sev].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alert list */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] animate-pulse">
                        <div className="flex items-start gap-3">
                          <div className="h-7 w-7 rounded-md bg-[#1e2a3a]" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-[#1e2a3a] rounded w-3/4" />
                            <div className="h-2 bg-[#1e2a3a] rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : filteredAlerts.length === 0 ? (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="h-6 w-6 text-[#10b981] mx-auto mb-2" />
                      <p className="text-[11px] text-[#64748b]">No alerts match current filters</p>
                    </div>
                  ) : (
                    filteredAlerts.map(alert => {
                      const sevConf = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info
                      const respConf = RESPONSE_CONFIG[alert.response] ?? RESPONSE_CONFIG.alert
                      const SevIcon = sevConf.icon
                      return (
                        <div
                          key={alert.id}
                          className={cn(
                            'p-3 rounded-lg border transition-all group',
                            alert.acknowledged
                              ? 'bg-[#0f1923]/60 border-[#1e2a3a] opacity-60'
                              : 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Severity icon */}
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${sevConf.color}15` }}
                            >
                              <SevIcon className="h-3.5 w-3.5" style={{ color: sevConf.color }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-[#e2e8f0]">{alert.rule}</span>
                                <Badge
                                  className="text-[8px] border-0 h-4 px-1.5"
                                  style={{
                                    color: sevConf.color,
                                    backgroundColor: `${sevConf.color}20`,
                                  }}
                                >
                                  {sevConf.label}
                                </Badge>
                                <Badge
                                  className="text-[8px] border-0 h-4 px-1.5"
                                  style={{
                                    color: respConf.color,
                                    backgroundColor: `${respConf.color}20`,
                                  }}
                                >
                                  {respConf.label}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-[#94a3b8] leading-relaxed line-clamp-2">
                                {alert.description}
                              </p>
                              <div className="flex items-center gap-3 text-[9px] text-[#475569]">
                                <span className="flex items-center gap-1" suppressHydrationWarning>
                                  <Clock className="h-2.5 w-2.5" />
                                  {timeAgo(alert.timestamp)}
                                </span>
                                {alert.vehicle_id && (
                                  <span className="flex items-center gap-1">
                                    <Server className="h-2.5 w-2.5" />
                                    {alert.vehicle_id}
                                  </span>
                                )}
                                {alert.acknowledged && (
                                  <span className="flex items-center gap-1 text-[#10b981]">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    ACKED
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Acknowledge button */}
                            {!alert.acknowledged && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] text-[#64748b] hover:text-[#00d4ff] shrink-0 gap-1"
                                disabled={acknowledgingId === alert.id}
                                onClick={() => handleAcknowledge(alert.id)}
                              >
                                {acknowledgingId === alert.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                ACK
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </HudCard>

            {/* ── Threat Stats ──────────────────────────────────────────────────── */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* By Severity */}
                <HudCard>
                  <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                    Alerts by Severity
                    <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
                      24h
                    </Badge>
                  </h3>
                  <MiniBarChart data={stats.alerts_by_severity} colorMap={severityColorMap} />
                </HudCard>

                {/* By Category */}
                <HudCard>
                  <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2 mb-4">
                    <Bug className="h-4 w-4 text-[#8b5cf6]" />
                    Alerts by Category
                    <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
                      24h
                    </Badge>
                  </h3>
                  <MiniBarChart data={stats.alerts_by_type} colorMap={categoryColorMap} />
                </HudCard>
              </div>
            )}
          </div>

          {/* ── Right Column: Rule Editor ─────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <HudCard>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00d4ff]" />
                    Rule Editor
                    <Badge className="text-[9px] bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30">
                      {rules.filter(r => r.enabled).length}/{rules.length}
                    </Badge>
                  </h2>
                </div>

                <div className="text-[10px] text-[#475569] mb-1">
                  ISO 21434 / UNECE R155 detection rules — toggle to enable/disable
                </div>

                {/* Rule list */}
                <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1 custom-scrollbar">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] animate-pulse">
                        <div className="h-3 bg-[#1e2a3a] rounded w-3/4 mb-2" />
                        <div className="h-2 bg-[#1e2a3a] rounded w-1/2" />
                      </div>
                    ))
                  ) : (
                    rules.map(rule => {
                      const catConf = CATEGORY_CONFIG[rule.category] ?? CATEGORY_CONFIG.can
                      const sevConf = SEVERITY_CONFIG[rule.severity] ?? SEVERITY_CONFIG.info
                      const CatIcon = catConf.icon
                      return (
                        <div
                          key={rule.id}
                          className={cn(
                            'p-3 rounded-lg border transition-all',
                            rule.enabled
                              ? 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]'
                              : 'bg-[#0f1923]/40 border-[#1e2a3a] opacity-50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className="text-[11px] font-semibold text-[#e2e8f0] truncate">
                                  {rule.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  className="text-[8px] border-0 h-4 px-1.5 gap-0.5"
                                  style={{
                                    color: catConf.color,
                                    backgroundColor: `${catConf.color}20`,
                                  }}
                                >
                                  <CatIcon className="h-2 w-2" />
                                  {catConf.label}
                                </Badge>
                                <Badge
                                  className="text-[8px] border-0 h-4 px-1.5"
                                  style={{
                                    color: sevConf.color,
                                    backgroundColor: `${sevConf.color}20`,
                                  }}
                                >
                                  {sevConf.label}
                                </Badge>
                                <Badge
                                  className="text-[8px] border-0 h-4 px-1.5"
                                  style={{
                                    color: RESPONSE_CONFIG[rule.response]?.color ?? '#64748b',
                                    backgroundColor: `${RESPONSE_CONFIG[rule.response]?.color ?? '#64748b'}20`,
                                  }}
                                >
                                  {RESPONSE_CONFIG[rule.response]?.label ?? rule.response}
                                </Badge>
                              </div>
                            </div>

                            {/* Toggle switch (custom styled) */}
                            <button
                              onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                              className={cn(
                                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
                                rule.enabled ? 'bg-[#10b981]' : 'bg-[#1e2a3a]'
                              )}
                              role="switch"
                              aria-checked={rule.enabled}
                            >
                              <span
                                className={cn(
                                  'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                                  rule.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                                )}
                              />
                            </button>
                          </div>

                          {/* Condition text */}
                          <p className="text-[10px] text-[#475569] leading-relaxed mb-2 line-clamp-2">
                            {rule.condition}
                          </p>

                          {/* Hit count */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-[#475569]" />
                              <span className="text-[9px] text-[#475569]">Hits (24h)</span>
                            </div>
                            <span
                              className={cn(
                                'text-[11px] font-mono font-semibold',
                                rule.hit_count_24h > 0 ? 'text-[#f59e0b]' : 'text-[#475569]'
                              )}
                            >
                              {rule.hit_count_24h}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </HudCard>
          </div>
        </div>
      </div>
    </div>
  )
}
