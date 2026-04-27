'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Stethoscope,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Activity,
  Thermometer,
  Gauge,
  Fuel,
  Wrench,
  ArrowRight,
  Zap,
  RotateCcw,
  Search,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ECUScanTarget {
  id: string
  name: string
  protocol: string
  status: 'pending' | 'scanning' | 'complete' | 'error'
  progress: number
  codesFound: number
}

interface FaultAnalysis {
  id: string
  code: string
  description: string
  probability: number
  severity: 'critical' | 'warning' | 'info'
  rootCause: string
  affectedSystems: string[]
}

interface DiagnosticStep {
  id: number
  title: string
  description: string
  status: 'pending' | 'active' | 'complete' | 'skipped'
}

interface SensorComparison {
  name: string
  expected: string
  actual: string
  unit: string
  status: 'normal' | 'warning' | 'critical'
  deviation: number
}

interface CylinderData {
  cylinder: number
  compression: number
  min: number
  max: number
  status: 'good' | 'marginal' | 'poor'
}

const ecuTargets: ECUScanTarget[] = [
  { id: 'ecm', name: 'Engine Control Module', protocol: 'ISO 15765-4', status: 'pending', progress: 0, codesFound: 0 },
  { id: 'tcm', name: 'Transmission Control Module', protocol: 'ISO 15765-4', status: 'pending', progress: 0, codesFound: 0 },
  { id: 'abs', name: 'ABS/ESP Module', protocol: 'KWP2000', status: 'pending', progress: 0, codesFound: 0 },
  { id: 'srs', name: 'Airbag Control Module', protocol: 'ISO 15765-4', status: 'pending', progress: 0, codesFound: 0 },
  { id: 'bcm', name: 'Body Control Module', protocol: 'KWP2000', status: 'pending', progress: 0, codesFound: 0 },
  { id: 'adas', name: 'ADAS Module', protocol: 'DoIP', status: 'pending', progress: 0, codesFound: 0 },
]

const faultAnalyses: FaultAnalysis[] = [
  {
    id: 'f1',
    code: 'P0300',
    description: 'Random/Multiple Cylinder Misfire - Root cause: Ignition coil degradation',
    probability: 87,
    severity: 'critical',
    rootCause: 'Cylinder #3 ignition coil primary resistance out of spec (0.8Ω vs 0.4-0.6Ω expected). Secondary insulation breakdown causing intermittent misfire under load.',
    affectedSystems: ['Ignition', 'Fuel Trim', 'Catalytic Converter', 'O2 Sensors'],
  },
  {
    id: 'f2',
    code: 'P0171',
    description: 'System Too Lean Bank 1 - Root cause: Vacuum leak at intake manifold',
    probability: 74,
    severity: 'warning',
    rootCause: 'Intake manifold gasket leak detected at cylinder #2 runner. Smoke test confirms 0.3L/min unmetered air entering at operating temperature.',
    affectedSystems: ['Fuel System', 'MAF Sensor', 'O2 Sensors', 'EVAP'],
  },
  {
    id: 'f3',
    code: 'P0420',
    description: 'Catalyst Efficiency Below Threshold - Root cause: Catalyst degradation',
    probability: 62,
    severity: 'warning',
    rootCause: 'Post-catalyst O2 sensor switching frequency approaching pre-catalyst frequency. Catalyst substrate thermal damage suspected from prior misfire events.',
    affectedSystems: ['Catalytic Converter', 'O2 Sensors', 'Exhaust'],
  },
  {
    id: 'f4',
    code: 'C0035',
    description: 'Left Front Wheel Speed Signal - Root cause: Sensor connector corrosion',
    probability: 45,
    severity: 'info',
    rootCause: 'Wheel speed sensor connector showing intermittent contact resistance. Corrosion detected on pin 2 of left front sensor harness.',
    affectedSystems: ['ABS', 'ESP', 'Traction Control'],
  },
]

