'use client'

import { MetricCard } from './metric-card'
import { Button } from '@/components/ui/badge'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/app-store'
import {
  Heart,
  Wifi,
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
  Clock,
  ArrowRight,
  Shield,
  Battery,
  Thermometer,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'

export function DashboardView() {
  const { setActiveView } = useAppStore()
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [healthScore, setHealthScore] = useState(87)

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

  const handleQuickScan = () => {
    setScanning(true)
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setScanning(false)
          return 100
        }
        return prev + Math.random() * 12 + 3
      })
    }, 300)
  }

  const healthColor = healthScore >= 85 ? '#10b981' : healthScore >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Dashboard</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            value={3}
            subtitle="Diagnostic trouble codes"
            icon={<AlertTriangle className="h-4 w-4" />}
            color="#f59e0b"
            glowColor="yellow"
          />
          <MetricCard
            title="ECU Modules"
            value={12}
            subtitle="Connected modules"
            icon={<Cpu className="h-4 w-4" />}
            color="#8b5cf6"
            glowColor="purple"
          />
          <MetricCard
            title="Data Streams"
            value={48}
            subtitle="Active parameters"
            icon={<Activity className="h-4 w-4" />}
            color="#00d4ff"
            glowColor="teal"
          />
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
                { label: 'Full Scan', icon: Activity, color: '#00d4ff', view: 'dtc-scan' as const },
                { label: 'DTC Check', icon: AlertTriangle, color: '#f59e0b', view: 'dtc-scan' as const },
                { label: 'Live Data', icon: Gauge, color: '#10b981', view: 'live-data' as const },
                { label: 'ECU Info', icon: Cpu, color: '#8b5cf6', view: 'performance' as const },
                { label: 'AI Analysis', icon: Zap, color: '#8b5cf6', view: 'ai-diagnostics' as const },
                { label: 'CAN Bus', icon: BusFront, color: '#00d4ff', view: 'canbus' as const },
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

        {/* Live Engine Parameters */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#00d4ff]" />
              Live Engine Parameters
            </h3>
            <button
              onClick={() => setActiveView('live-data')}
              className="flex items-center gap-1 text-[10px] text-[#00d4ff] hover:text-[#00bcd4] transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'RPM', value: '3,240', unit: 'rpm', color: '#00d4ff', percent: 48 },
              { label: 'Speed', value: '87', unit: 'km/h', color: '#10b981', percent: 35 },
              { label: 'Coolant', value: '89', unit: '°C', color: '#f59e0b', percent: 59 },
              { label: 'Battery', value: '14.2', unit: 'V', color: '#10b981', percent: 95 },
              { label: 'Throttle', value: '34', unit: '%', color: '#8b5cf6', percent: 34 },
              { label: 'Boost', value: '1.2', unit: 'bar', color: '#00d4ff', percent: 60 },
            ].map((param, i) => (
              <div key={i} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#64748b] mb-1">{param.label}</div>
                <div className="text-lg font-bold font-mono" style={{ color: param.color }}>
                  {param.value}
                  <span className="text-[10px] text-[#475569] ml-0.5">{param.unit}</span>
                </div>
                <div className="mt-2 w-full h-1 bg-[#1e2a3a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${param.percent}%`, backgroundColor: param.color, opacity: 0.7 }}
                  />
                </div>
              </div>
            ))}
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
                3 Active
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
              onClick={() => setActiveView('ai-diagnostics')}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[11px] text-[#8b5cf6] hover:bg-[#8b5cf6]/20 transition-all"
            >
              <Zap className="h-3 w-3" />
              Run AI Analysis on All Alerts
            </button>
          </div>
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
