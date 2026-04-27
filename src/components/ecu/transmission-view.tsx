'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Car,
  Gauge,
  Thermometer,
  Droplets,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Cog,
  ArrowRight,
  RotateCcw,
  Zap,
  Shield,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TransType = 'Auto' | 'Manual' | 'CVT' | 'DCT'
type GearPosition = 'P' | 'R' | 'N' | 'D' | 'S' | 'M'
type FluidCondition = 'Good' | 'Fair' | 'Degraded' | 'Critical'

interface ShiftData {
  from: string
  to: string
  time: number
  smoothness: number
}

const TRANS_TYPES: { type: TransType; specs: string[]; active: boolean }[] = [
  { type: 'Auto', specs: ['6-speed', 'Torque Converter', 'Hydraulic'], active: false },
  { type: 'Manual', specs: ['6-speed', 'Dry Clutch', 'Mechanical'], active: false },
  { type: 'CVT', specs: ['Continuous', 'Steel Belt', 'Variable'], active: false },
  { type: 'DCT', specs: ['7-speed', 'Dual Wet Clutch', 'BorgWarner'], active: true },
]

const GEAR_POSITIONS: { gear: GearPosition; label: string }[] = [
  { gear: 'P', label: 'Park' },
  { gear: 'R', label: 'Reverse' },
  { gear: 'N', label: 'Neutral' },
  { gear: 'D', label: 'Drive' },
  { gear: 'S', label: 'Sport' },
  { gear: 'M', label: 'Manual' },
]

const FLUID_DATA = {
  temperature: 92,
  pressure: 4.2,
  level: 78,
  condition: 'Fair' as FluidCondition,
  color: 'Amber',
  lastChange: '2024-08-15',
  lifeRemaining: 42,
}

const SHIFT_DATA: ShiftData[] = [
  { from: '1→2', to: '2nd', time: 320, smoothness: 87 },
  { from: '2→3', to: '3rd', time: 280, smoothness: 92 },
  { from: '3→4', to: '4th', time: 260, smoothness: 95 },
  { from: '4→5', to: '5th', time: 290, smoothness: 88 },
  { from: '5→6', to: '6th', time: 310, smoothness: 84 },
  { from: '6→7', to: '7th', time: 340, smoothness: 79 },
  { from: '7→6', to: '6th', time: 270, smoothness: 91 },
  { from: '6→5', to: '5th', time: 250, smoothness: 93 },
  { from: '5→4', to: '4th', time: 230, smoothness: 96 },
  { from: '4→3', to: '3rd', time: 210, smoothness: 94 },
]

const CLUTCH_DATA = {
  clutchA: { slip: 12, wear: 18, engagementPoint: 42, temp: 104 },
  clutchB: { slip: 8, wear: 22, engagementPoint: 38, temp: 98 },
}

const TORQUE_CONVERTER = {
  lockupStatus: 'Locked',
  slipRPM: 0,
  lockupSpeed: 65,
  stallSpeed: 2400,
}

const ADAPTIVE_DATA = [
  { channel: 'Shift 1-2 Up', current: '+0.12s', target: '0.00s', status: 'Adapted' },
  { channel: 'Shift 2-3 Up', current: '-0.05s', target: '0.00s', status: 'Adapted' },
  { channel: 'Shift 3-4 Up', current: '+0.18s', target: '0.00s', status: 'Learning' },
  { channel: 'Shift 4-5 Up', current: '+0.24s', target: '0.00s', status: 'Learning' },
  { channel: 'Shift 1-2 Down', current: '-0.03s', target: '0.00s', status: 'Adapted' },
  { channel: 'Shift 2-3 Down', current: '+0.07s', target: '0.00s', status: 'Adapted' },
  { channel: 'TC Lockup', current: '+0.15s', target: '0.00s', status: 'Adapted' },
  { channel: 'TC Unlock', current: '-0.02s', target: '0.00s', status: 'Adapted' },
]

const TRANS_FAULTS = [
  { code: 'P0730', desc: 'Incorrect Gear Ratio', severity: 'Active' },
  { code: 'P0780', desc: 'Shift Error (Intermittent)', severity: 'Pending' },
]

const CONDITION_COLORS: Record<FluidCondition, string> = {
  Good: '#10b981',
  Fair: '#f59e0b',
  Degraded: '#f97316',
  Critical: '#ef4444',
}