const diagnosticWorkflow: DiagnosticStep[] = [
  { id: 1, title: 'Initial Scan', description: 'Perform full system OBD-II scan and retrieve all stored codes', status: 'complete' },
  { id: 2, title: 'Freeze Frame Analysis', description: 'Analyze freeze frame data for active codes to identify operating conditions', status: 'complete' },
  { id: 3, title: 'Live Data Monitoring', description: 'Monitor key sensors in real-time: fuel trims, O2 sensors, MAF, MAP', status: 'active' },
  { id: 4, title: 'Component Testing', description: 'Perform component-level tests: ignition coils, injectors, sensors', status: 'pending' },
  { id: 5, title: 'Vacuum/Pressure Test', description: 'Check intake manifold vacuum and fuel system pressure', status: 'pending' },
  { id: 6, title: 'Circuit Verification', description: 'Verify wiring and connector integrity for flagged components', status: 'pending' },
  { id: 7, title: 'Root Cause Confirmation', description: 'Confirm root cause through targeted testing and data correlation', status: 'pending' },
  { id: 8, title: 'Repair & Verify', description: 'Perform repair and verify all systems return to normal operation', status: 'pending' },
]

const sensorComparisons: SensorComparison[] = [
  { name: 'MAF Sensor', expected: '14.2', actual: '15.8', unit: 'g/s', status: 'warning', deviation: 11.3 },
  { name: 'MAP Sensor', expected: '98', actual: '96', unit: 'kPa', status: 'normal', deviation: 2.0 },
  { name: 'Coolant Temp', expected: '90', actual: '94', unit: '°C', status: 'normal', deviation: 4.4 },
  { name: 'Intake Air Temp', expected: '25', actual: '42', unit: '°C', status: 'critical', deviation: 68.0 },
  { name: 'Throttle Position', expected: '3.5', actual: '3.6', unit: '%', status: 'normal', deviation: 2.9 },
  { name: 'O2 Sensor B1S1', expected: '0.45', actual: '0.32', unit: 'V', status: 'warning', deviation: 28.9 },
  { name: 'O2 Sensor B1S2', expected: '0.70', actual: '0.68', unit: 'V', status: 'normal', deviation: 2.9 },
  { name: 'Fuel Trim STFT', expected: '0', actual: '+14.5', unit: '%', status: 'critical', deviation: 100.0 },
  { name: 'Fuel Trim LTFT', expected: '0', actual: '+22.3', unit: '%', status: 'critical', deviation: 100.0 },
  { name: 'Engine Load', expected: '30', actual: '45', unit: '%', status: 'warning', deviation: 50.0 },
]

const cylinderData: CylinderData[] = [
  { cylinder: 1, compression: 178, min: 150, max: 200, status: 'good' },
  { cylinder: 2, compression: 172, min: 150, max: 200, status: 'good' },
  { cylinder: 3, compression: 135, min: 150, max: 200, status: 'poor' },
  { cylinder: 4, compression: 176, min: 150, max: 200, status: 'good' },
  { cylinder: 5, compression: 165, min: 150, max: 200, status: 'marginal' },
  { cylinder: 6, compression: 174, min: 150, max: 200, status: 'good' },
]

function getDeviationColor(deviation: number): string {
  if (deviation <= 5) return '#10b981'
  if (deviation <= 15) return '#f59e0b'
  return '#ef4444'
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'good':
    case 'normal': return '#10b981'
    case 'marginal':
    case 'warning': return '#f59e0b'
    case 'poor':
    case 'critical': return '#ef4444'
    default: return '#64748b'
  }
}

