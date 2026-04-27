'use client'

import { useState } from 'react'
import { MetricCard } from './metric-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Gauge,
  Zap,
  ArrowUp,
  TrendingUp,
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Flame,
  Thermometer,
  Wind,
  Timer,
  Cpu,
} from 'lucide-react'

// ─── Data Types ─────────────────────────────────────────────────────────────

interface TuningProfile {
  id: string
  name: string
  description: string
  powerGain: number
  riskLevel: 'Low' | 'Medium' | 'High'
  isActive: boolean
}

interface EngineParameter {
  label: string
  value: string
  max: string
  percent: number
  unit: string
  icon: React.ReactNode
  status: 'green' | 'yellow' | 'red'
}

interface ECUParamRow {
  parameter: string
  current: string
  stock: string
  modified: string
  status: 'Modified' | 'Stock' | 'Warning'
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PerformanceView() {
  const [activeProfile, setActiveProfile] = useState<string>('stock')
  const [isReading, setIsReading] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Tuning profiles
  const profiles: TuningProfile[] = [
    {
      id: 'stock',
      name: 'Stock (OEM)',
      description: 'Original factory calibration with manufacturer warranty compliance.',
      powerGain: 0,
      riskLevel: 'Low',
      isActive: activeProfile === 'stock',
    },
    {
      id: 'stage1',
      name: 'Stage 1 (Street)',
      description: 'Optimized for daily driving with improved throttle response and mid-range power.',
      powerGain: 45,
      riskLevel: 'Medium',
      isActive: activeProfile === 'stage1',
    },
    {
      id: 'stage2',
      name: 'Stage 2 (Race)',
      description: 'Maximum performance calibration for track use. Requires supporting hardware mods.',
      powerGain: 82,
      riskLevel: 'High',
      isActive: activeProfile === 'stage2',
    },
  ]

  // Live engine parameters
  const engineParams: EngineParameter[] = [
    { label: 'RPM', value: '3,240', max: '6,800', percent: 47.6, unit: 'rpm', icon: <Timer className="h-4 w-4" />, status: 'green' },
    { label: 'Boost', value: '1.2', max: '2.0', percent: 60, unit: 'bar', icon: <Wind className="h-4 w-4" />, status: 'green' },
    { label: 'Air/Fuel Ratio', value: '14.7', max: '14.7:1', percent: 100, unit: ':1', icon: <Flame className="h-4 w-4" />, status: 'green' },
    { label: 'Ignition Timing', value: '18', max: '30', percent: 60, unit: '° BTDC', icon: <Zap className="h-4 w-4" />, status: 'green' },
    { label: 'Intake Temp', value: '42', max: '80', percent: 52.5, unit: '°C', icon: <Thermometer className="h-4 w-4" />, status: 'yellow' },
    { label: 'Throttle Position', value: '34', max: '100', percent: 34, unit: '%', icon: <Gauge className="h-4 w-4" />, status: 'green' },
  ]

  // Power band data (HP at each RPM range)
  const powerBandData = [
    { rpm: '1000', hp: 45 },
    { rpm: '2000', hp: 98 },
    { rpm: '3000', hp: 165 },
    { rpm: '4000', hp: 215 },
    { rpm: '5000', hp: 247 },
    { rpm: '6000', hp: 230 },
    { rpm: '7000', hp: 195 },
  ]

  // Torque curve data (Nm at each RPM range)
  const torqueCurveData = [
    { rpm: '1000', nm: 180 },
    { rpm: '2000', nm: 310 },
    { rpm: '3000', nm: 385 },
    { rpm: '4000', nm: 370 },
    { rpm: '5000', nm: 340 },
    { rpm: '6000', nm: 290 },
    { rpm: '7000', nm: 220 },
  ]

  // ECU Parameters table
  const ecuParams: ECUParamRow[] = [
    { parameter: 'Rev Limiter', current: '6,800 RPM', stock: '6,500 RPM', modified: '6,800 RPM', status: 'Modified' },
    { parameter: 'Boost Target', current: '1.2 bar', stock: '0.9 bar', modified: '1.2 bar', status: 'Modified' },
    { parameter: 'Fuel Injection', current: 'Stage 1', stock: 'OEM', modified: 'Stage 1', status: 'Modified' },
    { parameter: 'Ignition Advance', current: '18° BTDC', stock: '15° BTDC', modified: '18° BTDC', status: 'Modified' },
    { parameter: 'Idle Speed', current: '750 RPM', stock: '750 RPM', modified: '750 RPM', status: 'Stock' },
    { parameter: 'Speed Limiter', current: '255 km/h', stock: '250 km/h', modified: '255 km/h', status: 'Warning' },
  ]

  // Handlers
  const handleReadECU = () => {
    setIsReading(true)
    setTimeout(() => setIsReading(false), 2000)
  }

  const handleApplyProfile = (profileId: string) => {
    setActiveProfile(profileId)
  }

  const handleSaveToECU = () => {
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 2500)
  }

