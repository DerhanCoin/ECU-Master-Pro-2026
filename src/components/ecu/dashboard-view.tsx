'use client'

import { MetricCard } from './metric-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/app-store'
import {
  Heart,
  Wifi,
  WifiOff,
  Activity,
  Cpu,
  Plug,
  Gauge,
  BusFront,
  AlertTriangle,
  Zap,
  Play,
  Car,
  Radio,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Shield,
  Battery,
  Thermometer,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Brain,
  Unplug,
  Wrench,
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'

// Types for live engine parameters
interface ParamState {
  label: string
  value: number
  unit: string
  color: string
  percent: number
  history: number[]
  trend: 'up' | 'down' | 'stable'
  min: number
  max: number
  fluctuation: number
}

// API data types
interface VehicleStats {
  total: number
  active: number
  needsAttention: number
  offline: number
  avgHealth: number
}

interface DtcStats {
  total: number
  critical: number
  warnings: number
  active: number
}

interface ServiceStats {
  total: number
  totalCost: number
}

const initialParams: ParamState[] = [
  { label: 'RPM', value: 3240, unit: 'rpm', color: '#00d4ff', percent: 48, history: [3200, 3210, 3230, 3220, 3240, 3240], trend: 'stable', min: 800, max: 6800, fluctuation: 50 },
  { label: 'Speed', value: 87, unit: 'km/h', color: '#10b981', percent: 35, history: [85, 86, 87, 86, 87, 87], trend: 'stable', min: 0, max: 250, fluctuation: 2 },
  { label: 'Coolant', value: 89, unit: '°C', color: '#f59e0b', percent: 59, history: [88, 88, 89, 89, 90, 89], trend: 'stable', min: 60, max: 120, fluctuation: 1 },
  { label: 'Battery', value: 14.2, unit: 'V', color: '#10b981', percent: 95, history: [14.2, 14.1, 14.2, 14.3, 14.2, 14.2], trend: 'stable', min: 10, max: 16, fluctuation: 0.1 },
  { label: 'Throttle', value: 34, unit: '%', color: '#8b5cf6', percent: 34, history: [32, 33, 34, 33, 34, 34], trend: 'stable', min: 0, max: 100, fluctuation: 2 },
  { label: 'Boost', value: 1.2, unit: 'bar', color: '#00d4ff', percent: 60, history: [1.1, 1.2, 1.2, 1.1, 1.2, 1.2], trend: 'stable', min: 0, max: 2.5, fluctuation: 0.05 },
]

// Activity timeline data
const activityEvents = [
  { message: 'DTC P0300 detected on VW Golf GTI', time: '2 min ago', category: 'CRITICAL', color: '#ef4444' },
  { message: 'AI analysis completed for Mercedes C-Class', time: '15 min ago', category: 'AI', color: '#8b5cf6' },
  { message: 'Oil change completed on BMW 330e', time: '1h ago', category: 'SERVICE', color: '#10b981' },
  { message: 'Firmware update available for VAS 6154', time: '2h ago', category: 'SYSTEM', color: '#00d4ff' },
  { message: 'Battery voltage alert on Audi A4', time: '3h ago', category: 'WARNING', color: '#f59e0b' },
  { message: 'Remote diagnostic session ended', time: '5h ago', category: 'CONNECTION', color: '#3b82f6' },
  { message: 'CAN bus error frame detected', time: '8h ago', category: 'ERROR', color: '#ef4444' },
  { message: 'Predictive maintenance report generated', time: 'Yesterday', category: 'AI', color: '#8b5cf6' },
]

// ── Loading metric card skeleton ────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-3 bg-[#1e2a3a] rounded w-20" />
        <div className="h-7 w-7 bg-[#1e2a3a] rounded-md" />
      </div>
      <div className="h-7 bg-[#1e2a3a] rounded w-16 mt-2" />
      <div className="h-2.5 bg-[#1e2a3a] rounded w-24 mt-2" />
    </div>
  )
}

