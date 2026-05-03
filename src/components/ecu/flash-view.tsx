'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Zap,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Cpu,
  RotateCcw,
  ChevronRight,
  ArrowRight,
  History,
  FileWarning,
  Battery,
  KeyRound,
  Wifi,
  Save,
} from 'lucide-react'
import { useState, useEffect } from 'react'

type FlashType = 'full' | 'partial' | 'calibration' | 'bootloader'
type FlashStage = 'idle' | 'erasing' | 'writing' | 'verifying' | 'completing'

const flashTypes: { id: FlashType; label: string; desc: string; risk: 'low' | 'medium' | 'high' }[] = [
  { id: 'full', label: 'Full Flash', desc: 'Complete firmware replacement', risk: 'high' },
  { id: 'partial', label: 'Partial Flash', desc: 'Selective region update', risk: 'medium' },
  { id: 'calibration', label: 'Calibration Only', desc: 'Maps & tables only', risk: 'low' },
  { id: 'bootloader', label: 'Bootloader', desc: 'Boot loader update', risk: 'high' },
]

const firmwareFiles = [
  { name: 'MED17.5.1_v4.2.3_full.bin', version: 'v4.2.3', size: '2.4 MB', date: '2026-04-20', compatible: true, checksum: 'A7F2C9D1' },
  { name: 'MED17.5.1_v4.2.2_full.bin', version: 'v4.2.2', size: '2.4 MB', date: '2026-03-15', compatible: true, checksum: 'B3E8D4F6' },
  { name: 'MED17.5.1_v4.1.8_cal.bin', version: 'v4.1.8', size: '512 KB', date: '2026-02-08', compatible: true, checksum: 'C9A1E7B3' },
  { name: 'EDC17C46_v3.9.1_full.bin', version: 'v3.9.1', size: '3.1 MB', date: '2026-01-22', compatible: false, checksum: 'D4F6B2C8' },
  { name: 'MED17.5.1_boot_v2.1.bin', version: 'v2.1', size: '128 KB', date: '2025-12-10', compatible: true, checksum: 'E8C3D5A9' },
]

const preFlashChecks = [
  { id: 'battery', label: 'Battery voltage ≥ 12.5V', icon: Battery, status: 'pass' as const, value: '13.2V' },
  { id: 'ignition', label: 'Ignition ON (engine off)', icon: KeyRound, status: 'pass' as const, value: 'ON' },
  { id: 'connection', label: 'Stable connection established', icon: Wifi, status: 'pass' as const, value: 'Stable' },
  { id: 'backup', label: 'Calibration backup created', icon: Save, status: 'warning' as const, value: 'Pending' },
]

const flashHistory = [
  { date: '2026-04-25 14:32', type: 'Calibration', version: 'v4.2.3', status: 'success', duration: '2m 14s' },
  { date: '2026-03-15 09:18', type: 'Full Flash', version: 'v4.2.2', status: 'success', duration: '8m 42s' },
  { date: '2026-02-08 16:45', type: 'Calibration', version: 'v4.1.8', status: 'success', duration: '1m 58s' },
  { date: '2025-12-10 11:22', type: 'Bootloader', version: 'v2.1', status: 'failed', duration: '3m 05s' },
  { date: '2025-11-03 08:55', type: 'Full Flash', version: 'v4.0.0', status: 'success', duration: '9m 12s' },
]

const riskWarnings = [
  { level: 'high', text: 'Interrupting a flash operation may brick the ECU. Ensure stable power and connection.' },
  { level: 'medium', text: 'Full flash will overwrite all calibration data. Backup recommended before proceeding.' },
  { level: 'high', text: 'Bootloader flash failure requires JTAG recovery. Ensure correct firmware file is selected.' },
]

