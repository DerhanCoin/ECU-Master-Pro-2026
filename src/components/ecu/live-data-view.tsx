'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Play,
  Square,
  Circle,
  Filter,
  Gauge,
  Thermometer,
  Zap,
  Wind,
  Fuel,
  Battery,
  Car,
  Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ParameterGroup = 'All' | 'Engine' | 'Transmission' | 'Electrical'

interface ParameterConfig {
  name: string
  unit: string
  baseline: number
  min: number
  max: number
  warningLow: number
  warningHigh: number
  criticalLow: number
  criticalHigh: number
  fluctuation: number
  group: ParameterGroup
  icon: React.ElementType
  decimals?: number
}

const parameterConfigs: ParameterConfig[] = [
  {
    name: 'Engine RPM',
    unit: 'RPM',
    baseline: 780,
    min: 0,
    max: 8000,
    warningLow: 600,
    warningHigh: 3500,
    criticalLow: 0,
    criticalHigh: 6500,
    fluctuation: 40,
    group: 'Engine',
    icon: Gauge,
    decimals: 0,
  },
  {
    name: 'Coolant Temp',
    unit: '°C',
    baseline: 88,
    min: -40,
    max: 150,
    warningLow: 70,
    warningHigh: 105,
    criticalLow: -40,
    criticalHigh: 120,
    fluctuation: 2,
    group: 'Engine',
    icon: Thermometer,
    decimals: 1,
  },
  {
    name: 'Vehicle Speed',
    unit: 'km/h',
    baseline: 0,
    min: 0,
    max: 260,
    warningLow: 0,
    warningHigh: 180,
    criticalLow: 0,
    criticalHigh: 220,
    fluctuation: 2,
    group: 'Transmission',
    icon: Car,
    decimals: 0,
  },
  {
    name: 'Throttle Position',
    unit: '%',
    baseline: 8,
    min: 0,
    max: 100,
    warningLow: 0,
    warningHigh: 80,
    criticalLow: 0,
    criticalHigh: 95,
    fluctuation: 1.5,
    group: 'Engine',
    icon: Activity,
    decimals: 1,
  },
  {
    name: 'MAF Rate',
    unit: 'g/s',
    baseline: 6.2,
    min: 0,
    max: 300,
    warningLow: 2,
    warningHigh: 180,
    criticalLow: 0,
    criticalHigh: 250,
    fluctuation: 0.8,
    group: 'Engine',
    icon: Wind,
    decimals: 1,
  },
  {
    name: 'Fuel Pressure',
    unit: 'kPa',
    baseline: 350,
    min: 0,
    max: 800,
    warningLow: 250,
    warningHigh: 500,
    criticalLow: 150,
    criticalHigh: 650,
    fluctuation: 8,
    group: 'Engine',
    icon: Fuel,
    decimals: 0,
  },
  {
    name: 'Intake Temp',
    unit: '°C',
    baseline: 32,
    min: -40,
    max: 100,
    warningLow: 10,
    warningHigh: 55,
    criticalLow: -40,
    criticalHigh: 70,
    fluctuation: 1,
    group: 'Engine',
    icon: Thermometer,
    decimals: 1,
  },
  {
    name: 'Battery Voltage',
    unit: 'V',
    baseline: 13.8,
    min: 0,
    max: 18,
    warningLow: 12.0,
    warningHigh: 15.0,
    criticalLow: 10.5,
    criticalHigh: 16.0,
    fluctuation: 0.15,
    group: 'Electrical',
    icon: Battery,
    decimals: 2,
  },
  {
    name: 'Transmission Temp',
    unit: '°C',
    baseline: 72,
    min: -40,
    max: 150,
    warningLow: 50,
    warningHigh: 100,
    criticalLow: -20,
    criticalHigh: 120,
    fluctuation: 1.5,
    group: 'Transmission',
    icon: Thermometer,
    decimals: 1,
  },
  {
    name: 'Alternator Output',
    unit: 'V',
    baseline: 14.2,
    min: 0,
    max: 18,
    warningLow: 13.0,
    warningHigh: 15.5,
    criticalLow: 12.0,
    criticalHigh: 16.5,
    fluctuation: 0.1,
    group: 'Electrical',
    icon: Zap,
    decimals: 1,
  },
  {
    name: 'Engine Load',
    unit: '%',
    baseline: 22,
    min: 0,
    max: 100,
    warningLow: 0,
    warningHigh: 75,
    criticalLow: 0,
    criticalHigh: 90,
    fluctuation: 3,
    group: 'Engine',
    icon: Cpu,
    decimals: 1,
  },
  {
    name: 'Timing Advance',
    unit: '°',
    baseline: 12,
    min: -20,
    max: 60,
    warningLow: 0,
    warningHigh: 35,
    criticalLow: -10,
    criticalHigh: 45,
    fluctuation: 1.5,
    group: 'Engine',
    icon: Activity,
    decimals: 1,
  },
]

type SeverityLevel = 'normal' | 'warning' | 'critical'

function getSeverity(value: number, config: ParameterConfig): SeverityLevel {
  if (value <= config.criticalLow || value >= config.criticalHigh) return 'critical'
  if (value <= config.warningLow || value >= config.warningHigh) return 'warning'
  return 'normal'
}

function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return '#ef4444'
    case 'warning':
      return '#f59e0b'
    case 'normal':
      return '#10b981'
  }
}

interface LiveDataCardProps {
  config: ParameterConfig
  value: number
  isStreaming: boolean
}

