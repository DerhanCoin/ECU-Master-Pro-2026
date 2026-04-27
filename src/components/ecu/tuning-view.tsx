'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Settings,
  Gauge,
  Flame,
  Zap,
  Shield,
  Car,
  Clock,
  Save,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Download,
  Upload,
  Lock,
  Eye,
  Thermometer,
  Activity,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface TuneMode {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  desc: string
}

const tuneModes: TuneMode[] = [
  { id: 'economy', label: 'Economy', icon: <TrendingUp className="h-4 w-4" />, color: '#10b981', desc: 'Fuel-optimized mapping' },
  { id: 'sport', label: 'Sport', icon: <Zap className="h-4 w-4" />, color: '#00d4ff', desc: 'Balanced performance' },
  { id: 'race', label: 'Race', icon: <Flame className="h-4 w-4" />, color: '#ef4444', desc: 'Maximum output' },
  { id: 'valet', label: 'Valet', icon: <Car className="h-4 w-4" />, color: '#f59e0b', desc: 'Restricted power' },
  { id: 'antitheft', label: 'Anti-Theft', icon: <Lock className="h-4 w-4" />, color: '#8b5cf6', desc: 'Immobilizer active' },
]

interface TuneParameter {
  id: string
  label: string
  unit: string
  stock: number
  tuned: number
  min: number
  max: number
  step: number
  icon: React.ReactNode
  warning?: string
}

const tuneParameters: TuneParameter[] = [
  { id: 'boost', label: 'Boost Pressure', unit: 'bar', stock: 1.0, tuned: 1.35, min: 0.5, max: 2.5, step: 0.05, icon: <Gauge className="h-3.5 w-3.5" />, warning: 'Exceeding 1.8 bar may damage turbocharger' },
  { id: 'fuel', label: 'Fuel Injection', unit: 'ms', stock: 3.2, tuned: 3.8, min: 1.0, max: 8.0, step: 0.1, icon: <Zap className="h-3.5 w-3.5" />, warning: 'Lean conditions may cause detonation' },
  { id: 'ignition', label: 'Ignition Timing', unit: '°BTDC', stock: 22, tuned: 26, min: 10, max: 35, step: 1, icon: <Flame className="h-3.5 w-3.5" />, warning: 'Advanced timing increases knock risk' },
  { id: 'revlimiter', label: 'Rev Limiter', unit: 'RPM', stock: 6800, tuned: 7200, min: 5500, max: 8000, step: 100, icon: <Activity className="h-3.5 w-3.5" />, warning: 'Exceeding mechanical limits may cause engine failure' },
  { id: 'speedlimiter', label: 'Speed Limiter', unit: 'km/h', stock: 250, tuned: 280, min: 180, max: 350, step: 10, icon: <Car className="h-3.5 w-3.5" /> },
  { id: 'throttle', label: 'Throttle Response', unit: '%', stock: 65, tuned: 85, min: 20, max: 100, step: 5, icon: <Gauge className="h-3.5 w-3.5" /> },
]

const revisionHistory = [
  { version: 'v3.2.1', date: '2026-04-25', author: 'M. Weber', mode: 'Race', changes: 'Boost increased to 1.35 bar, timing +2°' },
  { version: 'v3.2.0', date: '2026-04-18', author: 'M. Weber', mode: 'Sport', changes: 'Throttle response optimized, fuel map refined' },
  { version: 'v3.1.4', date: '2026-04-10', author: 'J. Schmidt', mode: 'Economy', changes: 'EGR mapping update, DPF regen cycle adjusted' },
  { version: 'v3.1.3', date: '2026-03-28', author: 'M. Weber', mode: 'Sport', changes: 'Cold start enrichment correction' },
  { version: 'v3.1.2', date: '2026-03-15', author: 'J. Schmidt', mode: 'Economy', changes: 'Initial economy tune baseline' },
]