export function DashboardView() {
  const { setActiveView, isConnected, selectedDevice, setConnectModalOpen, setIsConnected, setSelectedDevice } = useAppStore()
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [healthScore, setHealthScore] = useState(87)
  const [engineParams, setEngineParams] = useState<ParamState[]>(initialParams)

  // API-driven state
  const [vehicleStats, setVehicleStats] = useState<VehicleStats | null>(null)
  const [dtcStats, setDtcStats] = useState<DtcStats | null>(null)
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null)
  const [apiLoading, setApiLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [diagSource, setDiagSource] = useState<'real' | 'simulation' | 'offline'>('offline')
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch dashboard data from APIs on mount
  useEffect(() => {
    let cancelled = false

    async function fetchDashboardData() {
      setApiLoading(true)
      try {
        // Fetch from local Next.js APIs + diagnostic backend in parallel
        const [vehiclesRes, dtcRes, serviceRes, liveDataRes] = await Promise.allSettled([
          fetch('/api/vehicles'),
          fetch('/api/dtc-codes'),
          fetch('/api/service-records'),
          fetch('/api/live-data?XTransformPort=8000'),
        ])

        if (cancelled) return

        let anySuccess = false

        // Process vehicles
        if (vehiclesRes.status === 'fulfilled' && vehiclesRes.value.ok) {
          const data = await vehiclesRes.value.json()
          if (data.success && data.vehicles) {
            const vehicles = data.vehicles as Array<Record<string, unknown>>
            const avgHealth = vehicles.length > 0
              ? Math.round(vehicles.reduce((sum: number, v: Record<string, unknown>) => sum + ((v.health as number) ?? 80), 0) / vehicles.length)
              : 87
            setVehicleStats({
              total: data.total ?? vehicles.length,
              active: data.active ?? 0,
              needsAttention: data.needsAttention ?? 0,
              offline: data.offline ?? 0,
              avgHealth,
            })
            setHealthScore(avgHealth)
            anySuccess = true
          }
        }

        // Process DTC codes
        if (dtcRes.status === 'fulfilled' && dtcRes.value.ok) {
          const data = await dtcRes.value.json()
          if (data.success) {
            setDtcStats({
              total: data.total ?? 0,
              critical: data.critical ?? 0,
              warnings: data.warnings ?? 0,
              active: data.active ?? 0,
            })
            anySuccess = true
          }
        }

        // Process service records
        if (serviceRes.status === 'fulfilled' && serviceRes.value.ok) {
          const data = await serviceRes.value.json()
          if (data.success) {
            setServiceStats({
              total: data.total ?? 0,
              totalCost: data.totalCost ?? 0,
            })
            anySuccess = true
          }
        }

        // Process live diagnostic data from backend
        if (liveDataRes.status === 'fulfilled' && liveDataRes.value.ok) {
          const data = await liveDataRes.value.json()
          if (data.success && data.data?.sensors) {
            const sensors = data.data.sensors as Array<{ pid: string; name: string; value: number; unit: string }>
            setDiagSource(data.data.source ?? 'simulation')
            // Map sensor data to engine params
            setEngineParams(prev => prev.map(param => {
              const sensorMap: Record<string, string> = {
                'RPM': '0C', 'Speed': '0D', 'Coolant': '05',
                'Battery': '42', 'Throttle': '11', 'Boost': '0B',
              }
              const pid = sensorMap[param.label]
              const sensor = pid ? sensors.find(s => s.pid === pid) : null
              if (sensor) {
                const newValue = sensor.value
                const newHistory = [...param.history.slice(1), newValue]
                const prevValue = param.history[param.history.length - 2] ?? param.value
                const trend: 'up' | 'down' | 'stable' = newValue > prevValue + param.fluctuation * 0.3
                  ? 'up' : newValue < prevValue - param.fluctuation * 0.3 ? 'down' : 'stable'
                const percent = ((newValue - param.min) / (param.max - param.min)) * 100
                return { ...param, value: newValue, history: newHistory, trend, percent }
              }
              return param
            }))
            anySuccess = true
          }
        }

        setIsLive(anySuccess)
      } catch {
        setIsLive(false)
      } finally {
        if (!cancelled) {
          setApiLoading(false)
        }
      }
    }

    fetchDashboardData()
    return () => { cancelled = true }
  }, [])

  // Simulate live health score fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthScore(prev => {
        const delta = Math.random() * 2 - 1
        return Math.max(80, Math.min(95, prev + delta))
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Live engine parameter updates — fetch from diagnostic backend or simulate
  useEffect(() => {
    if (isConnected && diagSource !== 'offline') {
      // Real/simulated data from backend — poll every 2s
      liveIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/live-data?XTransformPort=8000')
          const data = await res.json()
          if (data.success && data.data?.sensors) {
            const sensors = data.data.sensors as Array<{ pid: string; name: string; value: number; unit: string }>
            setEngineParams(prev => prev.map(param => {
              const sensorMap: Record<string, string> = {
                'RPM': '0C', 'Speed': '0D', 'Coolant': '05',
                'Battery': '42', 'Throttle': '11', 'Boost': '0B',
              }
              const pid = sensorMap[param.label]
              const sensor = pid ? sensors.find(s => s.pid === pid) : null
              if (sensor) {
                const newValue = sensor.value
                const newHistory = [...param.history.slice(1), newValue]
                const prevValue = param.history[param.history.length - 2] ?? param.value
                const trend: 'up' | 'down' | 'stable' = newValue > prevValue + param.fluctuation * 0.3
                  ? 'up' : newValue < prevValue - param.fluctuation * 0.3 ? 'down' : 'stable'
                const percent = ((newValue - param.min) / (param.max - param.min)) * 100
                return { ...param, value: newValue, history: newHistory, trend, percent }
              }
              return param
            }))
          }
        } catch {
          // Backend unreachable — keep existing values
        }
      }, 2000)
    } else {
      // Simulation mode — local fluctuation
      liveIntervalRef.current = setInterval(() => {
        setEngineParams(prev => prev.map(param => {
          const delta = (Math.random() * 2 - 1) * param.fluctuation
          const newValue = Math.max(param.min, Math.min(param.max, param.value + delta))
          const newHistory = [...param.history.slice(1), newValue]
          const prevValue = param.history[param.history.length - 2] ?? param.value
          const trend: 'up' | 'down' | 'stable' = newValue > prevValue + param.fluctuation * 0.3
            ? 'up'
            : newValue < prevValue - param.fluctuation * 0.3
              ? 'down'
              : 'stable'
          const percent = ((newValue - param.min) / (param.max - param.min)) * 100
          return { ...param, value: newValue, history: newHistory, trend, percent }
        }))
      }, 2000)
    }
    return () => { if (liveIntervalRef.current) clearInterval(liveIntervalRef.current) }
  }, [isConnected, diagSource])

  const handleQuickScan = async () => {
    setScanning(true)
    setScanProgress(0)
    try {
      // Try to scan via diagnostic backend
      const res = await fetch('/api/scan?XTransformPort=8000', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          // Update health score from scan result
          if (data.data.healthScore) setHealthScore(data.data.healthScore)
          // Update DTCs from scan
          if (data.data.dtcs?.length >= 0) {
            setDtcStats({
              total: data.data.dtcs.length,
              critical: data.data.dtcs.filter((d: { severity: string }) => d.severity === 'critical').length,
              warnings: data.data.dtcs.filter((d: { severity: string }) => d.severity === 'warning').length,
              active: data.data.dtcs.filter((d: { status: string }) => d.status === 'Active').length,
            })
          }
        }
      }
    } catch {
      // Backend unreachable
    }
    // Simulate progress animation regardless
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setScanning(false)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 200)
  }

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    setSelectedDevice(null)
  }, [setIsConnected, setSelectedDevice])

  const healthColor = healthScore >= 85 ? '#10b981' : healthScore >= 70 ? '#f59e0b' : '#ef4444'

  // Format parameter value for display
  const formatValue = (value: number, label: string) => {
    if (label === 'RPM') return Math.round(value).toLocaleString()
    if (label === 'Battery' || label === 'Boost') return value.toFixed(1)
    return Math.round(value).toString()
  }

  // Get sparkline max for normalization
  const getSparklineMax = (history: number[]) => Math.max(...history, 1)
  const getSparklineMin = (history: number[]) => Math.min(...history)

  // Derived metric values with API fallback
  const activeDtcCount = dtcStats?.active ?? 3
  const serviceCount = serviceStats?.total ?? 12
  const fleetSize = vehicleStats?.total ?? 24

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Connection Status Banner */}
        {isConnected ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                <Wifi className="h-3.5 w-3.5 text-[#10b981]" />
              </div>
              <div>
                <span className="text-xs font-medium text-[#10b981]">Connected via {selectedDevice ?? 'OBD-II Device'}</span>
                <span className="text-[10px] text-[#64748b] ml-2">Real-time data streaming active</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleDisconnect}
              className="h-7 text-[10px] bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/20 font-medium gap-1"
              variant="outline"
            >
              <Unplug className="h-3 w-3" />
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
                <WifiOff className="h-3.5 w-3.5 text-[#f59e0b]" />
              </div>
              <div>
                <span className="text-xs font-medium text-[#f59e0b]">No device connected</span>
                <span className="text-[10px] text-[#64748b] ml-2">Connect a diagnostic device to start scanning</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setConnectModalOpen(true)}
              className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1"
            >
              <Wifi className="h-3 w-3" />
              Connect Device
            </Button>
          </div>
        )}

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Dashboard</h1>
              {/* Live / Demo indicator */}
              {apiLoading ? (
                <Badge className="bg-[#1e2a3a] text-[#64748b] border-[#2d3f55] text-[10px] gap-1 animate-pulse">
                  <Radio className="h-2.5 w-2.5" />
                  Loading
                </Badge>
              ) : isLive ? (
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px] gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px] gap-1">
                  Demo
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              Vehicle diagnostics overview and system status
            </p>
          </div>
          <div className="flex items-center gap-2">
            {scanning ? (
              <div className="flex items-center gap-2 bg-[#151d2b] border border-[#00d4ff]/30 rounded-lg px-3 py-2">
                <RefreshCw className="h-3.5 w-3.5 text-[#00d4ff] animate-spin" />
                <span className="text-xs text-[#00d4ff] font-mono">{Math.min(Math.round(scanProgress), 100)}%</span>
                <div className="w-20 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00d4ff] rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(scanProgress, 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleQuickScan}
                className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
              >
                <Play className="h-3 w-3" />
                Quick Scan
              </Button>
            )}
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {apiLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Vehicle Health"
                value={`${Math.round(healthScore)}%`}
                subtitle="Overall condition"
                icon={<Heart className="h-4 w-4" />}
                color={healthColor}
                glowColor="green"
              />
              <MetricCard
                title="Active DTCs"
                value={activeDtcCount}
                subtitle="Diagnostic trouble codes"
                icon={<AlertTriangle className="h-4 w-4" />}
                color="#f59e0b"
                glowColor="yellow"
              />
              <MetricCard
                title="Service Records"
                value={serviceCount}
                subtitle="Total maintenance records"
                icon={<Wrench className="h-4 w-4" />}
                color="#8b5cf6"
                glowColor="purple"
              />
              <MetricCard
                title="Fleet Size"
                value={fleetSize}
                subtitle="Registered vehicles"
                icon={<Car className="h-4 w-4" />}
                color="#00d4ff"
                glowColor="teal"
              />
            </>
          )}
        </div>

        {/* AI Insights Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#8b5cf6]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">AI Insights</h2>
            <Badge className="text-[9px] bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 ml-1">Powered by AI</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prediction Insight */}
            <div className="bg-[#151d2b] border border-[#8b5cf6]/20 rounded-lg p-4 hover:border-[#8b5cf6]/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#8b5cf6]/15 flex items-center justify-center shrink-0 group-hover:bg-[#8b5cf6]/25 transition-colors">
                  <TrendingUp className="h-4 w-4 text-[#8b5cf6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#e2e8f0] mb-1">Prediction</div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed mb-3">
                    Catalytic converter efficiency declining - 72% probability
                  </p>
                  <button
                    onClick={() => setActiveView('ai')}
                    className="flex items-center gap-1 text-[10px] text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
                  >
                    View Details <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Anomaly Insight */}
            <div className="bg-[#151d2b] border border-[#f59e0b]/20 rounded-lg p-4 hover:border-[#f59e0b]/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#f59e0b]/15 flex items-center justify-center shrink-0 group-hover:bg-[#f59e0b]/25 transition-colors">
                  <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#e2e8f0] mb-1">Anomaly</div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed mb-3">
                    Unusual vibration pattern detected at 2,400 RPM
                  </p>
                  <button
                    onClick={() => setActiveView('ai')}
                    className="flex items-center gap-1 text-[10px] text-[#f59e0b] hover:text-[#fbbf24] transition-colors"
                  >
                    View Details <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Trend Insight */}
            <div className="bg-[#151d2b] border border-[#00d4ff]/20 rounded-lg p-4 hover:border-[#00d4ff]/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/15 flex items-center justify-center shrink-0 group-hover:bg-[#00d4ff]/25 transition-colors">
                  <TrendingDown className="h-4 w-4 text-[#00d4ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#e2e8f0] mb-1">Trend</div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed mb-3">
                    Battery voltage declining 0.1V/month - monitor recommended
                  </p>
                  <button
                    onClick={() => setActiveView('ai')}
                    className="flex items-center gap-1 text-[10px] text-[#00d4ff] hover:text-[#00bcd4] transition-colors"
                  >
                    View Details <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Health Score Gauge - Large */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#10b981]" />
              Health Score
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1e2a3a" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={healthColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(healthScore / 100) * 326.7} 326.7`}
                    className="transition-all duration-1000"
                    style={{ filter: `drop-shadow(0 0 6px ${healthColor}40)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: healthColor }}>
                    {Math.round(healthScore)}
                  </span>
                  <span className="text-[10px] text-[#64748b]">out of 100</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold text-[#10b981]">Good</div>
                <div className="text-[9px] text-[#64748b]">85-100</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#f59e0b]">Fair</div>
                <div className="text-[9px] text-[#64748b]">70-84</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#ef4444]">Poor</div>
                <div className="text-[9px] text-[#64748b]">0-69</div>
              </div>
            </div>
          </div>

          {/* System status */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#00d4ff]" />
              System Status
            </h3>
            <div className="space-y-3">
              {[
                { label: 'OBD-II Connection', status: 'Disconnected', color: '#ef4444', icon: Wifi },
                { label: 'CAN Bus', status: 'Inactive', color: '#64748b', icon: BusFront },
                { label: 'EV/Hybrid Module', status: 'Standby', color: '#f59e0b', icon: Plug },
                { label: 'Performance Monitor', status: 'Ready', color: '#10b981', icon: Gauge },
                { label: 'AI Diagnostics', status: 'Available', color: '#8b5cf6', icon: Cpu },
                { label: 'Security Module', status: 'Armed', color: '#10b981', icon: Shield },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-[#64748b]" />
                      <span className="text-xs text-[#94a3b8]">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px]" style={{ color: item.color }}>{item.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick diagnostics */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#8b5cf6]" />
              Quick Diagnostics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Full Scan', icon: Activity, color: '#00d4ff', view: 'dtc-tool' as const },
                { label: 'DTC Check', icon: AlertTriangle, color: '#f59e0b', view: 'dtc-tool' as const },
                { label: 'Live Data', icon: Gauge, color: '#10b981', view: 'live-sensors' as const },
                { label: 'ECU Info', icon: Cpu, color: '#8b5cf6', view: 'ecu' as const },
                { label: 'AI Analysis', icon: Zap, color: '#8b5cf6', view: 'ai' as const },
                { label: 'CAN Bus', icon: BusFront, color: '#00d4ff', view: 'can' as const },
              ].map((action, i) => {
                const Icon = action.icon
                return (
                  <button
                    key={i}
                    onClick={() => setActiveView(action.view)}
                    className="flex items-center gap-2 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55] transition-all group"
                  >
                    <Icon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" style={{ color: action.color }} />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Live Engine Parameters - Enhanced with Live Animation */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#00d4ff]" />
              Live Engine Parameters
              <span className="ml-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[9px] text-[#10b981] font-medium">LIVE</span>
              </span>
            </h3>
            <button
              onClick={() => setActiveView('live-sensors')}
              className="flex items-center gap-1 text-[10px] text-[#00d4ff] hover:text-[#00bcd4] transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {engineParams.map((param, i) => {
              const sparkMin = getSparklineMin(param.history)
              const sparkMax = getSparklineMax(param.history)
              const sparkRange = sparkMax - sparkMin || 1
              return (
                <div key={i} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[#64748b] mb-1">{param.label}</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-bold font-mono" style={{ color: param.color }}>
                      {formatValue(param.value, param.label)}
                    </span>
                    <span className="text-[10px] text-[#475569]">{param.unit}</span>
                    {/* Trend indicator */}
                    {param.trend === 'up' && (
                      <ArrowUp className="h-3 w-3 text-[#10b981]" />
                    )}
                    {param.trend === 'down' && (
                      <ArrowDown className="h-3 w-3 text-[#ef4444]" />
                    )}
                    {param.trend === 'stable' && (
                      <ArrowRight className="h-3 w-3 text-[#64748b] opacity-50" />
                    )}
                  </div>
                  {/* Sparkline mini-bar chart */}
                  <div className="mt-2 flex items-end justify-center gap-[2px] h-5">
                    {param.history.map((val, j) => {
                      const normalizedHeight = ((val - sparkMin) / sparkRange) * 100
                      const height = Math.max(15, Math.min(100, normalizedHeight))
                      return (
                        <div
                          key={j}
                          className="w-1.5 rounded-sm transition-all duration-300"
                          style={{
                            height: `${height}%`,
                            backgroundColor: j === param.history.length - 1 ? param.color : `${param.color}40`,
                            opacity: j === param.history.length - 1 ? 1 : 0.6,
                          }}
                        />
                      )
                    })}
                  </div>
                  {/* Main progress bar */}
                  <div className="mt-1.5 w-full h-1 bg-[#1e2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${param.percent}%`, backgroundColor: param.color, opacity: 0.7 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom row: Recent vehicles + Active Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent vehicles */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Car className="h-4 w-4 text-[#00d4ff]" />
                Recent Vehicles
              </h3>
              <button
                onClick={() => setActiveView('fleet')}
                className="flex items-center gap-1 text-[10px] text-[#00d4ff] hover:text-[#00bcd4] transition-colors"
              >
                Fleet <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { name: '2024 VW Golf GTI', vin: 'WVWZZZ1KZPW000001', status: 'Healthy', color: '#10b981', score: 92 },
                { name: '2023 Audi A4 B10', vin: 'WAUZZZ8V7NA000002', status: 'Warning', color: '#f59e0b', score: 74 },
                { name: '2025 Skoda Octavia', vin: 'TMBAG9NE5N000003', status: 'Healthy', color: '#10b981', score: 88 },
                { name: '2024 BMW 330e', vin: 'WBA8E9C50N000004', status: 'Critical', color: '#ef4444', score: 45 },
              ].map((vehicle, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${vehicle.color}15` }}>
                      <Car className="h-4 w-4" style={{ color: vehicle.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#e2e8f0]">{vehicle.name}</div>
                      <div className="text-[10px] text-[#475569] font-mono">{vehicle.vin}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12">
                      <div className="w-full h-1 bg-[#1e2a3a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${vehicle.score}%`, backgroundColor: vehicle.color }}
                        />
                      </div>
                      <div className="text-[9px] text-[#475569] text-right mt-0.5">{vehicle.score}%</div>
                    </div>
                    <Badge
                      className="text-[10px] border-0"
                      style={{
                        color: vehicle.color,
                        backgroundColor: `${vehicle.color}20`,
                      }}
                    >
                      {vehicle.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                Active Alerts
              </h3>
              <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">
                {activeDtcCount} Active
              </Badge>
            </div>
            <div className="space-y-2">
              {[
                {
                  title: 'Catalytic Converter Efficiency',
                  code: 'P0420',
                  severity: 'CRITICAL',
                  color: '#ef4444',
                  time: '2h ago',
                  icon: XCircle,
                },
                {
                  title: 'System Too Lean (Bank 1)',
                  code: 'P0171',
                  severity: 'WARNING',
                  color: '#f59e0b',
                  time: '5h ago',
                  icon: AlertTriangle,
                },
                {
                  title: 'Wheel Speed Sensor (Left Front)',
                  code: 'C0035',
                  severity: 'WARNING',
                  color: '#f59e0b',
                  time: '1d ago',
                  icon: AlertTriangle,
                },
                {
                  title: 'Battery Voltage Normal',
                  code: 'SYS',
                  severity: 'OK',
                  color: '#10b981',
                  time: 'Just now',
                  icon: CheckCircle2,
                },
              ].map((alert, i) => {
                const Icon = alert.icon
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${alert.color}15` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: alert.color }} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#e2e8f0]">{alert.title}</div>
                        <div className="text-[10px] text-[#475569] font-mono">{alert.code}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#475569]">{alert.time}</span>
                      <Badge
                        className="text-[9px] border-0 h-5"
                        style={{
                          color: alert.color,
                          backgroundColor: `${alert.color}20`,
                        }}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => setActiveView('ai')}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[11px] text-[#8b5cf6] hover:bg-[#8b5cf6]/20 transition-all"
            >
              <Zap className="h-3 w-3" />
              Run AI Analysis on All Alerts
            </button>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00d4ff]" />
              Recent Activity
            </h3>
            <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
              {activityEvents.length} events
            </Badge>
          </div>
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[#1e2a3a]" />
            <div className="space-y-3">
              {activityEvents.map((event, i) => (
                <div key={i} className="relative flex items-start gap-4 pl-6">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-0 top-1.5 w-[14px] h-[14px] rounded-full border-2 z-10 flex items-center justify-center"
                    style={{
                      borderColor: event.color,
                      backgroundColor: `${event.color}30`,
                    }}
                  >
                    <div
                      className="w-[5px] h-[5px] rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  </div>
                  {/* Event card */}
                  <div className="flex-1 flex items-center justify-between p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] text-[#e2e8f0] truncate">{event.message}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[9px] text-[#475569] whitespace-nowrap">{event.time}</span>
                      <Badge
                        className="text-[8px] border-0 h-4 px-1.5 whitespace-nowrap"
                        style={{
                          color: event.color,
                          backgroundColor: `${event.color}20`,
                        }}
                      >
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1e2a3a] border border-[#2d3f55] text-[11px] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#3d5070] transition-all"
          >
            <Clock className="h-3 w-3" />
            View Full Log
          </button>
        </div>

        {/* Service & Maintenance Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming Maintenance */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#f59e0b]" />
                Upcoming Maintenance
              </h3>
              <button
                onClick={() => setActiveView('service')}
                className="flex items-center gap-1 text-[10px] text-[#00d4ff] hover:text-[#00bcd4] transition-colors"
              >
                Service History <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Oil Change', vehicle: 'BMW 3 Series', due: 'In 5 days', urgent: true, cost: '€120' },
                { name: 'Brake Replacement', vehicle: 'Mercedes C-Class', due: 'In 1 week', urgent: true, cost: '€450' },
                { name: 'Tire Rotation', vehicle: 'Audi A4', due: 'In 2 weeks', urgent: false, cost: '€60' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.urgent ? 'bg-[#ef4444] animate-pulse' : 'bg-[#64748b]'}`} />
                    <div>
                      <div className="text-xs font-medium text-[#e2e8f0]">{item.name}</div>
                      <div className="text-[10px] text-[#475569]">{item.vehicle} • {item.cost}</div>
                    </div>
                  </div>
                  <Badge
                    className="text-[9px] border-0"
                    style={{
                      color: item.urgent ? '#ef4444' : '#64748b',
                      backgroundColor: item.urgent ? '#ef444420' : '#64748b20',
                    }}
                  >
                    {item.due}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* ECU Module Overview */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#8b5cf6]" />
                ECU Module Overview
              </h3>
              <button
                onClick={() => setActiveView('network-analysis')}
                className="flex items-center gap-1 text-[10px] text-[#00d4ff] hover:text-[#00bcd4] transition-colors"
              >
                Network <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Engine (ECM)', status: 'Active', color: '#10b981' },
                { name: 'Transmission (TCM)', status: 'Active', color: '#10b981' },
                { name: 'ABS', status: 'Active', color: '#10b981' },
                { name: 'Airbag (SRS)', status: 'Standby', color: '#f59e0b' },
                { name: 'Body (BCM)', status: 'Active', color: '#10b981' },
                { name: 'Instrument Cluster', status: 'Active', color: '#10b981' },
                { name: 'Climate Control', status: 'Standby', color: '#f59e0b' },
                { name: 'ADAS', status: 'Error', color: '#ef4444' },
              ].map((module, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]"
                >
                  <span className="text-[11px] text-[#94a3b8]">{module.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: module.color }} />
                    <span className="text-[9px]" style={{ color: module.color }}>{module.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
