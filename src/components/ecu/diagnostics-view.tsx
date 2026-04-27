'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cpu,
  Search,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Car,
  Gauge,
  Shield,
  Wind,
  Settings,
  Thermometer,
  RotateCcw,
  Clock,
  ArrowRight,
  Wifi,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type SystemStatus = 'OK' | 'Warning' | 'Critical' | 'Offline'
type DTCSeverity = 'Critical' | 'Warning' | 'Info'

interface DiagnosticSystem {
  id: string
  name: string
  shortName: string
  icon: React.ElementType
  moduleCount: number
  faultCount: number
  lastScan: string
  status: SystemStatus
  color: string
}

interface ActiveDTC {
  code: string
  description: string
  severity: DTCSeverity
  module: string
  status: 'Active' | 'Pending' | 'Stored'
  timestamp: string
}

interface DiagnosticSession {
  id: string
  vehicle: string
  vin: string
  date: string
  duration: string
  dtcCount: number
  status: 'Complete' | 'Partial' | 'Failed'
}

interface LiveParameter {
  name: string
  value: number
  unit: string
  min: number
  max: number
  color: string
  icon: React.ElementType
}

// Mock data
const DIAGNOSTIC_SYSTEMS: DiagnosticSystem[] = [
  { id: 's1', name: 'Engine', shortName: 'ENG', icon: Cpu, moduleCount: 4, faultCount: 2, lastScan: '5 min ago', status: 'Critical', color: '#ef4444' },
  { id: 's2', name: 'Transmission', shortName: 'TRN', icon: Settings, moduleCount: 2, faultCount: 0, lastScan: '5 min ago', status: 'OK', color: '#10b981' },
  { id: 's3', name: 'ABS / Brakes', shortName: 'ABS', icon: Shield, moduleCount: 3, faultCount: 1, lastScan: '5 min ago', status: 'Warning', color: '#f59e0b' },
  { id: 's4', name: 'Airbag / SRS', shortName: 'SRS', icon: Wind, moduleCount: 2, faultCount: 0, lastScan: '5 min ago', status: 'OK', color: '#10b981' },
  { id: 's5', name: 'Body / Comfort', shortName: 'BDY', icon: Car, moduleCount: 5, faultCount: 1, lastScan: '5 min ago', status: 'Warning', color: '#f59e0b' },
  { id: 's6', name: 'Chassis', shortName: 'CHS', icon: Gauge, moduleCount: 3, faultCount: 0, lastScan: '5 min ago', status: 'OK', color: '#10b981' },
  { id: 's7', name: 'Network / Gateway', shortName: 'NET', icon: Wifi, moduleCount: 2, faultCount: 0, lastScan: '5 min ago', status: 'OK', color: '#10b981' },
  { id: 's8', name: 'HVAC / Climate', shortName: 'HVC', icon: Thermometer, moduleCount: 2, faultCount: 3, lastScan: '12 min ago', status: 'Critical', color: '#ef4444' },
]

