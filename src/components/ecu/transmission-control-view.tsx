'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cpu,
  Settings,
  RotateCcw,
  Zap,
  Shield,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  ChevronRight,
  Gauge,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// TCU Identification
const TCU_INFO = {
  partNumber: '0B5 927 156 AL',
  softwareVersion: 'v4521.8.0.3',
  hardwareVersion: 'HW-03 Rev.D',
  calibrationId: 'CAL-DQ381-7A-EU6',
  supplier: 'BorgWarner',
  manufacturingDate: '2022-11-14',
  serialNumber: 'BW-DQ381-2247810',
}

// Shift Map Grid - throttle position vs gear shift points (RPM)
const SHIFT_MAP_UP = [
  { throttle: '10%', g1: 1800, g2: 2200, g3: 2600, g4: 2800, g5: 3000, g6: 3200 },
  { throttle: '25%', g1: 2400, g2: 2800, g3: 3200, g4: 3400, g5: 3600, g6: 3800 },
  { throttle: '50%', g1: 3400, g2: 3800, g3: 4200, g4: 4400, g5: 4600, g6: 4800 },
  { throttle: '75%', g1: 4400, g2: 4800, g3: 5200, g4: 5400, g5: 5600, g6: 5800 },
  { throttle: '100%', g1: 5800, g2: 6200, g3: 6400, g4: 6600, g5: 6800, g6: 7000 },
]

// Adaptation channels
const ADAPTATION_CHANNELS = [
  { id: 1, name: 'Clutch A Fill', current: 0.82, target: 0.80, unit: 'A', status: 'OK' },
  { id: 2, name: 'Clutch B Fill', current: 0.91, target: 0.85, unit: 'A', status: 'Adjust' },
  { id: 3, name: 'Shift 1-2 Pressure', current: 3.2, target: 3.0, unit: 'bar', status: 'OK' },
  { id: 4, name: 'Shift 2-3 Pressure', current: 2.8, target: 3.0, unit: 'bar', status: 'Adjust' },
  { id: 5, name: 'Shift 3-4 Pressure', current: 3.1, target: 3.0, unit: 'bar', status: 'OK' },
  { id: 6, name: 'TC Lockup Pressure', current: 4.1, target: 4.2, unit: 'bar', status: 'OK' },
  { id: 7, name: 'Clutch A Kiss Point', current: 1.24, target: 1.20, unit: 'mm', status: 'Adjust' },
  { id: 8, name: 'Clutch B Kiss Point', current: 1.18, target: 1.20, unit: 'mm', status: 'OK' },
]

// TCU Coding variants
const CODING_OPTIONS = [
  { name: 'Start-Stop System', enabled: true, desc: 'Engine auto start/stop at idle' },
  { name: 'Launch Control', enabled: false, desc: 'Performance launch from standstill' },
  { name: 'Hill Hold Assist', enabled: true, desc: 'Automatic brake on inclines' },
  { name: 'Coasting Mode', enabled: true, desc: 'Fuel-saving freewheel mode' },
  { name: 'Sport Mode Default', enabled: false, desc: 'Always start in Sport mode' },
  { name: 'Shift Indicator', enabled: true, desc: 'Dashboard shift point display' },
  { name: 'Tow Mode', enabled: false, desc: 'Adjusted shift maps for towing' },
  { name: 'Winter Mode', enabled: false, desc: '2nd gear starts for low traction' },
]

// Solenoid data
const SOLENOIDS = [
  { id: 'N88', name: 'Shift Solenoid 1', state: 'OFF', current: 0.0, pressure: 0.0 },
  { id: 'N89', name: 'Shift Solenoid 2', state: 'ON', current: 0.82, pressure: 3.2 },
  { id: 'N90', name: 'Shift Solenoid 3', state: 'OFF', current: 0.0, pressure: 0.0 },
  { id: 'N91', name: 'TC Lockup Sol.', state: 'ON', current: 0.91, pressure: 4.1 },
  { id: 'N92', name: 'Pressure Ctrl 1', state: 'PWM', current: 0.54, pressure: 2.1 },
  { id: 'N93', name: 'Pressure Ctrl 2', state: 'PWM', current: 0.67, pressure: 2.8 },
]