export function TuningView() {
  const [activeMode, setActiveMode] = useState('sport')
  const [paramValues, setParamValues] = useState<Record<string, number>>(
    Object.fromEntries(tuneParameters.map(p => [p.id, p.tuned]))
  )
  const [livePreview, setLivePreview] = useState<Record<string, number>>(
    Object.fromEntries(tuneParameters.map(p => [p.id, p.tuned]))
  )

  // Simulate live parameter preview fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePreview(prev => {
        const next = { ...prev }
        next.boost = +(paramValues.boost + (Math.random() * 0.06 - 0.03)).toFixed(2)
        next.fuel = +(paramValues.fuel + (Math.random() * 0.2 - 0.1)).toFixed(1)
        next.ignition = Math.round(paramValues.ignition + (Math.random() * 2 - 1))
        next.revlimiter = paramValues.revlimiter
        next.speedlimiter = paramValues.speedlimiter
        next.throttle = Math.round(paramValues.throttle + (Math.random() * 4 - 2))
        return next
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [paramValues])

  const handleParamChange = (id: string, delta: number) => {
    const param = tuneParameters.find(p => p.id === id)
    if (!param) return
    setParamValues(prev => ({
      ...prev,
      [id]: Math.max(param.min, Math.min(param.max, prev[id] + delta)),
    }))
  }

  // Power & Torque data
  const stockPower = 245
  const tunedPower = 312
  const stockTorque = 370
  const tunedTorque = 445

  const activeModeData = tuneModes.find(m => m.id === activeMode)!

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">ECU Tuning</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
              PRO
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">Engine tuning and remapping interface</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs bg-[#151d2b] text-[#94a3b8] border border-[#1e2a3a] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5">
            <Upload className="h-3 w-3" />
            Restore
          </Button>
          <Button size="sm" className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5">
            <Save className="h-3 w-3" />
            Save Tune
          </Button>
        </div>
      </div>

      {/* Tuning Mode Selector */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00d4ff]" />
            Tuning Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {tuneModes.map(mode => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  activeMode === mode.id
                    ? 'border-[#00d4ff]/50 bg-[#00d4ff]/10'
                    : 'border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: mode.color }}>{mode.icon}</span>
                  <span className={`text-xs font-semibold ${activeMode === mode.id ? 'text-[#e2e8f0]' : 'text-[#94a3b8]'}`}>
                    {mode.label}
                  </span>
                </div>
                <p className="text-[10px] text-[#475569]">{mode.desc}</p>
                {activeMode === mode.id && (
                  <div className="mt-2 h-0.5 rounded-full" style={{ backgroundColor: mode.color }} />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Tune Profile */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Car className="h-4 w-4 text-[#8b5cf6]" />
            Current Tune Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-[#475569] mb-1">Version</div>
              <div className="text-sm font-mono font-bold text-[#e2e8f0]">v3.2.1</div>
            </div>
            <div>
              <div className="text-[10px] text-[#475569] mb-1">Last Flashed</div>
              <div className="text-sm text-[#e2e8f0]">2026-04-25</div>
            </div>
            <div>
              <div className="text-[10px] text-[#475569] mb-1">Author</div>
              <div className="text-sm text-[#e2e8f0]">M. Weber</div>
            </div>
            <div>
              <div className="text-[10px] text-[#475569] mb-1">Active Mode</div>
              <Badge className="text-[10px]" style={{ backgroundColor: `${activeModeData.color}20`, color: activeModeData.color, border: `1px solid ${activeModeData.color}30` }}>
                {activeModeData.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Warnings */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30">
        <Shield className="h-4 w-4 text-[#ef4444] shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-[#ef4444] mb-1">Safety Limits Active</div>
          <p className="text-[11px] text-[#94a3b8]">
            Hardware protection enabled. Boost capped at 2.2 bar, RPM limited to 7,800. Knock detection active with 3° retard authority.
            Tune changes require ECU restart to take effect.
          </p>
        </div>
      </div>

      {/* Parameter Adjustments */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#00d4ff]" />
              Parameter Adjustments
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] text-[#64748b] hover:text-[#e2e8f0] gap-1">
                <RotateCcw className="h-3 w-3" />
                Reset All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tuneParameters.map(param => {
            const currentVal = paramValues[param.id]
            const liveVal = livePreview[param.id]
            const percent = ((currentVal - param.min) / (param.max - param.min)) * 100
            const stockPercent = ((param.stock - param.min) / (param.max - param.min)) * 100
            const isModified = currentVal !== param.tuned

            return (
              <div key={param.id} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748b]">{param.icon}</span>
                    <span className="text-xs font-medium text-[#e2e8f0]">{param.label}</span>
                    {isModified && (
                      <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[8px] h-4">
                        MODIFIED
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#475569]">
                      Stock: <span className="font-mono text-[#64748b]">{param.stock}{param.unit}</span>
                    </span>
                    <span className="text-[10px] text-[#475569]">→</span>
                    <span className="text-xs font-mono font-bold text-[#00d4ff]">
                      {liveVal !== undefined ? (param.step < 1 ? liveVal.toFixed(param.step < 0.1 ? 2 : 1) : liveVal) : currentVal}{param.unit}
                    </span>
                  </div>
                </div>

                {/* Slider bar with stock marker */}
                <div className="relative mb-2">
                  <div className="w-full h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00d4ff]/40 to-[#00d4ff] rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {/* Stock marker */}
                  <div
                    className="absolute top-0 h-2 w-0.5 bg-[#f59e0b]"
                    style={{ left: `${stockPercent}%` }}
                    title={`Stock: ${param.stock}${param.unit}`}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]"
                      onClick={() => handleParamChange(param.id, -param.step)}
                    >
                      -
                    </Button>
                    <input
                      type="number"
                      value={currentVal}
                      onChange={e => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val)) {
                          setParamValues(prev => ({
                            ...prev,
                            [param.id]: Math.max(param.min, Math.min(param.max, val)),
                          }))
                        }
                      }}
                      className="w-20 h-6 text-center text-xs font-mono bg-[#1e2a3a] border border-[#2d3f55] rounded text-[#e2e8f0] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]"
                      onClick={() => handleParamChange(param.id, param.step)}
                    >
                      +
                    </Button>
                  </div>
                  <span className="text-[10px] text-[#475569] font-mono">
                    {param.min} – {param.max} {param.unit}
                  </span>
                </div>

                {/* Warning */}
                {param.warning && currentVal > param.stock * 1.15 && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#f59e0b]">
                    <AlertTriangle className="h-3 w-3" />
                    {param.warning}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Power & Torque Comparison */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#10b981]" />
            Power & Torque Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Power Chart */}
            <div>
              <div className="text-xs text-[#64748b] mb-3 flex items-center justify-between">
                <span>Power Output (HP)</span>
                <span className="text-[#10b981] font-mono font-bold">+{tunedPower - stockPower} HP</span>
              </div>
              <div className="flex items-end gap-4 h-32">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-24 gap-2">
                    <div className="w-10 rounded-t-md bg-[#1e2a3a] transition-all" style={{ height: `${(stockPower / 400) * 100}%` }}>
                      <div className="w-full h-full bg-[#475569]/40 rounded-t-md flex items-end justify-center pb-1">
                        <span className="text-[10px] font-mono font-bold text-[#94a3b8]">{stockPower}</span>
                      </div>
                    </div>
                    <div className="w-10 rounded-t-md bg-[#00d4ff]/30 transition-all" style={{ height: `${(tunedPower / 400) * 100}%` }}>
                      <div className="w-full h-full bg-[#00d4ff]/60 rounded-t-md flex items-end justify-center pb-1">
                        <span className="text-[10px] font-mono font-bold text-[#00d4ff]">{tunedPower}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#475569]">Stock → Tuned</span>
                </div>
              </div>
            </div>

            {/* Torque Chart */}
            <div>
              <div className="text-xs text-[#64748b] mb-3 flex items-center justify-between">
                <span>Torque Output (Nm)</span>
                <span className="text-[#8b5cf6] font-mono font-bold">+{tunedTorque - stockTorque} Nm</span>
              </div>
              <div className="flex items-end gap-4 h-32">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-24 gap-2">
                    <div className="w-10 rounded-t-md bg-[#1e2a3a] transition-all" style={{ height: `${(stockTorque / 500) * 100}%` }}>
                      <div className="w-full h-full bg-[#475569]/40 rounded-t-md flex items-end justify-center pb-1">
                        <span className="text-[10px] font-mono font-bold text-[#94a3b8]">{stockTorque}</span>
                      </div>
                    </div>
                    <div className="w-10 rounded-t-md bg-[#8b5cf6]/30 transition-all" style={{ height: `${(tunedTorque / 500) * 100}%` }}>
                      <div className="w-full h-full bg-[#8b5cf6]/60 rounded-t-md flex items-end justify-center pb-1">
                        <span className="text-[10px] font-mono font-bold text-[#8b5cf6]">{tunedTorque}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#475569]">Stock → Tuned</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Parameter Preview */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#10b981]" />
            Live Preview
            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px] gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              SIMULATED
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {tuneParameters.map(param => {
              const val = livePreview[param.id]
              return (
                <div key={param.id} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[#475569] mb-1">{param.label}</div>
                  <div className="text-lg font-bold font-mono text-[#00d4ff]">
                    {param.step < 1 ? val?.toFixed(param.step < 0.1 ? 2 : 1) : val}
                  </div>
                  <div className="text-[10px] text-[#475569]">{param.unit}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tune Revision History */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#f59e0b]" />
            Tune Revision History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {revisionHistory.map((rev, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1e2a3a] flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-[#00d4ff]">{rev.version}</span>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">{rev.changes}</div>
                    <div className="text-[10px] text-[#475569]">{rev.author} · {rev.date}</div>
                  </div>
                </div>
                <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
                  {rev.mode}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup / Restore Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/15 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-[#10b981]" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#e2e8f0] mb-1">Backup Current Tune</div>
              <p className="text-[10px] text-[#475569]">Save a snapshot of the current ECU calibration</p>
            </div>
            <Button size="sm" className="h-8 text-xs bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/30 gap-1">
              <Download className="h-3 w-3" />
              Backup
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/15 flex items-center justify-center shrink-0">
              <Upload className="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#e2e8f0] mb-1">Restore from Backup</div>
              <p className="text-[10px] text-[#475569]">Flash a previously saved tune file to the ECU</p>
            </div>
            <Button size="sm" className="h-8 text-xs bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/30 gap-1">
              <Upload className="h-3 w-3" />
              Restore
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
