'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Thermometer,
  Gauge,
  Zap,
  Car,
  Battery,
  Cpu,
  CircleDot,
  Camera,
  Download,
  Settings2,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SensorStatus = 'normal' | 'warning' | 'critical'
type SensorCategory = 'engine' | 'transmission' | 'abs' | 'electrical'

interface SensorData {
  id: string
  name: string
  category: SensorCategory
  value: number
  unit: string
  min: number
  max: number
  warningLow: number
  warningHigh: number
  criticalLow: number
  criticalHigh: number
  status: SensorStatus
  showGraph: boolean
}

const initialSensors: SensorData[] = [
  // Engine
  { id: 'rpm', name: 'Engine RPM', category: 'engine', value: 3240, unit: 'rpm', min: 0, max: 8000, warningLow: 600, warningHigh: 6500, criticalLow: 0, criticalHigh: 7200, status: 'normal', showGraph: false },
  { id: 'map', name: 'MAP Sensor', category: 'engine', value: 98, unit: 'kPa', min: 0, max: 255, warningLow: 20, warningHigh: 200, criticalLow: 0, criticalHigh: 230, status: 'normal', showGraph: false },
  { id: 'maf', name: 'MAF Rate', category: 'engine', value: 14.8, unit: 'g/s', min: 0, max: 200, warningLow: 1, warningHigh: 180, criticalLow: 0, criticalHigh: 195, status: 'normal', showGraph: false },
  { id: 'coolant', name: 'Coolant Temp', category: 'engine', value: 89, unit: '°C', min: -40, max: 150, warningLow: 60, warningHigh: 105, criticalLow: 40, criticalHigh: 120, status: 'normal', showGraph: false },
  { id: 'intake', name: 'Intake Temp', category: 'engine', value: 38, unit: '°C', min: -40, max: 80, warningLow: -20, warningHigh: 60, criticalLow: -30, criticalHigh: 75, status: 'normal', showGraph: false },
  { id: 'throttle', name: 'Throttle Position', category: 'engine', value: 34, unit: '%', min: 0, max: 100, warningLow: 0, warningHigh: 90, criticalLow: 0, criticalHigh: 100, status: 'normal', showGraph: false },
  { id: 'o2b1s1', name: 'O2 Sensor B1S1', category: 'engine', value: 0.45, unit: 'V', min: 0, max: 1.0, warningLow: 0.05, warningHigh: 0.9, criticalLow: 0, criticalHigh: 1.0, status: 'normal', showGraph: false },
  { id: 'o2b1s2', name: 'O2 Sensor B1S2', category: 'engine', value: 0.68, unit: 'V', min: 0, max: 1.0, warningLow: 0.05, warningHigh: 0.9, criticalLow: 0, criticalHigh: 1.0, status: 'normal', showGraph: false },
  { id: 'stft', name: 'Fuel Trim STFT', category: 'engine', value: 2.4, unit: '%', min: -30, max: 30, warningLow: -15, warningHigh: 15, criticalLow: -25, criticalHigh: 25, status: 'normal', showGraph: false },
  { id: 'ltft', name: 'Fuel Trim LTFT', category: 'engine', value: 5.2, unit: '%', min: -30, max: 30, warningLow: -10, warningHigh: 10, criticalLow: -20, criticalHigh: 20, status: 'normal', showGraph: false },
  // Transmission
  { id: 'gear', name: 'Current Gear', category: 'transmission', value: 4, unit: 'gear', min: 0, max: 7, warningLow: 0, warningHigh: 7, criticalLow: 0, criticalHigh: 7, status: 'normal', showGraph: false },
  { id: 'transtemp', name: 'Trans Fluid Temp', category: 'transmission', value: 78, unit: '°C', min: -20, max: 150, warningLow: 40, warningHigh: 100, criticalLow: 30, criticalHigh: 120, status: 'normal', showGraph: false },
  { id: 'slip', name: 'Torque Converter Slip', category: 'transmission', value: 12, unit: 'rpm', min: 0, max: 200, warningLow: 0, warningHigh: 80, criticalLow: 0, criticalHigh: 150, status: 'normal', showGraph: false },
  // ABS
  { id: 'wspdfl', name: 'Wheel Speed FL', category: 'abs', value: 87, unit: 'km/h', min: 0, max: 300, warningLow: 0, warningHigh: 250, criticalLow: 0, criticalHigh: 280, status: 'normal', showGraph: false },
  { id: 'wspdfr', name: 'Wheel Speed FR', category: 'abs', value: 87, unit: 'km/h', min: 0, max: 300, warningLow: 0, warningHigh: 250, criticalLow: 0, criticalHigh: 280, status: 'normal', showGraph: false },
  { id: 'wspdrl', name: 'Wheel Speed RL', category: 'abs', value: 86, unit: 'km/h', min: 0, max: 300, warningLow: 0, warningHigh: 250, criticalLow: 0, criticalHigh: 280, status: 'normal', showGraph: false },
  { id: 'wspdrr', name: 'Wheel Speed RR', category: 'abs', value: 86, unit: 'km/h', min: 0, max: 300, warningLow: 0, warningHigh: 250, criticalLow: 0, criticalHigh: 280, status: 'normal', showGraph: false },
  // Electrical
  { id: 'battv', name: 'Battery Voltage', category: 'electrical', value: 14.2, unit: 'V', min: 0, max: 18, warningLow: 11.5, warningHigh: 15.5, criticalLow: 10, criticalHigh: 16.5, status: 'normal', showGraph: false },
  { id: 'altoutput', name: 'Alternator Output', category: 'electrical', value: 14.4, unit: 'V', min: 0, max: 18, warningLow: 12.5, warningHigh: 15.5, criticalLow: 11, criticalHigh: 16.5, status: 'normal', showGraph: false },
]