// Learning procedure steps
const LEARNING_STEPS = [
  { step: 1, desc: 'Ensure transmission at operating temp (60-90°C)', status: 'Complete' },
  { step: 2, desc: 'Clear all adaptation values', status: 'Complete' },
  { step: 3, desc: 'Select D mode, accelerate gently to 80 km/h', status: 'Complete' },
  { step: 4, desc: 'Coast to stop without braking (repeat 3x)', status: 'In Progress' },
  { step: 5, desc: 'Perform 1-2-3-4 upshifts at 25% throttle (5x)', status: 'Pending' },
  { step: 6, desc: 'Perform 4-3-2-1 downshifts (5x)', status: 'Pending' },
  { step: 7, desc: 'Drive in S mode through all gears', status: 'Pending' },
  { step: 8, desc: 'Verify adaptation values are within spec', status: 'Pending' },
]

// Flash info
const FLASH_INFO = {
  currentVersion: 'v4521.8.0.3',
  availableVersion: 'v4521.9.1.0',
  calibrationCurrent: 'CAL-DQ381-7A-EU6',
  calibrationAvailable: 'CAL-DQ381-7A-EU6b',
  fileSize: '2.4 MB',
  releaseNotes: 'Improved shift quality for cold starts, revised TCC lockup strategy, DCT clutch wear compensation update',
}

