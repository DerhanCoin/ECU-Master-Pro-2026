'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Gauge,
  Activity,
  Thermometer,
  Battery,
  Zap,
  Flame,
  Wind,
  Car,
  Clock,
  Camera,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Shield,
  Cpu,
  Oil,
  Snowflake,
  LayoutGrid,
  List,
  Layers,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

type LayoutMode = 'gauges' | 'digital' | 'mixed'

interface GaugeData {
  id: string
  label: string
  value: number
  unit: string
  min: number
  max: number
  color: string
  warnHigh: number
  dangerHigh: number
  history: number[]
}

interface DigitalReadout {
  id: string
  label: string
  value: number
  unit: string
  color: string
  decimals: number
  history: number[]
}

interface WarningLight {
  id: string
  label: string
  icon: React.ReactNode
  active: boolean
  color: string
}

const initialGauges: GaugeData[] = [
  { id: 'rpm', label: 'RPM', value: 3240, unit: 'rpm', min: 0, max: 8000, color: '#00d4ff', warnHigh: 6500, dangerHigh: 7500, history: [3200, 3220, 3190, 3240, 3260, 3240, 3230, 3250, 3240] },
  { id: 'speed', label: 'Speed', value: 87, unit: 'km/h', min: 0, max: 280, color: '#10b981', warnHigh: 220, dangerHigh: 260, history: [85, 86, 87, 86, 88, 87, 87, 88, 87] },
  { id: 'boost', label: 'Boost', value: 1.2, unit: 'bar', min: 0, max: 2.5, color: '#8b5cf6', warnHigh: 2.0, dangerHigh: 2.3, history: [1.1, 1.2, 1.2, 1.1, 1.2, 1.3, 1.2, 1.2, 1.2] },
  { id: 'coolant', label: 'Coolant', value: 89, unit: '°C', min: 40, max: 130, color: '#ef4444', warnHigh: 105, dangerHigh: 120, history: [88, 89, 89, 90, 89, 88, 89, 89, 89] },
]

const initialDigital: DigitalReadout[] = [
  { id: 'afr', label: 'AFR', value: 14.3, unit: ':1', color: '#00d4ff', decimals: 1, history: [14.2, 14.3, 14.4, 14.3, 14.3, 14.2, 14.3, 14.3, 14.3] },
  { id: 'ignition', label: 'Ignition', value: 24, unit: '°BTDC', color: '#f59e0b', decimals: 0, history: [23, 24, 24, 25, 24, 23, 24, 24, 24] },
  { id: 'throttle', label: 'Throttle', value: 34, unit: '%', color: '#8b5cf6', decimals: 0, history: [32, 33, 34, 33, 35, 34, 34, 33, 34] },
  { id: 'battery', label: 'Battery', value: 14.2, unit: 'V', color: '#10b981', decimals: 1, history: [14.2, 14.1, 14.2, 14.3, 14.2, 14.2, 14.1, 14.2, 14.2] },
]

const warningLights: WarningLight[] = [
  { id: 'checkengine', label: 'Check Engine', icon: <AlertTriangle className="h-4 w-4" />, active: false, color: '#f59e0b' },
  { id: 'oilpressure', label: 'Oil Pressure', icon: <Oil className="h-4 w-4" />, active: false, color: '#ef4444' },
  { id: 'coolantwarn', label: 'Coolant', icon: <Thermometer className="h-4 w-4" />, active: false, color: '#ef4444' },
  { id: 'batterywarn', label: 'Battery', icon: <Battery className="h-4 w-4" />, active: false, color: '#f59e0b' },
  { id: 'abs', label: 'ABS', icon: <Shield className="h-4 w-4" />, active: false, color: '#f59e0b' },
  { id: 'airbag', label: 'Airbag', icon: <Cpu className="h-4 w-4" />, active: false, color: '#ef4444' },
]

