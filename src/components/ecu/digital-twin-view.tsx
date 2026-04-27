'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  digitalTwinEngine,
  type DigitalTwinState,
  type OTASimulationResult,
} from '@/lib/digital-twin-engine'
import {
  Globe,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronRight,
  Search,
  Shield,
  Zap,
  FileText,
  ArrowRight,
  Server,
  Microchip,
  Clock,
  Car,
  Eye,
  Bug,
  Download,
  RotateCcw,
  Upload,
  Pause,
  Lock,
} from 'lucide-react'

// ── Severity / Risk Color Helpers ──────────────────────────────────────────────

function healthColor(score: number): string {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#f59e0b'
  return '#ef4444'
}

function riskColor(level: 'low' | 'medium' | 'high'): string {
  if (level === 'low') return '#10b981'
  if (level === 'medium') return '#f59e0b'
  return '#ef4444'
}

function stalenessLabel(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1_000)}s ago`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`
  return `${Math.round(ms / 3_600_000)}h ago`
}

// ── HUD Card Wrapper ───────────────────────────────────────────────────────────

function HudCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative rounded-lg border border-[#1e2a3a] bg-[#151d2b] p-4', className)}>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00d4ff]" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00d4ff]" />
      {children}
    </div>
  )
}

// ── Health Gauge SVG ────────────────────────────────────────────────────────────

function HealthGauge({ score }: { score: number }) {
  const color = healthColor(score)
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#1e2a3a" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono" style={{ color }}>
          {score}
        </span>
        <span className="text-[9px] text-[#64748b]">Health</span>
      </div>
    </div>
  )
}

// ── Confidence Bar ──────────────────────────────────────────────────────────────

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const color = value >= 0.8 ? '#ef4444' : value >= 0.6 ? '#f59e0b' : '#10b981'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#94a3b8] truncate mr-2">{label}</span>
        <span className="text-[11px] font-mono shrink-0" style={{ color }}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────────