export function TransmissionControlView() {
  const [resettingChannels, setResettingChannels] = useState<Set<number>>(new Set())
  const [currentLearningStep, setCurrentLearningStep] = useState(4)
  const [isFlashing, setIsFlashing] = useState(false)
  const [flashProgress, setFlashProgress] = useState(0)

  const handleResetChannel = (id: number) => {
    setResettingChannels(prev => new Set(prev).add(id))
    setTimeout(() => {
      setResettingChannels(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 1500)
  }

  const handleStartFlash = () => {
    setIsFlashing(true)
    setFlashProgress(0)
    const interval = setInterval(() => {
      setFlashProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsFlashing(false)
          return 100
        }
        return prev + 2
      })
    }, 100)
  }

  const handleStartLearning = () => {
    setCurrentLearningStep(1)
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Transmission Control Module</h1>
          </div>
          <p className="text-xs text-[#64748b]">
            TCU programming, adaptation, and shift map configuration
          </p>
        </div>
        <Button size="sm" onClick={handleStartLearning} className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
          <Play className="h-3 w-3" />
          Start Learning Procedure
        </Button>
      </div>

      {/* TCU Identification + Shift Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TCU Identification */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#00d4ff]" />
              TCU Identification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: 'Part Number', value: TCU_INFO.partNumber },
                { label: 'Software Version', value: TCU_INFO.softwareVersion },
                { label: 'Hardware Version', value: TCU_INFO.hardwareVersion },
                { label: 'Calibration ID', value: TCU_INFO.calibrationId },
                { label: 'Supplier', value: TCU_INFO.supplier },
                { label: 'Manufacturing Date', value: TCU_INFO.manufacturingDate },
                { label: 'Serial Number', value: TCU_INFO.serialNumber },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1e2a3a]/50 last:border-0">
                  <span className="text-[11px] text-[#64748b]">{item.label}</span>
                  <span className="text-[11px] font-mono text-[#e2e8f0]">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shift Map Editor */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#00d4ff]" />
              Shift Map - Upshift Points (RPM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 pr-2">Throttle</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-1">1→2</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-1">2→3</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-1">3→4</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-1">4→5</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-1">5→6</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-1">6→7</th>
                  </tr>
                </thead>
                <tbody>
                  {SHIFT_MAP_UP.map((row, i) => {
                    const rpmColor = i < 2 ? '#10b981' : i < 4 ? '#f59e0b' : '#ef4444'
                    return (
                      <tr key={i} className="border-b border-[#1e2a3a]/30 hover:bg-[#1e2a3a]/20 transition-colors">
                        <td className="py-2 pr-2 font-semibold text-[#94a3b8]">{row.throttle}</td>
                        <td className="text-center py-2 px-1 font-mono tabular-nums" style={{ color: rpmColor }}>{row.g1}</td>
                        <td className="text-center py-2 px-1 font-mono tabular-nums" style={{ color: rpmColor }}>{row.g2}</td>
                        <td className="text-center py-2 px-1 font-mono tabular-nums" style={{ color: rpmColor }}>{row.g3}</td>
                        <td className="text-center py-2 px-1 font-mono tabular-nums" style={{ color: rpmColor }}>{row.g4}</td>
                        <td className="text-center py-2 px-1 font-mono tabular-nums" style={{ color: rpmColor }}>{row.g5}</td>
                        <td className="text-center py-2 px-1 font-mono tabular-nums" style={{ color: rpmColor }}>{row.g6}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#10b981]" /><span className="text-[9px] text-[#475569]">Economy</span></div>
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /><span className="text-[9px] text-[#475569]">Normal</span></div>
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" /><span className="text-[9px] text-[#475569]">Full Load</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adaptation Values + TCU Coding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Adaptation Values */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#00d4ff]" />
              Adaptation Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {ADAPTATION_CHANNELS.map((ch) => {
                const needsAdjust = ch.status === 'Adjust'
                const diff = Math.abs(ch.current - ch.target)
                return (
                  <div key={ch.id} className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
                    needsAdjust ? 'bg-[#f59e0b]/5 border-[#f59e0b]/30' : 'bg-[#0f1923] border-[#1e2a3a]'
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-[#e2e8f0]">{ch.name}</span>
                        {needsAdjust && <AlertTriangle className="h-3 w-3 text-[#f59e0b]" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#64748b]">Current:</span>
                        <span className="text-[10px] font-mono text-[#e2e8f0] tabular-nums">{ch.current} {ch.unit}</span>
                        <ArrowRight className="h-3 w-3 text-[#475569]" />
                        <span className="text-[10px] text-[#64748b]">Target:</span>
                        <span className="text-[10px] font-mono text-[#00d4ff] tabular-nums">{ch.target} {ch.unit}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetChannel(ch.id)}
                      disabled={resettingChannels.has(ch.id)}
                      className="h-6 text-[9px] gap-1 border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff]/40 flex-shrink-0"
                    >
                      {resettingChannels.has(ch.id) ? (
                        <><RotateCcw className="h-2.5 w-2.5 animate-spin" />Resetting</>
                      ) : (
                        <><RotateCcw className="h-2.5 w-2.5" />Reset</>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* TCU Coding */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#00d4ff]" />
              TCU Coding - Variant Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {CODING_OPTIONS.map((opt, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55] transition-colors">
                  <div className={cn(
                    'h-5 w-9 rounded-full flex items-center transition-colors cursor-pointer relative',
                    opt.enabled ? 'bg-[#00d4ff]/30' : 'bg-[#1e2a3a]'
                  )}>
                    <div className={cn(
                      'h-4 w-4 rounded-full absolute top-0.5 transition-all',
                      opt.enabled ? 'bg-[#00d4ff] left-[18px] shadow-[0_0_6px_#00d4ff60]' : 'bg-[#475569] left-0.5'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[11px] font-semibold', opt.enabled ? 'text-[#e2e8f0]' : 'text-[#64748b]')}>
                      {opt.name}
                    </div>
                    <div className="text-[9px] text-[#475569]">{opt.desc}</div>
                  </div>
                  {opt.enabled && <CheckCircle2 className="h-4 w-4 text-[#00d4ff] flex-shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Pressure + Torque Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Shift Pressure Control */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#00d4ff]" />
              Solenoid Activation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {SOLENOIDS.map((sol) => {
                const stateColor = sol.state === 'ON' ? '#10b981' : sol.state === 'PWM' ? '#00d4ff' : '#475569'
                return (
                  <div key={sol.id} className="flex items-center gap-3 p-2.5 bg-[#0f1923] border border-[#1e2a3a] rounded-lg hover:border-[#2d3f55] transition-colors">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-[#1e2a3a] flex-shrink-0">
                      <span className="text-[9px] font-mono font-bold text-[#94a3b8]">{sol.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-[#e2e8f0]">{sol.name}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[9px] text-[#475569]">Current: <span className="font-mono text-[#94a3b8]">{sol.current.toFixed(2)}A</span></span>
                        <span className="text-[9px] text-[#475569]">Pressure: <span className="font-mono text-[#94a3b8]">{sol.pressure.toFixed(1)} bar</span></span>
                      </div>
                    </div>
                    <Badge className="text-[8px] border-0 px-1.5 py-0 h-4" style={{ backgroundColor: `${stateColor}20`, color: stateColor }}>
                      {sol.state}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Torque Management */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              Torque Management During Shifts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Engine Torque Reduction</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] text-[#475569]">Upshift Reduction</div>
                  <div className="text-lg font-bold text-[#f59e0b] tabular-nums">-45 Nm</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Downshift Reduction</div>
                  <div className="text-lg font-bold text-[#00d4ff] tabular-nums">-30 Nm</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Reduction Duration</div>
                  <div className="text-sm font-bold text-[#e2e8f0] tabular-nums">280 ms</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Ramp Rate</div>
                  <div className="text-sm font-bold text-[#e2e8f0] tabular-nums">120 Nm/s</div>
                </div>
              </div>
            </div>
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Ignition Retard</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-[9px] text-[#475569]">Upshift</div>
                  <div className="text-sm font-bold text-[#f59e0b]">-8°</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-[#475569]">Downshift</div>
                  <div className="text-sm font-bold text-[#00d4ff]">-5°</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-[#475569]">Duration</div>
                  <div className="text-sm font-bold text-[#e2e8f0]">200 ms</div>
                </div>
              </div>
            </div>
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Fuel Cut Strategy</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748b]">Partial fuel cut during upshift</span>
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Procedure + TCU Flash */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Learning Procedure */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-[#00d4ff]" />
              Guided Adaptation Procedure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {LEARNING_STEPS.map((step) => {
                const isComplete = step.status === 'Complete'
                const isCurrent = step.step === currentLearningStep
                return (
                  <div key={step.step} className={cn(
                    'flex items-start gap-3 p-2.5 rounded-lg border transition-colors',
                    isComplete ? 'bg-[#10b981]/5 border-[#10b981]/30' :
                    isCurrent ? 'bg-[#00d4ff]/5 border-[#00d4ff]/30' :
                    'bg-[#0f1923] border-[#1e2a3a]'
                  )}>
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                      isComplete ? 'bg-[#10b981]/20 text-[#10b981]' :
                      isCurrent ? 'bg-[#00d4ff]/20 text-[#00d4ff]' :
                      'bg-[#1e2a3a] text-[#475569]'
                    )}>
                      {isComplete ? '✓' : step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-[11px]',
                        isComplete ? 'text-[#10b981]' : isCurrent ? 'text-[#00d4ff]' : 'text-[#64748b]'
                      )}>
                        {step.desc}
                      </div>
                    </div>
                    <Badge className={cn(
                      'text-[8px] border-0 px-1.5 py-0 h-4 flex-shrink-0',
                      isComplete ? 'bg-[#10b981]/20 text-[#10b981]' :
                      isCurrent ? 'bg-[#00d4ff]/20 text-[#00d4ff]' :
                      'bg-[#1e2a3a] text-[#475569]'
                    )}>
                      {step.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#00d4ff] transition-all" style={{ width: `${(3 / 8) * 100}%` }} />
              </div>
              <div className="text-[9px] text-[#64748b] mt-1">Step 4 of 8 — 37% complete</div>
            </div>
          </CardContent>
        </Card>

        {/* TCU Flash */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Download className="h-4 w-4 text-[#00d4ff]" />
              TCU Firmware Flash
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="text-[9px] text-[#475569] uppercase tracking-wider">Current Version</div>
                <div className="text-sm font-mono font-bold text-[#94a3b8] mt-1">{FLASH_INFO.currentVersion}</div>
                <div className="text-[9px] text-[#475569] mt-1">{FLASH_INFO.calibrationCurrent}</div>
              </div>
              <div className="bg-[#0f1923] border border-[#10b981]/30 rounded-lg p-3">
                <div className="text-[9px] text-[#475569] uppercase tracking-wider">Available Version</div>
                <div className="text-sm font-mono font-bold text-[#10b981] mt-1">{FLASH_INFO.availableVersion}</div>
                <div className="text-[9px] text-[#475569] mt-1">{FLASH_INFO.calibrationAvailable}</div>
              </div>
            </div>
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-1">Release Notes</div>
              <div className="text-[10px] text-[#94a3b8]">{FLASH_INFO.releaseNotes}</div>
              <div className="text-[9px] text-[#475569] mt-1">File size: {FLASH_INFO.fileSize}</div>
            </div>
            {isFlashing && (
              <div className="bg-[#0f1923] border border-[#00d4ff]/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#00d4ff] font-semibold">Flashing in progress...</span>
                  <span className="text-xs font-bold text-[#00d4ff] tabular-nums">{flashProgress}%</span>
                </div>
                <div className="h-2 w-full bg-[#0f1923] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#00d4ff] transition-all" style={{ width: `${flashProgress}%`, boxShadow: '0 0 8px #00d4ff40' }} />
                </div>
                <div className="text-[9px] text-[#475569] mt-1">Do not turn off ignition or disconnect device</div>
              </div>
            )}
            <Button
              size="sm"
              onClick={handleStartFlash}
              disabled={isFlashing}
              className="w-full h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
            >
              {isFlashing ? (
                <><RotateCcw className="h-3 w-3 animate-spin" />Flashing...</>
              ) : (
                <><Download className="h-3 w-3" />Flash Firmware</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
