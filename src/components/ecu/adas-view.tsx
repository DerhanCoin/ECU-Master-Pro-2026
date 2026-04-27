'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  Eye,
  Radar,
  Car,
  Crosshair,
  ScanLine,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Settings2,
  Wrench,
  Camera,
  Radio,
  Zap,
  RotateCcw,
  Download,
  CircleDot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type CalibrationStatus = 'calibrated' | 'needs-calibration' | 'not-available'
type ModuleStatus = 'online' | 'offline' | 'error'
type WorkflowStep = 'pre-check' | 'setup' | 'target-alignment' | 'measurement' | 'verification'

interface ADASModule {
  id: string
  name: string
  icon: React.ElementType
  status: ModuleStatus
  calibrationStatus: CalibrationStatus
  lastCalibration: string
  sensorType: string
}

interface CalibrationHistoryEntry {
  id: string
  module: string
  date: string
  result: 'pass' | 'fail' | 'incomplete'
  technician: string
  notes: string
}

interface ToolItem {
  name: string
  required: boolean
  available: boolean
}

const adasModules: ADASModule[] = [
  { id: 'lka', name: 'Lane Keep Assist', icon: Eye, status: 'online', calibrationStatus: 'calibrated', lastCalibration: '2025-01-15', sensorType: 'Front Camera' },
  { id: 'acc', name: 'Adaptive Cruise Control', icon: Radar, status: 'online', calibrationStatus: 'needs-calibration', lastCalibration: '2024-09-20', sensorType: 'Front Radar' },
  { id: 'bsm', name: 'Blind Spot Monitor', icon: ScanLine, status: 'online', calibrationStatus: 'calibrated', lastCalibration: '2025-02-01', sensorType: 'Side Radar (L/R)' },
  { id: 'aeb', name: 'Auto Emergency Brake', icon: Shield, status: 'online', calibrationStatus: 'needs-calibration', lastCalibration: '2024-08-10', sensorType: 'Front Radar + Camera' },
  { id: 'park', name: 'Park Assist', icon: Car, status: 'online', calibrationStatus: 'calibrated', lastCalibration: '2025-01-28', sensorType: 'Ultrasonic Sensors' },
  { id: 'cta', name: 'Cross Traffic Alert', icon: Crosshair, status: 'offline', calibrationStatus: 'not-available', lastCalibration: 'N/A', sensorType: 'Rear Radar (L/R)' },
  { id: 'hud', name: 'Head-Up Display', icon: Zap, status: 'online', calibrationStatus: 'calibrated', lastCalibration: '2025-02-10', sensorType: 'HUD Projector' },
  { id: 'nightvision', name: 'Night Vision', icon: Eye, status: 'error', calibrationStatus: 'not-available', lastCalibration: 'N/A', sensorType: 'IR Camera' },
]

const calibrationHistory: CalibrationHistoryEntry[] = [
  { id: 'ch1', module: 'Lane Keep Assist', date: '2025-01-15', result: 'pass', technician: 'M. Schmidt', notes: 'Camera recalibrated after windshield replacement' },
  { id: 'ch2', module: 'Adaptive Cruise Control', date: '2024-09-20', result: 'fail', technician: 'J. Weber', notes: 'Radar misalignment detected. Requires physical adjustment.' },
  { id: 'ch3', module: 'Blind Spot Monitor', date: '2025-02-01', result: 'pass', technician: 'M. Schmidt', notes: 'Routine calibration check. All within spec.' },
  { id: 'ch4', module: 'Auto Emergency Brake', date: '2024-08-10', result: 'incomplete', technician: 'K. Braun', notes: 'Calibration interrupted by DTC C1102. Resolve fault first.' },
  { id: 'ch5', module: 'Park Assist', date: '2025-01-28', result: 'pass', technician: 'J. Weber', notes: 'Sensor replacement and recalibration. All 12 sensors verified.' },
]

const requiredTools: ToolItem[] = [
  { name: 'VAS 6430 Calibration Panel', required: true, available: true },
  { name: 'VAS 6640 Wheel Alignment Stand', required: true, available: true },
  { name: 'VAS 6350/6 Laser Measure', required: true, available: false },
  { name: 'ODIS Engineering Software', required: true, available: true },
  { name: 'VAS 6154 Diagnostic Unit', required: true, available: true },
  { name: 'Calibration Target Board (5-panel)', required: true, available: true },
  { name: 'Vehicle Battery Stabilizer', required: true, available: true },
  { name: 'Measuring Tape (5m, class II)', required: false, available: true },
  { name: 'Spirit Level (digital)', required: false, available: true },
  { name: 'IR Thermometer', required: false, available: false },
]