function CircularGauge({ data }: { data: GaugeData }) {
  const percent = ((data.value - data.min) / (data.max - data.min)) * 100
  const circumference = 2 * Math.PI * 45
  const arcLength = (percent / 100) * circumference * 0.75
  const isDanger = data.value >= data.dangerHigh
  const isWarn = data.value >= data.warnHigh
  const arcColor = isDanger ? '#ef4444' : isWarn ? '#f59e0b' : data.color

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36 md:w-44 md:h-44">
        <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 100 100">
          {/* Background arc */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e2a3a" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset="0"
          />
          {/* Value arc */}
          <circle cx="50" cy="50" r="45" fill="none" stroke={arcColor} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset="0"
            className="transition-all duration-500"
            style={{ filter: `drop-shadow(0 0 6px ${arcColor}40)` }}
          />
          {/* Warning threshold marker */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="none"
            strokeWidth="6"
            strokeDasharray="2 200"
            strokeDashoffset={`${-((data.warnHigh - data.min) / (data.max - data.min)) * circumference * 0.75}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-2xl md:text-3xl font-bold font-mono" style={{ color: arcColor }}>
            {data.id === 'boost' ? data.value.toFixed(1) : Math.round(data.value)}
          </span>
          <span className="text-[10px] text-[#475569]">{data.unit}</span>
        </div>
      </div>
      <div className="text-xs font-medium text-[#e2e8f0] mt-2">{data.label}</div>
      {/* Sparkline */}
      <svg width="120" height="24" className="mt-1">
        {data.history.length > 1 && (() => {
          const min = Math.min(...data.history)
          const max = Math.max(...data.history)
          const range = max - min || 1
          const points = data.history.map((v, i) =>
            `${(i / (data.history.length - 1)) * 120},${24 - ((v - min) / range) * 20 - 2}`
          ).join(' ')
          return <polyline points={points} fill="none" stroke={data.color} strokeWidth="1.5" opacity="0.6" />
        })()}
      </svg>
    </div>
  )
}

export function RealtimeView() {
  const [gauges, setGauges] = useState(initialGauges)
  const [digital, setDigital] = useState(initialDigital)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('gauges')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [wLights, setWLights] = useState(warningLights)

  // Simulate live data
  useEffect(() => {
    const interval = setInterval(() => {
      setGauges(prev => prev.map(g => {
        const fluctuation = (g.max - g.min) * 0.02
        const newVal = Math.max(g.min, Math.min(g.max, g.value + (Math.random() * 2 - 1) * fluctuation))
        return { ...g, value: newVal, history: [...g.history.slice(1), newVal] }
      }))
      setDigital(prev => prev.map(d => {
        const fluctuation = d.id === 'afr' ? 0.3 : d.id === 'battery' ? 0.1 : 2
        const newVal = d.value + (Math.random() * 2 - 1) * fluctuation
        return { ...d, value: +newVal.toFixed(d.decimals), history: [...d.history.slice(1), +newVal.toFixed(d.decimals)] }
      }))
      setSessionTime(prev => prev + 1)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // Randomly trigger warning lights for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setWLights(prev => prev.map(w => ({
        ...w,
        active: Math.random() < 0.05 ? !w.active : w.active,
      })))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatSessionTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className={`h-full overflow-y-auto p-4 md:p-6 space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0f1923]' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Real-Time Monitor</h1>
            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px] gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              LIVE
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">Live dashboard with gauges and digital readouts</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Layout mode toggle */}
          <div className="flex items-center bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-0.5">
            {[
              { mode: 'gauges' as LayoutMode, icon: <Gauge className="h-3.5 w-3.5" />, label: 'Gauges' },
              { mode: 'digital' as LayoutMode, icon: <List className="h-3.5 w-3.5" />, label: 'Digital' },
              { mode: 'mixed' as LayoutMode, icon: <Layers className="h-3.5 w-3.5" />, label: 'Mixed' },
            ].map(m => (
              <button
                key={m.mode}
                onClick={() => setLayoutMode(m.mode)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  layoutMode === m.mode
                    ? 'bg-[#00d4ff]/20 text-[#00d4ff]'
                    : 'text-[#64748b] hover:text-[#e2e8f0]'
                }`}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]">
            <Camera className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Session Info Bar */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-3.5 w-3.5 text-[#00d4ff]" />
            <span className="text-xs text-[#e2e8f0]">VW Golf GTI MK8</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#10b981]" />
            <span className="text-xs text-[#64748b]">Session:</span>
            <span className="text-xs font-mono text-[#e2e8f0]">{formatSessionTime(sessionTime)}</span>
          </div>
        </div>
        <Button size="sm" className="h-7 text-[10px] bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30 gap-1">
          <Camera className="h-3 w-3" />
          Snapshot
        </Button>
      </div>

      {/* Main Gauges Section */}
      {(layoutMode === 'gauges' || layoutMode === 'mixed') && (
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#00d4ff]" />
              Primary Gauges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gauges.map(g => (
                <CircularGauge key={g.id} data={g} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Digital Readouts */}
      {(layoutMode === 'digital' || layoutMode === 'mixed') && (
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#10b981]" />
              Digital Readouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {digital.map(d => (
                <div key={d.id} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                  <div className="text-[10px] text-[#475569] mb-2">{d.label}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold font-mono" style={{ color: d.color }}>
                      {d.value.toFixed(d.decimals)}
                    </span>
                    <span className="text-xs text-[#475569]">{d.unit}</span>
                  </div>
                  {/* Sparkline */}
                  <svg width="100%" height="20" preserveAspectRatio="none">
                    {d.history.length > 1 && (() => {
                      const min = Math.min(...d.history)
                      const max = Math.max(...d.history)
                      const range = max - min || 1
                      const w = 100
                      const points = d.history.map((v, i) =>
                        `${(i / (d.history.length - 1)) * w},${20 - ((v - min) / range) * 16 - 2}`
                      ).join(' ')
                      const areaPoints = `0,20 ${points} ${w},20`
                      return (
                        <>
                          <polygon points={areaPoints} fill={`${d.color}15`} />
                          <polyline points={points} fill="none" stroke={d.color} strokeWidth="1.5" />
                        </>
                      )
                    })()}
                  </svg>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Lights Panel */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
            Warning Lights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {wLights.map(w => (
              <div
                key={w.id}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                  w.active
                    ? 'border-[#f59e0b]/40 bg-[#f59e0b]/10 animate-pulse'
                    : 'border-[#1e2a3a] bg-[#0f1923]'
                }`}
              >
                <div className={`mb-2 ${w.active ? '' : 'opacity-30'}`} style={{ color: w.active ? w.color : '#475569' }}>
                  {w.icon}
                </div>
                <span className={`text-[9px] text-center font-medium ${w.active ? 'text-[#e2e8f0]' : 'text-[#475569]'}`}>
                  {w.label}
                </span>
                {w.active && (
                  <Badge className="mt-1 bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[8px] h-4">
                    ACTIVE
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Parameters Grid (for digital mode) */}
      {layoutMode === 'digital' && (
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-[#8b5cf6]" />
              All Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[...gauges, ...digital].map(param => {
                const isGauge = 'warnHigh' in param
                const val = isGauge ? (param.id === 'boost' ? param.value.toFixed(1) : Math.round(param.value)) : (param as DigitalReadout).value.toFixed((param as DigitalReadout).decimals)
                const unit = param.unit
                const isWarn = isGauge && param.value >= param.warnHigh
                const isDanger = isGauge && param.value >= param.dangerHigh
                return (
                  <div key={param.id} className={`p-3 rounded-lg border ${isDanger ? 'border-[#ef4444]/40 bg-[#ef4444]/5' : isWarn ? 'border-[#f59e0b]/40 bg-[#f59e0b]/5' : 'border-[#1e2a3a] bg-[#0f1923]'}`}>
                    <div className="text-[10px] text-[#475569] mb-1">{param.label}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold font-mono" style={{ color: isDanger ? '#ef4444' : isWarn ? '#f59e0b' : param.color }}>
                        {val}
                      </span>
                      <span className="text-[10px] text-[#475569]">{unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
