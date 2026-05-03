'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
  Pause,
  RotateCcw,
  Play,
  Upload,
  Lock,
  FileText,
  Clock,
  Download,
  Server,
  Car,
  ArrowRight,
} from 'lucide-react'
import {
  otaManager,
  type OTACampaign,
  type OTAVehicleStatus,
  type FirmwarePackage,
} from '@/lib/ota-manager'

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function campaignStatusColor(status: OTACampaign['status']): string {
  const map: Record<OTACampaign['status'], string> = {
    pending: '#f59e0b',
    active: '#00d4ff',
    paused: '#8b5cf6',
    complete: '#10b981',
    rolled_back: '#ef4444',
  }
  return map[status]
}

function vehicleStatusColor(status: OTAVehicleStatus['status']): string {
  const map: Record<OTAVehicleStatus['status'], string> = {
    pending: '#64748b',
    downloading: '#00d4ff',
    installing: '#f59e0b',
    verifying: '#8b5cf6',
    success: '#10b981',
    failed: '#ef4444',
    rolled_back: '#ef4444',
  }
  return map[status]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(2)} GB`
}

function formatTimestampShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Main Component ────────────────────────────────────────────────────────────

export function OTAView() {
  const [campaigns, setCampaigns] = useState<OTACampaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [vehicleStatuses, setVehicleStatuses] = useState<OTAVehicleStatus[]>([])
  const [firmwareList, setFirmwareList] = useState<FirmwarePackage[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) ?? null

  // ── Data Loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    async function fetchInitial() {
      const [campList, fwList] = await Promise.all([
        otaManager.listCampaigns(),
        otaManager.listFirmware(),
      ])
      if (cancelled) return
      setCampaigns(campList)
      setFirmwareList(fwList)
      if (campList.length > 0) {
        setSelectedCampaignId(prev => prev ?? campList[0].id)
      }
    }
    fetchInitial()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedCampaignId) return
    let cancelled = false
    async function fetchStatuses() {
      const statuses = await otaManager.getVehicleStatuses(selectedCampaignId)
      if (cancelled) return
      setVehicleStatuses(statuses)
    }
    fetchStatuses()
    return () => { cancelled = true }
  }, [selectedCampaignId])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [campList, fwList] = await Promise.all([
        otaManager.listCampaigns(),
        otaManager.listFirmware(),
      ])
      setCampaigns(campList)
      setFirmwareList(fwList)
      if (selectedCampaignId) {
        const statuses = await otaManager.getVehicleStatuses(selectedCampaignId)
        setVehicleStatuses(statuses)
      }
    } catch {
      // Silently handle
    }
    setIsRefreshing(false)
  }, [selectedCampaignId])

  const handleAdvanceStage = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      const updated = await otaManager.advanceStage(id)
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c))
    } catch {
      // Silently handle — mock data keeps working
    }
    setActionLoading(null)
  }, [])

  const handlePauseCampaign = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      const updated = await otaManager.pauseCampaign(id)
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c))
    } catch {
      // Silently handle
    }
    setActionLoading(null)
  }, [])

  const handleRollbackCampaign = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      const updated = await otaManager.rollbackCampaign(id)
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c))
      // Refresh vehicle statuses after rollback
      const currentId = selectedCampaignId
      if (currentId) {
        const statuses = await otaManager.getVehicleStatuses(currentId)
        setVehicleStatuses(statuses)
      }
    } catch {
      // Silently handle
    }
    setActionLoading(null)
  }, [selectedCampaignId])

  // ── Computed Stats ───────────────────────────────────────────────────────

  const totalVehicles = campaigns.reduce((sum, c) => sum + c.stats.total, 0)
  const totalSuccess = campaigns.reduce((sum, c) => sum + c.stats.success, 0)
  const totalFailed = campaigns.reduce((sum, c) => sum + c.stats.failed, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#8b5cf6]/15 flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#8b5cf6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#e2e8f0]">OTA Campaign Manager</h1>
              <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[9px] px-1.5 py-0 h-4">
                Uptane
              </Badge>
              <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[9px] px-1.5 py-0 h-4">
                UNECE R156
              </Badge>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Over-the-Air firmware management — Uptane Framework compliant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <Button
            size="sm"
            className="h-7 text-[10px] gap-1.5 bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
          >
            <Upload className="h-3 w-3" />
            Upload Firmware
          </Button>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Campaigns', value: campaigns.length, icon: Server, color: '#8b5cf6' },
          { label: 'Active', value: activeCampaigns, icon: Activity, color: '#00d4ff' },
          { label: 'Vehicles', value: totalVehicles.toLocaleString(), icon: Car, color: '#10b981' },
          { label: 'Failed', value: totalFailed.toLocaleString(), icon: XCircle, color: '#ef4444' },
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

      {/* ── Campaign List + Detail ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Campaign Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Server className="h-3.5 w-3.5 text-[#8b5cf6]" />
            Campaigns
          </div>

          {campaigns.map(campaign => {
            const successRate = campaign.stats.total > 0
              ? Math.round((campaign.stats.success / campaign.stats.total) * 100)
              : 0
            const progressPct = campaign.stats.total > 0
              ? Math.round(((campaign.stats.success + campaign.stats.failed + campaign.stats.rolled_back) / campaign.stats.total) * 100)
              : 0

            return (
              <button
                key={campaign.id}
                onClick={() => setSelectedCampaignId(campaign.id)}
                className={cn(
                  'w-full text-left',
                  selectedCampaignId === campaign.id && 'ring-1 ring-[#00d4ff]/40'
                )}
              >
                <HudCard className="hover:border-[#2d3f55] transition-all">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'text-[11px] font-semibold truncate',
                          selectedCampaignId === campaign.id ? 'text-[#00d4ff]' : 'text-[#e2e8f0]'
                        )}>
                          {campaign.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge
                            className="text-[8px] px-1 py-0 h-3.5 border"
                            style={{
                              backgroundColor: `${campaignStatusColor(campaign.status)}20`,
                              color: campaignStatusColor(campaign.status),
                              borderColor: `${campaignStatusColor(campaign.status)}30`,
                            }}
                          >
                            {campaign.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-[9px] text-[#475569]">v{campaign.firmware.version}</span>
                          <Badge className="bg-[#1e2a3a] text-[#64748b] text-[8px] px-1 py-0 h-3 border border-[#1e2a3a]">
                            {campaign.targeting.strategy.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[9px] mb-1">
                        <span className="text-[#475569]">Progress</span>
                        <span className="font-mono text-[#94a3b8]">{progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0c1219] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: campaignStatusColor(campaign.status),
                            boxShadow: `0 0 6px ${campaignStatusColor(campaign.status)}40`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[11px] font-mono font-bold text-[#10b981]">{campaign.stats.success.toLocaleString()}</div>
                        <div className="text-[8px] text-[#475569]">Success</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-bold text-[#ef4444]">{campaign.stats.failed.toLocaleString()}</div>
                        <div className="text-[8px] text-[#475569]">Failed</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-bold text-[#f59e0b]">{campaign.stats.pending.toLocaleString()}</div>
                        <div className="text-[8px] text-[#475569]">Pending</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-[#1e2a3a]/50">
                      {campaign.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handlePauseCampaign(campaign.id) }}
                            disabled={actionLoading === campaign.id}
                            className="h-6 text-[9px] gap-1 bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 px-2"
                          >
                            <Pause className="h-3 w-3" /> Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleAdvanceStage(campaign.id) }}
                            disabled={actionLoading === campaign.id}
                            className="h-6 text-[9px] gap-1 bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30 hover:bg-[#00d4ff]/20 px-2"
                          >
                            <ArrowRight className="h-3 w-3" /> Advance
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleRollbackCampaign(campaign.id) }}
                            disabled={actionLoading === campaign.id}
                            className="h-6 text-[9px] gap-1 bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/20 px-2"
                          >
                            <RotateCcw className="h-3 w-3" /> Rollback
                          </Button>
                        </>
                      )}
                      {campaign.status === 'paused' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleAdvanceStage(campaign.id) }}
                            disabled={actionLoading === campaign.id}
                            className="h-6 text-[9px] gap-1 bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/20 px-2"
                          >
                            <Play className="h-3 w-3" /> Resume
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleRollbackCampaign(campaign.id) }}
                            disabled={actionLoading === campaign.id}
                            className="h-6 text-[9px] gap-1 bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/20 px-2"
                          >
                            <RotateCcw className="h-3 w-3" /> Rollback
                          </Button>
                        </>
                      )}
                      {campaign.status === 'complete' && (
                        <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      )}
                      {campaign.status === 'rolled_back' && (
                        <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[9px]">
                          <RotateCcw className="h-3 w-3 mr-1" /> Rolled Back
                        </Badge>
                      )}
                      {campaign.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleAdvanceStage(campaign.id) }}
                          disabled={actionLoading === campaign.id}
                          className="h-6 text-[9px] gap-1 bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30 hover:bg-[#00d4ff]/20 px-2"
                        >
                          <Play className="h-3 w-3" /> Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </HudCard>
              </button>
            )
          })}
        </div>

        {/* ── Detail Panel ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCampaign ? (
            <>
              {/* Stage Visualization */}
              <HudCard>
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-[#00d4ff]" />
                    Rollout Stages — {selectedCampaign.targeting.strategy.type} Strategy
                  </div>

                  <div className="flex items-center gap-1">
                    {selectedCampaign.targeting.strategy.stages.map((pct, idx) => {
                      const isCurrentOrPast = idx < selectedCampaign.current_stage
                      const isCurrent = idx === selectedCampaign.current_stage - 1
                      const isFuture = idx >= selectedCampaign.current_stage
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              'h-8 w-full rounded-md border flex items-center justify-center text-[10px] font-mono font-bold transition-all',
                              isCurrentOrPast
                                ? 'border-[#10b981]/40 bg-[#10b981]/15 text-[#10b981]'
                                : isCurrent
                                    ? 'border-[#00d4ff]/40 bg-[#00d4ff]/15 text-[#00d4ff] shadow-[0_0_8px_#00d4ff20]'
                                    : 'border-[#1e2a3a] bg-[#0c1219] text-[#475569]'
                            )}
                          >
                            {pct}%
                          </div>
                          <div className={cn(
                            'text-[8px]',
                            isCurrent ? 'text-[#00d4ff] font-semibold' : 'text-[#475569]'
                          )}>
                            Stage {idx + 1}
                          </div>
                          {isCurrent && (
                            <div className="h-1 w-1 rounded-full bg-[#00d4ff] shadow-[0_0_4px_#00d4ff]" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] pt-2 border-t border-[#1e2a3a]/50">
                    <div>
                      <span className="text-[#475569]">Interval: </span>
                      <span className="font-mono text-[#94a3b8]">{selectedCampaign.targeting.strategy.stage_interval_hours}h</span>
                    </div>
                    <div>
                      <span className="text-[#475569]">Auto-advance: </span>
                      <span className={selectedCampaign.targeting.strategy.auto_advance ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                        {selectedCampaign.targeting.strategy.auto_advance ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#475569]">Rollback threshold: </span>
                      <span className="font-mono text-[#f59e0b]">{selectedCampaign.targeting.strategy.rollback_threshold_pct}%</span>
                    </div>
                    <div>
                      <span className="text-[#475569]">Min voltage: </span>
                      <span className="font-mono text-[#94a3b8]">{selectedCampaign.targeting.strategy.require_voltage_min}V</span>
                    </div>
                  </div>
                </div>
              </HudCard>

              {/* Vehicle Status Table */}
              <HudCard>
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-[#00d4ff]" />
                    Vehicle Status ({vehicleStatuses.length})
                  </div>

                  <div className="max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0c1219' }}>
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-[#1e2a3a]">
                          <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 pr-2">VIN</th>
                          <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Vehicle</th>
                          <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Status</th>
                          <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Progress</th>
                          <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Bank</th>
                          <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 pl-2">Version</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicleStatuses.map((vs, i) => (
                          <tr key={i} className="border-b border-[#1e2a3a]/30 hover:bg-[#1e2a3a]/20 transition-colors">
                            <td className="py-2 pr-2 font-mono text-[#94a3b8]">{vs.vin.slice(-8)}</td>
                            <td className="py-2 px-2 text-[#e2e8f0]">{vs.vehicle_name}</td>
                            <td className="text-center py-2 px-2">
                              <Badge
                                className="text-[8px] px-1 py-0 h-3.5 border"
                                style={{
                                  backgroundColor: `${vehicleStatusColor(vs.status)}20`,
                                  color: vehicleStatusColor(vs.status),
                                  borderColor: `${vehicleStatusColor(vs.status)}30`,
                                }}
                              >
                                {vs.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="text-center py-2 px-2">
                              <div className="flex items-center gap-1.5">
                                <Progress value={vs.progress_pct} className="h-1.5 flex-1 bg-[#1e2a3a]" />
                                <span className="font-mono text-[#94a3b8] w-7 text-right">{vs.progress_pct}%</span>
                              </div>
                            </td>
                            <td className="text-center py-2 px-2">
                              <Badge className={cn(
                                'text-[8px] px-1 py-0 h-3.5 border',
                                vs.current_bank === 'A'
                                  ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                                  : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                              )}>
                                Bank {vs.current_bank}
                              </Badge>
                            </td>
                            <td className="py-2 pl-2">
                              <span className="font-mono text-[#475569]">{vs.previous_version}</span>
                              <ArrowRight className="h-2.5 w-2.5 inline mx-0.5 text-[#475569]" />
                              <span className="font-mono text-[#00d4ff]">{vs.target_version}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vehicle Status Summary */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1e2a3a]/50">
                    {([
                      { label: 'Pending', count: vehicleStatuses.filter(v => v.status === 'pending').length, color: '#64748b' },
                      { label: 'Installing', count: vehicleStatuses.filter(v => v.status === 'installing' || v.status === 'downloading').length, color: '#00d4ff' },
                      { label: 'Success', count: vehicleStatuses.filter(v => v.status === 'success').length, color: '#10b981' },
                      { label: 'Failed', count: vehicleStatuses.filter(v => v.status === 'failed' || v.status === 'rolled_back').length, color: '#ef4444' },
                    ]).map((item, i) => (
                      <div key={i} className="bg-[#0c1219] border border-[#1e2a3a] rounded-md p-2 text-center">
                        <div className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.count}</div>
                        <div className="text-[8px] text-[#475569] uppercase">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </HudCard>
            </>
          ) : (
            <HudCard>
              <div className="flex flex-col items-center justify-center py-12 text-[#475569]">
                <Server className="h-10 w-10 mb-3" />
                <div className="text-[12px] font-semibold text-[#94a3b8]">Select a Campaign</div>
                <div className="text-[10px]">Choose a campaign to view details</div>
              </div>
            </HudCard>
          )}

          {/* ── Uptane Security Card ──────────────────────────────────────── */}
          <HudCard>
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#8b5cf6]" />
                Uptane Security Framework
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ed25519 Signing */}
                <div className="bg-[#0c1219] border border-[#1e2a3a] rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-[#10b981]" />
                    <span className="text-[11px] font-semibold text-[#e2e8f0]">Ed25519 Signing</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Director Repo</span>
                      <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5 border">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Verified
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Image Repo</span>
                      <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5 border">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Verified
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Timestamp Role</span>
                      <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5 border">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Valid
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* BLAKE3 Verification */}
                <div className="bg-[#0c1219] border border-[#1e2a3a] rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-[#00d4ff]" />
                    <span className="text-[11px] font-semibold text-[#e2e8f0]">BLAKE3 Verification</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Hash Algorithm</span>
                      <span className="text-[9px] font-mono text-[#00d4ff]">BLAKE3-256</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Integrity Check</span>
                      <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5 border">
                        Passed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Dual-Bank Swap</span>
                      <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[8px] px-1 py-0 h-3.5 border">
                        A → B
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Anti-Rollback */}
                <div className="bg-[#0c1219] border border-[#1e2a3a] rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                    <span className="text-[11px] font-semibold text-[#e2e8f0]">Anti-Rollback</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Counter (HW)</span>
                      <span className="text-[9px] font-mono text-[#e2e8f0]">0x0000002F</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Monotonic</span>
                      <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5 border">
                        Enforced
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Version Downgrade</span>
                      <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[8px] px-1 py-0 h-3.5 border">
                        Blocked
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Dual-Bank */}
                <div className="bg-[#0c1219] border border-[#1e2a3a] rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-[#10b981]" />
                    <span className="text-[11px] font-semibold text-[#e2e8f0]">Dual-Bank A/B</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Bank A (Active)</span>
                      <span className="text-[9px] font-mono text-[#f59e0b]">v4.2.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Bank B (Staging)</span>
                      <span className="text-[9px] font-mono text-[#10b981]">v4.2.1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748b]">Fallback</span>
                      <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5 border">
                        Available
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </HudCard>

          {/* ── Firmware Packages ──────────────────────────────────────────── */}
          <HudCard>
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#8b5cf6]" />
                Firmware Packages ({firmwareList.length})
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0c1219' }}>
                {firmwareList.map(fw => (
                  <div
                    key={fw.id}
                    className="border border-[#1e2a3a] bg-[#0c1219] rounded-md p-3 hover:border-[#2d3f55] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-[#e2e8f0]">{fw.name}</span>
                          <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[9px] px-1.5 py-0 h-4 border">
                            v{fw.version}
                          </Badge>
                          {fw.signature_valid ? (
                            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5 border">
                              <Lock className="h-2.5 w-2.5 mr-0.5" /> Signed
                            </Badge>
                          ) : (
                            <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[8px] px-1 py-0 h-3.5 border">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Unsigned
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-[#475569]">
                          <span>Target: <span className="font-mono text-[#94a3b8]">{fw.target_ecu}</span></span>
                          <span>Size: <span className="font-mono text-[#94a3b8]">{formatBytes(fw.size_bytes)}</span></span>
                          <span className="font-mono">BLAKE3: {fw.hash_blake3.slice(0, 20)}...</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn(
                            'text-[8px] px-1 py-0 h-3.5 border',
                            fw.sbom_available
                              ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                              : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'
                          )}>
                            {fw.sbom_available ? 'SBOM Available' : 'No SBOM'}
                          </Badge>
                          <span className="text-[9px] text-[#475569]">
                            Uploaded: {formatTimestampShort(fw.upload_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </HudCard>
        </div>
      </div>
    </div>
  )
}
