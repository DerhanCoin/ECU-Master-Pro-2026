'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Wrench,
  Wifi,
  WifiOff,
  Signal,
  Car,
  Send,
  XCircle,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Monitor,
  Eye,
  RotateCcw,
  Zap,
  Globe,
  Lock,
  Server,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type SignalStrength = 'Excellent' | 'Good' | 'Fair' | 'Poor'
type VehicleStatus = 'Online' | 'Standby' | 'Offline'
type RiskLevel = 'Safe' | 'Caution' | 'Critical'

interface LiveDataItem {
  label: string
  value: string
  unit?: string
}

interface ActiveSession {
  id: string
  vehicleName: string
  vin: string
  status: 'Connected' | 'Connecting' | 'Disconnected'
  durationSeconds: number
  signalStrength: SignalStrength
  liveData: LiveDataItem[]
}

interface AvailableVehicle {
  id: string
  vehicleName: string
  vin: string
  lastSeen: string
  status: VehicleStatus
  signalBars: number
}

interface RemoteCommand {
  id: string
  name: string
  description: string
  estimatedTime: string
  riskLevel: RiskLevel
  requiresConfirmation: boolean
  requiresDoubleConfirmation: boolean
}

interface CommandResult {
  commandId: string
  success: boolean
  message: string
  timestamp: number
}

// Signal strength to bars
function signalToBars(strength: SignalStrength): number {
  switch (strength) {
    case 'Excellent': return 4
    case 'Good': return 3
    case 'Fair': return 2
    case 'Poor': return 1
  }
}

function signalBarsColor(strength: SignalStrength): string {
  switch (strength) {
    case 'Excellent': return '#10b981'
    case 'Good': return '#00d4ff'
    case 'Fair': return '#f59e0b'
    case 'Poor': return '#ef4444'
  }
}

// Risk level badge config
function riskLevelConfig(level: RiskLevel) {
  switch (level) {
    case 'Safe':
      return { bg: '#10b98120', color: '#10b981', border: '#10b98140' }
    case 'Caution':
      return { bg: '#f59e0b20', color: '#f59e0b', border: '#f59e0b40' }
    case 'Critical':
      return { bg: '#ef444420', color: '#ef4444', border: '#ef444440' }
  }
}

// Format seconds to mm:ss or hh:mm:ss
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  }
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

// Initial mock data
const initialActiveSessions: ActiveSession[] = [
  {
    id: 'session-1',
    vehicleName: 'VW Golf GTI',
    vin: 'WVW...001',
    status: 'Connected',
    durationSeconds: 720, // 12 min
    signalStrength: 'Excellent',
    liveData: [
      { label: 'Engine RPM', value: '2,840', unit: 'rpm' },
      { label: 'Speed', value: '72', unit: 'km/h' },
      { label: 'Coolant', value: '84', unit: '°C' },
    ],
  },
  {
    id: 'session-2',
    vehicleName: 'BMW 330e',
    vin: 'WBA...004',
    status: 'Connected',
    durationSeconds: 180, // 3 min
    signalStrength: 'Good',
    liveData: [
      { label: 'SOC', value: '78', unit: '%' },
      { label: 'Range', value: '312', unit: 'km' },
      { label: 'Motor Temp', value: '52', unit: '°C' },
    ],
  },
]

const availableVehicles: AvailableVehicle[] = [
  {
    id: 'avail-1',
    vehicleName: 'Mercedes C-Class',
    vin: 'WDD...005',
    lastSeen: '5 min ago',
    status: 'Online',
    signalBars: 4,
  },
  {
    id: 'avail-2',
    vehicleName: 'Audi A4',
    vin: 'WAU...002',
    lastSeen: '2h ago',
    status: 'Standby',
    signalBars: 2,
  },
  {
    id: 'avail-3',
    vehicleName: 'Skoda Octavia',
    vin: 'TMB...003',
    lastSeen: 'Offline',
    status: 'Offline',
    signalBars: 0,
  },
]