export function ProDiagnosticsView() {
  const [scanTargets, setScanTargets] = useState<ECUScanTarget[]>(ecuTargets)
  const [isScanning, setIsScanning] = useState(false)
  const [expandedFault, setExpandedFault] = useState<string | null>(null)
  const [workflowStep, setWorkflowStep] = useState(3)

  const startMultiScan = useCallback(() => {
    setIsScanning(true)
    const updated = [...ecuTargets]
    let idx = 0
    const interval = setInterval(() => {
      if (idx < updated.length) {
        updated[idx].status = 'scanning'
        updated[idx].progress = 0
        setScanTargets([...updated])

        const progressInterval = setInterval(() => {
          updated[idx].progress = Math.min(updated[idx].progress + Math.random() * 25 + 10, 100)
          setScanTargets([...updated])
          if (updated[idx].progress >= 100) {
            clearInterval(progressInterval)
            updated[idx].status = 'complete'
            updated[idx].codesFound = Math.floor(Math.random() * 4)
            setScanTargets([...updated])
            idx++
          }
        }, 200)
      } else {
        clearInterval(interval)
        setIsScanning(false)
      }
    }, 1200)
  }, [])

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Professional Diagnostics</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">PRO</Badge>
          </div>
          <p className="text-xs text-[#64748b]">Advanced diagnostic suite for professional technicians</p>
        </div>
        <Button
          size="sm"
          onClick={startMultiScan}
          disabled={isScanning}
          className={cn(
            'h-8 text-xs font-semibold gap-1.5',
            isScanning
              ? 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
              : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
          )}
        >
          <Search className="h-3 w-3" />
          {isScanning ? 'Scanning...' : 'Multi-ECU Scan'}
        </Button>
      </div>

      {/* Multi-ECU Scanning Progress */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#00d4ff]" />
            Multi-ECU Simultaneous Scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scanTargets.map((target) => (
            <div key={target.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {target.status === 'scanning' && (
                    <div className="h-2 w-2 rounded-full bg-[#00d4ff] animate-pulse" />
                  )}
                  {target.status === 'complete' && (
                    <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                  )}
                  {target.status === 'pending' && (
                    <div className="h-2 w-2 rounded-full bg-[#475569]" />
                  )}
                  <span className="text-xs text-[#e2e8f0]">{target.name}</span>
                  <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 bg-[#1e2a3a] text-[#64748b]">
                    {target.protocol}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {target.status === 'complete' && target.codesFound > 0 && (
                    <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 bg-[#ef4444]/20 text-[#ef4444]">
                      {target.codesFound} codes
                    </Badge>
                  )}
                  {target.status === 'complete' && target.codesFound === 0 && (
                    <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 bg-[#10b981]/20 text-[#10b981]">
                      OK
                    </Badge>
                  )}
                  <span className="text-[10px] text-[#64748b] min-w-[32px] text-right">
                    {target.status === 'pending' ? '—' : `${Math.round(target.progress)}%`}
                  </span>
                </div>
              </div>
              <Progress value={target.progress} className="h-1 bg-[#1e2a3a]" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Advanced Fault Analysis */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
            Advanced Fault Analysis
            <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[10px]">AI</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faultAnalyses.map((fault) => (
            <div key={fault.id} className="border border-[#1e2a3a] rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFault(expandedFault === fault.id ? null : fault.id)}
                className="w-full flex items-center gap-3 p-3 text-left bg-[#0f1923] hover:bg-[#1a2435] transition-colors"
              >
                {expandedFault === fault.id ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#64748b]" />
                )}
                <span className="text-xs font-mono font-bold text-[#e2e8f0] min-w-[44px]">{fault.code}</span>
                <span className="text-xs text-[#94a3b8] flex-1 truncate">{fault.description}</span>
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-5 font-semibold"
                    style={{
                      color: getStatusColor(fault.severity),
                      backgroundColor: `${getStatusColor(fault.severity)}20`,
                    }}
                  >
                    {fault.probability}%
                  </Badge>
                </div>
              </button>
              {expandedFault === fault.id && (
                <div className="bg-[#151d2b] border-t border-[#1e2a3a] p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-semibold text-[#e2e8f0]">Root Cause Probability</span>
                    </div>
                    <div className="h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${fault.probability}%`,
                          backgroundColor: getStatusColor(fault.severity),
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#e2e8f0]">Root Cause</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">{fault.rootCause}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#e2e8f0]">Affected Systems</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {fault.affectedSystems.map((sys) => (
                        <Badge key={sys} className="text-[9px] border-0 px-1.5 py-0 h-4 bg-[#1e2a3a] text-[#94a3b8]">
                          {sys}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Guided Diagnostic Workflow */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#00d4ff]" />
              Guided Diagnostic Workflow
            </CardTitle>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
              Step {workflowStep}/8
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {diagnosticWorkflow.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
                      step.status === 'complete' ? 'bg-[#10b981]/20 text-[#10b981]' :
                      step.status === 'active' ? 'bg-[#00d4ff]/20 text-[#00d4ff] ring-2 ring-[#00d4ff]/30' :
                      'bg-[#1e2a3a] text-[#475569]'
                    )}
                  >
                    {step.status === 'complete' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {idx < diagnosticWorkflow.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-6',
                      step.status === 'complete' ? 'bg-[#10b981]/40' : 'bg-[#1e2a3a]'
                    )} />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-semibold',
                      step.status === 'complete' ? 'text-[#10b981]' :
                      step.status === 'active' ? 'text-[#00d4ff]' :
                      'text-[#64748b]'
                    )}>
                      {step.title}
                    </span>
                    {step.status === 'active' && (
                      <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px] h-4 px-1.5">
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-[#475569] mt-0.5">{step.description}</p>
                  {step.status === 'active' && (
                    <Button
                      size="sm"
                      className="h-6 text-[10px] mt-2 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] gap-1"
                      onClick={() => {
                        setWorkflowStep(Math.min(workflowStep + 1, 8))
                      }}
                    >
                      <ArrowRight className="h-3 w-3" />
                      Next Step
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Data Comparison Table */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00d4ff]" />
            Expected vs Actual Sensor Values
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  <th className="text-left text-[10px] font-semibold text-[#64748b] uppercase tracking-wider pb-2 pr-3">Sensor</th>
                  <th className="text-right text-[10px] font-semibold text-[#64748b] uppercase tracking-wider pb-2 pr-3">Expected</th>
                  <th className="text-right text-[10px] font-semibold text-[#64748b] uppercase tracking-wider pb-2 pr-3">Actual</th>
                  <th className="text-right text-[10px] font-semibold text-[#64748b] uppercase tracking-wider pb-2 pr-3">Deviation</th>
                  <th className="text-center text-[10px] font-semibold text-[#64748b] uppercase tracking-wider pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensorComparisons.map((sensor) => (
                  <tr key={sensor.name} className="border-b border-[#1e2a3a]/50 hover:bg-[#1e2a3a]/20">
                    <td className="py-2 pr-3 text-[#e2e8f0] font-medium">{sensor.name}</td>
                    <td className="py-2 pr-3 text-[#94a3b8] text-right font-mono">{sensor.expected} {sensor.unit}</td>
                    <td className="py-2 pr-3 text-right font-mono" style={{ color: getStatusColor(sensor.status) }}>
                      {sensor.actual} {sensor.unit}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono" style={{ color: getDeviationColor(sensor.deviation) }}>
                      {sensor.deviation > 0 ? '+' : ''}{sensor.deviation.toFixed(1)}%
                    </td>
                    <td className="py-2 text-center">
                      <Badge
                        className="text-[9px] border-0 px-1.5 py-0 h-4"
                        style={{
                          color: getStatusColor(sensor.status),
                          backgroundColor: `${getStatusColor(sensor.status)}20`,
                        }}
                      >
                        {sensor.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Oscilloscope Placeholder & Compression Test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Oscilloscope */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#00d4ff]" />
              Signal Viewer
              <Badge className="bg-[#475569]/20 text-[#475569] border-[#475569]/30 text-[9px]">BETA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0a0f18] border border-[#1e2a3a] rounded-lg h-48 flex items-center justify-center relative overflow-hidden">
              {/* Simulated oscilloscope grid */}
              <div className="absolute inset-0 opacity-20">
                {[20, 40, 60, 80].map((y) => (
                  <div key={`h-${y}`} className="absolute w-full border-t border-dashed border-[#1e2a3a]" style={{ top: `${y}%` }} />
                ))}
                {[20, 40, 60, 80].map((x) => (
                  <div key={`v-${x}`} className="absolute h-full border-l border-dashed border-[#1e2a3a]" style={{ left: `${x}%` }} />
                ))}
              </div>
              {/* Simulated waveform */}
              <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#00d4ff"
                  strokeWidth="1.5"
                  points="0,80 20,80 25,20 35,100 45,80 80,80 85,20 95,100 105,80 140,80 145,20 155,100 165,80 200,80 205,20 215,100 225,80 260,80 265,20 275,100 285,80 320,80 325,20 335,100 345,80 380,80 385,20 395,100 400,80"
                  opacity="0.8"
                />
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="1"
                  points="0,90 40,70 80,90 120,60 160,85 200,50 240,80 280,65 320,75 360,55 400,70"
                  opacity="0.5"
                />
              </svg>
              <div className="absolute top-2 left-2 text-[9px] text-[#64748b] font-mono">
                CH1: IGNITION COIL PRIMARY | 5V/div | 10ms/div
              </div>
              <div className="absolute bottom-2 right-2 text-[9px] text-[#64748b] font-mono">
                CH2: FUEL INJECTOR | 2V/div
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 bg-[#00d4ff]/20 text-[#00d4ff]">CH1 Active</Badge>
              <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 bg-[#8b5cf6]/20 text-[#8b5cf6]">CH2 Active</Badge>
              <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 bg-[#1e2a3a] text-[#475569]">CH3 Off</Badge>
              <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 bg-[#1e2a3a] text-[#475569]">CH4 Off</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Compression Test */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#f59e0b]" />
              Compression Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cylinderData.map((cyl) => (
              <div key={cyl.cylinder} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#e2e8f0] font-medium">Cylinder #{cyl.cylinder}</span>
                    <Badge
                      className="text-[9px] border-0 px-1.5 py-0 h-4"
                      style={{
                        color: getStatusColor(cyl.status),
                        backgroundColor: `${getStatusColor(cyl.status)}20`,
                      }}
                    >
                      {cyl.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono" style={{ color: getStatusColor(cyl.status) }}>
                    {cyl.compression} PSI
                  </span>
                </div>
                <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(cyl.compression / 220) * 100}%`,
                      backgroundColor: getStatusColor(cyl.status),
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-[#475569]">
                  <span>Min: {cyl.min} PSI</span>
                  <span>Max: {cyl.max} PSI</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fuel System Analysis */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Fuel className="h-4 w-4 text-[#8b5cf6]" />
            Fuel System Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pressure */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="h-4 w-4 text-[#00d4ff]" />
                <span className="text-xs font-semibold text-[#e2e8f0]">Fuel Pressure</span>
              </div>
              <div className="text-2xl font-bold text-[#00d4ff] mb-1">3.8 <span className="text-sm font-normal text-[#64748b]">bar</span></div>
              <div className="text-[10px] text-[#475569]">Spec: 3.5 - 4.0 bar</div>
              <div className="mt-2 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div className="h-full bg-[#10b981] rounded-full" style={{ width: '95%' }} />
              </div>
              <Badge className="mt-2 text-[9px] border-0 px-1.5 py-0 h-4 bg-[#10b981]/20 text-[#10b981]">NORMAL</Badge>
            </div>
            {/* Flow Rate */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-[#f59e0b]" />
                <span className="text-xs font-semibold text-[#e2e8f0]">Flow Rate</span>
              </div>
              <div className="text-2xl font-bold text-[#f59e0b] mb-1">285 <span className="text-sm font-normal text-[#64748b]">cc/min</span></div>
              <div className="text-[10px] text-[#475569]">Spec: 280 - 320 cc/min</div>
              <div className="mt-2 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div className="h-full bg-[#f59e0b] rounded-full" style={{ width: '89%' }} />
              </div>
              <Badge className="mt-2 text-[9px] border-0 px-1.5 py-0 h-4 bg-[#f59e0b]/20 text-[#f59e0b]">MARGINAL</Badge>
            </div>
            {/* Injector Balance */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="h-4 w-4 text-[#8b5cf6]" />
                <span className="text-xs font-semibold text-[#e2e8f0]">Injector Balance</span>
              </div>
              <div className="text-2xl font-bold text-[#8b5cf6] mb-1">±2.1 <span className="text-sm font-normal text-[#64748b]">%</span></div>
              <div className="text-[10px] text-[#475569]">Spec: ±3.0% max deviation</div>
              <div className="mt-2 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div className="h-full bg-[#10b981] rounded-full" style={{ width: '70%' }} />
              </div>
              <Badge className="mt-2 text-[9px] border-0 px-1.5 py-0 h-4 bg-[#10b981]/20 text-[#10b981]">BALANCED</Badge>
            </div>
          </div>

          {/* Individual injector details */}
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {['INJ #1', 'INJ #2', 'INJ #3', 'INJ #4', 'INJ #5', 'INJ #6'].map((inj, idx) => {
              const deviation = [1.2, -0.8, -2.1, 1.5, 0.3, -0.5][idx]
              const isOut = Math.abs(deviation) > 2
              return (
                <div key={inj} className={cn(
                  'bg-[#0f1923] border rounded-lg p-2 text-center',
                  isOut ? 'border-[#f59e0b]/40' : 'border-[#1e2a3a]'
                )}>
                  <div className="text-[9px] text-[#64748b] mb-1">{inj}</div>
                  <div className={cn(
                    'text-sm font-bold font-mono',
                    isOut ? 'text-[#f59e0b]' : 'text-[#10b981]'
                  )}>
                    {deviation > 0 ? '+' : ''}{deviation}%
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