  const handleResetToStock = () => {
    setShowResetConfirm(true)
    setTimeout(() => {
      setActiveProfile('stock')
      setShowResetConfirm(false)
    }, 1500)
  }

  // Helper: status color for engine params
  const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return '#10b981'
      case 'yellow': return '#f59e0b'
      case 'red': return '#ef4444'
    }
  }

  // Helper: progress bar gradient
  const getProgressGradient = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'from-[#00d4ff] to-[#10b981]'
      case 'yellow': return 'from-[#f59e0b] to-[#f97316]'
      case 'red': return 'from-[#ef4444] to-[#dc2626]'
    }
  }

  // Helper: risk badge
  const getRiskBadge = (risk: 'Low' | 'Medium' | 'High') => {
    switch (risk) {
      case 'Low': return { color: '#10b981', bg: '#10b98120' }
      case 'Medium': return { color: '#f59e0b', bg: '#f59e0b20' }
      case 'High': return { color: '#ef4444', bg: '#ef444420' }
    }
  }

  // Helper: ECU param status badge
  const getECUStatusBadge = (status: 'Modified' | 'Stock' | 'Warning') => {
    switch (status) {
      case 'Modified': return { color: '#00d4ff', bg: '#00d4ff20' }
      case 'Stock': return { color: '#64748b', bg: '#64748b20' }
      case 'Warning': return { color: '#f59e0b', bg: '#f59e0b20' }
    }
  }

  const maxHp = Math.max(...powerBandData.map(d => d.hp))
  const maxNm = Math.max(...torqueCurveData.map(d => d.nm))

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">

        {/* ─── 1. Page Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Performance Tuning</h1>
            </div>
            <p className="text-xs text-[#64748b]">
              Engine performance analysis and ECU tuning management
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleReadECU}
            disabled={isReading}
            className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
          >
            {isReading ? (
              <>
                <Cpu className="h-3 w-3 animate-spin" />
                Reading...
              </>
            ) : (
              <>
                <Cpu className="h-3 w-3" />
                Read ECU
              </>
            )}
          </Button>
        </div>

        {/* ─── 2. Performance Metrics Row ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Horsepower"
            value="247 HP"
            subtitle="Current output"
            icon={<Zap className="h-4 w-4" />}
            color="#00d4ff"
            glowColor="teal"
          />
          <MetricCard
            title="Torque"
            value="385 Nm"
            subtitle="Peak torque"
            icon={<ArrowUp className="h-4 w-4" />}
            color="#10b981"
            glowColor="green"
          />
          <MetricCard
            title="Boost Pressure"
            value="1.2 bar"
            subtitle="Current boost"
            icon={<Wind className="h-4 w-4" />}
            color="#8b5cf6"
            glowColor="purple"
          />
          <MetricCard
            title="RPM Limit"
            value="6,800"
            subtitle="Rev limiter"
            icon={<Timer className="h-4 w-4" />}
            color="#f59e0b"
            glowColor="yellow"
          />
        </div>

        {/* ─── 3. Tuning Profiles Section ─────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Tuning Profiles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profiles.map((profile) => {
              const risk = getRiskBadge(profile.riskLevel)
              return (
                <div
                  key={profile.id}
                  className={`bg-[#151d2b] rounded-lg p-4 transition-all duration-200 ${
                    profile.isActive
                      ? 'border-2 border-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                      : 'border border-[#1e2a3a] hover:border-[#2d3f55]'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#e2e8f0]">{profile.name}</h3>
                    {profile.isActive && (
                      <Badge className="text-[10px] border-0 bg-[#00d4ff]/20 text-[#00d4ff] font-bold px-2 py-0.5 h-5">
                        ACTIVE
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-[#94a3b8] mb-4 leading-relaxed">
                    {profile.description}
                  </p>

                  {/* Power gain */}
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-3.5 w-3.5 text-[#00d4ff]" />
                    <span className="text-xs text-[#94a3b8]">Power Gain:</span>
                    <span className={`text-sm font-bold ${profile.powerGain > 0 ? 'text-[#00d4ff]' : 'text-[#64748b]'}`}>
                      +{profile.powerGain} HP
                    </span>
                  </div>

                  {/* Risk level */}
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-3.5 w-3.5" style={{ color: risk.color }} />
                    <span className="text-xs text-[#94a3b8]">Risk Level:</span>
                    <Badge
                      className="text-[10px] border-0 font-semibold px-1.5 py-0 h-4"
                      style={{ color: risk.color, backgroundColor: risk.bg }}
                    >
                      {profile.riskLevel}
                    </Badge>
                  </div>

                  {/* Apply / Active button */}
                  <Button
                    size="sm"
                    onClick={() => handleApplyProfile(profile.id)}
                    disabled={profile.isActive}
                    className={`w-full h-8 text-xs font-semibold gap-1.5 ${
                      profile.isActive
                        ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/15 cursor-default'
                        : 'bg-[#0f1923] text-[#94a3b8] border border-[#1e2a3a] hover:text-[#e2e8f0] hover:border-[#2d3f55]'
                    }`}
                  >
                    {profile.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Active Profile
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3" />
                        Apply
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── 4. Live Engine Parameters ──────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Live Engine Parameters</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {engineParams.map((param, idx) => {
              const statusColor = getStatusColor(param.status)
              const gradient = getProgressGradient(param.status)
              return (
                <div
                  key={idx}
                  className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-all"
                >
                  {/* Label row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ color: statusColor }}>{param.icon}</span>
                      <span className="text-xs text-[#94a3b8] font-medium">{param.label}</span>
                    </div>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}40` }}
                    />
                  </div>

                  {/* Value display */}
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-bold text-[#e2e8f0] tabular-nums">
                      {param.value}
                    </span>
                    <span className="text-xs text-[#64748b]">{param.unit}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1.5">
                    <div className="h-2 bg-[#0f1923] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                        style={{ width: `${Math.min(param.percent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Range labels */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#475569]">0</span>
                    <span className="text-[10px] text-[#475569]">
                      {param.max}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── 5. Performance Graphs ──────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Performance Graphs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Power Band */}
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-[#00d4ff]" />
                Power Band (HP)
              </h3>
              <div className="flex items-end gap-2 h-40">
                {powerBandData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[#00d4ff] font-medium tabular-nums">
                      {d.hp}
                    </span>
                    <div className="w-full relative" style={{ height: '120px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-sm bg-gradient-to-t from-[#00d4ff] to-[#00d4ff]/40 transition-all duration-500"
                        style={{ height: `${(d.hp / maxHp) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-[#475569]">{d.rpm}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Torque Curve */}
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
                <ArrowUp className="h-3.5 w-3.5 text-[#10b981]" />
                Torque Curve (Nm)
              </h3>
              <div className="flex items-end gap-2 h-40">
                {torqueCurveData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[#10b981] font-medium tabular-nums">
                      {d.nm}
                    </span>
                    <div className="w-full relative" style={{ height: '120px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-sm bg-gradient-to-t from-[#10b981] to-[#10b981]/40 transition-all duration-500"
                        style={{ height: `${(d.nm / maxNm) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-[#475569]">{d.rpm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6. ECU Parameters Table ────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">ECU Parameters</h2>
          </div>
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Parameter</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Current</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Stock</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Modified</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ecuParams.map((row, i) => {
                    const statusStyle = getECUStatusBadge(row.status)
                    return (
                      <tr
                        key={i}
                        className="border-b border-[#1e2a3a]/50 hover:bg-[#1e2a3a]/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-[#e2e8f0] font-medium">{row.parameter}</td>
                        <td className="px-4 py-3 text-[#94a3b8] tabular-nums">{row.current}</td>
                        <td className="px-4 py-3 text-[#64748b] tabular-nums">{row.stock}</td>
                        <td className="px-4 py-3 text-[#00d4ff] tabular-nums">{row.modified}</td>
                        <td className="px-4 py-3">
                          <Badge
                            className="text-[10px] border-0 font-semibold px-2 py-0 h-5"
                            style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
                          >
                            {row.status === 'Warning' && <AlertTriangle className="h-2.5 w-2.5 mr-1 inline" />}
                            {row.status === 'Modified' && <CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" />}
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#1e2a3a] bg-[#0f1923]/50">
              <div className="text-[10px] text-[#475569]">
                {ecuParams.filter(p => p.status === 'Modified').length} of {ecuParams.length} parameters modified
              </div>
              <div className="flex items-center gap-3">
                {showResetConfirm ? (
                  <span className="text-[10px] text-[#f59e0b] animate-pulse">Resetting to stock...</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetToStock}
                    className="h-7 text-xs border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444]/60 gap-1.5 bg-transparent"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to Stock
                  </Button>
                )}
                {showSaveSuccess ? (
                  <span className="text-[10px] text-[#10b981] animate-pulse">Saved to ECU!</span>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSaveToECU}
                    className="h-7 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
                  >
                    <Save className="h-3 w-3" />
                    Save to ECU
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