const workflowSteps: { id: WorkflowStep; label: string; description: string }[] = [
  { id: 'pre-check', label: 'Pre-Check', description: 'Verify vehicle conditions: tire pressure, fuel level, battery voltage, ride height, DTC check' },
  { id: 'setup', label: 'Setup', description: 'Position vehicle on level surface, mount calibration targets, connect diagnostic equipment' },
  { id: 'target-alignment', label: 'Target Alignment', description: 'Align calibration panels to vehicle centerline, set correct distances per OEM specifications' },
  { id: 'measurement', label: 'Measurement', description: 'Run automated measurement sequences for each ADAS sensor and camera' },
  { id: 'verification', label: 'Verification', description: 'Verify all measurements within tolerance, generate calibration report' },
]

function getCalibStatusColor(status: CalibrationStatus): string {
  switch (status) {
    case 'calibrated': return '#10b981'
    case 'needs-calibration': return '#f59e0b'
    case 'not-available': return '#475569'
  }
}

function getCalibStatusLabel(status: CalibrationStatus): string {
  switch (status) {
    case 'calibrated': return 'Calibrated'
    case 'needs-calibration': return 'Needs Calibration'
    case 'not-available': return 'Not Available'
  }
}

function getModuleStatusColor(status: ModuleStatus): string {
  switch (status) {
    case 'online': return '#10b981'
    case 'offline': return '#475569'
    case 'error': return '#ef4444'
  }
}

function getResultColor(result: string): string {
  switch (result) {
    case 'pass': return '#10b981'
    case 'fail': return '#ef4444'
    case 'incomplete': return '#f59e0b'
    default: return '#64748b'
  }
}

