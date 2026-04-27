'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Key,
  Binary,
  FileText,
  Play,
  Square,
  Search,
  Wrench,
  ToggleLeft,
  Wifi,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Zap,
  Fan,
  Droplets,
  Cylinder,
  Activity,
  Cpu,
  Hash,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

const securityLevels = [
  { level: 1, description: 'Default Access', granted: true },
  { level: 3, description: 'Extended Diagnostics', granted: true },
  { level: 5, description: 'Programming Access', granted: false },
  { level: 7, description: 'Calibration Access', granted: false },
  { level: 9, description: 'End-of-Line Programming', granted: false },
  { level: 11, description: 'Supplier Access', granted: false },
  { level: 15, description: 'OEM Engineering', granted: false },
  { level: 27, description: 'Development/Debug', granted: false },
]

const registers = [
  { address: '0x4000_0000', value: '0x0001_3A7F', description: 'System Control Register' },
  { address: '0x4000_0004', value: '0x0000_0042', description: 'CPU Clock Configuration' },
  { address: '0x4000_0008', value: '0xFFFF_FF00', description: 'GPIO Port A Direction' },
  { address: '0x4000_000C', value: '0x0000_00FF', description: 'GPIO Port A Data' },
  { address: '0x4000_1000', value: '0x0000_0003', description: 'CAN Control Register' },
  { address: '0x4000_1004', value: '0x0000_01C2', description: 'CAN Bit Timing Register' },
  { address: '0x4000_2000', value: '0x0000_0001', description: 'ADC Control Register' },
  { address: '0x4000_3000', value: '0x0000_0000', description: 'Timer 0 Control' },
  { address: '0x4000_3004', value: '0x0000_EA60', description: 'Timer 0 Period (60kHz)' },
  { address: '0xD000_0000', value: '0x4142_4344', description: 'Flash Signature Word 0' },
]

const dtcEntries = [
  { code: 'P0234', status: 'active', description: 'Turbocharger Overboost Condition', occurrences: 3, lastSeen: '2026-04-28 08:14', freezeFrame: true },
  { code: 'P0087', status: 'pending', description: 'Fuel Rail/System Pressure Too Low', occurrences: 1, lastSeen: '2026-04-27 16:32', freezeFrame: true },
  { code: 'P0401', status: 'stored', description: 'Exhaust Gas Recirculation Flow Insufficient', occurrences: 7, lastSeen: '2026-04-25 11:05', freezeFrame: false },
  { code: 'P0420', status: 'stored', description: 'Catalyst System Efficiency Below Threshold', occurrences: 2, lastSeen: '2026-04-22 09:48', freezeFrame: true },
  { code: 'P0544', status: 'history', description: 'Exhaust Gas Temperature Sensor Circuit', occurrences: 1, lastSeen: '2026-03-14 14:22', freezeFrame: false },
  { code: 'P0671', status: 'history', description: 'Cylinder 1 Glow Plug Circuit', occurrences: 4, lastSeen: '2026-02-28 07:15', freezeFrame: false },
]

const ioActuators = [
  { id: 'fuel_pump', name: 'Fuel Pump Relay', icon: Droplets, currentState: 'AUTO', forcedState: null, safe: true },
  { id: 'radiator_fan', name: 'Radiator Fan', icon: Fan, currentState: 'OFF', forcedState: 'ON (Low)', safe: true },
  { id: 'injector_1', name: 'Injector Cylinder 1', icon: Droplets, currentState: 'ACTIVE', forcedState: null, safe: false },
  { id: 'injector_2', name: 'Injector Cylinder 2', icon: Droplets, currentState: 'ACTIVE', forcedState: null, safe: false },
  { id: 'coil_1', name: 'Ignition Coil 1', icon: Zap, currentState: 'ACTIVE', forcedState: null, safe: false },
  { id: 'coil_2', name: 'Ignition Coil 2', icon: Zap, currentState: 'ACTIVE', forcedState: null, safe: false },
  { id: 'egr_valve', name: 'EGR Valve', icon: ToggleLeft, currentState: '12%', forcedState: null, safe: true },
  { id: 'throttle', name: 'Throttle Actuator', icon: Activity, currentState: '8.2%', forcedState: null, safe: false },
]

