'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Cpu,
  Settings2,
  ShieldAlert,
  AirVent,
  CircuitBoard,
  Gauge,
  ChevronDown,
  ChevronRight,
  Trash2,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Wrench,
  ThermometerSun,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Severity = 'CRITICAL' | 'WARNING' | 'INFO'
type DTCStatus = 'Active' | 'Pending' | 'Stored'

interface ECUModule {
  id: string
  name: string
  abbreviation: string
  codeCount: number
  icon: React.ElementType
  status: 'ok' | 'warning' | 'error'
}

interface DTCCode {
  code: string
  description: string
  module: string
  moduleAbbr: string
  severity: Severity
  status: DTCStatus
  freezeFrame: {
    rpm: number
    speed: number
    coolantTemp: number
    fuelTrim: number
    load: number
  }
  conditions: string
  suggestedFix: string
}

const ecuModules: ECUModule[] = [
  {
    id: 'ecm',
    name: 'Engine Control Module',
    abbreviation: 'ECM',
    codeCount: 2,
    icon: Cpu,
    status: 'error',
  },
  {
    id: 'tcm',
    name: 'Transmission Control Module',
    abbreviation: 'TCM',
    codeCount: 0,
    icon: Settings2,
    status: 'ok',
  },
  {
    id: 'abs',
    name: 'Anti-lock Brake System',
    abbreviation: 'ABS',
    codeCount: 1,
    icon: ShieldAlert,
    status: 'warning',
  },
  {
    id: 'srs',
    name: 'Airbag Control Module',
    abbreviation: 'SRS',
    codeCount: 0,
    icon: AirVent,
    status: 'ok',
  },
  {
    id: 'bcm',
    name: 'Body Control Module',
    abbreviation: 'BCM',
    codeCount: 1,
    icon: CircuitBoard,
    status: 'warning',
  },
  {
    id: 'ic',
    name: 'Instrument Cluster',
    abbreviation: 'IC',
    codeCount: 0,
    icon: Gauge,
    status: 'ok',
  },
]

const dtcCodes: DTCCode[] = [
  {
    code: 'P0300',
    description: 'Random/Multiple Cylinder Misfire Detected',
    module: 'Engine Control Module',
    moduleAbbr: 'ECM',
    severity: 'CRITICAL',
    status: 'Active',
    freezeFrame: {
      rpm: 2450,
      speed: 68,
      coolantTemp: 94,
      fuelTrim: -12.5,
      load: 45,
    },
    conditions:
      'Engine speed between 1200-3200 RPM, engine load 15-45%, coolant temp above 70°C. Misfire count exceeded threshold within 200 revolution window.',
    suggestedFix:
      'Inspect spark plugs and ignition coils. Check fuel injector operation and fuel pressure. Perform compression test on all cylinders. Check for vacuum leaks.',
  },
  {
    code: 'P0171',
    description: 'System Too Lean (Bank 1)',
    module: 'Engine Control Module',
    moduleAbbr: 'ECM',
    severity: 'WARNING',
    status: 'Active',
    freezeFrame: {
      rpm: 1820,
      speed: 52,
      coolantTemp: 88,
      fuelTrim: 28.3,
      load: 32,
    },
    conditions:
      'Fuel trim correction exceeds +25% for more than 10 seconds. Short-term fuel trim at maximum adaptive limit. Bank 1 oxygen sensor reading lean.',
    suggestedFix:
      'Check for vacuum leaks at intake manifold gasket and throttle body. Inspect MAF sensor cleanliness. Check fuel pressure and fuel filter. Inspect O2 sensor output.',
  },
  {
    code: 'C0035',
    description: 'Left Front Wheel Speed Sensor Circuit',
    module: 'Anti-lock Brake System',
    moduleAbbr: 'ABS',
    severity: 'WARNING',
    status: 'Pending',
    freezeFrame: {
      rpm: 980,
      speed: 35,
      coolantTemp: 82,
      fuelTrim: 2.1,
      load: 18,
    },
    conditions:
      'Vehicle speed above 15 km/h. LF wheel speed sensor signal missing or implausible for more than 500ms. Difference between LF and other wheels exceeds 30%.',
    suggestedFix:
      'Inspect LF wheel speed sensor wiring and connector for damage or corrosion. Check sensor air gap. Measure sensor resistance (should be 1.0-2.5 kΩ). Replace sensor if faulty.',
  },
  {
    code: 'B1000',
    description: 'ECU Internal Circuit Failure',
    module: 'Body Control Module',
    moduleAbbr: 'BCM',
    severity: 'INFO',
    status: 'Stored',
    freezeFrame: {
      rpm: 750,
      speed: 0,
      coolantTemp: 76,
      fuelTrim: 0.5,
      load: 12,
    },
    conditions:
      'BCM self-test detected intermittent internal communication error. Occurred during startup self-diagnosis cycle. No current malfunction detected.',
    suggestedFix:
      'Monitor for recurrence. If code returns, perform BCM software update. Check BCM power supply and ground connections. If persistent, BCM replacement may be required.',
  },
]