export function FlashView() {
  const [selectedType, setSelectedType] = useState<FlashType>('calibration')
  const [selectedFirmware, setSelectedFirmware] = useState(0)
  const [flashStage, setFlashStage] = useState<FlashStage>('idle')
  const [flashProgress, setFlashProgress] = useState(0)

  const currentEcuInfo = {
    ecuId: 'MED17.5.1',
    hardwareVersion: 'HW-03',
    softwareVersion: 'SW v4.2.1',
    calibrationVersion: 'CAL v4.2.1-A',
    partNumber: '03L 906 018 Q',
  }

  // Simulate flash progress
  useEffect(() => {
    if (flashStage === 'idle') return

    const stageMap: Record<FlashStage, { next: FlashStage; maxProgress: number }> = {
      idle: { next: 'erasing', maxProgress: 0 },
      erasing: { next: 'writing', maxProgress: 25 },
      writing: { next: 'verifying', maxProgress: 75 },
      verifying: { next: 'completing', maxProgress: 95 },
      completing: { next: 'idle', maxProgress: 100 },
    }

    const interval = setInterval(() => {
      setFlashProgress(prev => {
        const maxP = stageMap[flashStage].maxProgress
        if (prev >= maxP) {
          if (flashStage === 'completing') {
            setFlashStage('idle')
            return 100
          }
          setFlashStage(stageMap[flashStage].next)
          return prev
        }
        return prev + 1
      })
    }, 80)

    return () => clearInterval(interval)
  }, [flashStage])

  const startFlash = () => {
    setFlashProgress(0)
    setFlashStage('erasing')
  }

  const stageIndicators: { stage: FlashStage; label: string }[] = [
    { stage: 'erasing', label: 'Erasing' },
    { stage: 'writing', label: 'Writing' },
    { stage: 'verifying', label: 'Verifying' },
    { stage: 'completing', label: 'Completing' },
  ]

  const getStageStatus = (stage: FlashStage) => {
    const order = ['idle', 'erasing', 'writing', 'verifying', 'completing']
    const currentIdx = order.indexOf(flashStage)
    const stageIdx = order.indexOf(stage)
    if (flashStage === 'idle' && flashProgress < 100) return 'pending'
    if (flashStage === 'idle' && flashProgress >= 100) return 'complete'
    if (stageIdx < currentIdx) return 'complete'
    if (stageIdx === currentIdx) return 'active'
    return 'pending'
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">ECU Flash</h1>
            <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">
              EXPERT
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">Firmware flashing and programming interface</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs bg-[#10b981] text-white hover:bg-[#059669] font-semibold gap-1.5"
            onClick={startFlash}
            disabled={flashStage !== 'idle'}
          >
            <Download className="h-3 w-3" />
            {flashStage === 'idle' ? 'Start Flash' : 'Flashing...'}
          </Button>
          <Button size="sm" className="h-8 text-xs bg-[#151d2b] text-[#94a3b8] border border-[#1e2a3a] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5">
            <RotateCcw className="h-3 w-3" />
            Abort
          </Button>
        </div>
      </div>

      {/* Flash Operation Type Selector */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#00d4ff]" />
            Flash Operation Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {flashTypes.map(ft => (
              <button
                key={ft.id}
                onClick={() => setSelectedType(ft.id)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedType === ft.id
                    ? 'border-[#00d4ff]/50 bg-[#00d4ff]/10'
                    : 'border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                }`}
              >
                <div className="text-xs font-semibold text-[#e2e8f0] mb-1">{ft.label}</div>
                <p className="text-[10px] text-[#475569] mb-2">{ft.desc}</p>
                <Badge
                  className={`text-[8px] ${
                    ft.risk === 'high'
                      ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                      : ft.risk === 'medium'
                      ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                      : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                  }`}
                >
                  {ft.risk.toUpperCase()} RISK
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current ECU Info */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-[#8b5cf6]" />
            Current ECU Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'ECU ID', value: currentEcuInfo.ecuId },
              { label: 'Hardware Version', value: currentEcuInfo.hardwareVersion },
              { label: 'Software Version', value: currentEcuInfo.softwareVersion },
              { label: 'Calibration Version', value: currentEcuInfo.calibrationVersion },
              { label: 'Part Number', value: currentEcuInfo.partNumber },
            ].map(item => (
              <div key={item.label}>
                <div className="text-[10px] text-[#475569] mb-1">{item.label}</div>
                <div className="text-sm font-mono font-bold text-[#e2e8f0]">{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Firmware Files */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Download className="h-4 w-4 text-[#10b981]" />
            Available Firmware Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {firmwareFiles.map((fw, i) => (
              <button
                key={i}
                onClick={() => fw.compatible && setSelectedFirmware(i)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  !fw.compatible
                    ? 'border-[#1e2a3a] bg-[#0f1923] opacity-50 cursor-not-allowed'
                    : selectedFirmware === i
                    ? 'border-[#00d4ff]/50 bg-[#00d4ff]/10'
                    : 'border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1e2a3a] flex items-center justify-center">
                    <HardDrive className="h-4 w-4 text-[#64748b]" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium text-[#e2e8f0] font-mono">{fw.name}</div>
                    <div className="text-[10px] text-[#475569]">{fw.size} · {fw.date} · SHA: {fw.checksum}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {fw.compatible ? (
                    <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px]">
                      COMPATIBLE
                    </Badge>
                  ) : (
                    <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[9px]">
                      INCOMPATIBLE
                    </Badge>
                  )}
                  {fw.compatible && <ChevronRight className="h-4 w-4 text-[#475569]" />}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flash Progress */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#00d4ff]" />
            Flash Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stage indicators */}
          <div className="flex items-center justify-between">
            {stageIndicators.map((si, i) => {
              const status = getStageStatus(si.stage)
              return (
                <div key={si.stage} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        status === 'active'
                          ? 'border-[#00d4ff] bg-[#00d4ff]/20'
                          : status === 'complete'
                          ? 'border-[#10b981] bg-[#10b981]/20'
                          : 'border-[#1e2a3a] bg-[#0f1923]'
                      }`}
                    >
                      {status === 'complete' ? (
                        <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                      ) : status === 'active' ? (
                        <Zap className="h-4 w-4 text-[#00d4ff] animate-pulse" />
                      ) : (
                        <span className="text-[10px] text-[#475569] font-mono">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium ${
                      status === 'active' ? 'text-[#00d4ff]' : status === 'complete' ? 'text-[#10b981]' : 'text-[#475569]'
                    }`}>
                      {si.label}
                    </span>
                  </div>
                  {i < stageIndicators.length - 1 && (
                    <ArrowRight className={`h-4 w-4 shrink-0 mb-4 ${
                      status === 'complete' ? 'text-[#10b981]' : 'text-[#1e2a3a]'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">
                {flashStage === 'idle' && flashProgress === 0 && 'Ready to flash'}
                {flashStage === 'erasing' && 'Erasing flash memory...'}
                {flashStage === 'writing' && 'Writing firmware data...'}
                {flashStage === 'verifying' && 'Verifying written data...'}
                {flashStage === 'completing' && 'Finalizing flash operation...'}
                {flashStage === 'idle' && flashProgress >= 100 && 'Flash completed successfully!'}
              </span>
              <span className="text-xs font-mono font-bold text-[#00d4ff]">{flashProgress}%</span>
            </div>
            <div className="w-full h-3 bg-[#1e2a3a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${flashProgress}%`,
                  background: flashProgress >= 100
                    ? '#10b981'
                    : 'linear-gradient(90deg, #00d4ff, #00d4ff80)',
                }}
              />
            </div>
          </div>

          {/* Current operation details */}
          {flashStage !== 'idle' && (
            <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
              <div>
                <div className="text-[10px] text-[#475569]">Blocks Written</div>
                <div className="text-xs font-mono text-[#e2e8f0]">{Math.floor(flashProgress * 2.56)}/256</div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569]">Data Rate</div>
                <div className="text-xs font-mono text-[#e2e8f0]">128 KB/s</div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569]">Elapsed</div>
                <div className="text-xs font-mono text-[#e2e8f0]">
                  {`${Math.floor(flashProgress / 10)}m ${((flashProgress % 10) * 6).toFixed(0)}s`}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-Flash Checklist */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#f59e0b]" />
            Pre-Flash Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {preFlashChecks.map(check => (
              <div key={check.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-3">
                  <check.icon className={`h-4 w-4 ${
                    check.status === 'pass' ? 'text-[#10b981]' : 'text-[#f59e0b]'
                  }`} />
                  <span className="text-xs text-[#e2e8f0]">{check.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#64748b]">{check.value}</span>
                  {check.status === 'pass' ? (
                    <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Warnings */}
      <div className="space-y-2">
        {riskWarnings.map((w, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
            w.level === 'high'
              ? 'bg-[#ef4444]/10 border-[#ef4444]/30'
              : 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
          }`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
              w.level === 'high' ? 'text-[#ef4444]' : 'text-[#f59e0b]'
            }`} />
            <p className="text-[11px] text-[#94a3b8]">{w.text}</p>
          </div>
        ))}
      </div>

      {/* Flash History Log */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <History className="h-4 w-4 text-[#f59e0b]" />
            Flash History Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {flashHistory.map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-3">
                  {entry.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#ef4444]" />
                  )}
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">{entry.type} · {entry.version}</div>
                    <div className="text-[10px] text-[#475569]">{entry.date} · Duration: {entry.duration}</div>
                  </div>
                </div>
                <Badge className={`text-[9px] ${
                  entry.status === 'success'
                    ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                    : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                }`}>
                  {entry.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Recovery */}
      <Card className="bg-[#151d2b] border-[#ef4444]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#ef4444] flex items-center gap-2">
            <FileWarning className="h-4 w-4" />
            Emergency Recovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-[11px] text-[#94a3b8]">
              If the ECU becomes unresponsive after a failed flash, use the emergency recovery mode to restore
              the last known working firmware. This requires a hard-reset of the ECU and bootloader-level access.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button size="sm" className="h-9 text-xs bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/30 gap-1.5 w-full">
                <RotateCcw className="h-3 w-3" />
                Bootloader Recovery Mode
              </Button>
              <Button size="sm" className="h-9 text-xs bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/30 gap-1.5 w-full">
                <Clock className="h-3 w-3" />
                Restore Last Known Good
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