const routineControls = [
  { id: 'routine_1', name: 'DPF Regeneration', type: 'Service Routine', status: 'idle' },
  { id: 'routine_2', name: 'Injector Quantity Adjustment', type: 'Calibration Routine', status: 'idle' },
  { id: 'routine_3', name: 'Throttle Body Adaptation', type: 'Adaptation Routine', status: 'idle' },
  { id: 'routine_4', name: 'Turbo Actuator Learn', type: 'Adaptation Routine', status: 'idle' },
  { id: 'routine_5', name: 'Compression Test', type: 'Service Routine', status: 'idle' },
  { id: 'routine_6', name: 'Evap System Test', type: 'Service Routine', status: 'idle' },
]

const commChannels = [
  { id: 'comm_1', name: 'Application Communication', enabled: true },
  { id: 'comm_2', name: 'Fault Memory Communication', enabled: true },
  { id: 'comm_3', name: 'Test Equipment Communication', enabled: true },
  { id: 'comm_4', name: 'Node Communication', enabled: true },
  { id: 'comm_5', name: 'Network Management', enabled: true },
]

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export function AdvancedECUView() {
  const [seedKeyChallenge, setSeedKeyChallenge] = useState({ seed: '', key: '', requested: false })
  const [memAddress, setMemAddress] = useState('0x4000_0000')
  const [memData, setMemData] = useState('0x0001_3A7F')
  const [operationLog, setOperationLog] = useState<LogEntry[]>([
    { timestamp: '14:32:05', level: 'info', message: 'Session opened — Default Session (Level 1)' },
    { timestamp: '14:32:08', level: 'info', message: 'Security access granted — Level 3 (Extended Diagnostics)' },
    { timestamp: '14:33:12', level: 'warn', message: 'Security access denied — Level 5 (Programming) — Seed/Key required' },
    { timestamp: '14:34:01', level: 'info', message: 'Memory read — Address 0x40000000, Length 16 bytes' },
    { timestamp: '14:35:22', level: 'error', message: 'Write attempt failed — Insufficient access level' },
  ])
  const [activeRoutines, setActiveRoutines] = useState<Record<string, 'idle' | 'running' | 'completed'>>({})

  const requestSeed = () => {
    const seed = Math.random().toString(16).substr(2, 8).toUpperCase()
    setSeedKeyChallenge({ seed: `0x${seed}`, key: '', requested: true })
    addLog('info', `Seed requested — Received: 0x${seed}`)
  }

  const computeKey = () => {
    // Simulate key computation
    const key = Math.random().toString(16).substr(2, 8).toUpperCase()
    setSeedKeyChallenge(prev => ({ ...prev, key: `0x${key}` }))
    addLog('info', `Key computed — Sending: 0x${key}`)
  }

  const addLog = (level: LogEntry['level'], message: string) => {
    const now = new Date()
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    setOperationLog(prev => [{ timestamp: ts, level, message }, ...prev].slice(0, 50))
  }

  const handleMemRead = () => {
    addLog('info', `Memory read — Address ${memAddress}, Length 4 bytes`)
    const val = Math.random().toString(16).substr(2, 8).toUpperCase()
    setMemData(`0x${val}`)
  }

  const handleMemWrite = () => {
    addLog('warn', `Memory write attempt — Address ${memAddress}, Data ${memData}`)
  }

  const startRoutine = (id: string, name: string) => {
    setActiveRoutines(prev => ({ ...prev, [id]: 'running' }))
    addLog('info', `Routine started — ${name}`)
  }

  const stopRoutine = (id: string, name: string) => {
    setActiveRoutines(prev => ({ ...prev, [id]: 'idle' }))
    addLog('warn', `Routine stopped — ${name}`)
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-[#ef4444]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Advanced ECU Operations</h1>
            <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">
              EXPERT ONLY
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">Expert-level ECU manipulation — use with extreme caution</p>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30">
        <AlertTriangle className="h-4 w-4 text-[#ef4444] shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-[#ef4444] mb-1">Critical Warning</div>
          <p className="text-[11px] text-[#94a3b8]">
            Advanced operations can permanently damage the ECU, void warranties, and compromise vehicle safety.
            Only use these features if you fully understand the implications. Incorrect memory writes or
            forced actuator states may cause engine damage or fire hazard.
          </p>
        </div>
      </div>

      {/* Security Access Levels */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#8b5cf6]" />
            Security Access Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {securityLevels.map(sl => (
              <div
                key={sl.level}
                className={`p-3 rounded-lg border transition-all ${
                  sl.granted
                    ? 'bg-[#10b981]/10 border-[#10b981]/30'
                    : 'bg-[#0f1923] border-[#1e2a3a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#475569]">Level {sl.level}</span>
                  {sl.granted ? (
                    <Unlock className="h-3.5 w-3.5 text-[#10b981]" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-[#475569]" />
                  )}
                </div>
                <div className="text-xs font-medium text-[#e2e8f0] mb-1">{sl.description}</div>
                <Badge className={`text-[8px] ${
                  sl.granted
                    ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                    : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'
                }`}>
                  {sl.granted ? 'GRANTED' : 'LOCKED'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seed/Key Challenge */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Key className="h-4 w-4 text-[#f59e0b]" />
            Seed/Key Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
              <div className="text-[10px] text-[#475569] mb-1">Seed (from ECU)</div>
              <div className="text-sm font-mono font-bold text-[#f59e0b]">
                {seedKeyChallenge.seed || '—'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
              <div className="text-[10px] text-[#475569] mb-1">Key (computed)</div>
              <div className="text-sm font-mono font-bold text-[#10b981]">
                {seedKeyChallenge.key || '—'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-9 text-xs bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/30 gap-1.5 flex-1" onClick={requestSeed}>
                <Download className="h-3 w-3" />
                Request Seed
              </Button>
              <Button size="sm" className="h-9 text-xs bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/30 gap-1.5 flex-1" onClick={computeKey} disabled={!seedKeyChallenge.requested}>
                <Upload className="h-3 w-3" />
                Send Key
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Read/Write Operations */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Binary className="h-4 w-4 text-[#00d4ff]" />
            Memory Read/Write
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#475569] mb-1 block">Address (Hex)</label>
                <input
                  type="text"
                  value={memAddress}
                  onChange={e => setMemAddress(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-mono bg-[#0f1923] border border-[#1e2a3a] rounded-lg text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none"
                  placeholder="0x4000_0000"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#475569] mb-1 block">Data (Hex)</label>
                <input
                  type="text"
                  value={memData}
                  onChange={e => setMemData(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-mono bg-[#0f1923] border border-[#1e2a3a] rounded-lg text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none"
                  placeholder="0x0000_0000"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-9 text-xs bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30 gap-1.5 flex-1" onClick={handleMemRead}>
                  <Eye className="h-3 w-3" />
                  Read
                </Button>
                <Button size="sm" className="h-9 text-xs bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/30 gap-1.5 flex-1" onClick={handleMemWrite}>
                  <Upload className="h-3 w-3" />
                  Write
                </Button>
              </div>
            </div>

            {/* Register Viewer */}
            <div>
              <div className="text-[10px] text-[#475569] mb-2 flex items-center gap-1.5">
                <Hash className="h-3 w-3" />
                Register Viewer
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {registers.map((reg, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-all">
                    <div>
                      <span className="text-[10px] font-mono text-[#00d4ff]">{reg.address}</span>
                      <span className="text-[9px] text-[#475569] ml-2">{reg.description}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#e2e8f0]">{reg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routine Control */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Play className="h-4 w-4 text-[#10b981]" />
            Routine Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {routineControls.map(rc => {
              const routineStatus = activeRoutines[rc.id] || 'idle'
              return (
                <div key={rc.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">{rc.name}</div>
                    <div className="text-[10px] text-[#475569]">{rc.type}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0 bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30"
                      onClick={() => startRoutine(rc.id, rc.name)}
                      disabled={routineStatus === 'running'}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0 bg-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/30"
                      onClick={() => stopRoutine(rc.id, rc.name)}
                      disabled={routineStatus !== 'running'}
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                    <Button size="sm" className="h-7 w-7 p-0 bg-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/30">
                      <Search className="h-3 w-3" />
                    </Button>
                    <Badge className={`text-[8px] ${
                      routineStatus === 'running'
                        ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                        : routineStatus === 'completed'
                        ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                        : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'
                    }`}>
                      {routineStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* DTC Management */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
              DTC Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 text-[10px] bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30 gap-1">
                <RefreshCw className="h-3 w-3" />
                Read All
              </Button>
              <Button size="sm" className="h-7 text-[10px] bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/30 gap-1">
                <Trash2 className="h-3 w-3" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dtcEntries.map((dtc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    dtc.status === 'active' ? 'bg-[#ef4444] animate-pulse'
                      : dtc.status === 'pending' ? 'bg-[#f59e0b]'
                      : dtc.status === 'stored' ? 'bg-[#8b5cf6]'
                      : 'bg-[#475569]'
                  }`} />
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">
                      <span className="font-mono text-[#00d4ff] mr-2">{dtc.code}</span>
                      {dtc.description}
                    </div>
                    <div className="text-[10px] text-[#475569]">
                      Occurrences: {dtc.occurrences} · Last: {dtc.lastSeen}
                      {dtc.freezeFrame && ' · Freeze frame available'}
                    </div>
                  </div>
                </div>
                <Badge className={`text-[8px] ${
                  dtc.status === 'active' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                    : dtc.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                    : dtc.status === 'stored' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30'
                    : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'
                }`}>
                  {dtc.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* IO Control */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <ToggleLeft className="h-4 w-4 text-[#00d4ff]" />
            IO Control — Force Actuator States
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ioActuators.map(act => (
              <div key={act.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    act.forcedState ? 'bg-[#f59e0b]/15' : 'bg-[#1e2a3a]'
                  }`}>
                    <act.icon className={`h-4 w-4 ${act.forcedState ? 'text-[#f59e0b]' : 'text-[#64748b]'}`} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">{act.name}</div>
                    <div className="text-[10px] text-[#475569]">
                      Current: <span className="font-mono text-[#94a3b8]">{act.currentState}</span>
                      {act.forcedState && (
                        <> · Forced: <span className="font-mono text-[#f59e0b]">{act.forcedState}</span></>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!act.safe && (
                    <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[8px]">
                      DANGER
                    </Badge>
                  )}
                  <Button size="sm" className="h-7 text-[10px] bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/30 gap-1">
                    {act.forcedState ? 'Release' : 'Force'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Communication Control */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Wifi className="h-4 w-4 text-[#8b5cf6]" />
            Communication Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {commChannels.map(ch => (
              <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ch.enabled ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
                  <span className="text-xs text-[#e2e8f0]">{ch.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" className="h-6 w-6 p-0 bg-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/30 text-[9px]">
                    OFF
                  </Button>
                  <Button size="sm" className="h-6 w-6 p-0 bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 text-[9px]">
                    ON
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operation Log */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#f59e0b]" />
            Operation Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {operationLog.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-[#0f1923] border border-[#1e2a3a]">
                <span className="text-[10px] font-mono text-[#475569] shrink-0">{entry.timestamp}</span>
                <Badge className={`text-[7px] h-4 shrink-0 ${
                  entry.level === 'error' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                    : entry.level === 'warn' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                    : 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
                }`}>
                  {entry.level.toUpperCase()}
                </Badge>
                <span className="text-[11px] text-[#94a3b8]">{entry.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