const remoteCommands: RemoteCommand[] = [
  {
    id: 'cmd-1',
    name: 'Read DTC Codes',
    description: 'Retrieve all diagnostic trouble codes from the vehicle ECU',
    estimatedTime: '~3 sec',
    riskLevel: 'Safe',
    requiresConfirmation: false,
    requiresDoubleConfirmation: false,
  },
  {
    id: 'cmd-2',
    name: 'Clear DTC Codes',
    description: 'Clear all stored and pending diagnostic trouble codes',
    estimatedTime: '~5 sec',
    riskLevel: 'Caution',
    requiresConfirmation: true,
    requiresDoubleConfirmation: false,
  },
  {
    id: 'cmd-3',
    name: 'Read Live Data',
    description: 'Start streaming real-time sensor data from the vehicle',
    estimatedTime: '~2 sec',
    riskLevel: 'Safe',
    requiresConfirmation: false,
    requiresDoubleConfirmation: false,
  },
  {
    id: 'cmd-4',
    name: 'Actuator Test',
    description: 'Execute actuator test sequences on vehicle components',
    estimatedTime: '~10 sec',
    riskLevel: 'Caution',
    requiresConfirmation: true,
    requiresDoubleConfirmation: false,
  },
  {
    id: 'cmd-5',
    name: 'ECU Reset',
    description: 'Perform a complete reset of the engine control unit',
    estimatedTime: '~15 sec',
    riskLevel: 'Critical',
    requiresConfirmation: true,
    requiresDoubleConfirmation: true,
  },
]

const connectionRequirements = [
  {
    icon: Monitor,
    title: 'Remote Client Required',
    description: 'Remote client must be installed on target vehicle for diagnostics access',
    color: '#00d4ff',
  },
  {
    icon: Globe,
    title: 'Stable Connection',
    description: 'Stable internet connection required (min 1 Mbps) for data streaming',
    color: '#10b981',
  },
  {
    icon: Lock,
    title: 'End-to-End Encrypted',
    description: 'Security: End-to-end encrypted (TLS 1.3) for all data transfers',
    color: '#8b5cf6',
  },
  {
    icon: Server,
    title: 'Supported Protocols',
    description: 'OBD-II, UDS, DoIP protocols supported for multi-brand diagnostics',
    color: '#f59e0b',
  },
]