function getStatusFromValue(sensor: SensorData): SensorStatus {
  const v = sensor.value
  if (v <= sensor.criticalLow || v >= sensor.criticalHigh) return 'critical'
  if (v <= sensor.warningLow || v >= sensor.warningHigh) return 'warning'
  return 'normal'
}

function getStatusColor(status: SensorStatus): string {
  switch (status) {
    case 'normal': return '#10b981'
    case 'warning': return '#f59e0b'
    case 'critical': return '#ef4444'
  }
}

function getCategoryLabel(cat: SensorCategory): string {
  switch (cat) {
    case 'engine': return 'Engine'
    case 'transmission': return 'Transmission'
    case 'abs': return 'ABS'
    case 'electrical': return 'Electrical'
  }
}

function getCategoryIcon(cat: SensorCategory) {
  switch (cat) {
    case 'engine': return Cpu
    case 'transmission': return Car
    case 'abs': return CircleDot
    case 'electrical': return Zap
  }
}

export function LiveSensorsView() {
  const [sensors, setSensors] = useState<SensorData[]>(initialSensors)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<SensorCategory | 'all'>('all')
  const [snapshotTaken, setSnapshotTaken] = useState(false)
  const [alertConfigOpen, setAlertConfigOpen] = useState<string | null>(null)
  const recordingRef = useRef(false)

  // Simulate live data updates
  useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((sensor) => {
          const fluctuation = (Math.random() - 0.5) * (sensor.max - sensor.min) * 0.02
          let newVal = sensor.value + fluctuation
          newVal = Math.max(sensor.min, Math.min(sensor.max, newVal))
          // Revert towards baseline for some sensors
          const baseline = initialSensors.find((s) => s.id === sensor.id)?.value ?? sensor.value
          newVal = newVal * 0.97 + baseline * 0.03
          const updated = { ...sensor, value: Number(newVal.toFixed(sensor.unit === 'V' || sensor.unit === '%' ? 1 : 0)) }
          updated.status = getStatusFromValue(updated)
          return updated
        })
      )
    }, 500)

    return () => clearInterval(interval)
  }, [isStreaming])

  useEffect(() => {
    recordingRef.current = isRecording
  }, [isRecording])

  const toggleGraph = useCallback((id: string) => {
    setSensors((prev) =>
      prev.map((s) => s.id === id ? { ...s, showGraph: !s.showGraph } : s)
    )
  }, [])

  const takeSnapshot = useCallback(() => {
    setSnapshotTaken(true)
    setTimeout(() => setSnapshotTaken(false), 2000)
  }, [])

  const filteredSensors = sensors.filter(
    (s) => categoryFilter === 'all' || s.category === categoryFilter
  )

  const normalCount = sensors.filter((s) => s.status === 'normal').length
  const warningCount = sensors.filter((s) => s.status === 'warning').length
  const criticalCount = sensors.filter((s) => s.status === 'critical').length

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Live Sensors</h1>
            {isStreaming && (
              <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#10b981] mr-1 animate-pulse" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#64748b]">Real-time sensor data monitoring</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setIsStreaming(!isStreaming)}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              isStreaming
                ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            {isStreaming ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isStreaming ? 'Stop' : 'Start Stream'}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsRecording(!isRecording)}
            variant="outline"
            className={cn(
              'h-8 text-xs gap-1.5 border-[#1e2a3a]',
              isRecording
                ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'
                : 'bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a]'
            )}
          >
            {isRecording ? <Square className="h-3 w-3" /> : <CircleDot className="h-3 w-3" />}
            {isRecording ? 'Stop Rec' : 'Record'}
          </Button>
          <Button
            size="sm"
            onClick={takeSnapshot}
            variant="outline"
            className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] gap-1.5"
          >
            <Camera className="h-3 w-3" />
            {snapshotTaken ? 'Saved!' : 'Snapshot'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] gap-1.5"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Normal', count: normalCount, color: '#10b981', icon: CheckCircle2 },
          { label: 'Warning', count: warningCount, color: '#f59e0b', icon: AlertTriangle },
          { label: 'Critical', count: criticalCount, color: '#ef4444', icon: AlertTriangle },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3 flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stat.color}15` }}>
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.count}</div>
              <div className="text-[10px] text-[#64748b]">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
          <div className="h-2 w-2 rounded-full bg-[#ef4444] animate-pulse" />
          <span className="text-xs text-[#ef4444] font-semibold">Recording in progress...</span>
          <span className="text-[10px] text-[#64748b] ml-auto">{new Date().toLocaleTimeString()}</span>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCategoryFilter('all')}
          className={cn(
            'h-7 text-[10px] px-2.5 border-[#1e2a3a]',
            categoryFilter === 'all'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
              : 'bg-[#151d2b] text-[#64748b]'
          )}
        >
          All ({sensors.length})
        </Button>
        {(['engine', 'transmission', 'abs', 'electrical'] as SensorCategory[]).map((cat) => {
          const Icon = getCategoryIcon(cat)
          const count = sensors.filter((s) => s.category === cat).length
          return (
            <Button
              key={cat}
              size="sm"
              variant="outline"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'h-7 text-[10px] px-2.5 border-[#1e2a3a] gap-1',
                categoryFilter === cat
                  ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
                  : 'bg-[#151d2b] text-[#64748b]'
              )}
            >
              <Icon className="h-3 w-3" />
              {getCategoryLabel(cat)} ({count})
            </Button>
          )
        })}
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredSensors.map((sensor) => {
          const statusColor = getStatusColor(sensor.status)
          const rangePercent = sensor.max !== sensor.min
            ? ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100
            : 0

          return (
            <Card key={sensor.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#2d3f55] transition-colors">
              <CardContent className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor, boxShadow: sensor.status !== 'normal' ? `0 0 6px ${statusColor}` : 'none' }} />
                    <span className="text-[10px] text-[#64748b] font-medium">{sensor.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleGraph(sensor.id)}
                      className="p-1 rounded hover:bg-[#1e2a3a] transition-colors"
                      title="Toggle graph"
                    >
                      <Activity className={cn('h-3 w-3', sensor.showGraph ? 'text-[#00d4ff]' : 'text-[#475569]')} />
                    </button>
                    <button
                      onClick={() => setAlertConfigOpen(alertConfigOpen === sensor.id ? null : sensor.id)}
                      className="p-1 rounded hover:bg-[#1e2a3a] transition-colors"
                      title="Configure alerts"
                    >
                      <Settings2 className="h-3 w-3 text-[#475569]" />
                    </button>
                  </div>
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-[#e2e8f0] tabular-nums">
                    {sensor.value}
                  </span>
                  <span className="text-[10px] text-[#64748b]">{sensor.unit}</span>
                </div>

                {/* Range Bar */}
                <div className="space-y-1">
                  <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden relative">
                    {/* Warning zone indicators */}
                    <div className="absolute inset-0 flex">
                      <div className="h-full bg-[#10b981]/10" style={{ width: `${((sensor.warningLow - sensor.min) / (sensor.max - sensor.min)) * 100}%` }} />
                      <div className="h-full bg-[#10b981]/20" style={{ width: `${((sensor.warningHigh - sensor.warningLow) / (sensor.max - sensor.min)) * 100}%` }} />
                      <div className="h-full bg-[#10b981]/10" style={{ width: `${((sensor.max - sensor.warningHigh) / (sensor.max - sensor.min)) * 100}%` }} />
                    </div>
                    {/* Value indicator */}
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(2, rangePercent)}%`,
                        backgroundColor: statusColor,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-[#475569]">
                    <span>Min: {sensor.min}</span>
                    <span>Max: {sensor.max}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge
                  className="text-[9px] border-0 px-1.5 py-0 h-4 w-fit"
                  style={{
                    color: statusColor,
                    backgroundColor: `${statusColor}20`,
                  }}
                >
                  {sensor.status.toUpperCase()}
                </Badge>

                {/* Mini graph placeholder */}
                {sensor.showGraph && (
                  <div className="h-16 bg-[#0a0f18] border border-[#1e2a3a] rounded-md overflow-hidden relative">
                    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      {(() => {
                        const points: string[] = []
                        for (let i = 0; i < 20; i++) {
                          const x = (i / 19) * 100
                          const y = 20 + (Math.sin(i * 0.8 + Date.now() * 0.001) * 8) + (Math.random() * 4)
                          points.push(`${x},${Math.max(2, Math.min(38, y))}`)
                        }
                        return (
                          <polyline
                            fill="none"
                            stroke={statusColor}
                            strokeWidth="1.5"
                            points={points.join(' ')}
                            opacity="0.7"
                          />
                        )
                      })()}
                    </svg>
                    <div className="absolute top-1 left-1 text-[8px] text-[#475569] font-mono">Real-time</div>
                  </div>
                )}

                {/* Alert config (expandable) */}
                {alertConfigOpen === sensor.id && (
                  <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2 space-y-1.5">
                    <div className="text-[9px] font-semibold text-[#e2e8f0]">Alert Thresholds</div>
                    <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                      <div>
                        <span className="text-[#f59e0b]">Warn Low:</span>
                        <span className="text-[#94a3b8] ml-1 font-mono">{sensor.warningLow} {sensor.unit}</span>
                      </div>
                      <div>
                        <span className="text-[#f59e0b]">Warn High:</span>
                        <span className="text-[#94a3b8] ml-1 font-mono">{sensor.warningHigh} {sensor.unit}</span>
                      </div>
                      <div>
                        <span className="text-[#ef4444]">Crit Low:</span>
                        <span className="text-[#94a3b8] ml-1 font-mono">{sensor.criticalLow} {sensor.unit}</span>
                      </div>
                      <div>
                        <span className="text-[#ef4444]">Crit High:</span>
                        <span className="text-[#94a3b8] ml-1 font-mono">{sensor.criticalHigh} {sensor.unit}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Not streaming state */}
      {!isStreaming && (
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="py-8 text-center">
            <Activity className="h-8 w-8 text-[#00d4ff] mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">Sensor Stream Inactive</h3>
            <p className="text-xs text-[#64748b]">Click &quot;Start Stream&quot; to begin live sensor data monitoring.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