function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL':
      return '#ef4444'
    case 'WARNING':
      return '#f59e0b'
    case 'INFO':
      return '#3b82f6'
  }
}

function getStatusIcon(status: DTCStatus) {
  switch (status) {
    case 'Active':
      return <AlertTriangle className="h-3 w-3" />
    case 'Pending':
      return <Clock className="h-3 w-3" />
    case 'Stored':
      return <Database className="h-3 w-3" />
  }
}

function getStatusColor(status: DTCStatus): string {
  switch (status) {
    case 'Active':
      return '#ef4444'
    case 'Pending':
      return '#f59e0b'
    case 'Stored':
      return '#64748b'
  }
}

function getModuleStatusColor(status: 'ok' | 'warning' | 'error'): string {
  switch (status) {
    case 'ok':
      return '#10b981'
    case 'warning':
      return '#f59e0b'
    case 'error':
      return '#ef4444'
  }
}

function getModuleStatusText(status: 'ok' | 'warning' | 'error'): string {
  switch (status) {
    case 'ok':
      return 'OK'
    case 'warning':
      return 'Warning'
    case 'error':
      return 'Fault'
  }
}

interface ModuleCardProps {
  module: ECUModule
  isScanning: boolean
  scanned: boolean
}

function ModuleCard({ module, isScanning, scanned }: ModuleCardProps) {
  const Icon = module.icon
  const statusColor = getModuleStatusColor(module.status)

  return (
    <div
      className={cn(
        'bg-[#151d2b] border rounded-lg p-4 transition-all',
        scanned ? 'border-[#1e2a3a] hover:border-[#2d3f55]' : 'border-[#1e2a3a] opacity-50'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-md"
            style={{ backgroundColor: `${statusColor}15` }}
          >
            <Icon className="h-4 w-4" style={{ color: statusColor }} />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#e2e8f0]">
              {module.abbreviation}
            </div>
            <div className="text-[10px] text-[#64748b]">{module.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isScanning && !scanned ? (
            <div className="h-2 w-2 rounded-full bg-[#00d4ff] animate-pulse" />
          ) : scanned ? (
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: statusColor }} />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#64748b]">Status:</span>
          <span className="text-[10px] font-medium" style={{ color: statusColor }}>
            {scanned ? getModuleStatusText(module.status) : '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#64748b]">Codes:</span>
          <Badge
            className="text-[10px] border-0 px-1.5 py-0 h-4"
            style={{
              color: module.codeCount > 0 ? '#f59e0b' : '#10b981',
              backgroundColor:
                module.codeCount > 0 ? '#f59e0b20' : '#10b98120',
            }}
          >
            {scanned ? module.codeCount : '—'}
          </Badge>
        </div>
      </div>
    </div>
  )
}

interface DTCRowProps {
  dtc: DTCCode
  cleared: boolean
}

function DTCRow({ dtc, cleared }: DTCRowProps) {
  const [expanded, setExpanded] = useState(false)
  const severityColor = getSeverityColor(dtc.severity)
  const statusColor = getStatusColor(dtc.status)

  if (cleared) return null

  return (
    <div className="border border-[#1e2a3a] rounded-lg overflow-hidden transition-all hover:border-[#2d3f55]">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left bg-[#151d2b] hover:bg-[#1a2435] transition-colors"
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[#64748b]" />
          )}
        </div>

        {/* Code */}
        <span className="text-xs font-mono font-bold text-[#e2e8f0] min-w-[60px]">
          {dtc.code}
        </span>

        {/* Description */}
        <span className="text-xs text-[#94a3b8] flex-1 truncate hidden sm:block">
          {dtc.description}
        </span>

        {/* Module */}
        <Badge
          className="text-[9px] border-0 px-1.5 py-0 h-4 hidden md:flex"
          style={{
            color: '#94a3b8',
            backgroundColor: '#1e2a3a',
          }}
        >
          {dtc.moduleAbbr}
        </Badge>

        {/* Severity */}
        <Badge
          className="text-[9px] border-0 px-1.5 py-0 h-5 font-semibold"
          style={{
            color: severityColor,
            backgroundColor: `${severityColor}20`,
          }}
        >
          {dtc.severity}
        </Badge>

        {/* Status */}
        <div className="flex items-center gap-1">
          <span style={{ color: statusColor }}>{getStatusIcon(dtc.status)}</span>
          <span className="text-[10px] font-medium" style={{ color: statusColor }}>
            {dtc.status}
          </span>
        </div>
      </button>

      {/* Mobile description */}
      <div className="sm:hidden px-3 pb-2 bg-[#151d2b]">
        <span className="text-xs text-[#94a3b8]">{dtc.description}</span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-[#0f1923] border-t border-[#1e2a3a] p-4 space-y-4">
          {/* Freeze frame data */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ThermometerSun className="h-3 w-3 text-[#00d4ff]" />
              <span className="text-[11px] font-semibold text-[#e2e8f0]">
                Freeze Frame Data
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Engine RPM', value: `${dtc.freezeFrame.rpm}`, color: '#00d4ff' },
                { label: 'Vehicle Speed', value: `${dtc.freezeFrame.speed} km/h`, color: '#10b981' },
                { label: 'Coolant Temp', value: `${dtc.freezeFrame.coolantTemp}°C`, color: '#f59e0b' },
                { label: 'Fuel Trim', value: `${dtc.freezeFrame.fuelTrim}%`, color: '#8b5cf6' },
                { label: 'Engine Load', value: `${dtc.freezeFrame.load}%`, color: '#94a3b8' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-[#151d2b] border border-[#1e2a3a] rounded-md p-2"
                >
                  <div className="text-[9px] text-[#64748b] mb-0.5">{item.label}</div>
                  <div className="text-xs font-semibold" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3 w-3 text-[#f59e0b]" />
              <span className="text-[11px] font-semibold text-[#e2e8f0]">
                Conditions for Setting
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-relaxed bg-[#151d2b] border border-[#1e2a3a] rounded-md p-3">
              {dtc.conditions}
            </p>
          </div>

          {/* Suggested fix */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Wrench className="h-3 w-3 text-[#10b981]" />
              <span className="text-[11px] font-semibold text-[#e2e8f0]">
                Suggested Repair
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-relaxed bg-[#151d2b] border border-[#1e2a3a] rounded-md p-3">
              {dtc.suggestedFix}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function DTCScanView() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scannedModules, setScannedModules] = useState<Set<string>>(new Set())
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [codesCleared, setCodesCleared] = useState(false)

  const startScan = useCallback(() => {
    setIsScanning(true)
    setScanProgress(0)
    setScannedModules(new Set())
    setCodesCleared(false)

    const moduleIds = ecuModules.map((m) => m.id)
    let step = 0
    const totalSteps = moduleIds.length
    const interval = setInterval(() => {
      step++
      setScanProgress(Math.round((step / totalSteps) * 100))
      setScannedModules((prev) => {
        const next = new Set(prev)
        if (step <= totalSteps) {
          next.add(moduleIds[step - 1])
        }
        return next
      })
      if (step >= totalSteps) {
        clearInterval(interval)
        setTimeout(() => setIsScanning(false), 300)
      }
    }, 600)
  }, [])

  const filteredCodes = dtcCodes.filter((dtc) => {
    if (severityFilter !== 'ALL' && dtc.severity !== severityFilter) return false
    if (statusFilter !== 'ALL' && dtc.status !== statusFilter) return false
    return true
  })

  const hasScanned = scannedModules.size > 0

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">DTC Scanner</h1>
              {hasScanned && !isScanning && (
                <Badge className="text-[9px] border-0 bg-[#10b981]20 text-[#10b981] px-1.5">
                  Scanned
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              Diagnostic trouble code analysis and management
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Scan button */}
            <Button
              size="sm"
              onClick={startScan}
              disabled={isScanning}
              className={cn(
                'h-8 text-xs font-semibold gap-1.5',
                isScanning
                  ? 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
                  : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
              )}
            >
              <Search className="h-3 w-3" />
              {isScanning ? 'Scanning...' : 'Scan All Modules'}
            </Button>

            {/* Clear codes button with confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasScanned || isScanning || codesCleared}
                  className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {codesCleared ? 'Codes Cleared' : 'Clear Codes'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#151d2b] border-[#1e2a3a]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[#e2e8f0]">
                    Clear All Diagnostic Codes?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[#94a3b8]">
                    This will clear all stored, pending, and active diagnostic trouble codes from all
                    ECU modules. This action cannot be undone. Make sure you have recorded any codes
                    you need for reference.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => setCodesCleared(true)}
                    className="bg-[#ef4444] text-white hover:bg-[#dc2626]"
                  >
                    Clear All Codes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Scan progress */}
        {isScanning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#94a3b8]">
                Scanning ECU modules...
              </span>
              <span className="text-[11px] text-[#00d4ff] font-medium">
                {scanProgress}%
              </span>
            </div>
            <Progress
              value={scanProgress}
              className="h-1.5 bg-[#1e2a3a]"
            />
          </div>
        )}

        {/* ECU Module status cards */}
        <div>
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#00d4ff]" />
            ECU Modules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ecuModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                isScanning={isScanning}
                scanned={scannedModules.has(module.id)}
              />
            ))}
          </div>
        </div>

        {/* DTC Code list */}
        {hasScanned && !codesCleared && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                Diagnostic Trouble Codes
                <Badge className="text-[9px] border-0 bg-[#1e2a3a] text-[#94a3b8] px-1.5">
                  {filteredCodes.length}
                </Badge>
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Severity filter */}
                <Select
                  value={severityFilter}
                  onValueChange={setSeverityFilter}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-7 text-[11px] border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] w-[130px]"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                    <SelectItem value="ALL" className="text-[11px] text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                      All Severities
                    </SelectItem>
                    <SelectItem value="CRITICAL" className="text-[11px] text-[#ef4444] focus:bg-[#1e2a3a]">
                      Critical
                    </SelectItem>
                    <SelectItem value="WARNING" className="text-[11px] text-[#f59e0b] focus:bg-[#1e2a3a]">
                      Warning
                    </SelectItem>
                    <SelectItem value="INFO" className="text-[11px] text-[#3b82f6] focus:bg-[#1e2a3a]">
                      Info
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Status filter */}
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-7 text-[11px] border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] w-[120px]"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                    <SelectItem value="ALL" className="text-[11px] text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                      All Status
                    </SelectItem>
                    <SelectItem value="Active" className="text-[11px] text-[#ef4444] focus:bg-[#1e2a3a]">
                      Active
                    </SelectItem>
                    <SelectItem value="Pending" className="text-[11px] text-[#f59e0b] focus:bg-[#1e2a3a]">
                      Pending
                    </SelectItem>
                    <SelectItem value="Stored" className="text-[11px] text-[#64748b] focus:bg-[#1e2a3a]">
                      Stored
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Column headers - desktop only */}
            <div className="hidden md:flex items-center gap-3 px-3 py-2 mb-2 text-[10px] text-[#64748b] font-medium uppercase tracking-wider">
              <span className="w-3.5" />
              <span className="min-w-[60px]">Code</span>
              <span className="flex-1">Description</span>
              <span className="min-w-[48px]">Module</span>
              <span className="min-w-[64px]">Severity</span>
              <span className="min-w-[60px]">Status</span>
            </div>

            {/* Code rows */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {filteredCodes.length > 0 ? (
                filteredCodes.map((dtc) => (
                  <DTCRow key={dtc.code} dtc={dtc} cleared={codesCleared} />
                ))
              ) : (
                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-[#10b981] mx-auto mb-2" />
                  <p className="text-xs text-[#94a3b8]">
                    No codes match the selected filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Codes cleared state */}
        {codesCleared && (
          <div className="bg-[#151d2b] border border-[#10b981]30 rounded-lg p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-[#10b981] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">
              All Codes Cleared Successfully
            </h3>
            <p className="text-xs text-[#64748b]">
              All diagnostic trouble codes have been cleared from all ECU modules.
              Rescan to verify.
            </p>
          </div>
        )}

        {/* Empty state before scan */}
        {!hasScanned && !isScanning && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-8 text-center">
            <Search className="h-10 w-10 text-[#00d4ff] mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">
              No Scan Performed
            </h3>
            <p className="text-xs text-[#64748b]">
              Click &quot;Scan All Modules&quot; to begin diagnostic trouble code analysis across all ECU modules.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