const ACTIVE_DTCS: ActiveDTC[] = [
  { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'Critical', module: 'Engine', status: 'Active', timestamp: '2 min ago' },
  { code: 'P0171', description: 'System Too Lean (Bank 1)', severity: 'Warning', module: 'Engine', status: 'Active', timestamp: '15 min ago' },
  { code: 'C0035', description: 'Left Front Wheel Speed Sensor Circuit', severity: 'Warning', module: 'ABS', status: 'Pending', timestamp: '30 min ago' },
  { code: 'B1000', description: 'ECU Internal Circuit Failure', severity: 'Warning', module: 'Body', status: 'Stored', timestamp: '2 days ago' },
  { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold', severity: 'Critical', module: 'Engine', status: 'Active', timestamp: '5 min ago' },
  { code: 'B1096', description: 'HVAC Blend Door Actuator Failure', severity: 'Warning', module: 'HVAC', status: 'Active', timestamp: '8 min ago' },
  { code: 'U0140', description: 'Lost Communication With BCM', severity: 'Info', module: 'Network', status: 'Stored', timestamp: '1 week ago' },
]

const RECENT_SESSIONS: DiagnosticSession[] = [
  { id: 'rs1', vehicle: 'VW Golf GTI 2023', vin: 'WVWZZZ1KZAM000001', date: 'Today, 12:22 PM', duration: '14 min', dtcCount: 4, status: 'Complete' },
  { id: 'rs2', vehicle: 'Audi A4 B10 2024', vin: 'WAUZZZ8V5NA000002', date: 'Yesterday, 3:45 PM', duration: '22 min', dtcCount: 2, status: 'Complete' },
  { id: 'rs3', vehicle: 'BMW 330e G20 2023', vin: 'WBA5R1C50PA000003', date: 'Mar 3, 10:15 AM', duration: '8 min', dtcCount: 0, status: 'Complete' },
  { id: 'rs4', vehicle: 'Mercedes C300 W206', vin: 'W1KZF8DB3NA000004', date: 'Mar 2, 2:30 PM', duration: '5 min', dtcCount: 1, status: 'Partial' },
  { id: 'rs5', vehicle: 'Skoda Octavia 2024', vin: 'TMBAG9NE3L0000005', date: 'Mar 1, 11:00 AM', duration: '18 min', dtcCount: 3, status: 'Complete' },
]

const SEVERITY_CONFIG: Record<DTCSeverity, { color: string; badgeClass: string }> = {
  Critical: { color: '#ef4444', badgeClass: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' },
  Warning: { color: '#f59e0b', badgeClass: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' },
  Info: { color: '#00d4ff', badgeClass: 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' },
}

const STATUS_CONFIG: Record<string, { color: string; badgeClass: string }> = {
  Active: { color: '#ef4444', badgeClass: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' },
  Pending: { color: '#f59e0b', badgeClass: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' },
  Stored: { color: '#64748b', badgeClass: 'bg-[#64748b]/20 text-[#64748b] border-[#64748b]/30' },
}

export function DiagnosticsView() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanType, setScanType] = useState<string | null>(null)
  const [liveParams, setLiveParams] = useState<LiveParameter[]>([
    { name: 'Engine RPM', value: 3240, unit: 'rpm', min: 0, max: 7000, color: '#00d4ff', icon: Gauge },
    { name: 'Coolant Temp', value: 89, unit: '°C', min: 0, max: 130, color: '#f59e0b', icon: Thermometer },
    { name: 'Vehicle Speed', value: 87, unit: 'km/h', min: 0, max: 260, color: '#10b981', icon: Car },
    { name: 'Battery Voltage', value: 14.2, unit: 'V', min: 0, max: 16, color: '#8b5cf6', icon: Zap },
    { name: 'Engine Load', value: 45, unit: '%', min: 0, max: 100, color: '#00d4ff', icon: Activity },
    { name: 'Throttle Position', value: 34, unit: '%', min: 0, max: 100, color: '#f97316', icon: TrendingUp },
  ])

  // Simulate live parameter updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveParams(prev => prev.map(p => ({
        ...p,
        value: Math.round((p.value + (Math.random() - 0.5) * (p.max * 0.02)) * 10) / 10,
      })))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const handleScan = (type: string) => {
    setIsScanning(true)
    setScanType(type)
    setTimeout(() => {
      setIsScanning(false)
      setScanType(null)
    }, 3000)
  }

  const criticalCount = ACTIVE_DTCS.filter(d => d.severity === 'Critical').length
  const warningCount = ACTIVE_DTCS.filter(d => d.severity === 'Warning').length
  const infoCount = ACTIVE_DTCS.filter(d => d.severity === 'Info').length

  const healthBars = DIAGNOSTIC_SYSTEMS.map(sys => ({
    name: sys.shortName,
    health: sys.status === 'OK' ? 95 + Math.floor(Math.random() * 5) :
            sys.status === 'Warning' ? 55 + Math.floor(Math.random() * 25) :
            sys.status === 'Critical' ? 15 + Math.floor(Math.random() * 30) :
            0,
    color: sys.color,
  }))

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Diagnostics Hub</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">CENTRAL</Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Complete vehicle diagnostics dashboard with real-time monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleScan('full')}
            disabled={isScanning}
            className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
          >
            {isScanning && scanType === 'full' ? (
              <><RotateCcw className="h-3 w-3 animate-spin" />Scanning...</>
            ) : (
              <><Search className="h-3 w-3" />Full Vehicle Scan</>
            )}
          </Button>
        </div>
      </div>

      {/* Scan Progress */}
      {isScanning && (
        <Card className="bg-[#151d2b] border-[#00d4ff]/30 shadow-[0_0_12px_#00d4ff10]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#00d4ff]">
                {scanType === 'full' ? 'Full Vehicle Scan' : scanType === 'quick' ? 'Quick Scan' : 'Deep Module Scan'} in progress...
              </span>
              <span className="text-xs font-mono text-[#64748b]">Scanning modules...</span>
            </div>
            <div className="h-2 w-full bg-[#0f1923] rounded-full overflow-hidden">
              <div className="h-full bg-[#00d4ff] rounded-full animate-pulse" style={{ width: '45%', boxShadow: '0 0 8px #00d4ff40' }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Diagnostic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DIAGNOSTIC_SYSTEMS.map((system) => {
          const Icon = system.icon
          return (
            <Card
              key={system.id}
              className={cn(
                'bg-[#151d2b] border-[#1e2a3a] hover:border-[#2d3f55] transition-all duration-150 cursor-pointer group',
                system.status === 'Critical' && 'border-[#ef4444]/30 hover:border-[#ef4444]/50',
                system.status === 'Warning' && 'border-[#f59e0b]/30 hover:border-[#f59e0b]/50',
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    'h-7 w-7 rounded-md flex items-center justify-center',
                    system.status === 'OK' ? 'bg-[#10b981]/15' :
                    system.status === 'Warning' ? 'bg-[#f59e0b]/15' :
                    system.status === 'Critical' ? 'bg-[#ef4444]/15' :
                    'bg-[#64748b]/15'
                  )}>
                    <Icon className="h-3.5 w-3.5" style={{ color: system.color }} />
                  </div>
                  <span className={cn(
                    'h-2 w-2 rounded-full',
                    system.status === 'OK' ? 'bg-[#10b981] shadow-[0_0_4px_#10b981]' :
                    system.status === 'Warning' ? 'bg-[#f59e0b] shadow-[0_0_4px_#f59e0b]' :
                    system.status === 'Critical' ? 'bg-[#ef4444] shadow-[0_0_4px_#ef4444] animate-pulse' :
                    'bg-[#64748b]'
                  )} />
                </div>
                <div className="text-xs font-semibold text-[#e2e8f0] mb-0.5 group-hover:text-[#00d4ff] transition-colors">{system.name}</div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] text-[#475569]">{system.moduleCount} modules</span>
                  {system.faultCount > 0 && (
                    <Badge className="text-[8px] px-1 py-0 h-3.5 border" style={{
                      backgroundColor: `${system.color}20`,
                      color: system.color,
                      borderColor: `${system.color}30`,
                    }}>
                      {system.faultCount} fault{system.faultCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-[#475569]" />
                  <span className="text-[9px] text-[#475569]">{system.lastScan}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Health Overview + Active DTC Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Health Overview */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00d4ff]" />
              System Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthBars.map((bar) => (
              <div key={bar.name} className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-[#94a3b8] w-8 text-right">{bar.name}</span>
                <div className="flex-1 h-4 bg-[#0f1923] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${bar.health}%`,
                      backgroundColor: `${bar.color}40`,
                      boxShadow: `0 0 4px ${bar.color}20`,
                    }}
                  >
                    <span className="text-[8px] font-bold" style={{ color: bar.color }}>
                      {bar.health}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-[#1e2a3a]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[9px]">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  <span className="text-[#64748b]">OK</span>
                </div>
                <div className="flex items-center gap-1 text-[9px]">
                  <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                  <span className="text-[#64748b]">Warning</span>
                </div>
                <div className="flex items-center gap-1 text-[9px]">
                  <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                  <span className="text-[#64748b]">Critical</span>
                </div>
              </div>
              <span className="text-[9px] text-[#475569]">Average: {Math.round(healthBars.reduce((a, b) => a + b.health, 0) / healthBars.length)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Active DTC Summary */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                Active DTC Summary
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">{criticalCount} Critical</Badge>
                <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">{warningCount} Warning</Badge>
                <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">{infoCount} Info</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {ACTIVE_DTCS.map((dtc) => {
                const severityConfig = SEVERITY_CONFIG[dtc.severity]
                const statusConfig = STATUS_CONFIG[dtc.status]
                return (
                  <div
                    key={dtc.code}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[#1e2a3a] bg-[#0f1923] hover:bg-[#1e2a3a]/30 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${severityConfig.color}15` }}>
                      <span className="text-[9px] font-bold font-mono" style={{ color: severityConfig.color }}>{dtc.code.slice(0, 1)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color: severityConfig.color }}>{dtc.code}</span>
                        <Badge className={cn('text-[8px] border px-1 py-0 h-3.5', severityConfig.badgeClass)}>
                          {dtc.severity}
                        </Badge>
                        <Badge className={cn('text-[8px] border px-1 py-0 h-3.5', statusConfig.badgeClass)}>
                          {dtc.status}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-[#94a3b8] truncate">{dtc.description}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[9px] text-[#475569]">{dtc.module}</div>
                      <div className="text-[8px] text-[#475569]">{dtc.timestamp}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Real-time Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#00d4ff]" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { id: 'full', label: 'Full Vehicle Scan', desc: 'Complete scan of all systems', icon: Search, color: '#00d4ff' },
              { id: 'quick', label: 'Quick Scan', desc: 'Fast scan of critical modules', icon: Zap, color: '#10b981' },
              { id: 'deep', label: 'Module Deep Scan', desc: 'Detailed scan with freeze frames', icon: Cpu, color: '#8b5cf6' },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => handleScan(action.id)}
                disabled={isScanning}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#1e2a3a] bg-[#0f1923] hover:bg-[#1e2a3a]/50 hover:border-[#2d3f55] transition-all duration-150 group disabled:opacity-50"
              >
                <div className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${action.color}15` }}>
                  <action.icon className="h-4 w-4" style={{ color: action.color }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs font-semibold text-[#e2e8f0] group-hover:text-[#00d4ff] transition-colors">{action.label}</div>
                  <div className="text-[9px] text-[#475569]">{action.desc}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#475569] group-hover:text-[#00d4ff] flex-shrink-0 transition-colors" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Real-time Monitor */}
        <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00d4ff]" />
                Real-time Monitor
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_4px_#10b981]" />
                  <span className="text-[9px] text-[#10b981] font-medium">LIVE</span>
                </div>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {liveParams.map((param) => {
                const Icon = param.icon
                const percentage = Math.max(0, Math.min(100, ((param.value - param.min) / (param.max - param.min)) * 100))
                const statusColor = percentage > 80 ? '#ef4444' : percentage > 60 ? '#f59e0b' : param.color
                return (
                  <div key={param.name} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 hover:border-[#2d3f55] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3" style={{ color: statusColor }} />
                        <span className="text-[10px] font-medium text-[#94a3b8]">{param.name}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-lg font-bold tabular-nums" style={{ color: statusColor }}>
                        {param.value < 100 ? param.value.toFixed(1) : Math.round(param.value)}
                      </span>
                      <span className="text-[9px] text-[#64748b]">{param.unit}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1e2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: statusColor,
                          boxShadow: `0 0 4px ${statusColor}30`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[8px] text-[#475569]">{param.min} {param.unit}</span>
                      <span className="text-[8px] text-[#475569]">{param.max} {param.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Diagnostic Sessions */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00d4ff]" />
              Recent Diagnostic Sessions
            </CardTitle>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">{RECENT_SESSIONS.length} sessions</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
            {RECENT_SESSIONS.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#1e2a3a] bg-[#0f1923] hover:bg-[#1e2a3a]/30 hover:border-[#2d3f55] transition-colors group"
              >
                <div className="h-9 w-9 rounded-md bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0">
                  <Car className="h-4 w-4 text-[#00d4ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-[#e2e8f0] truncate">{session.vehicle}</span>
                    <Badge className={cn(
                      'text-[8px] border px-1.5 py-0 h-3.5',
                      session.status === 'Complete' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' :
                      session.status === 'Partial' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' :
                      'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                    )}>
                      {session.status}
                    </Badge>
                  </div>
                  <div className="text-[9px] font-mono text-[#475569]">{session.vin}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-[#94a3b8]">{session.date}</div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[9px] text-[#475569]">{session.duration}</span>
                    {session.dtcCount > 0 ? (
                      <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[8px] px-1 py-0 h-3.5">
                        {session.dtcCount} DTC
                      </Badge>
                    ) : (
                      <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px] px-1 py-0 h-3.5">
                        Clean
                      </Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#475569] group-hover:text-[#00d4ff] flex-shrink-0 transition-colors" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
