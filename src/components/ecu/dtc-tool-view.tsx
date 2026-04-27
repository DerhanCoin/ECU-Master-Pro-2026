'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  FileText,
  FileSpreadsheet,
  Thermometer,
  Gauge,
  Activity,
  Zap,
  Cpu,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Wrench,
  Car,
  ShieldAlert,
  AirVent,
  CircuitBoard,
  Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type DTCType = 'P' | 'C' | 'B' | 'U'
type Severity = 'critical' | 'warning' | 'info'
type CodeStatus = 'active' | 'pending' | 'history'

interface DTCCodeEntry {
  code: string
  type: DTCType
  description: string
  severity: Severity
  status: CodeStatus
  category: string
  possibleCauses: string[]
  commonFixes: string[]
  freezeFrame: {
    rpm: number
    load: number
    map: number
    coolantTemp: number
    fuelTrim: number
  }
}

interface CodeStats {
  total: number
  active: number
  pending: number
  history: number
}

interface TSBReference {
  number: string
  title: string
  relevance: 'high' | 'medium' | 'low'
}

const dtcDatabase: Record<string, DTCCodeEntry> = {
  P0300: {
    code: 'P0300',
    type: 'P',
    description: 'Random/Multiple Cylinder Misfire Detected',
    severity: 'critical',
    status: 'active',
    category: 'Ignition / Fuel',
    possibleCauses: [
      'Faulty spark plugs or ignition coils',
      'Clogged or defective fuel injectors',
      'Low fuel pressure or vacuum leak',
      'Valve train or compression issue',
      'Incorrect fuel mixture',
    ],
    commonFixes: [
      'Replace spark plugs (NGK PFR7S8EG, gap 0.032")',
      'Replace ignition coils (use OEM Beru or Bosch)',
      'Clean or replace fuel injectors',
      'Check fuel pressure (spec: 3.5-4.0 bar)',
      'Perform compression test (min 150 PSI)',
    ],
    freezeFrame: { rpm: 2450, load: 45, map: 78, coolantTemp: 94, fuelTrim: -12.5 },
  },
  P0171: {
    code: 'P0171',
    type: 'P',
    description: 'System Too Lean (Bank 1)',
    severity: 'warning',
    status: 'active',
    category: 'Fuel / Air',
    possibleCauses: [
      'Vacuum leak at intake manifold gasket',
      'Dirty or faulty MAF sensor',
      'Low fuel pressure (weak pump or clogged filter)',
      'Exhaust leak before O2 sensor',
      'Faulty O2 sensor (Bank 1 Sensor 1)',
    ],
    commonFixes: [
      'Perform smoke test to locate vacuum leaks',
      'Clean MAF sensor with MAF-specific cleaner',
      'Check fuel pressure and replace filter',
      'Inspect exhaust manifold for leaks',
      'Test O2 sensor voltage response',
    ],
    freezeFrame: { rpm: 1820, load: 32, map: 65, coolantTemp: 88, fuelTrim: 28.3 },
  },
  P0420: {
    code: 'P0420',
    type: 'P',
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    severity: 'warning',
    status: 'pending',
    category: 'Emissions',
    possibleCauses: [
      'Degraded catalytic converter',
      'O2 sensor (post-cat) malfunction',
      'Exhaust leak',
      'Engine running rich or lean (damaging catalyst)',
      'Contaminated catalyst (oil/coolant)',
    ],
    commonFixes: [
      'Compare pre/post O2 sensor switching rates',
      'Replace catalytic converter if efficiency < 75%',
      'Fix any underlying fuel trim issues first',
      'Check for exhaust leaks before O2 sensors',
      'Replace post-cat O2 sensor',
    ],
    freezeFrame: { rpm: 2100, load: 28, map: 72, coolantTemp: 90, fuelTrim: 8.5 },
  },
  C0035: {
    code: 'C0035',
    type: 'C',
    description: 'Left Front Wheel Speed Sensor Circuit',
    severity: 'warning',
    status: 'pending',
    category: 'ABS / Chassis',
    possibleCauses: [
      'Damaged or corroded wheel speed sensor wiring',
      'Faulty wheel speed sensor',
      'Excessive sensor air gap',
      'Damaged tone ring / reluctor wheel',
      'ABS module internal fault',
    ],
    commonFixes: [
      'Inspect LF sensor wiring and connector',
      'Measure sensor resistance (1.0-2.5 kΩ)',
      'Check sensor air gap (0.2-1.0mm)',
      'Inspect tone ring for damage',
      'Replace LF wheel speed sensor',
    ],
    freezeFrame: { rpm: 980, load: 18, map: 55, coolantTemp: 82, fuelTrim: 2.1 },
  },
  B1000: {
    code: 'B1000',
    type: 'B',
    description: 'ECU Internal Circuit Failure',
    severity: 'info',
    status: 'history',
    category: 'Body Electronics',
    possibleCauses: [
      'BCM internal communication fault',
      'Power supply interruption',
      'Software glitch during self-test',
      'Corroded ground connection',
    ],
    commonFixes: [
      'Monitor for recurrence',
      'Perform BCM software update',
      'Check BCM power and ground connections',
      'BCM replacement if persistent',
    ],
    freezeFrame: { rpm: 750, load: 12, map: 48, coolantTemp: 76, fuelTrim: 0.5 },
  },
  U0140: {
    code: 'U0140',
    type: 'U',
    description: 'Lost Communication With Body Control Module',
    severity: 'warning',
    status: 'active',
    category: 'Network / Communication',
    possibleCauses: [
      'CAN bus wiring fault (open or short)',
      'BCM power supply issue',
      'BCM internal failure',
      'CAN bus termination resistor fault',
      'Electromagnetic interference',
    ],
    commonFixes: [
      'Check CAN bus wiring continuity',
      'Measure CAN termination resistors (120Ω each end)',
      'Verify BCM power supply and ground',
      'Inspect CAN bus for corrosion or damage',
      'Check for aftermarket electronics causing interference',
    ],
    freezeFrame: { rpm: 1200, load: 22, map: 60, coolantTemp: 85, fuelTrim: 1.2 },
  },
}