export function DigitalTwinView() {
  const [twins, setTwins] = useState<DigitalTwinState[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchVin, setSearchVin] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncTarget, setSyncTarget] = useState<string | null>(null)

  // OTA simulation state
  const [otaSimulation, setOtaSimulation] = useState<OTASimulationResult | null>(null)
  const [otaSimulating, setOtaSimulating] = useState(false)
  const [otaFirmware, setOtaFirmware] = useState({ ecu: '', version: '' })
  const [otaPanelOpen, setOtaPanelOpen] = useState(false)

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ecuMap: true,
    faults: true,
    predictions: true,
    ota: false,
  })

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Fetch twins on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await digitalTwinEngine.listTwins()
        if (!cancelled) {
          setTwins(data)
          if (data.length > 0 && !selectedId) {
            setSelectedId(data[0].vehicle_id)
          }
        }
      } catch {
        // silent fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const selectedTwin = twins.find(t => t.vehicle_id === selectedId) ?? null

  // Filter twins by VIN search
  const filteredTwins = twins.filter(t =>
    t.vin.toLowerCase().includes(searchVin.toLowerCase())
  )

  // Fleet stats
  const avgHealth = twins.length > 0
    ? Math.round(twins.reduce((s, t) => s + t.health_score, 0) / twins.length)
    : 0
  const totalPending = twins.reduce((s, t) => s + t.pending_updates.length, 0)
  const totalFaults = twins.reduce((s, t) => s + t.active_faults.length, 0)

  // Sync handler
  const handleSync = useCallback(async (vehicleId: string) => {
    setSyncTarget(vehicleId)
    setSyncing(true)
    try {
      const updated = await digitalTwinEngine.syncTwin(vehicleId)
      setTwins(prev => prev.map(t => t.vehicle_id === vehicleId ? updated : t))
    } catch {
      // silent
    } finally {
      setSyncing(false)
      setSyncTarget(null)
    }
  }, [])

  // OTA simulation handler
  const handleSimulateOta = useCallback(async () => {
    if (!selectedTwin) return
    setOtaSimulating(true)
    setOtaSimulation(null)
    try {
      const result = await digitalTwinEngine.simulateOta(
        selectedTwin.vin,
        { ecu: otaFirmware.ecu, version: otaFirmware.version }
      )
      setOtaSimulation(result)
    } catch {
      // silent
    } finally {
      setOtaSimulating(false)
    }
  }, [selectedTwin, otaFirmware])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Digital Twin Explorer</h1>
              <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                LIVE
              </Badge>
            </div>
            <p className="text-xs text-[#64748b]">
              Virtual vehicle replicas for simulation, pre-validation &amp; predictive maintenance
            </p>
          </div>

          {/* Fleet stats row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
              <Car className="h-3.5 w-3.5 text-[#00d4ff]" />
              <span className="text-[11px] font-mono text-[#00d4ff]">{twins.length}</span>
              <span className="text-[10px] text-[#64748b]">Twins</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
              <Activity className="h-3.5 w-3.5" style={{ color: healthColor(avgHealth) }} />
              <span className="text-[11px] font-mono" style={{ color: healthColor(avgHealth) }}>{avgHealth}%</span>
              <span className="text-[10px] text-[#64748b]">Avg Health</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
              <Upload className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span className="text-[11px] font-mono text-[#f59e0b]">{totalPending}</span>
              <span className="text-[10px] text-[#64748b]">Pending OTA</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
              <Bug className="h-3.5 w-3.5 text-[#ef4444]" />
              <span className="text-[11px] font-mono text-[#ef4444]">{totalFaults}</span>
              <span className="text-[10px] text-[#64748b]">Faults</span>
            </div>
          </div>
        </div>

        {/* ── Main Layout: Left Panel + Right Panel ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ── Left Panel: Twin Selector ─────────────────────────────────────── */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-3">
            <HudCard>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                    <Microchip className="h-4 w-4 text-[#00d4ff]" />
                    Fleet Twins
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] gap-1"
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const data = await digitalTwinEngine.listTwins()
                        setTwins(data)
                      } catch { /* silent */ } finally { setLoading(false) }
                    }}
                  >
                    <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
                    Refresh
                  </Button>
                </div>

                {/* VIN Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#475569]" />
                  <Input
                    placeholder="Search VIN..."
                    value={searchVin}
                    onChange={e => setSearchVin(e.target.value)}
                    className="h-8 pl-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569]"
                  />
                </div>

                {/* Twin List */}
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                  {loading ? (
                    // Skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] animate-pulse">
                        <div className="h-3 bg-[#1e2a3a] rounded w-32 mb-2" />
                        <div className="h-2 bg-[#1e2a3a] rounded w-20 mb-2" />
                        <div className="h-1.5 bg-[#1e2a3a] rounded w-full" />
                      </div>
                    ))
                  ) : filteredTwins.length === 0 ? (
                    <div className="py-8 text-center">
                      <Search className="h-6 w-6 text-[#475569] mx-auto mb-2" />
                      <p className="text-[11px] text-[#475569]">No twins match your search</p>
                    </div>
                  ) : (
                    filteredTwins.map(twin => {
                      const isSelected = twin.vehicle_id === selectedId
                      const hColor = healthColor(twin.health_score)
                      const isSyncing = syncing && syncTarget === twin.vehicle_id
                      return (
                        <button
                          key={twin.vehicle_id}
                          onClick={() => setSelectedId(twin.vehicle_id)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg border transition-all group',
                            isSelected
                              ? 'bg-[#0f1923] border-[#00d4ff]/50 shadow-[0_0_12px_#00d4ff10]'
                              : 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono text-[#475569] truncate">
                              {twin.vin.slice(-8)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {twin.is_sdv && (
                                <Badge className="text-[8px] bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30 px-1 h-4">
                                  SDV
                                </Badge>
                              )}
                              <Badge
                                className="text-[8px] px-1 h-4 border-0"
                                style={{
                                  backgroundColor: `${hColor}20`,
                                  color: hColor,
                                }}
                              >
                                {twin.health_score}%
                              </Badge>
                            </div>
                          </div>

                          {/* Health bar */}
                          <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden mb-1.5">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${twin.health_score}%`, backgroundColor: hColor }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {twin.active_faults.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[9px] text-[#ef4444]">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  {twin.active_faults.length}
                                </span>
                              )}
                              {twin.pending_updates.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[9px] text-[#f59e0b]">
                                  <Upload className="h-2.5 w-2.5" />
                                  {twin.pending_updates.length}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-[#475569] flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {stalenessLabel(twin.sync_staleness_ms)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-[#475569] hover:text-[#00d4ff]"
                                onClick={e => { e.stopPropagation(); handleSync(twin.vehicle_id) }}
                                disabled={isSyncing}
                              >
                                <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
                              </Button>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </HudCard>
          </div>

          {/* ── Right Panel: Selected Twin Detail ──────────────────────────────── */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {!selectedTwin ? (
              <HudCard className="flex flex-col items-center justify-center py-16">
                <Server className="h-10 w-10 text-[#475569] mb-3" />
                <p className="text-sm text-[#64748b]">Select a digital twin to view details</p>
              </HudCard>
            ) : (
              <>
                {/* ── State Card ──────────────────────────────────────────────── */}
                <HudCard>
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Health gauge */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <HealthGauge score={selectedTwin.health_score} />
                      <div className="flex items-center gap-1 mt-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                        <span className="text-[9px] text-[#10b981] font-medium">SYNCED</span>
                      </div>
                    </div>

                    {/* Twin metadata */}
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[#e2e8f0] font-mono">
                          {selectedTwin.vin}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedTwin.is_sdv && (
                            <Badge className="text-[9px] bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30 gap-1">
                              <Cpu className="h-2.5 w-2.5" />
                              SDV
                            </Badge>
                          )}
                          {selectedTwin.sovd_capable && (
                            <Badge className="text-[9px] bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30 gap-1">
                              <Globe className="h-2.5 w-2.5" />
                              SOVD
                            </Badge>
                          )}
                          {selectedTwin.active_faults.length > 0 ? (
                            <Badge className="text-[9px] bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30 gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {selectedTwin.active_faults.length} Faults
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              No Faults
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Metadata grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-0.5">Last Sync</div>
                          <div className="text-xs text-[#e2e8f0] font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#00d4ff]" />
                            {stalenessLabel(selectedTwin.sync_staleness_ms)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-0.5">Mileage</div>
                          <div className="text-xs text-[#e2e8f0] font-mono flex items-center gap-1">
                            <Car className="h-3 w-3 text-[#f59e0b]" />
                            {selectedTwin.mileage_km.toLocaleString()} km
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-0.5">Last Service</div>
                          <div className="text-xs text-[#e2e8f0] font-mono flex items-center gap-1">
                            <FileText className="h-3 w-3 text-[#8b5cf6]" />
                            {selectedTwin.last_service_date ?? 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-0.5">Pending OTA</div>
                          <div className="text-xs text-[#e2e8f0] font-mono flex items-center gap-1">
                            <Upload className="h-3 w-3 text-[#f59e0b]" />
                            {selectedTwin.pending_updates.length} updates
                          </div>
                        </div>
                      </div>

                      {/* Sync button */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className={cn(
                            'h-8 text-xs font-semibold gap-1.5',
                            syncing && syncTarget === selectedTwin.vehicle_id
                              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30'
                              : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                          )}
                          onClick={() => handleSync(selectedTwin.vehicle_id)}
                          disabled={syncing && syncTarget === selectedTwin.vehicle_id}
                        >
                          {syncing && syncTarget === selectedTwin.vehicle_id ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3" />
                              Force Sync
                            </>
                          )}
                        </Button>
                        {selectedTwin.sync_staleness_ms > 300_000 && (
                          <span className="text-[10px] text-[#f59e0b] flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Stale data — sync recommended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </HudCard>

                {/* ── ECU Software Map ─────────────────────────────────────────── */}
                <HudCard>
                  <button
                    className="w-full flex items-center justify-between mb-3"
                    onClick={() => toggleSection('ecuMap')}
                  >
                    <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <Microchip className="h-4 w-4 text-[#00d4ff]" />
                      ECU Software Map
                      <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
                        {Object.keys(selectedTwin.ecu_sw_map).length} ECUs
                      </Badge>
                    </h3>
                    {expandedSections.ecuMap ? (
                      <ChevronDown className="h-4 w-4 text-[#64748b]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#64748b]" />
                    )}
                  </button>
                  {expandedSections.ecuMap && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#1e2a3a]">
                            <th className="text-left py-2 pr-4 text-[10px] text-[#64748b] uppercase tracking-wide font-medium">ECU</th>
                            <th className="text-left py-2 pr-4 text-[10px] text-[#64748b] uppercase tracking-wide font-medium">SW Version</th>
                            <th className="text-left py-2 pr-4 text-[10px] text-[#64748b] uppercase tracking-wide font-medium">FW Version</th>
                            <th className="text-left py-2 text-[10px] text-[#64748b] uppercase tracking-wide font-medium">Pending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(selectedTwin.ecu_sw_map).map(([ecu, swVer]) => {
                            const fwVer = selectedTwin.firmware_versions[ecu] ?? '—'
                            const hasPending = selectedTwin.pending_updates.some(u => u.startsWith(`${ecu}:`))
                            const pendingVersion = selectedTwin.pending_updates.find(u => u.startsWith(`${ecu}:`))
                            return (
                              <tr key={ecu} className="border-b border-[#1e2a3a]/50 hover:bg-[#0f1923]/50">
                                <td className="py-2 pr-4">
                                  <div className="flex items-center gap-1.5">
                                    <Cpu className="h-3 w-3 text-[#00d4ff]" />
                                    <span className="text-[#e2e8f0] font-medium">{ecu}</span>
                                  </div>
                                </td>
                                <td className="py-2 pr-4 font-mono text-[#94a3b8]">{swVer}</td>
                                <td className="py-2 pr-4 font-mono text-[#94a3b8]">{fwVer}</td>
                                <td className="py-2">
                                  {hasPending ? (
                                    <Badge className="text-[9px] bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30 gap-1">
                                      <Upload className="h-2.5 w-2.5" />
                                      {pendingVersion?.split(':')[1]}
                                    </Badge>
                                  ) : (
                                    <span className="text-[#475569]">—</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </HudCard>

                {/* ── Active Faults ────────────────────────────────────────────── */}
                <HudCard>
                  <button
                    className="w-full flex items-center justify-between mb-3"
                    onClick={() => toggleSection('faults')}
                  >
                    <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                      Active Faults
                      <Badge className="text-[9px] bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30">
                        {selectedTwin.active_faults.length}
                      </Badge>
                    </h3>
                    {expandedSections.faults ? (
                      <ChevronDown className="h-4 w-4 text-[#64748b]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#64748b]" />
                    )}
                  </button>
                  {expandedSections.faults && (
                    selectedTwin.active_faults.length === 0 ? (
                      <div className="flex items-center gap-2 py-3">
                        <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                        <span className="text-xs text-[#10b981]">No active DTCs — vehicle is clear</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {selectedTwin.active_faults.map(fault => {
                          const isCritical = fault.startsWith('P030') || fault.startsWith('U0') || fault.startsWith('P0172')
                          return (
                            <div
                              key={fault}
                              className={cn(
                                'flex items-center justify-between p-2.5 rounded-lg border',
                                isCritical
                                  ? 'bg-[#ef4444]/5 border-[#ef4444]/20'
                                  : 'bg-[#0f1923] border-[#1e2a3a]'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {isCritical ? (
                                  <XCircle className="h-3.5 w-3.5 text-[#ef4444]" />
                                ) : (
                                  <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b]" />
                                )}
                                <span className="text-xs font-mono font-semibold text-[#e2e8f0]">{fault}</span>
                              </div>
                              <Badge
                                className="text-[9px] border-0"
                                style={{
                                  color: isCritical ? '#ef4444' : '#f59e0b',
                                  backgroundColor: isCritical ? '#ef444420' : '#f59e0b20',
                                }}
                              >
                                {isCritical ? 'CRITICAL' : 'WARNING'}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    )
                  )}
                </HudCard>

                {/* ── Predictions ──────────────────────────────────────────────── */}
                <HudCard>
                  <button
                    className="w-full flex items-center justify-between mb-3"
                    onClick={() => toggleSection('predictions')}
                  >
                    <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <Eye className="h-4 w-4 text-[#8b5cf6]" />
                      Failure Predictions
                      <Badge className="text-[9px] bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30">
                        {Object.keys(selectedTwin.predictions).length}
                      </Badge>
                    </h3>
                    {expandedSections.predictions ? (
                      <ChevronDown className="h-4 w-4 text-[#64748b]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#64748b]" />
                    )}
                  </button>
                  {expandedSections.predictions && (
                    Object.keys(selectedTwin.predictions).length === 0 ? (
                      <div className="flex items-center gap-2 py-3">
                        <Shield className="h-4 w-4 text-[#10b981]" />
                        <span className="text-xs text-[#10b981]">No imminent failures predicted</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(selectedTwin.predictions).map(([component, pred]) => {
                          const urgency = pred.days_to_failure <= 14 ? '#ef4444' : pred.days_to_failure <= 60 ? '#f59e0b' : '#10b981'
                          return (
                            <div key={component} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-3.5 w-3.5" style={{ color: urgency }} />
                                  <span className="text-xs font-medium text-[#e2e8f0]">{component}</span>
                                </div>
                                <span className="text-xs font-mono font-semibold" style={{ color: urgency }}>
                                  {pred.days_to_failure}d remaining
                                </span>
                              </div>
                              <ConfidenceBar value={pred.confidence} label="Confidence" />
                              <div className="mt-2">
                                <Progress
                                  value={Math.max(0, Math.min(100, (pred.days_to_failure / 365) * 100))}
                                  className="h-1 bg-[#1e2a3a]"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  )}
                </HudCard>

                {/* ── OTA Pre-Validation ───────────────────────────────────────── */}
                <HudCard>
                  <button
                    className="w-full flex items-center justify-between mb-3"
                    onClick={() => toggleSection('ota')}
                  >
                    <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#f59e0b]" />
                      OTA Pre-Validation
                      {selectedTwin.pending_updates.length > 0 && (
                        <Badge className="text-[9px] bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30">
                          {selectedTwin.pending_updates.length} pending
                        </Badge>
                      )}
                    </h3>
                    {expandedSections.ota ? (
                      <ChevronDown className="h-4 w-4 text-[#64748b]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#64748b]" />
                    )}
                  </button>

                  {expandedSections.ota && (
                    <div className="space-y-4">
                      {/* Pending updates quick-pick */}
                      {selectedTwin.pending_updates.length > 0 && (
                        <div>
                          <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-2">
                            Quick Select Pending Update
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedTwin.pending_updates.map(update => {
                              const [ecu, version] = update.split(':')
                              const isActive = otaFirmware.ecu === ecu && otaFirmware.version === version
                              return (
                                <button
                                  key={update}
                                  onClick={() => setOtaFirmware({ ecu, version })}
                                  className={cn(
                                    'px-2.5 py-1 rounded-md text-[10px] font-mono border transition-all',
                                    isActive
                                      ? 'bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff]'
                                      : 'bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8] hover:border-[#2d3f55] hover:text-[#e2e8f0]'
                                  )}
                                >
                                  {ecu} → {version}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Manual input */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-[#64748b] uppercase tracking-wide block mb-1">
                            Target ECU
                          </label>
                          <Input
                            placeholder="e.g. ECM"
                            value={otaFirmware.ecu}
                            onChange={e => setOtaFirmware(prev => ({ ...prev, ecu: e.target.value }))}
                            className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#64748b] uppercase tracking-wide block mb-1">
                            Target Version
                          </label>
                          <Input
                            placeholder="e.g. 4.2.1"
                            value={otaFirmware.version}
                            onChange={e => setOtaFirmware(prev => ({ ...prev, version: e.target.value }))}
                            className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569]"
                          />
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className={cn(
                          'h-8 text-xs font-semibold gap-1.5',
                          otaSimulating
                            ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30'
                            : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                        )}
                        onClick={handleSimulateOta}
                        disabled={otaSimulating || !otaFirmware.ecu || !otaFirmware.version}
                      >
                        {otaSimulating ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Simulating...
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            Simulate OTA
                          </>
                        )}
                      </Button>

                      {/* Simulation Result */}
                      {otaSimulation && (
                        <div className="p-4 rounded-lg bg-[#0f1923] border border-[#1e2a3a] space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            {otaSimulation.compatible ? (
                              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                            ) : (
                              <XCircle className="h-4 w-4 text-[#ef4444]" />
                            )}
                            <span className={cn(
                              'text-sm font-semibold',
                              otaSimulation.compatible ? 'text-[#10b981]' : 'text-[#ef4444]'
                            )}>
                              {otaSimulation.compatible ? 'OTA Compatible' : 'OTA Not Recommended'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <div className="text-[9px] text-[#64748b] uppercase tracking-wide mb-0.5">Risk Level</div>
                              <Badge
                                className="text-[10px] border-0"
                                style={{
                                  color: riskColor(otaSimulation.risk_level),
                                  backgroundColor: `${riskColor(otaSimulation.risk_level)}20`,
                                }}
                              >
                                {otaSimulation.risk_level.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-[9px] text-[#64748b] uppercase tracking-wide mb-0.5">Est. Duration</div>
                              <span className="text-xs font-mono text-[#e2e8f0]">{otaSimulation.estimated_duration_min} min</span>
                            </div>
                            <div>
                              <div className="text-[9px] text-[#64748b] uppercase tracking-wide mb-0.5">Health Δ</div>
                              <span className={cn(
                                'text-xs font-mono font-semibold',
                                otaSimulation.predicted_health_delta >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                              )}>
                                {otaSimulation.predicted_health_delta >= 0 ? '+' : ''}{otaSimulation.predicted_health_delta}
                              </span>
                            </div>
                            <div>
                              <div className="text-[9px] text-[#64748b] uppercase tracking-wide mb-0.5">New Health</div>
                              <span className="text-xs font-mono font-semibold" style={{ color: healthColor(otaSimulation.simulated_state.health_score) }}>
                                {otaSimulation.simulated_state.health_score}%
                              </span>
                            </div>
                          </div>

                          {otaSimulation.warnings.length > 0 && (
                            <div>
                              <div className="text-[10px] text-[#f59e0b] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Warnings ({otaSimulation.warnings.length})
                              </div>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                {otaSimulation.warnings.map((warning, i) => (
                                  <div key={i} className="text-[11px] text-[#94a3b8] p-2 rounded bg-[#f59e0b]/5 border border-[#f59e0b]/10">
                                    {warning}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:text-[#e2e8f0] gap-1"
                              onClick={() => setOtaSimulation(null)}
                            >
                              <Pause className="h-3 w-3" />
                              Clear Result
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-[10px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/25 gap-1"
                              disabled={!otaSimulation.compatible}
                            >
                              <ArrowRight className="h-3 w-3" />
                              Proceed to Flash
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </HudCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