export function TransmissionView() {
  const [currentGear, setCurrentGear] = useState<GearPosition>('D')
  const [manualGear, setManualGear] = useState(4)
  const [isResetting, setIsResetting] = useState(false)

  const handleResetAdaptions = () => {
    setIsResetting(true)
    setTimeout(() => setIsResetting(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cog className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Transmission Diagnostics</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
              DCT
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Real-time transmission system analysis, fluid monitoring, and shift quality assessment
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleResetAdaptions}
          disabled={isResetting}
          className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
        >
          {isResetting ? (
            <><RotateCcw className="h-3 w-3 animate-spin" />Resetting...</>
          ) : (
            <><RotateCcw className="h-3 w-3" />Reset Adaptations</>
          )}
        </Button>
      </div>

      {/* Transmission Type + Gear Position */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transmission Type Card */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Car className="h-4 w-4 text-[#00d4ff]" />
              Transmission Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {TRANS_TYPES.map((t) => (
                <div
                  key={t.type}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    t.active
                      ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40 shadow-[0_0_8px_#00d4ff15]'
                      : 'bg-[#0f1923] border-[#1e2a3a] opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('text-sm font-bold', t.active ? 'text-[#00d4ff]' : 'text-[#64748b]')}>
                      {t.type}
                    </span>
                    {t.active && <CheckCircle2 className="h-4 w-4 text-[#00d4ff]" />}
                  </div>
                  <div className="space-y-1">
                    {t.specs.map((spec, i) => (
                      <div key={i} className="text-[10px] text-[#94a3b8]">{spec}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2">
                <div className="text-[9px] text-[#475569]">Mileage</div>
                <div className="text-xs font-mono text-[#e2e8f0]">67,842 km</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2">
                <div className="text-[9px] text-[#475569]">Serial</div>
                <div className="text-xs font-mono text-[#e2e8f0]">DQ381-7A-0247</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gear Engagement Status */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#00d4ff]" />
              Gear Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {GEAR_POSITIONS.map(({ gear, label }) => (
                <button
                  key={gear}
                  onClick={() => setCurrentGear(gear)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                    currentGear === gear
                      ? 'bg-[#00d4ff]/15 border-[#00d4ff]/50 shadow-[0_0_12px_#00d4ff20]'
                      : 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]'
                  )}
                >
                  <span className={cn(
                    'text-lg font-bold',
                    currentGear === gear ? 'text-[#00d4ff]' : 'text-[#475569]'
                  )}>
                    {gear}
                  </span>
                  <span className={cn(
                    'text-[8px]',
                    currentGear === gear ? 'text-[#00d4ff]' : 'text-[#475569]'
                  )}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Current State</span>
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">Engaged</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[9px] text-[#475569]">Position</div>
                  <div className="text-sm font-bold text-[#00d4ff]">{currentGear}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Active Gear</div>
                  <div className="text-sm font-bold text-[#e2e8f0]">
                    {currentGear === 'D' ? `D${manualGear}` : currentGear === 'M' ? `M${manualGear}` : currentGear === 'S' ? `S4` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Ratio</div>
                  <div className="text-sm font-mono text-[#e2e8f0]">
                    {currentGear === 'R' ? '2.94:1' : `${(3.5 / manualGear).toFixed(2)}:1`}
                  </div>
                </div>
              </div>
            </div>
            {currentGear === 'M' && (
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" variant="outline" className="h-7 text-xs border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8]" onClick={() => setManualGear(Math.min(7, manualGear + 1))}>
                  Shift Up
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8]" onClick={() => setManualGear(Math.max(1, manualGear - 1))}>
                  Shift Down
                </Button>
                <span className="text-xs text-[#64748b]">Gear {manualGear}/7</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fluid Analysis + Shift Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fluid Analysis */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Droplets className="h-4 w-4 text-[#00d4ff]" />
              Fluid Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#64748b]">Temperature</span>
                  <Thermometer className="h-3 w-3 text-[#f59e0b]" />
                </div>
                <span className={cn(
                  'text-lg font-bold tabular-nums',
                  FLUID_DATA.temperature > 100 ? 'text-[#ef4444]' : FLUID_DATA.temperature > 85 ? 'text-[#f59e0b]' : 'text-[#10b981]'
                )}>
                  {FLUID_DATA.temperature}°C
                </span>
                <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: `${(FLUID_DATA.temperature / 130) * 100}%` }} />
                </div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#64748b]">Pressure</span>
                  <Activity className="h-3 w-3 text-[#00d4ff]" />
                </div>
                <span className="text-lg font-bold text-[#00d4ff] tabular-nums">{FLUID_DATA.pressure} bar</span>
                <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full rounded-full bg-[#00d4ff]" style={{ width: `${(FLUID_DATA.pressure / 6) * 100}%` }} />
                </div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#64748b]">Level</span>
                  <Droplets className="h-3 w-3 text-[#10b981]" />
                </div>
                <span className="text-lg font-bold text-[#10b981] tabular-nums">{FLUID_DATA.level}%</span>
                <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${FLUID_DATA.level}%` }} />
                </div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#64748b]">Condition</span>
                  <Shield className="h-3 w-3" style={{ color: CONDITION_COLORS[FLUID_DATA.condition] }} />
                </div>
                <span className="text-lg font-bold tabular-nums" style={{ color: CONDITION_COLORS[FLUID_DATA.condition] }}>
                  {FLUID_DATA.condition}
                </span>
                <div className="text-[9px] text-[#475569] mt-1">Color: {FLUID_DATA.color}</div>
              </div>
            </div>
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748b]">Fluid Life Remaining</span>
                <span className="text-xs font-bold" style={{ color: CONDITION_COLORS[FLUID_DATA.condition] }}>{FLUID_DATA.lifeRemaining}%</span>
              </div>
              <div className="h-2 w-full bg-[#0f1923] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${FLUID_DATA.lifeRemaining}%`, backgroundColor: CONDITION_COLORS[FLUID_DATA.condition] }} />
              </div>
              <div className="text-[9px] text-[#475569] mt-1">Last changed: {FLUID_DATA.lastChange}</div>
            </div>
          </CardContent>
        </Card>

        {/* Shift Quality Analysis */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Timer className="h-4 w-4 text-[#00d4ff]" />
              Shift Quality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              <div className="grid grid-cols-[1fr_80px_80px_60px] gap-2 px-2 text-[9px] font-bold uppercase tracking-wider text-[#475569]">
                <span>Shift</span>
                <span>Time (ms)</span>
                <span>Smooth</span>
                <span>Rating</span>
              </div>
              {SHIFT_DATA.map((shift, i) => {
                const rating = shift.smoothness >= 90 ? 'Excellent' : shift.smoothness >= 80 ? 'Good' : shift.smoothness >= 70 ? 'Fair' : 'Poor'
                const ratingColor = shift.smoothness >= 90 ? '#10b981' : shift.smoothness >= 80 ? '#00d4ff' : shift.smoothness >= 70 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={i} className="grid grid-cols-[1fr_80px_80px_60px] gap-2 items-center bg-[#0f1923] border border-[#1e2a3a] rounded-md px-2 py-2 hover:border-[#2d3f55] transition-colors">
                    <span className="text-[11px] font-semibold text-[#e2e8f0]">{shift.from}</span>
                    <span className="text-[11px] font-mono text-[#94a3b8] tabular-nums">{shift.time}ms</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 bg-[#0f1923] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${shift.smoothness}%`, backgroundColor: ratingColor }} />
                        </div>
                        <span className="text-[10px] font-mono tabular-nums" style={{ color: ratingColor }}>{shift.smoothness}%</span>
                      </div>
                    </div>
                    <Badge className="text-[8px] border-0 px-1 py-0 h-4" style={{ backgroundColor: `${ratingColor}20`, color: ratingColor }}>
                      {rating}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clutch Parameters + Torque Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Clutch Parameters */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#00d4ff]" />
              Clutch Parameters
              <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[10px]">DCT</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(['clutchA', 'clutchB'] as const).map((clutch, idx) => {
              const data = clutch === 'clutchA' ? CLUTCH_DATA.clutchA : CLUTCH_DATA.clutchB
              const label = clutch === 'clutchA' ? 'Clutch A (Odd 1-3-5-7)' : 'Clutch B (Even 2-4-6)'
              const wearColor = data.wear < 25 ? '#10b981' : data.wear < 50 ? '#f59e0b' : '#ef4444'
              return (
                <div key={clutch} className={cn('bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3', idx === 0 ? 'mb-3' : '')}>
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">{label}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[9px] text-[#475569]">Slip</div>
                      <div className="text-sm font-bold text-[#e2e8f0] tabular-nums">{data.slip} RPM</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#475569]">Temperature</div>
                      <div className="text-sm font-bold text-[#e2e8f0] tabular-nums">{data.temp}°C</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#475569]">Wear</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums" style={{ color: wearColor }}>{data.wear}%</span>
                        <div className="h-1.5 w-16 bg-[#0f1923] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${data.wear}%`, backgroundColor: wearColor }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#475569]">Engagement Point</div>
                      <div className="text-sm font-bold text-[#e2e8f0] tabular-nums">{data.engagementPoint}mm</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Torque Converter */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00d4ff]" />
              Torque Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                <div className="text-[9px] text-[#475569] uppercase tracking-wider mb-1">Lockup Status</div>
                <Badge className={cn(
                  'text-[10px] border',
                  TORQUE_CONVERTER.lockupStatus === 'Locked'
                    ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                    : 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                )}>
                  {TORQUE_CONVERTER.lockupStatus}
                </Badge>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                <div className="text-[9px] text-[#475569] uppercase tracking-wider mb-1">Slip RPM</div>
                <span className={cn(
                  'text-xl font-bold tabular-nums',
                  TORQUE_CONVERTER.slipRPM === 0 ? 'text-[#10b981]' : 'text-[#f59e0b]'
                )}>
                  {TORQUE_CONVERTER.slipRPM}
                </span>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="text-[9px] text-[#475569]">Lockup Speed</div>
                <span className="text-sm font-bold text-[#e2e8f0] tabular-nums">{TORQUE_CONVERTER.lockupSpeed} km/h</span>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="text-[9px] text-[#475569]">Stall Speed</div>
                <span className="text-sm font-bold text-[#e2e8f0] tabular-nums">{TORQUE_CONVERTER.stallSpeed} RPM</span>
              </div>
            </div>
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Converter Efficiency</div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-full bg-[#0f1923] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#10b981]" style={{ width: TORQUE_CONVERTER.lockupStatus === 'Locked' ? '98%' : '87%' }} />
                </div>
                <span className="text-sm font-bold text-[#10b981] tabular-nums flex-shrink-0">
                  {TORQUE_CONVERTER.lockupStatus === 'Locked' ? '98%' : '87%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adaptive Shift Data + Fault Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Adaptive Shift Data */}
        <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              Adaptive Shift Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              <div className="grid grid-cols-[1fr_70px_70px_80px] gap-2 px-2 text-[9px] font-bold uppercase tracking-wider text-[#475569]">
                <span>Channel</span>
                <span>Current</span>
                <span>Target</span>
                <span>Status</span>
              </div>
              {ADAPTIVE_DATA.map((item, i) => {
                const isAdapted = item.status === 'Adapted'
                return (
                  <div key={i} className="grid grid-cols-[1fr_70px_70px_80px] gap-2 items-center bg-[#0f1923] border border-[#1e2a3a] rounded-md px-2 py-2 hover:border-[#2d3f55] transition-colors">
                    <span className="text-[11px] font-medium text-[#e2e8f0]">{item.channel}</span>
                    <span className="text-[11px] font-mono text-[#94a3b8] tabular-nums">{item.current}</span>
                    <span className="text-[11px] font-mono text-[#64748b] tabular-nums">{item.target}</span>
                    <Badge className={cn(
                      'text-[8px] border-0 px-1.5 py-0 h-4',
                      isAdapted ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                    )}>
                      {item.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transmission Fault Codes */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
              Fault Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {TRANS_FAULTS.map((fault, i) => (
              <div key={i} className={cn(
                'p-3 rounded-lg border',
                fault.severity === 'Active' ? 'bg-[#ef4444]/5 border-[#ef4444]/30' : 'bg-[#f59e0b]/5 border-[#f59e0b]/30'
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: fault.severity === 'Active' ? '#ef4444' : '#f59e0b' }}>
                    {fault.code}
                  </span>
                  <Badge className={cn(
                    'text-[8px] border-0 px-1.5 py-0 h-4',
                    fault.severity === 'Active' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                  )}>
                    {fault.severity}
                  </Badge>
                </div>
                <div className="text-[10px] text-[#94a3b8]">{fault.desc}</div>
              </div>
            ))}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 mt-2">
              <div className="text-[9px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Summary</div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#64748b]">Active Codes</span>
                <span className="text-xs font-bold text-[#ef4444]">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748b]">Pending Codes</span>
                <span className="text-xs font-bold text-[#f59e0b]">1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