export function ADASView() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<WorkflowStep>('pre-check')
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [showRadarViz, setShowRadarViz] = useState(false)
  const [showCameraGrid, setShowCameraGrid] = useState(false)

  const startCalibration = useCallback(() => {
    setIsCalibrating(true)
    setCalibrationProgress(0)
    const steps = workflowSteps.map((s) => s.id)
    let stepIdx = 0
    let progress = 0

    const interval = setInterval(() => {
      progress += Math.random() * 8 + 2
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setTimeout(() => setIsCalibrating(false), 500)
      }
      setCalibrationProgress(Math.round(progress))

      const stepIndex = Math.min(Math.floor(progress / 20), steps.length - 1)
      if (stepIndex !== stepIdx) {
        stepIdx = stepIndex
        setActiveWorkflowStep(steps[stepIdx])
      }
    }, 400)
  }, [])

  const toolsReady = requiredTools.filter((t) => t.required).every((t) => t.available)

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">ADAS Calibration</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">ADAS</Badge>
          </div>
          <p className="text-xs text-[#64748b]">Advanced Driver Assistance Systems calibration</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={startCalibration}
            disabled={isCalibrating || !toolsReady}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              isCalibrating || !toolsReady
                ? 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            <Crosshair className="h-3 w-3" />
            {isCalibrating ? 'Calibrating...' : 'Start Calibration'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] gap-1.5"
          >
            <Download className="h-3 w-3" />
            Report
          </Button>
        </div>
      </div>

      {/* Calibration Progress */}
      {isCalibrating && (
        <Card className="bg-[#151d2b] border-[#00d4ff]/30">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#e2e8f0] font-semibold">Calibration in Progress</span>
              <span className="text-xs text-[#00d4ff] font-mono">{calibrationProgress}%</span>
            </div>
            <Progress value={calibrationProgress} className="h-2 bg-[#1e2a3a]" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748b]">Current step:</span>
              <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
                {workflowSteps.find((s) => s.id === activeWorkflowStep)?.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADAS Module Overview */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#00d4ff]" />
            ADAS System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {adasModules.map((module) => {
              const Icon = module.icon
              const calibColor = getCalibStatusColor(module.calibrationStatus)
              const statusColor = getModuleStatusColor(module.status)
              const isSelected = selectedModule === module.id

              return (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(isSelected ? null : module.id)}
                  className={cn(
                    'bg-[#0f1923] border rounded-lg p-3 text-left transition-all hover:border-[#2d3f55]',
                    isSelected ? 'border-[#00d4ff]/50' : 'border-[#1e2a3a]'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md" style={{ backgroundColor: `${calibColor}15` }}>
                        <Icon className="h-4 w-4" style={{ color: calibColor }} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
                      </div>
                    </div>
                    <Badge
                      className="text-[8px] border-0 px-1.5 py-0 h-4"
                      style={{ color: calibColor, backgroundColor: `${calibColor}20` }}
                    >
                      {getCalibStatusLabel(module.calibrationStatus)}
                    </Badge>
                  </div>
                  <div className="text-xs font-semibold text-[#e2e8f0] mb-0.5">{module.name}</div>
                  <div className="text-[9px] text-[#475569]">{module.sensorType}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-2.5 w-2.5 text-[#475569]" />
                    <span className="text-[9px] text-[#475569]">
                      {module.lastCalibration !== 'N/A' ? `Last: ${module.lastCalibration}` : 'No calibration data'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calibration Workflow */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[#00d4ff]" />
            Calibration Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {workflowSteps.map((step, idx) => {
              const isActive = step.id === activeWorkflowStep
              const isPast = workflowSteps.findIndex((s) => s.id === activeWorkflowStep) > idx
              return (
                <div key={step.id} className="flex items-start min-w-[160px]">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        isPast ? 'bg-[#10b981]/20 text-[#10b981]' :
                        isActive ? 'bg-[#00d4ff]/20 text-[#00d4ff] ring-2 ring-[#00d4ff]/30' :
                        'bg-[#1e2a3a] text-[#475569]'
                      )}
                    >
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    <div className={cn(
                      'text-[10px] font-semibold mt-1.5 text-center',
                      isActive ? 'text-[#00d4ff]' : isPast ? 'text-[#10b981]' : 'text-[#475569]'
                    )}>
                      {step.label}
                    </div>
                    <div className="text-[8px] text-[#475569] text-center mt-0.5 px-1 leading-tight">
                      {step.description}
                    </div>
                  </div>
                  {idx < workflowSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-[#1e2a3a] mt-2 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Camera Grid & Radar Alignment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camera Calibration Grid */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Camera className="h-4 w-4 text-[#00d4ff]" />
                Camera Calibration Grid
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCameraGrid(!showCameraGrid)}
                className="h-6 text-[9px] border-[#1e2a3a] bg-[#151d2b] text-[#64748b]"
              >
                {showCameraGrid ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCameraGrid ? (
              <div className="bg-[#0a0f18] border border-[#1e2a3a] rounded-lg h-52 relative overflow-hidden">
                {/* Camera calibration grid visualization */}
                <svg className="w-full h-full" viewBox="0 0 200 120">
                  {/* Grid lines */}
                  {Array.from({ length: 11 }).map((_, i) => (
                    <line key={`vg-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="120" stroke="#1e2a3a" strokeWidth="0.5" />
                  ))}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <line key={`hg-${i}`} x1="0" y1={i * 20} x2="200" y2={i * 20} stroke="#1e2a3a" strokeWidth="0.5" />
                  ))}
                  {/* Center crosshair */}
                  <line x1="100" y1="0" x2="100" y2="120" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.5" />
                  <line x1="0" y1="60" x2="200" y2="60" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.5" />
                  {/* Calibration target boxes */}
                  <rect x="40" y="20" width="30" height="24" fill="none" stroke="#10b981" strokeWidth="1" rx="1" />
                  <rect x="130" y="20" width="30" height="24" fill="none" stroke="#10b981" strokeWidth="1" rx="1" />
                  <rect x="85" y="70" width="30" height="24" fill="none" stroke="#10b981" strokeWidth="1" rx="1" />
                  {/* Detection dots */}
                  <circle cx="55" cy="32" r="3" fill="#10b981" opacity="0.8" />
                  <circle cx="145" cy="32" r="3" fill="#10b981" opacity="0.8" />
                  <circle cx="100" cy="82" r="3" fill="#10b981" opacity="0.8" />
                  {/* Labels */}
                  <text x="55" y="16" textAnchor="middle" fill="#64748b" fontSize="5">LEFT</text>
                  <text x="145" y="16" textAnchor="middle" fill="#64748b" fontSize="5">RIGHT</text>
                  <text x="100" y="108" textAnchor="middle" fill="#64748b" fontSize="5">CENTER</text>
                </svg>
                <div className="absolute bottom-2 left-2 text-[8px] text-[#64748b] font-mono">
                  FOV: 52° | Resolution: 1280x720 | FPS: 30
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="text-[8px] border-0 px-1.5 py-0 h-4 bg-[#10b981]/20 text-[#10b981]">TRACKED</Badge>
                </div>
              </div>
            ) : (
              <div className="bg-[#0a0f18] border border-[#1e2a3a] rounded-lg h-52 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-6 w-6 text-[#475569] mx-auto mb-2" />
                  <p className="text-[10px] text-[#475569]">Click Show to view camera grid</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Alignment */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#8b5cf6]" />
                Radar Alignment
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRadarViz(!showRadarViz)}
                className="h-6 text-[9px] border-[#1e2a3a] bg-[#151d2b] text-[#64748b]"
              >
                {showRadarViz ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showRadarViz ? (
              <div className="bg-[#0a0f18] border border-[#1e2a3a] rounded-lg h-52 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 200 120">
                  {/* Radar cone */}
                  <polygon points="100,115 30,20 170,20" fill="#8b5cf6" opacity="0.05" />
                  <line x1="100" y1="115" x2="30" y2="20" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
                  <line x1="100" y1="115" x2="170" y2="20" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
                  {/* Range rings */}
                  <ellipse cx="100" cy="115" rx="25" ry="20" fill="none" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.2" />
                  <ellipse cx="100" cy="115" rx="50" ry="40" fill="none" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.2" />
                  <ellipse cx="100" cy="115" rx="70" ry="55" fill="none" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.2" />
                  {/* Center line */}
                  <line x1="100" y1="115" x2="100" y2="20" stroke="#8b5cf6" strokeWidth="0.5" strokeDasharray="3 2" opacity="0.5" />
                  {/* Detected objects */}
                  <circle cx="95" cy="55" r="3" fill="#f59e0b" opacity="0.8" />
                  <circle cx="115" cy="40" r="2" fill="#64748b" opacity="0.5" />
                  <circle cx="80" cy="70" r="2.5" fill="#64748b" opacity="0.4" />
                  {/* Radar unit */}
                  <rect x="94" y="108" width="12" height="8" fill="#8b5cf6" opacity="0.6" rx="1" />
                  {/* Labels */}
                  <text x="100" y="118" textAnchor="middle" fill="#8b5cf6" fontSize="4" opacity="0.8">FRONT RADAR</text>
                  <text x="30" y="14" fill="#64748b" fontSize="4">-15°</text>
                  <text x="162" y="14" fill="#64748b" fontSize="4">+15°</text>
                </svg>
                <div className="absolute bottom-2 left-2 text-[8px] text-[#64748b] font-mono">
                  Range: 0-170m | Angle: ±15° | Freq: 76-77 GHz
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="text-[8px] border-0 px-1.5 py-0 h-4 bg-[#f59e0b]/20 text-[#f59e0b]">MISALIGNED</Badge>
                </div>
              </div>
            ) : (
              <div className="bg-[#0a0f18] border border-[#1e2a3a] rounded-lg h-52 flex items-center justify-center">
                <div className="text-center">
                  <Radio className="h-6 w-6 text-[#475569] mx-auto mb-2" />
                  <p className="text-[10px] text-[#475569]">Click Show to view radar alignment</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sensor Coverage Diagram */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-[#00d4ff]" />
            Sensor Coverage Diagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-[#0a0f18] border border-[#1e2a3a] rounded-lg h-64 relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 300 180">
              {/* Vehicle outline */}
              <rect x="120" y="55" width="60" height="90" rx="10" fill="#1e2a3a" stroke="#2d3f55" strokeWidth="1" />
              <text x="150" y="105" textAnchor="middle" fill="#64748b" fontSize="7">VEHICLE</text>

              {/* Front camera FOV */}
              <polygon points="150,50 90,10 210,10" fill="#00d4ff" opacity="0.08" />
              <line x1="150" y1="50" x2="90" y2="10" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <line x1="150" y1="50" x2="210" y2="10" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <text x="150" y="18" textAnchor="middle" fill="#00d4ff" fontSize="5">CAMERA</text>

              {/* Front radar FOV */}
              <polygon points="150,50 110,15 190,15" fill="#8b5cf6" opacity="0.08" />
              <line x1="150" y1="50" x2="110" y2="15" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
              <line x1="150" y1="50" x2="190" y2="15" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
              <text x="150" y="8" textAnchor="middle" fill="#8b5cf6" fontSize="5">RADAR</text>

              {/* Left blind spot */}
              <polygon points="120,60 70,50 70,100 120,110" fill="#f59e0b" opacity="0.08" />
              <line x1="120" y1="60" x2="70" y2="50" stroke="#f59e0b" strokeWidth="0.5" opacity="0.3" />
              <line x1="120" y1="110" x2="70" y2="100" stroke="#f59e0b" strokeWidth="0.5" opacity="0.3" />
              <text x="80" y="82" textAnchor="middle" fill="#f59e0b" fontSize="5">BSM L</text>

              {/* Right blind spot */}
              <polygon points="180,60 230,50 230,100 180,110" fill="#f59e0b" opacity="0.08" />
              <line x1="180" y1="60" x2="230" y2="50" stroke="#f59e0b" strokeWidth="0.5" opacity="0.3" />
              <line x1="180" y1="110" x2="230" y2="100" stroke="#f59e0b" strokeWidth="0.5" opacity="0.3" />
              <text x="220" y="82" textAnchor="middle" fill="#f59e0b" fontSize="5">BSM R</text>

              {/* Rear cross traffic */}
              <polygon points="150,150 100,175 200,175" fill="#ef4444" opacity="0.08" />
              <line x1="150" y1="150" x2="100" y2="175" stroke="#ef4444" strokeWidth="0.5" opacity="0.3" />
              <line x1="150" y1="150" x2="200" y2="175" stroke="#ef4444" strokeWidth="0.5" opacity="0.3" />
              <text x="150" y="172" textAnchor="middle" fill="#ef4444" fontSize="5">CROSS TRAFFIC</text>

              {/* Ultrasonic sensors */}
              {[
                { x: 125, y: 52, label: 'US' },
                { x: 140, y: 50, label: 'US' },
                { x: 160, y: 50, label: 'US' },
                { x: 175, y: 52, label: 'US' },
                { x: 125, y: 148, label: 'US' },
                { x: 140, y: 150, label: 'US' },
                { x: 160, y: 150, label: 'US' },
                { x: 175, y: 148, label: 'US' },
              ].map((sensor, i) => (
                <g key={`us-${i}`}>
                  <circle cx={sensor.x} cy={sensor.y} r="4" fill="#10b981" opacity="0.3" />
                  <circle cx={sensor.x} cy={sensor.y} r="1.5" fill="#10b981" opacity="0.8" />
                </g>
              ))}
            </svg>
            {/* Legend */}
            <div className="absolute bottom-2 right-2 flex items-center gap-3 text-[7px]">
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-[#00d4ff]" /> Camera</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-[#8b5cf6]" /> Radar</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-[#f59e0b]" /> BSM</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-[#ef4444]" /> Rear</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-[#10b981]" /> US</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Tools & Calibration History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Required Tools Checklist */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Wrench className="h-4 w-4 text-[#f59e0b]" />
                Required Tools & Equipment
              </CardTitle>
              <Badge className={cn(
                'text-[9px] border-0 px-1.5 py-0 h-4',
                toolsReady
                  ? 'bg-[#10b981]/20 text-[#10b981]'
                  : 'bg-[#ef4444]/20 text-[#ef4444]'
              )}>
                {toolsReady ? 'ALL READY' : 'MISSING ITEMS'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {requiredTools.map((tool) => (
              <div key={tool.name} className="flex items-center gap-2 py-1.5 border-b border-[#1e2a3a]/50 last:border-0">
                {tool.available ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981] flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444] flex-shrink-0" />
                )}
                <span className={cn(
                  'text-xs flex-1',
                  tool.available ? 'text-[#e2e8f0]' : 'text-[#ef4444]'
                )}>
                  {tool.name}
                </span>
                {tool.required && (
                  <Badge className="text-[8px] border-0 px-1 py-0 h-3 bg-[#f59e0b]/20 text-[#f59e0b]">REQ</Badge>
                )}
                {!tool.required && (
                  <Badge className="text-[8px] border-0 px-1 py-0 h-3 bg-[#1e2a3a] text-[#475569]">OPT</Badge>
                )}
              </div>
            ))}
            {!toolsReady && (
              <div className="mt-3 p-2 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-md">
                <p className="text-[10px] text-[#ef4444]">
                  ⚠️ Missing required tools. Calibration cannot proceed until all required items are available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calibration History */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#64748b]" />
              Calibration History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {calibrationHistory.map((entry) => (
              <div key={entry.id} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#e2e8f0]">{entry.module}</span>
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-4"
                    style={{ color: getResultColor(entry.result), backgroundColor: `${getResultColor(entry.result)}20` }}
                  >
                    {entry.result.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-[#475569]">
                  <span>{entry.date}</span>
                  <span>•</span>
                  <span>{entry.technician}</span>
                </div>
                <p className="text-[10px] text-[#64748b] mt-1 leading-relaxed">{entry.notes}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