const tsbReferences: TSBReference[] = [
  { number: 'VW-21-045', title: 'Rough Idle and DTC P0300 — Ignition Coil Replacement', relevance: 'high' },
  { number: 'VW-20-112', title: 'DSG Transmission Shudder — Mechatronic Unit Update', relevance: 'medium' },
  { number: 'VW-19-087', title: 'DTC P0420 Catalyst Efficiency — O2 Sensor Update', relevance: 'high' },
  { number: 'VAG-18-206', title: 'CAN Bus Communication Errors — Grounding Points', relevance: 'medium' },
  { number: 'VW-17-155', title: 'Wheel Speed Sensor Corrosion — Wiring Repair Kit', relevance: 'low' },
]

const currentCodes: DTCCodeEntry[] = Object.values(dtcDatabase)

const codeStats: CodeStats = {
  total: currentCodes.length,
  active: currentCodes.filter((c) => c.status === 'active').length,
  pending: currentCodes.filter((c) => c.status === 'pending').length,
  history: currentCodes.filter((c) => c.status === 'history').length,
}

function getTypeColor(type: DTCType): string {
  switch (type) {
    case 'P': return '#ef4444'
    case 'C': return '#f59e0b'
    case 'B': return '#8b5cf6'
    case 'U': return '#00d4ff'
  }
}

function getTypeLabel(type: DTCType): string {
  switch (type) {
    case 'P': return 'Powertrain'
    case 'C': return 'Chassis'
    case 'B': return 'Body'
    case 'U': return 'Network'
  }
}

function getTypeIcon(type: DTCType): React.ElementType {
  switch (type) {
    case 'P': return Cpu
    case 'C': return ShieldAlert
    case 'B': return CircuitBoard
    case 'U': return Activity
  }
}