// Signal bars component
function SignalBars({ strength, bars: overrideBars }: { strength: SignalStrength; bars?: number }) {
  const totalBars = 4
  const activeBars = overrideBars ?? signalToBars(strength)
  const color = overrideBars !== undefined
    ? (overrideBars >= 4 ? '#10b981' : overrideBars >= 3 ? '#00d4ff' : overrideBars >= 2 ? '#f59e0b' : overrideBars >= 1 ? '#ef4444' : '#475569')
    : signalBarsColor(strength)

  return (
    <div className="flex items-end gap-[2px]" title={strength}>
      {Array.from({ length: totalBars }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm transition-all duration-200"
          style={{
            height: `${6 + i * 3}px`,
            backgroundColor: i < activeBars ? color : '#1e2a3a',
            boxShadow: i < activeBars ? `0 0 3px ${color}40` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function RemoteDiagView() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(initialActiveSessions)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>('session-1')
  const [commandResults, setCommandResults] = useState<CommandResult[]>([])
  const [confirmingCommandId, setConfirmingCommandId] = useState<string | null>(null)
  const [doubleConfirmingCommandId, setDoubleConfirmingCommandId] = useState<string | null>(null)
  const [sendingCommandId, setSendingCommandId] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Session timer - counts up every second
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSessions((prev) =>
        prev.map((session) =>
          session.status === 'Connected'
            ? { ...session, durationSeconds: session.durationSeconds + 1 }
            : session
        )
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulate live data fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSessions((prev) =>
        prev.map((session) => {
          if (session.status !== 'Connected') return session
          return {
            ...session,
            liveData: session.liveData.map((item) => {
              // Slight random fluctuation for numeric values
              const numVal = parseFloat(item.value.replace(/,/g, ''))
              if (isNaN(numVal)) return item
              const fluctuation = (Math.random() - 0.5) * 2
              const newVal = Math.round((numVal + fluctuation) * 10) / 10
              return {
                ...item,
                value: Number.isInteger(numVal)
                  ? Math.round(newVal).toLocaleString()
                  : newVal.toFixed(1),
              }
            }),
          }
        })
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleEndSession = useCallback((sessionId: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null)
    }
  }, [selectedSessionId])

  const handleSendCommand = useCallback((command: RemoteCommand) => {
    if (command.requiresDoubleConfirmation && !doubleConfirmingCommandId) {
      setDoubleConfirmingCommandId(command.id)
      return
    }
    if (command.requiresConfirmation && !confirmingCommandId && !doubleConfirmingCommandId) {
      setConfirmingCommandId(command.id)
      return
    }

    setConfirmingCommandId(null)
    setDoubleConfirmingCommandId(null)
    setSendingCommandId(command.id)

    // Simulate sending command
    setTimeout(() => {
      const success = Math.random() > 0.15 // 85% success rate
      const result: CommandResult = {
        commandId: command.id,
        success,
        message: success
          ? `Command "${command.name}" sent successfully`
          : `Command "${command.name}" failed: Connection timeout`,
        timestamp: Date.now(),
      }
      setCommandResults((prev) => [result, ...prev].slice(0, 10))
      setSendingCommandId(null)
      setShowResults(true)
    }, 800 + Math.random() * 1200)
  }, [confirmingCommandId, doubleConfirmingCommandId])

  const handleConnectVehicle = useCallback((vehicle: AvailableVehicle) => {
    const newSession: ActiveSession = {
      id: `session-${Date.now()}`,
      vehicleName: vehicle.vehicleName,
      vin: vehicle.vin,
      status: 'Connected',
      durationSeconds: 0,
      signalStrength: vehicle.signalBars >= 4 ? 'Excellent' : vehicle.signalBars >= 3 ? 'Good' : 'Fair',
      liveData: [
        { label: 'Engine RPM', value: '1,200', unit: 'rpm' },
        { label: 'Speed', value: '0', unit: 'km/h' },
        { label: 'Coolant', value: '72', unit: '°C' },
      ],
    }
    setActiveSessions((prev) => [...prev, newSession])
    setSelectedSessionId(newSession.id)
  }, [])

  const handleWakeVehicle = useCallback((vehicle: AvailableVehicle) => {
    // Simulate waking up a standby vehicle - just show as toast-like behavior
    const result: CommandResult = {
      commandId: `wake-${vehicle.id}`,
      success: true,
      message: `Wake-up signal sent to ${vehicle.vehicleName} (${vehicle.vin})`,
      timestamp: Date.now(),
    }
    setCommandResults((prev) => [result, ...prev].slice(0, 10))
    setShowResults(true)
  }, [])

  const selectedSession = activeSessions.find((s) => s.id === selectedSessionId)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Remote Diagnostics</h1>
            </div>
            <p className="text-xs text-[#64748b]">
              Connect to remote vehicles for real-time diagnostics and support
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
          >
            <Radio className="h-3 w-3" />
            New Session
          </Button>
        </div>

        {/* Active Sessions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Active Sessions</h2>
            <Badge
              className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
              style={{ backgroundColor: '#10b98120', color: '#10b981' }}
            >
              {activeSessions.length}
            </Badge>
          </div>

          {activeSessions.length === 0 ? (
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-8 flex flex-col items-center justify-center">
              <WifiOff className="h-8 w-8 text-[#475569] mb-2" />
              <p className="text-xs text-[#64748b]">No active remote sessions</p>
              <p className="text-[10px] text-[#475569] mt-1">Connect to a vehicle below to start a session</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'bg-[#151d2b] border rounded-lg p-4 transition-all duration-200 cursor-pointer',
                    selectedSessionId === session.id
                      ? 'border-[#00d4ff] shadow-[0_0_12px_#00d4ff15]'
                      : 'border-[#1e2a3a] hover:border-[#2d3f55]'
                  )}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  {/* Session Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                        <Car className="h-4 w-4 text-[#00d4ff]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#e2e8f0]">
                            {session.vehicleName}
                          </span>
                          {/* Green pulsing dot for connected status */}
                          {session.status === 'Connected' && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[#64748b]">{session.vin}</span>
                          <Badge
                            className="text-[9px] border-0 px-1.5 py-0 h-3.5 font-semibold"
                            style={{
                              backgroundColor: session.status === 'Connected' ? '#10b98120' : '#f59e0b20',
                              color: session.status === 'Connected' ? '#10b981' : '#f59e0b',
                            }}
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SignalBars strength={session.signalStrength} />
                    </div>
                  </div>

                  {/* Session Meta */}
                  <div className="flex items-center gap-3 mb-3 text-[10px] text-[#64748b]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="tabular-nums font-medium text-[#94a3b8]">
                        {formatDuration(session.durationSeconds)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Signal className="h-3 w-3" style={{ color: signalBarsColor(session.signalStrength) }} />
                      <span>{session.signalStrength}</span>
                    </div>
                  </div>

                  {/* Live Data Preview */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {session.liveData.map((item) => (
                      <div
                        key={item.label}
                        className="bg-[#0f1923] border border-[#1e2a3a] rounded-md px-2.5 py-2"
                      >
                        <div className="text-[9px] text-[#64748b] mb-0.5">{item.label}</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-[#e2e8f0] tabular-nums">
                            {item.value}
                          </span>
                          {item.unit && (
                            <span className="text-[9px] text-[#64748b]">{item.unit}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-[10px] font-semibold gap-1 bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 border-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSessionId(session.id)
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      View Live Data
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] font-semibold gap-1 bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 border-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSessionId(session.id)
                      }}
                    >
                      <Send className="h-3 w-3" />
                      Send Command
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] font-semibold gap-1 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border-0 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEndSession(session.id)
                      }}
                    >
                      <XCircle className="h-3 w-3" />
                      End Session
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Vehicles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Available Vehicles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center"
                      style={{
                        backgroundColor:
                          vehicle.status === 'Online'
                            ? '#10b98110'
                            : vehicle.status === 'Standby'
                            ? '#f59e0b10'
                            : '#47556910',
                      }}
                    >
                      <Car
                        className="h-4 w-4"
                        style={{
                          color:
                            vehicle.status === 'Online'
                              ? '#10b981'
                              : vehicle.status === 'Standby'
                              ? '#f59e0b'
                              : '#475569',
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#e2e8f0]">
                        {vehicle.vehicleName}
                      </span>
                      <div className="text-[10px] font-mono text-[#64748b]">{vehicle.vin}</div>
                    </div>
                  </div>
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                    style={{
                      backgroundColor:
                        vehicle.status === 'Online'
                          ? '#10b98120'
                          : vehicle.status === 'Standby'
                          ? '#f59e0b20'
                          : '#47556920',
                      color:
                        vehicle.status === 'Online'
                          ? '#10b981'
                          : vehicle.status === 'Standby'
                          ? '#f59e0b'
                          : '#64748b',
                    }}
                  >
                    {vehicle.status === 'Online' && (
                      <span className="relative flex h-1.5 w-1.5 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]" />
                      </span>
                    )}
                    {vehicle.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#64748b]">
                    <Clock className="h-3 w-3" />
                    <span>Last seen: {vehicle.lastSeen}</span>
                  </div>
                  <SignalBars strength="Excellent" bars={vehicle.signalBars} />
                </div>

                {/* Action Button based on status */}
                {vehicle.status === 'Online' ? (
                  <Button
                    size="sm"
                    className="h-7 w-full text-[10px] font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                    onClick={() => handleConnectVehicle(vehicle)}
                  >
                    <Wifi className="h-3 w-3" />
                    Connect
                  </Button>
                ) : vehicle.status === 'Standby' ? (
                  <Button
                    size="sm"
                    className="h-7 w-full text-[10px] font-semibold gap-1.5 bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 border-0"
                    onClick={() => handleWakeVehicle(vehicle)}
                  >
                    <Zap className="h-3 w-3" />
                    Wake Up
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled
                    className="h-7 w-full text-[10px] font-semibold gap-1.5 bg-[#1e2a3a] text-[#475569] border-0 cursor-not-allowed"
                  >
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Session Statistics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Session Statistics</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                  <Radio className="h-3.5 w-3.5 text-[#00d4ff]" />
                </div>
                <span className="text-[11px] text-[#64748b] font-medium">Total Sessions</span>
              </div>
              <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">156</span>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-[#10b981]/10 flex items-center justify-center">
                  <Signal className="h-3.5 w-3.5 text-[#10b981]" />
                </div>
                <span className="text-[11px] text-[#64748b] font-medium">Active Now</span>
              </div>
              <span className="text-xl font-bold text-[#10b981] tabular-nums">{activeSessions.length}</span>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-[#8b5cf6]/10 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-[#8b5cf6]" />
                </div>
                <span className="text-[11px] text-[#64748b] font-medium">Avg Duration</span>
              </div>
              <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">28</span>
              <span className="text-xs text-[#64748b] ml-1">min</span>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-[#f59e0b]/10 flex items-center justify-center">
                  <Globe className="h-3.5 w-3.5 text-[#f59e0b]" />
                </div>
                <span className="text-[11px] text-[#64748b] font-medium">Data Transferred</span>
              </div>
              <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">2.4</span>
              <span className="text-xs text-[#64748b] ml-1">GB</span>
            </div>
          </div>
        </div>

        {/* Remote Commands Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Commands List */}
          <div className="xl:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <Send className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Remote Commands</h2>
              {selectedSession && (
                <Badge
                  className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                  style={{ backgroundColor: '#00d4ff20', color: '#00d4ff' }}
                >
                  {selectedSession.vehicleName}
                </Badge>
              )}
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
              {/* Commands list */}
              <div className="divide-y divide-[#1e2a3a]">
                {remoteCommands.map((command) => {
                  const risk = riskLevelConfig(command.riskLevel)
                  const isConfirming = confirmingCommandId === command.id
                  const isDoubleConfirming = doubleConfirmingCommandId === command.id
                  const isSending = sendingCommandId === command.id

                  return (
                    <div key={command.id} className="p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-[#e2e8f0]">
                              {command.name}
                            </span>
                            <Badge
                              className="text-[9px] border px-1.5 py-0 h-4 font-semibold"
                              style={{
                                backgroundColor: risk.bg,
                                color: risk.color,
                                borderColor: risk.border,
                              }}
                            >
                              {command.riskLevel === 'Critical' && (
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                              )}
                              {command.riskLevel}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-[#64748b] mb-1.5">{command.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-[#475569]">
                            <Clock className="h-3 w-3" />
                            <span>{command.estimatedTime}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {/* Double confirmation for ECU Reset */}
                          {isDoubleConfirming ? (
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-1 text-[10px] text-[#ef4444]">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="font-semibold">Are you absolutely sure?</span>
                              </div>
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  className="h-6 text-[9px] font-semibold bg-[#ef4444] text-white hover:bg-[#dc2626]"
                                  onClick={() => handleSendCommand(command)}
                                >
                                  Confirm Reset
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[9px] font-semibold border-[#1e2a3a] text-[#94a3b8] hover:bg-[#1e2a3a]"
                                  onClick={() => setDoubleConfirmingCommandId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : isConfirming ? (
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-1 text-[10px] text-[#f59e0b]">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="font-semibold">Confirm command?</span>
                              </div>
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  className="h-6 text-[9px] font-semibold bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                                  onClick={() => handleSendCommand(command)}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[9px] font-semibold border-[#1e2a3a] text-[#94a3b8] hover:bg-[#1e2a3a]"
                                  onClick={() => setConfirmingCommandId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className={cn(
                                'h-7 text-[10px] font-semibold gap-1',
                                command.riskLevel === 'Critical'
                                  ? 'bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border-0'
                                  : command.riskLevel === 'Caution'
                                  ? 'bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 border-0'
                                  : 'bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 border-0'
                              )}
                              disabled={isSending || activeSessions.length === 0}
                              onClick={() => handleSendCommand(command)}
                            >
                              {isSending ? (
                                <>
                                  <RotateCcw className="h-3 w-3 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-3 w-3" />
                                  Send
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Command Results */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00d4ff]" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">Command Results</h2>
              </div>
              {commandResults.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[9px] font-semibold border-[#1e2a3a] text-[#64748b] hover:bg-[#1e2a3a] hover:text-[#94a3b8]"
                  onClick={() => {
                    setCommandResults([])
                    setShowResults(false)
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
              {commandResults.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center">
                  <Monitor className="h-8 w-8 text-[#475569] mb-2" />
                  <p className="text-xs text-[#64748b]">No command results yet</p>
                  <p className="text-[10px] text-[#475569] mt-1">Send a command to see results here</p>
                </div>
              ) : (
                <div
                  className="max-h-[360px] overflow-y-auto divide-y divide-[#1e2a3a]"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#1e2a3a #0f1923',
                  }}
                >
                  {commandResults.map((result, index) => {
                    const command = remoteCommands.find((c) => c.id === result.commandId)
                    return (
                      <div
                        key={`${result.commandId}-${result.timestamp}-${index}`}
                        className="p-3 hover:bg-[#1e2a3a]/30 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {result.success ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981] mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-[#ef4444] mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[11px] font-semibold text-[#e2e8f0]">
                                {command?.name ?? 'Wake Signal'}
                              </span>
                              <Badge
                                className="text-[8px] border-0 px-1 py-0 h-3 font-semibold"
                                style={{
                                  backgroundColor: result.success ? '#10b98120' : '#ef444420',
                                  color: result.success ? '#10b981' : '#ef4444',
                                }}
                              >
                                {result.success ? 'SUCCESS' : 'FAILED'}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-[#94a3b8]">{result.message}</p>
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-[#475569]">
                              <Clock className="h-2.5 w-2.5" />
                              <span className="tabular-nums">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Requirements */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Connection Requirements</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {connectionRequirements.map((req) => {
              const Icon = req.icon
              return (
                <div
                  key={req.title}
                  className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="h-7 w-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${req.color}10` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: req.color }} />
                    </div>
                    <span className="text-xs font-semibold text-[#e2e8f0]">{req.title}</span>
                  </div>
                  <p className="text-[10px] text-[#64748b] leading-relaxed">{req.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