function LiveDataCard({ config, value, isStreaming }: LiveDataCardProps) {
  const severity = getSeverity(value, config)
  const color = getSeverityColor(severity)
  const Icon = config.icon
  const displayValue = value.toFixed(config.decimals ?? 1)
  const rangePercent = Math.max(0, Math.min(100, ((value - config.min) / (config.max - config.min)) * 100))

  return (
    <div
      className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all hover:border-[#2d3f55]"
      style={{
        boxShadow: isStreaming ? `0 0 12px ${color}15` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          <span className="text-xs font-medium text-[#94a3b8]">{config.name}</span>
        </div>
        <div
          className="h-1.5 w-1.5 rounded-full transition-colors"
          style={{
            backgroundColor: isStreaming ? color : '#475569',
            boxShadow: isStreaming ? `0 0 6px ${color}` : 'none',
          }}
        />
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className="text-2xl font-bold tabular-nums transition-colors"
          style={{ color }}
        >
          {isStreaming ? displayValue : '--'}
        </span>
        <span className="text-xs text-[#64748b]">{config.unit}</span>
      </div>

      {/* Sparkline bar */}
      <div className="mb-3">
        <div className="h-2 w-full bg-[#0f1923] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${rangePercent}%`,
              backgroundColor: color,
              boxShadow: isStreaming ? `0 0 8px ${color}60` : 'none',
            }}
          />
        </div>
      </div>

      {/* Min/Max range */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#64748b]">
          {config.min.toFixed(config.decimals ?? 0)} {config.unit}
        </span>
        <Badge
          className="text-[9px] border-0 px-1.5 py-0"
          style={{
            color,
            backgroundColor: `${color}20`,
          }}
        >
          {severity.toUpperCase()}
        </Badge>
        <span className="text-[10px] text-[#64748b]">
          {config.max.toFixed(config.decimals ?? 0)} {config.unit}
        </span>
      </div>
    </div>
  )
}

export function LiveDataView() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [parameterGroup, setParameterGroup] = useState<ParameterGroup>('All')
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    parameterConfigs.forEach((p) => {
      initial[p.name] = p.baseline
    })
    return initial
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const updateValues = useCallback(() => {
    setValues((prev) => {
      const next: Record<string, number> = {}
      parameterConfigs.forEach((p) => {
        const current = prev[p.name] ?? p.baseline
        const delta = (Math.random() - 0.5) * 2 * p.fluctuation
        // Tendency to revert toward baseline
        const reversion = (p.baseline - current) * 0.05
        let newVal = current + delta + reversion
        newVal = Math.max(p.min, Math.min(p.max, newVal))
        next[p.name] = newVal
      })
      return next
    })
  }, [])

  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(updateValues, 500)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isStreaming, updateValues])

  const filteredParams = parameterConfigs.filter(
    (p) => parameterGroup === 'All' || p.group === parameterGroup
  )

  const streamParamCount = filteredParams.length

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Live Data</h1>
              {isStreaming && (
                <div className="flex items-center gap-1.5 ml-2">
                  <Circle className="h-2.5 w-2.5 text-[#ef4444] fill-[#ef4444] animate-pulse" />
                  <span className="text-[10px] font-semibold text-[#ef4444] uppercase tracking-wider">
                    Recording
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              Real-time vehicle parameter monitoring
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Connection status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#151d2b] border border-[#1e2a3a]">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  isStreaming
                    ? 'bg-[#10b981] shadow-[0_0_6px_#10b981]'
                    : 'bg-[#64748b]'
                )}
              />
              <span
                className={cn(
                  'text-[11px] font-medium',
                  isStreaming ? 'text-[#10b981]' : 'text-[#64748b]'
                )}
              >
                {isStreaming ? 'Streaming' : 'Disconnected'}
              </span>
            </div>

            {/* Filter dropdown */}
            <Select
              value={parameterGroup}
              onValueChange={(v) => setParameterGroup(v as ParameterGroup)}
            >
              <SelectTrigger
                size="sm"
                className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] w-[140px]"
              >
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                <SelectItem value="All" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                  All Parameters
                </SelectItem>
                <SelectItem value="Engine" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                  Engine
                </SelectItem>
                <SelectItem value="Transmission" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                  Transmission
                </SelectItem>
                <SelectItem value="Electrical" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                  Electrical
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Start/Stop Stream button */}
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
              {isStreaming ? (
                <>
                  <Square className="h-3 w-3" />
                  Stop Stream
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Start Stream
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stream info bar */}
        {isStreaming && (
          <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg bg-[#151d2b] border border-[#1e2a3a]">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#00d4ff] animate-pulse" />
              <span className="text-[11px] text-[#94a3b8]">
                <span className="text-[#e2e8f0] font-medium">{streamParamCount}</span> parameters streaming
              </span>
            </div>
            <div className="h-3 w-px bg-[#1e2a3a]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94a3b8]">
                Refresh rate: <span className="text-[#00d4ff] font-medium">500ms</span>
              </span>
            </div>
            <div className="h-3 w-px bg-[#1e2a3a]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94a3b8]">
                Protocol: <span className="text-[#10b981] font-medium">ISO 15765-4 CAN</span>
              </span>
            </div>
          </div>
        )}

        {/* Parameter cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredParams.map((config) => (
            <LiveDataCard
              key={config.name}
              config={config}
              value={values[config.name] ?? config.baseline}
              isStreaming={isStreaming}
            />
          ))}
        </div>

        {/* Empty state when not streaming */}
        {!isStreaming && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-8 text-center">
            <Activity className="h-10 w-10 text-[#00d4ff] mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">No Active Stream</h3>
            <p className="text-xs text-[#64748b]">
              Click &quot;Start Stream&quot; to begin monitoring live vehicle parameters in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