function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return '#ef4444'
    case 'warning': return '#f59e0b'
    case 'info': return '#3b82f6'
  }
}

function getStatusColor(status: CodeStatus): string {
  switch (status) {
    case 'active': return '#ef4444'
    case 'pending': return '#f59e0b'
    case 'history': return '#64748b'
  }
}

function getStatusIcon(status: CodeStatus) {
  switch (status) {
    case 'active': return <AlertTriangle className="h-3 w-3" />
    case 'pending': return <Clock className="h-3 w-3" />
    case 'history': return <Database className="h-3 w-3" />
  }
}

export function DTCToolView() {
  const [codeInput, setCodeInput] = useState('')
  const [lookupResult, setLookupResult] = useState<DTCCodeEntry | null>(null)
  const [lookupError, setLookupError] = useState(false)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<DTCType | 'ALL'>('ALL')
  const [codesCleared, setCodesCleared] = useState(false)

  const lookupCode = useCallback(() => {
    const clean = codeInput.toUpperCase().trim()
    if (dtcDatabase[clean]) {
      setLookupResult(dtcDatabase[clean])
      setLookupError(false)
    } else {
      setLookupResult(null)
      setLookupError(true)
    }
  }, [codeInput])

  const filteredCodes = currentCodes.filter((code) => {
    if (typeFilter !== 'ALL' && code.type !== typeFilter) return false
    return true
  })

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">DTC Tool</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">TOOL</Badge>
          </div>
          <p className="text-xs text-[#64748b]">Comprehensive diagnostic trouble code management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5"
          >
            <FileSpreadsheet className="h-3 w-3" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5"
          >
            <FileText className="h-3 w-3" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Code Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Codes', value: codeStats.total, color: '#00d4ff', icon: Database },
          { label: 'Active', value: codeStats.active, color: '#ef4444', icon: AlertTriangle },
          { label: 'Pending', value: codeStats.pending, color: '#f59e0b', icon: Clock },
          { label: 'History', value: codeStats.history, color: '#64748b', icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-md" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
              </div>
              <span className="text-[10px] text-[#64748b] font-medium">{stat.label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Code Lookup Input */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Search className="h-4 w-4 text-[#00d4ff]" />
            Manual Code Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.toUpperCase())
                setLookupError(false)
              }}
              placeholder="Enter DTC code (e.g., P0300)"
              className="bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] font-mono tracking-wider placeholder:text-[#475569] text-sm h-9 max-w-[200px]"
              maxLength={5}
              onKeyDown={(e) => e.key === 'Enter' && lookupCode()}
            />
            <Button
              size="sm"
              onClick={lookupCode}
              disabled={codeInput.length < 4}
              className={cn(
                'h-9 text-xs font-semibold gap-1.5',
                codeInput.length >= 4
                  ? 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                  : 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
              )}
            >
              <Search className="h-3 w-3" />
              Lookup
            </Button>
          </div>

          {/* Lookup Result */}
          {lookupResult && (
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold font-mono" style={{ color: getTypeColor(lookupResult.type) }}>
                    {lookupResult.code}
                  </span>
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-5"
                    style={{ color: getSeverityColor(lookupResult.severity), backgroundColor: `${getSeverityColor(lookupResult.severity)}20` }}
                  >
                    {lookupResult.severity.toUpperCase()}
                  </Badge>
                </div>
                <Badge className="text-[9px] border-0 px-1.5 py-0 h-5" style={{ color: getTypeColor(lookupResult.type), backgroundColor: `${getTypeColor(lookupResult.type)}20` }}>
                  {getTypeLabel(lookupResult.type)}
                </Badge>
              </div>
              <div className="text-sm text-[#e2e8f0] font-medium">{lookupResult.description}</div>

              {/* Freeze Frame */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Thermometer className="h-3 w-3 text-[#00d4ff]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0]">Freeze Frame Data</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'RPM', value: lookupResult.freezeFrame.rpm, color: '#00d4ff' },
                    { label: 'Load', value: `${lookupResult.freezeFrame.load}%`, color: '#f59e0b' },
                    { label: 'MAP', value: `${lookupResult.freezeFrame.map} kPa`, color: '#8b5cf6' },
                    { label: 'Coolant', value: `${lookupResult.freezeFrame.coolantTemp}°C`, color: '#10b981' },
                    { label: 'Fuel Trim', value: `${lookupResult.freezeFrame.fuelTrim}%`, color: '#ef4444' },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#151d2b] border border-[#1e2a3a] rounded-md p-2">
                      <div className="text-[9px] text-[#64748b]">{item.label}</div>
                      <div className="text-xs font-semibold font-mono" style={{ color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Possible Causes */}
              <div>
                <div className="text-[10px] font-semibold text-[#e2e8f0] mb-1.5">Possible Causes</div>
                <ul className="space-y-1">
                  {lookupResult.possibleCauses.map((cause, idx) => (
                    <li key={idx} className="text-[11px] text-[#94a3b8] flex items-start gap-1.5">
                      <span className="text-[#f59e0b] mt-0.5">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Fixes */}
              <div>
                <div className="text-[10px] font-semibold text-[#e2e8f0] mb-1.5">Common Fixes</div>
                <ul className="space-y-1">
                  {lookupResult.commonFixes.map((fix, idx) => (
                    <li key={idx} className="text-[11px] text-[#94a3b8] flex items-start gap-1.5">
                      <Wrench className="h-3 w-3 text-[#10b981] mt-0.5 flex-shrink-0" />
                      {fix}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {lookupError && (
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-[#f59e0b] mx-auto mb-2" />
              <p className="text-xs text-[#94a3b8]">Code &quot;{codeInput}&quot; not found in database. Check the code format and try again.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Categorization & List */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
              Current DTC Codes
            </CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTypeFilter('ALL')}
                className={cn(
                  'h-6 text-[10px] px-2 border-[#1e2a3a]',
                  typeFilter === 'ALL' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' : 'bg-[#151d2b] text-[#64748b]'
                )}
              >
                All
              </Button>
              {(['P', 'C', 'B', 'U'] as DTCType[]).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    'h-6 text-[10px] px-2 border-[#1e2a3a]',
                    typeFilter === type
                      ? `text-[${getTypeColor(type)}]`
                      : 'bg-[#151d2b] text-[#64748b]'
                  )}
                  style={typeFilter === type ? {
                    color: getTypeColor(type),
                    backgroundColor: `${getTypeColor(type)}20`,
                    borderColor: `${getTypeColor(type)}30`,
                  } : {}}
                >
                  {type} — {getTypeLabel(type)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {codesCleared ? (
            <div className="bg-[#0f1923] border border-[#10b981]/30 rounded-lg p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-[#10b981] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-[#e2e8f0]">All Codes Cleared</h3>
              <p className="text-xs text-[#64748b] mt-1">All diagnostic trouble codes have been cleared successfully.</p>
            </div>
          ) : (
            filteredCodes.map((code) => (
              <div key={code.code} className="border border-[#1e2a3a] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCode(expandedCode === code.code ? null : code.code)}
                  className="w-full flex items-center gap-3 p-3 text-left bg-[#0f1923] hover:bg-[#1a2435] transition-colors"
                >
                  {expandedCode === code.code ? (
                    <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-[#64748b]" />
                  )}
                  <span className="text-xs font-mono font-bold min-w-[48px]" style={{ color: getTypeColor(code.type) }}>
                    {code.code}
                  </span>
                  <span className="text-xs text-[#94a3b8] flex-1 truncate hidden sm:block">{code.description}</span>
                  <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 hidden md:flex" style={{
                    color: getTypeColor(code.type),
                    backgroundColor: `${getTypeColor(code.type)}20`,
                  }}>
                    {getTypeLabel(code.type)}
                  </Badge>
                  <Badge className="text-[9px] border-0 px-1.5 py-0 h-5" style={{
                    color: getSeverityColor(code.severity),
                    backgroundColor: `${getSeverityColor(code.severity)}20`,
                  }}>
                    {code.severity.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span style={{ color: getStatusColor(code.status) }}>{getStatusIcon(code.status)}</span>
                    <span className="text-[10px] font-medium" style={{ color: getStatusColor(code.status) }}>
                      {code.status.charAt(0).toUpperCase() + code.status.slice(1)}
                    </span>
                  </div>
                </button>

                {/* Mobile description */}
                <div className="sm:hidden px-3 pb-2 bg-[#0f1923]">
                  <span className="text-xs text-[#94a3b8]">{code.description}</span>
                </div>

                {expandedCode === code.code && (
                  <div className="bg-[#151d2b] border-t border-[#1e2a3a] p-4 space-y-4">
                    {/* Freeze Frame */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Thermometer className="h-3 w-3 text-[#00d4ff]" />
                        <span className="text-[11px] font-semibold text-[#e2e8f0]">Freeze Frame Data</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { label: 'RPM', value: `${code.freezeFrame.rpm}`, color: '#00d4ff' },
                          { label: 'Engine Load', value: `${code.freezeFrame.load}%`, color: '#10b981' },
                          { label: 'MAP', value: `${code.freezeFrame.map} kPa`, color: '#8b5cf6' },
                          { label: 'Coolant Temp', value: `${code.freezeFrame.coolantTemp}°C`, color: '#f59e0b' },
                          { label: 'Fuel Trim', value: `${code.freezeFrame.fuelTrim}%`, color: '#ef4444' },
                        ].map((item) => (
                          <div key={item.label} className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2">
                            <div className="text-[9px] text-[#64748b]">{item.label}</div>
                            <div className="text-xs font-semibold font-mono" style={{ color: item.color }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Possible Causes & Fixes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-semibold text-[#e2e8f0] mb-1.5">Possible Causes</div>
                        <ul className="space-y-1">
                          {code.possibleCauses.slice(0, 3).map((cause, idx) => (
                            <li key={idx} className="text-[10px] text-[#94a3b8] flex items-start gap-1.5">
                              <span className="text-[#f59e0b]">•</span>{cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-[#e2e8f0] mb-1.5">Common Fixes</div>
                        <ul className="space-y-1">
                          {code.commonFixes.slice(0, 3).map((fix, idx) => (
                            <li key={idx} className="text-[10px] text-[#94a3b8] flex items-start gap-1.5">
                              <Wrench className="h-2.5 w-2.5 text-[#10b981] mt-0.5 flex-shrink-0" />{fix}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Clear Codes */}
          {!codesCleared && (
            <div className="pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 hover:text-[#ef4444] gap-1.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear All Codes
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#151d2b] border-[#1e2a3a]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#e2e8f0]">Clear All Diagnostic Codes?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[#94a3b8]">
                      This will clear all active, pending, and history codes. This action cannot be undone. Make sure you have recorded any codes you need for reference.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8]">Cancel</AlertDialogCancel>
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
          )}
        </CardContent>
      </Card>

      {/* Related TSBs */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#f59e0b]" />
            Related Technical Service Bulletins
            <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">{tsbReferences.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tsbReferences.map((tsb) => (
            <div key={tsb.number} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 hover:border-[#2d3f55] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-[#00d4ff]">{tsb.number}</span>
                <Badge
                  className="text-[9px] border-0 px-1.5 py-0 h-4"
                  style={{
                    color: tsb.relevance === 'high' ? '#ef4444' : tsb.relevance === 'medium' ? '#f59e0b' : '#64748b',
                    backgroundColor: tsb.relevance === 'high' ? '#ef444420' : tsb.relevance === 'medium' ? '#f59e0b20' : '#64748b20',
                  }}
                >
                  {tsb.relevance.toUpperCase()} RELEVANCE
                </Badge>
              </div>
              <div className="text-xs text-[#e2e8f0] font-medium">{tsb.title}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
