'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Globe,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
  Trash2,
  Play,
  ChevronRight,
  Search,
  Wifi,
  Shield,
  Zap,
  FileText,
  Server,
  Microchip,
  Lock,
  Clock,
  Pause,
  RotateCcw,
} from 'lucide-react'
import {
  DEMO_COMPONENTS,
  DEMO_FAULTS,
  DEMO_DATA_GROUPS,
  DEMO_OPERATIONS,
  DEMO_SW_PACKAGES,
  severityColor,
  statusColor,
  protocolColor,
  formatTimestamp,
  countDemoFaults,
  createLiveDataSimulator,
  type SOVDComponent,
  type SOVDFault,
  type SOVDDataGroup,
  type SOVDOperation,
  type SOVDSwPackage,
} from '@/lib/sovd-client'

// ── HUD Card Wrapper ──────────────────────────────────────────────────────────

function HudCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative rounded-lg border border-[#1e2a3a] bg-[#151d2b] p-4', className)}>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00d4ff]" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00d4ff]" />
      {children}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ProtocolMode = 'sovd' | 'uds'
type DetailTab = 'faults' | 'live-data' | 'operations' | 'sw-packages'

// ── Main Component ────────────────────────────────────────────────────────────

export function SOVDView() {
  const [protocolMode, setProtocolMode] = useState<ProtocolMode>('sovd')
  const [selectedComponentId, setSelectedComponentId] = useState<string>(DEMO_COMPONENTS[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<DetailTab>('faults')
  const [liveData, setLiveData] = useState<Record<string, SOVDDataGroup>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [executingOps, setExecutingOps] = useState<Set<string>>(new Set())
  const [clearedFaults, setClearedFaults] = useState<Set<string>>(new Set())

  const selectedComponent = DEMO_COMPONENTS.find(c => c.id === selectedComponentId) ?? DEMO_COMPONENTS[0]
  const faults = DEMO_FAULTS[selectedComponentId] ?? []
  const dataGroups = DEMO_DATA_GROUPS[selectedComponentId] ?? []
  const operations = DEMO_OPERATIONS[selectedComponentId] ?? []
  const swPackages = DEMO_SW_PACKAGES[selectedComponentId] ?? []

  const filteredComponents = DEMO_COMPONENTS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const faultCounts = countDemoFaults()
  const visibleFaults = faults.filter(f => !clearedFaults.has(f.fault_id))

  // ── Live Data Simulation ──────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'live-data' || dataGroups.length === 0) return

    const simulators = dataGroups.map(dg => {
      const sim = createLiveDataSimulator(selectedComponentId, dg.group, (updated) => {
        setLiveData(prev => ({ ...prev, [updated.group]: updated }))
      }, 1500)
      sim.start()
      return sim
    })

    return () => {
      for (const sim of simulators) {
        sim.stop()
      }
    }
  }, [selectedComponentId, activeTab, dataGroups])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }, [])

  const handleClearFault = useCallback((faultId: string) => {
    setClearedFaults(prev => new Set(prev).add(faultId))
  }, [])

  const handleClearAllFaults = useCallback(() => {
    const currentFaults = DEMO_FAULTS[selectedComponentId] ?? []
    const allIds = currentFaults.map(f => f.fault_id)
    setClearedFaults(prev => {
      const next = new Set(prev)
      for (const id of allIds) next.add(id)
      return next
    })
  }, [selectedComponentId])

  const handleExecuteOp = useCallback((opId: string) => {
    setExecutingOps(prev => new Set(prev).add(opId))
    setTimeout(() => {
      setExecutingOps(prev => {
        const next = new Set(prev)
        next.delete(opId)
        return next
      })
    }, 3000)
  }, [])

  // ── Status Dot ───────────────────────────────────────────────────────────

  function StatusDot({ status }: { status: SOVDComponent['status'] }) {
    const color = statusColor(status)
    return (
      <span
        className={cn(
          'inline-block h-2 w-2 rounded-full',
          status === 'online' && 'shadow-[0_0_6px_var(--dot-color)]'
        )}
        style={{ backgroundColor: color, '--dot-color': color } as React.CSSProperties}
      />
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      {/* ── Header Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#00d4ff]/15 flex items-center justify-center">
            <Globe className="h-5 w-5 text-[#00d4ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#e2e8f0]">SOVD Diagnostic Console</h1>
              <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px] px-1.5 py-0 h-4">
                ISO 17978-3
              </Badge>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Service-Oriented Vehicle Diagnostics — ASAM SOVD v1.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Protocol Selector */}
          <div className="flex rounded-md border border-[#1e2a3a] overflow-hidden">
            {(['sovd', 'uds'] as ProtocolMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setProtocolMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                  protocolMode === mode
                    ? 'bg-[#00d4ff] text-[#0f1923]'
                    : 'bg-[#151d2b] text-[#64748b] hover:text-[#94a3b8]'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Connection Status */}
          <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">
            <Wifi className="h-3 w-3 mr-1" />
            Connected
          </Badge>

          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 text-[10px] gap-1.5 bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30"
            variant="outline"
          >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Components', value: DEMO_COMPONENTS.length, icon: Server, color: '#00d4ff' },
          { label: 'Active Faults', value: faultCounts.total, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Critical', value: faultCounts.critical, icon: XCircle, color: '#ef4444' },
          { label: 'Online', value: DEMO_COMPONENTS.filter(c => c.status === 'online').length, icon: CheckCircle2, color: '#10b981' },
        ].map((stat, i) => (
          <HudCard key={i} className="p-3">
            <div className="flex items-center gap-2">
              <stat.icon className="h-4 w-4 flex-shrink-0" style={{ color: stat.color }} />
              <div>
                <div className="text-lg font-bold font-mono text-[#e2e8f0] tabular-nums">{stat.value}</div>
                <div className="text-[9px] text-[#64748b] uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          </HudCard>
        ))}
      </div>

      {/* ── Main Content Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── Left Panel: Component Tree ────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-3">
          <HudCard>
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                <Microchip className="h-3.5 w-3.5 text-[#00d4ff]" />
                Vehicle Components
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#475569]" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search components..."
                  className="h-8 pl-8 text-[11px] bg-[#0c1219] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569]"
                />
              </div>

              {/* Component List */}
              <div className="space-y-1 max-h-[calc(100vh-380px)] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0c1219' }}>
                {filteredComponents.map(comp => {
                  const compFaults = DEMO_FAULTS[comp.id] ?? []
                  const hasCritical = compFaults.some(f => f.severity === 'critical')
                  return (
                    <button
                      key={comp.id}
                      onClick={() => {
                        setSelectedComponentId(comp.id)
                        setActiveTab('faults')
                        setClearedFaults(new Set())
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 p-2.5 rounded-md border transition-all text-left',
                        selectedComponentId === comp.id
                          ? 'border-[#00d4ff]/40 bg-[#00d4ff]/10 shadow-[0_0_8px_#00d4ff15]'
                          : 'border-[#1e2a3a] bg-[#0c1219] hover:border-[#2d3f55]'
                      )}
                    >
                      <StatusDot status={comp.status} />
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'text-[11px] font-semibold truncate',
                          selectedComponentId === comp.id ? 'text-[#00d4ff]' : 'text-[#e2e8f0]'
                        )}>
                          {comp.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge
                            className="text-[8px] px-1 py-0 h-3 border"
                            style={{
                              backgroundColor: `${protocolColor(comp.protocol)}20`,
                              color: protocolColor(comp.protocol),
                              borderColor: `${protocolColor(comp.protocol)}30`,
                            }}
                          >
                            {comp.protocol.toUpperCase()}
                          </Badge>
                          <span className="text-[9px] text-[#475569] truncate">{comp.sw_version}</span>
                        </div>
                      </div>
                      {hasCritical && (
                        <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444] flex-shrink-0" />
                      )}
                      {compFaults.length > 0 && !hasCritical && (
                        <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[8px] px-1 py-0 h-3.5 border">
                          {compFaults.length}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </HudCard>
        </div>

        {/* ── Right Panel: Component Detail ─────────────────────────────────── */}
        <div className="lg:col-span-9 space-y-4">
          {/* Component Info Header */}
          <HudCard>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${protocolColor(selectedComponent.protocol)}15` }}
                >
                  <Cpu className="h-5 w-5" style={{ color: protocolColor(selectedComponent.protocol) }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#e2e8f0]">{selectedComponent.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-[#64748b]">{selectedComponent.id}</span>
                    <Badge
                      className="text-[8px] px-1 py-0 h-3 border"
                      style={{
                        backgroundColor: `${protocolColor(selectedComponent.protocol)}20`,
                        color: protocolColor(selectedComponent.protocol),
                        borderColor: `${protocolColor(selectedComponent.protocol)}30`,
                      }}
                    >
                      {selectedComponent.protocol.toUpperCase()}
                    </Badge>
                    <Badge
                      className="text-[8px] px-1 py-0 h-3 border"
                      style={{
                        backgroundColor: `${statusColor(selectedComponent.status)}20`,
                        color: statusColor(selectedComponent.status),
                        borderColor: `${statusColor(selectedComponent.status)}30`,
                      }}
                    >
                      {selectedComponent.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <div>
                  <span className="text-[#475569]">SW: </span>
                  <span className="font-mono text-[#e2e8f0]">{selectedComponent.sw_version}</span>
                </div>
                <div>
                  <span className="text-[#475569]">HW: </span>
                  <span className="font-mono text-[#e2e8f0]">{selectedComponent.hardware_id}</span>
                </div>
                <div>
                  <span className="text-[#475569]">Type: </span>
                  <span className="font-mono text-[#e2e8f0] uppercase">{selectedComponent.type}</span>
                </div>
              </div>
            </div>
          </HudCard>

          {/* Tab Bar */}
          <div className="flex gap-1 border-b border-[#1e2a3a]">
            {([
              { id: 'faults' as DetailTab, label: 'Faults', icon: AlertTriangle, count: visibleFaults.length },
              { id: 'live-data' as DetailTab, label: 'Live Data', icon: Activity, count: dataGroups.length },
              { id: 'operations' as DetailTab, label: 'Operations', icon: Play, count: operations.length },
              { id: 'sw-packages' as DetailTab, label: 'SW Packages', icon: FileText, count: swPackages.length },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-[#00d4ff] text-[#00d4ff]'
                    : 'border-transparent text-[#64748b] hover:text-[#94a3b8]'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <Badge className={cn(
                    'text-[8px] px-1 py-0 h-3.5 border',
                    activeTab === tab.id
                      ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
                      : 'bg-[#1e2a3a] text-[#64748b] border-[#1e2a3a]'
                  )}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Faults ────────────────────────────────────────────────── */}
          {activeTab === 'faults' && (
            <HudCard>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b]" />
                    Diagnostic Trouble Codes ({visibleFaults.length})
                  </div>
                  {visibleFaults.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearAllFaults}
                      className="h-6 text-[9px] gap-1 bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/20"
                    >
                      <Trash2 className="h-3 w-3" /> Clear All
                    </Button>
                  )}
                </div>

                {visibleFaults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-[#475569]">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-[#10b981]" />
                    <div className="text-[11px] font-semibold text-[#10b981]">No Active Faults</div>
                    <div className="text-[10px]">All DTCs cleared for this component</div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0c1219' }}>
                    {visibleFaults.map(fault => (
                      <div
                        key={fault.fault_id}
                        className="border border-[#1e2a3a] bg-[#0c1219] rounded-md p-3 hover:border-[#2d3f55] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className="text-[9px] px-1.5 py-0 h-4 border font-semibold uppercase"
                                style={{
                                  backgroundColor: `${severityColor(fault.severity)}20`,
                                  color: severityColor(fault.severity),
                                  borderColor: `${severityColor(fault.severity)}30`,
                                }}
                              >
                                {fault.severity}
                              </Badge>
                              <span className="text-[11px] font-mono font-bold text-[#e2e8f0]">{fault.dtc_id}</span>
                              {fault.status.mil_on && (
                                <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[8px] px-1 py-0 h-3.5 border">
                                  MIL ON
                                </Badge>
                              )}
                              {fault.status.confirmed && (
                                <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[8px] px-1 py-0 h-3.5 border">
                                  Confirmed
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-[#e2e8f0] mb-0.5">{fault.description}</div>
                            <div className="text-[10px] text-[#64748b]">{fault.symptom}</div>
                            <div className="flex items-center gap-3 mt-1.5 text-[9px] text-[#475569]">
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                Last: {formatTimestamp(fault.last_occurrence)}
                              </span>
                              <span>Occurrences: <span className="font-mono text-[#e2e8f0]">{fault.occurrence_count}</span></span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClearFault(fault.fault_id)}
                            className="h-6 text-[9px] gap-1 bg-[#1e2a3a] text-[#94a3b8] border-[#1e2a3a] hover:bg-[#2d3f55] hover:text-[#e2e8f0] flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" /> Clear
                          </Button>
                        </div>

                        {/* Environment Data */}
                        <div className="mt-2 pt-2 border-t border-[#1e2a3a]/50">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {Object.entries(fault.environment_data).map(([key, val]) => (
                              <div key={key} className="text-[9px]">
                                <span className="text-[#475569]">{key.replace(/_/g, ' ')}: </span>
                                <span className="font-mono text-[#94a3b8]">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </HudCard>
          )}

          {/* ── Tab: Live Data ─────────────────────────────────────────────── */}
          {activeTab === 'live-data' && (
            <div className="space-y-3">
              {dataGroups.length === 0 ? (
                <HudCard>
                  <div className="flex flex-col items-center justify-center py-8 text-[#475569]">
                    <Activity className="h-8 w-8 mb-2" />
                    <div className="text-[11px] font-semibold">No Data Groups</div>
                    <div className="text-[10px]">This component has no live data groups available</div>
                  </div>
                </HudCard>
              ) : (
                dataGroups.map(dg => {
                  const liveDg = liveData[dg.group] ?? dg
                  return (
                    <HudCard key={dg.group}>
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-[#00d4ff]" />
                          {dg.name}
                          <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3 border ml-1">
                            LIVE
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.entries(liveDg.values).map(([key, entry]) => (
                            <div
                              key={key}
                              className="bg-[#0c1219] border border-[#1e2a3a] rounded-md p-2.5 hover:border-[#00d4ff]/30 transition-colors"
                            >
                              <div className="text-[9px] text-[#475569] uppercase tracking-wider truncate mb-1">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-base font-mono font-bold text-[#00d4ff] tabular-nums leading-none">
                                {typeof entry.value === 'number' && Number.isInteger(entry.value)
                                  ? entry.value.toLocaleString()
                                  : entry.value.toFixed(1)}
                              </div>
                              <div className="text-[9px] text-[#64748b] mt-0.5">{entry.unit}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </HudCard>
                  )
                })
              )}
            </div>
          )}

          {/* ── Tab: Operations ────────────────────────────────────────────── */}
          {activeTab === 'operations' && (
            <HudCard>
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-[#00d4ff]" />
                  Available Operations ({operations.length})
                </div>

                {operations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-[#475569]">
                    <Zap className="h-8 w-8 mb-2" />
                    <div className="text-[11px] font-semibold">No Operations</div>
                    <div className="text-[10px]">This component has no executable operations</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {operations.map(op => {
                      const isExecuting = executingOps.has(op.id)
                      return (
                        <div
                          key={op.id}
                          className="border border-[#1e2a3a] bg-[#0c1219] rounded-md p-3 hover:border-[#2d3f55] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-semibold text-[#e2e8f0]">{op.name}</span>
                                <Badge
                                  className={cn(
                                    'text-[8px] px-1 py-0 h-3.5 border',
                                    op.status === 'available'
                                      ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                                      : op.status === 'running'
                                        ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
                                        : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'
                                  )}
                                >
                                  {op.status}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-[#64748b] mb-1.5">{op.description}</div>
                              {op.parameters.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {op.parameters.map(param => (
                                    <Badge key={param.name} className="bg-[#1e2a3a] text-[#64748b] text-[8px] px-1.5 py-0 h-3.5 border border-[#1e2a3a]">
                                      {param.name}
                                      <span className="text-[#475569] ml-0.5">:{param.type}</span>
                                      {param.required && <span className="text-[#ef4444] ml-0.5">*</span>}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleExecuteOp(op.id)}
                              disabled={isExecuting || op.status === 'running'}
                              className={cn(
                                'h-7 text-[10px] gap-1.5 flex-shrink-0',
                                isExecuting
                                  ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30'
                                  : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                              )}
                            >
                              {isExecuting ? (
                                <><RefreshCw className="h-3 w-3 animate-spin" /> Executing...</>
                              ) : (
                                <><Play className="h-3 w-3" /> Execute</>
                              )}
                            </Button>
                          </div>
                          {isExecuting && (
                            <div className="mt-2">
                              <Progress value={66} className="h-1 bg-[#1e2a3a]" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </HudCard>
          )}

          {/* ── Tab: SW Packages ───────────────────────────────────────────── */}
          {activeTab === 'sw-packages' && (
            <HudCard>
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#00d4ff]" />
                  Installed Software ({swPackages.length})
                </div>

                {swPackages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-[#475569]">
                    <Shield className="h-8 w-8 mb-2" />
                    <div className="text-[11px] font-semibold">No Software Packages</div>
                    <div className="text-[10px]">No SW packages found for this component</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {swPackages.map(pkg => (
                      <div
                        key={pkg.id}
                        className="border border-[#1e2a3a] bg-[#0c1219] rounded-md p-3 hover:border-[#2d3f55] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-[#e2e8f0]">{pkg.name}</span>
                              <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[9px] px-1.5 py-0 h-4 border">
                                v{pkg.version}
                              </Badge>
                              {pkg.signature_valid ? (
                                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5 border">
                                  <Lock className="h-2.5 w-2.5 mr-0.5" /> Signed
                                </Badge>
                              ) : (
                                <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[8px] px-1 py-0 h-3.5 border">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Unsigned
                                </Badge>
                              )}
                            </div>
                            <div className="text-[9px] text-[#475569] font-mono mt-1">
                              BLAKE3: {pkg.hash_blake3.slice(0, 24)}...
                            </div>
                            <div className="text-[9px] text-[#475569] mt-0.5">
                              Installed: {formatTimestamp(pkg.install_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </HudCard>
          )}
        </div>
      </div>
    </div>
  )
}
