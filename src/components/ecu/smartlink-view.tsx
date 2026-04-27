'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Link2,
  Wifi,
  Usb,
  Bluetooth,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  AlertTriangle,
  Settings,
  Zap,
  Radio,
  Cpu,
  Car,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface ConnectedDevice {
  id: string
  name: string
  connectionType: 'WiFi' | 'USB' | 'Bluetooth'
  signal: 'Strong' | 'Good' | 'Wired'
  signalBars: number
  protocol: string
  status: 'Connected' | 'Standby'
  throughput: string
  latency: string
  accentColor: string
}

interface HubStatus {
  name: string
  status: 'Active' | 'Inactive'
  ip: string
  firmware: string
  connectedDevices: number
  maxDevices: number
  uptimeSeconds: number
  networkThroughput: string
}

type PowerMode = 'performance' | 'balanced' | 'power-saver'
type BufferSize = '1MB' | '5MB' | '10MB' | '50MB'

// Mock data
const CONNECTED_DEVICES: ConnectedDevice[] = [
  {
    id: 'vas6154',
    name: 'VAS 6154',
    connectionType: 'WiFi',
    signal: 'Strong',
    signalBars: 4,
    protocol: 'DOIP',
    status: 'Connected',
    throughput: '1.2 MB/s',
    latency: '8ms',
    accentColor: '#00d4ff',
  },
  {
    id: 'bosch560',
    name: 'Bosch KTS 560',
    connectionType: 'USB',
    signal: 'Wired',
    signalBars: 0,
    protocol: 'J2534',
    status: 'Connected',
    throughput: '800 KB/s',
    latency: '3ms',
    accentColor: '#10b981',
  },
  {
    id: 'elm327',
    name: 'ELM327',
    connectionType: 'Bluetooth',
    signal: 'Good',
    signalBars: 3,
    protocol: 'OBD-II',
    status: 'Connected',
    throughput: '256 KB/s',
    latency: '24ms',
    accentColor: '#8b5cf6',
  },
  {
    id: 'j2534pt',
    name: 'J2534 PassThru',
    connectionType: 'USB',
    signal: 'Wired',
    signalBars: 0,
    protocol: 'SAE J2534',
    status: 'Standby',
    throughput: '128 KB/s',
    latency: '5ms',
    accentColor: '#f59e0b',
  },
]

const PROTOCOLS = ['OBD-II', 'CAN', 'UDS', 'DoIP', 'J2534']

// Protocol bridge matrix: true = translation supported
const BRIDGE_MATRIX: boolean[][] = [
  // OBD-II  CAN    UDS    DoIP   J2534  (source → target)
  [true,  true,  true,  true,  true ],  // OBD-II
  [true,  true,  true,  true,  true ],  // CAN
  [true,  true,  true,  true,  false],  // UDS
  [true,  true,  true,  true,  true ],  // DoIP
  [true,  false, false, true,  true ],  // J2534
]

// Connection type icon component
function ConnectionTypeIcon({ type, color }: { type: 'WiFi' | 'USB' | 'Bluetooth'; color: string }) {
  switch (type) {
    case 'WiFi':
      return <Wifi className="h-4 w-4" style={{ color }} />
    case 'USB':
      return <Usb className="h-4 w-4" style={{ color }} />
    case 'Bluetooth':
      return <Bluetooth className="h-4 w-4" style={{ color }} />
  }
}

// Signal bars component
function SignalBars({ bars, color }: { bars: number; color: string }) {
  return (
    <div className="flex items-end gap-[2px]">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className="w-[3px] rounded-sm transition-all"
          style={{
            height: `${4 + level * 3}px`,
            backgroundColor: level <= bars ? color : '#1e2a3a',
            boxShadow: level <= bars ? `0 0 4px ${color}40` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function SmartLinkView() {
  // Hub status with ticking uptime
  const [uptime, setUptime] = useState(47 * 3600 + 23 * 60) // 47h 23m in seconds
  const [hubStatus] = useState<HubStatus>({
    name: 'SL-HUB-001',
    status: 'Active',
    ip: '192.168.1.100',
    firmware: 'v2.4.1',
    connectedDevices: 4,
    maxDevices: 8,
    uptimeSeconds: 47 * 3600 + 23 * 60,
    networkThroughput: '2.4 MB/s',
  })

  // Configuration state
  const [autoDiscovery, setAutoDiscovery] = useState(true)
  const [connectionPriority, setConnectionPriority] = useState(['WiFi', 'USB', 'Bluetooth'])
  const [powerMode, setPowerMode] = useState<PowerMode>('balanced')
  const [dataBuffering, setDataBuffering] = useState(true)
  const [bufferSize, setBufferSize] = useState<BufferSize>('10MB')
  const [failoverMode, setFailoverMode] = useState(true)
  const [showApplySuccess, setShowApplySuccess] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Uptime ticker
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setUptime((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Format uptime
  const formatUptime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  }, [])

  // Move priority item up/down
  const movePriority = useCallback((index: number, direction: 'up' | 'down') => {
    const newPriority = [...connectionPriority]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newPriority.length) return
    ;[newPriority[index], newPriority[targetIndex]] = [newPriority[targetIndex], newPriority[index]]
    setConnectionPriority(newPriority)
  }, [connectionPriority])

  // Apply settings
  const applySettings = useCallback(() => {
    setShowApplySuccess(true)
    setTimeout(() => setShowApplySuccess(false), 3000)
  }, [])

  // Connection type icon for priority list
  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'WiFi': return <Wifi className="h-3.5 w-3.5 text-[#00d4ff]" />
      case 'USB': return <Usb className="h-3.5 w-3.5 text-[#10b981]" />
      case 'Bluetooth': return <Bluetooth className="h-3.5 w-3.5 text-[#8b5cf6]" />
      default: return null
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* ===== 1. Page Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">SmartLink</h1>
              <Badge
                className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                style={{ backgroundColor: '#00d4ff20', color: '#00d4ff' }}
              >
                NEW
              </Badge>
            </div>
            <p className="text-xs text-[#64748b]">
              Intelligent multi-protocol connectivity hub for diagnostic networks
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
          >
            <Link2 className="h-3 w-3" />
            Pair New Device
          </Button>
        </div>

        {/* ===== 2. SmartLink Hub Status ===== */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
          {/* Hub header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#00d4ff]/5 border-b border-[#1e2a3a]">
            <div className="h-10 w-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-[#00d4ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#e2e8f0]">{hubStatus.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]" />
                  <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">
                    {hubStatus.status}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-[#94a3b8]">SmartLink Hub</span>
            </div>
          </div>

          {/* Hub metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5">
            {/* IP Address */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">IP Address</span>
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-[#00d4ff]" />
                <span className="text-sm font-semibold text-[#e2e8f0] font-mono">{hubStatus.ip}</span>
              </div>
            </div>

            {/* Firmware */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Firmware</span>
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-[#8b5cf6]" />
                <span className="text-sm font-semibold text-[#e2e8f0]">{hubStatus.firmware}</span>
              </div>
            </div>

            {/* Connected Devices */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Devices</span>
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[#10b981]" />
                <span className="text-sm font-semibold text-[#e2e8f0]">
                  {hubStatus.connectedDevices}<span className="text-[#64748b]">/{hubStatus.maxDevices}</span>
                </span>
              </div>
              {/* Device usage bar */}
              <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(hubStatus.connectedDevices / hubStatus.maxDevices) * 100}%`,
                    backgroundColor: '#00d4ff',
                    boxShadow: '0 0 6px #00d4ff40',
                  }}
                />
              </div>
            </div>

            {/* Uptime */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Uptime</span>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#00d4ff]" />
                <span className="text-sm font-semibold text-[#e2e8f0] tabular-nums">{formatUptime(uptime)}</span>
              </div>
            </div>

            {/* Network Throughput */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Throughput</span>
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-[#f59e0b]" />
                <span className="text-sm font-semibold text-[#e2e8f0]">{hubStatus.networkThroughput}</span>
              </div>
            </div>
          </div>

          {/* Hub action buttons */}
          <div className="px-5 py-3 border-t border-[#1e2a3a] bg-[#0f1923]/30 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] font-semibold gap-1.5 border-[#1e2a3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]/50 hover:border-[#2d3f55]"
            >
              <RotateCcw className="h-3 w-3" />
              Restart Hub
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] font-semibold gap-1.5 border-[#ef4444]/30 text-[#ef4444]/70 hover:text-[#ef4444] hover:bg-[#ef4444]/10 hover:border-[#ef4444]/50"
            >
              <AlertTriangle className="h-3 w-3" />
              Factory Reset
            </Button>
          </div>
        </div>

        {/* ===== 3. Connected Devices Grid ===== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Connected Devices</h2>
            <Badge
              className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
              style={{ backgroundColor: '#10b98120', color: '#10b981' }}
            >
              {CONNECTED_DEVICES.filter((d) => d.status === 'Connected').length} Online
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {CONNECTED_DEVICES.map((device) => (
              <div
                key={device.id}
                className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-colors"
                style={{ borderLeftWidth: '3px', borderLeftColor: device.accentColor }}
              >
                {/* Device header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${device.accentColor}15` }}
                    >
                      <ConnectionTypeIcon type={device.connectionType} color={device.accentColor} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#e2e8f0]">{device.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#64748b]">{device.connectionType}</span>
                        {device.signal !== 'Wired' ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[#1e2a3a]" />
                            <SignalBars bars={device.signalBars} color={device.accentColor} />
                          </>
                        ) : (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[#1e2a3a]" />
                            <span className="text-[10px] font-medium text-[#64748b]">Wired</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        device.status === 'Connected' ? 'bg-[#10b981] animate-pulse' : 'bg-[#64748b]'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        device.status === 'Connected' ? 'text-[#10b981]' : 'text-[#64748b]'
                      )}
                    >
                      {device.status}
                    </span>
                  </div>
                </div>

                {/* Protocol badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                    style={{
                      backgroundColor: `${device.accentColor}20`,
                      color: device.accentColor,
                    }}
                  >
                    {device.protocol}
                  </Badge>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#0f1923] rounded px-2 py-1.5">
                    <div className="text-[9px] text-[#64748b] uppercase tracking-wider">Throughput</div>
                    <div className="text-xs font-semibold text-[#e2e8f0] mt-0.5">{device.throughput}</div>
                  </div>
                  <div className="bg-[#0f1923] rounded px-2 py-1.5">
                    <div className="text-[9px] text-[#64748b] uppercase tracking-wider">Latency</div>
                    <div className="text-xs font-semibold text-[#e2e8f0] mt-0.5">{device.latency}</div>
                  </div>
                </div>

                {/* Disconnect button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-[10px] font-semibold gap-1 border-[#ef4444]/30 text-[#ef4444]/70 hover:text-[#ef4444] hover:bg-[#ef4444]/10 hover:border-[#ef4444]/50"
                >
                  <XCircle className="h-3 w-3" />
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 4. Protocol Bridge Matrix ===== */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Protocol Bridge Matrix</h2>
            <Badge
              className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
              style={{ backgroundColor: '#00d4ff20', color: '#00d4ff' }}
            >
              SmartLink Translation
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[400px]">
              <thead>
                <tr>
                  <th className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider p-2 text-left bg-[#0f1923] border border-[#1e2a3a]">
                    Source → Target
                  </th>
                  {PROTOCOLS.map((proto) => (
                    <th
                      key={proto}
                      className="text-[10px] font-medium text-[#00d4ff] uppercase tracking-wider p-2 text-center bg-[#0f1923] border border-[#1e2a3a]"
                    >
                      {proto}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROTOCOLS.map((sourceProto, rowIdx) => (
                  <tr key={sourceProto}>
                    <td className="text-[10px] font-medium text-[#00d4ff] uppercase tracking-wider p-2 bg-[#0f1923] border border-[#1e2a3a]">
                      {sourceProto}
                    </td>
                    {PROTOCOLS.map((targetProto, colIdx) => {
                      const isSupported = BRIDGE_MATRIX[rowIdx]?.[colIdx] ?? false
                      const isSame = rowIdx === colIdx
                      return (
                        <td
                          key={targetProto}
                          className={cn(
                            'p-2 text-center border border-[#1e2a3a] transition-colors',
                            isSupported
                              ? 'bg-[#10b981]/15'
                              : 'bg-[#0f1923]'
                          )}
                        >
                          {isSupported ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <CheckCircle2
                                className="h-4 w-4"
                                style={{
                                  color: isSame ? '#10b981' : '#00d4ff',
                                  opacity: isSame ? 0.6 : 1,
                                }}
                              />
                              <span
                                className="text-[8px] font-semibold"
                                style={{
                                  color: isSame ? '#10b981' : '#00d4ff',
                                  opacity: isSame ? 0.6 : 1,
                                }}
                              >
                                {isSame ? 'NATIVE' : 'BRIDGE'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-0.5">
                              <XCircle className="h-4 w-4 text-[#475569]" />
                              <span className="text-[8px] font-semibold text-[#475569]">N/A</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e2a3a]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-[#00d4ff]" />
              <span className="text-[10px] text-[#94a3b8]">Bridge Supported</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-[#10b981] opacity-60" />
              <span className="text-[10px] text-[#94a3b8]">Native (Same Protocol)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3 w-3 text-[#475569]" />
              <span className="text-[10px] text-[#94a3b8]">Not Available</span>
            </div>
          </div>
        </div>

        {/* ===== 5. Network Topology ===== */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Network Topology</h2>
            <Badge
              className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
              style={{ backgroundColor: '#10b98120', color: '#10b981' }}
            >
              Live
            </Badge>
          </div>

          <div className="relative w-full" style={{ paddingBottom: '55%' }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 110">
              {/* Connection lines from hub to devices */}
              {[
                { x: 35, y: 20, color: '#00d4ff' },   // VAS 6154
                { x: 90, y: 15, color: '#10b981' },   // Bosch KTS 560
                { x: 145, y: 20, color: '#8b5cf6' },  // ELM327
                { x: 170, y: 50, color: '#f59e0b' },  // J2534 PassThru
              ].map((device, i) => (
                <g key={i}>
                  {/* Line */}
                  <line
                    x1="100"
                    y1="50"
                    x2={device.x}
                    y2={device.y}
                    stroke={device.color}
                    strokeWidth="0.6"
                    strokeOpacity="0.4"
                  />
                  {/* Data flow arrow - animated dot */}
                  <circle r="1.5" fill={device.color} opacity="0.8">
                    <animateMotion
                      dur={`${2 + i * 0.5}s`}
                      repeatCount="indefinite"
                      path={`M100,50 L${device.x},${device.y}`}
                    />
                  </circle>
                  {/* Reverse flow dot */}
                  <circle r="1" fill={device.color} opacity="0.5">
                    <animateMotion
                      dur={`${2.5 + i * 0.3}s`}
                      repeatCount="indefinite"
                      path={`M${device.x},${device.y} L100,50`}
                    />
                  </circle>
                </g>
              ))}

              {/* Line from hub to vehicle */}
              <line
                x1="100"
                y1="50"
                x2="100"
                y2="90"
                stroke="#00d4ff"
                strokeWidth="0.8"
                strokeOpacity="0.5"
              />
              {/* Vehicle data flow */}
              <circle r="1.5" fill="#00d4ff" opacity="0.8">
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path="M100,50 L100,90"
                />
              </circle>
              <circle r="1" fill="#10b981" opacity="0.5">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path="M100,90 L100,50"
                />
              </circle>

              {/* Hub center node */}
              <rect
                x="85"
                y="40"
                width="30"
                height="20"
                rx="4"
                fill="#00d4ff15"
                stroke="#00d4ff"
                strokeWidth="0.8"
              />
              <text
                x="100"
                y="50"
                textAnchor="middle"
                className="fill-[#00d4ff] text-[4px] font-bold"
              >
                HUB
              </text>
              <text
                x="100"
                y="55"
                textAnchor="middle"
                className="fill-[#64748b] text-[2.5px]"
              >
                SL-HUB-001
              </text>
              {/* Hub status dot */}
              <circle cx="112" cy="43" r="1.5" fill="#10b981">
                <animate
                  attributeName="opacity"
                  values="1;0.4;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Device nodes */}
              {/* VAS 6154 */}
              <rect x="25" y="12" width="22" height="16" rx="3" fill="#151d2b" stroke="#00d4ff" strokeWidth="0.6" />
              <text x="36" y="20" textAnchor="middle" className="fill-[#e2e8f0] text-[3px] font-semibold">VAS 6154</text>
              <text x="36" y="24" textAnchor="middle" className="fill-[#64748b] text-[2px]">WiFi / DOIP</text>
              <circle cx="44" cy="15" r="1.2" fill="#10b981" />

              {/* Bosch KTS 560 */}
              <rect x="78" y="7" width="26" height="16" rx="3" fill="#151d2b" stroke="#10b981" strokeWidth="0.6" />
              <text x="91" y="15" textAnchor="middle" className="fill-[#e2e8f0] text-[3px] font-semibold">Bosch KTS 560</text>
              <text x="91" y="19" textAnchor="middle" className="fill-[#64748b] text-[2px]">USB / J2534</text>
              <circle cx="100" cy="10" r="1.2" fill="#10b981" />

              {/* ELM327 */}
              <rect x="133" y="12" width="22" height="16" rx="3" fill="#151d2b" stroke="#8b5cf6" strokeWidth="0.6" />
              <text x="144" y="20" textAnchor="middle" className="fill-[#e2e8f0] text-[3px] font-semibold">ELM327</text>
              <text x="144" y="24" textAnchor="middle" className="fill-[#64748b] text-[2px]">BT / OBD-II</text>
              <circle cx="152" cy="15" r="1.2" fill="#10b981" />

              {/* J2534 PassThru */}
              <rect x="153" y="42" width="34" height="16" rx="3" fill="#151d2b" stroke="#f59e0b" strokeWidth="0.6" />
              <text x="170" y="50" textAnchor="middle" className="fill-[#e2e8f0] text-[3px] font-semibold">J2534 PassThru</text>
              <text x="170" y="54" textAnchor="middle" className="fill-[#64748b] text-[2px]">USB / SAE J2534</text>
              <circle cx="183" cy="45" r="1.2" fill="#64748b" />

              {/* Vehicle ECU */}
              <rect x="82" y="82" width="36" height="20" rx="3" fill="#151d2b" stroke="#00d4ff" strokeWidth="0.6" />
              <text x="100" y="92" textAnchor="middle" className="fill-[#00d4ff] text-[3.5px] font-bold">Vehicle ECU</text>
              <text x="100" y="97" textAnchor="middle" className="fill-[#64748b] text-[2px]">CAN / UDS / DoIP</text>
              <circle cx="114" cy="85" r="1.2" fill="#10b981">
                <animate
                  attributeName="opacity"
                  values="1;0.4;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>

          {/* Topology Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e2a3a] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              <span className="text-[10px] text-[#94a3b8]">Connected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#64748b]" />
              <span className="text-[10px] text-[#94a3b8]">Standby</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-4 bg-gradient-to-r from-[#00d4ff] to-transparent rounded" />
              <span className="text-[10px] text-[#94a3b8]">Data Flow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#64748b]">→</span>
              <span className="text-[10px] text-[#94a3b8]">Bidirectional</span>
            </div>
          </div>
        </div>

        {/* ===== 6. SmartLink Configuration ===== */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">SmartLink Configuration</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Auto-discovery toggle */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-[#00d4ff]" />
                      <span className="text-sm font-medium text-[#e2e8f0]">Auto-Discovery</span>
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-1 ml-6">
                      Enable mDNS/SSDP protocol for automatic device detection
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoDiscovery(!autoDiscovery)}
                    className="flex-shrink-0"
                  >
                    {autoDiscovery ? (
                      <ToggleRight className="h-8 w-8 text-[#00d4ff]" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-[#475569]" />
                    )}
                  </button>
                </div>
                {autoDiscovery && (
                  <div className="ml-6 mt-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-[10px] text-[#10b981]">Scanning for devices...</span>
                  </div>
                )}
              </div>

              {/* Connection Priority */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-[#00d4ff]" />
                  <span className="text-sm font-medium text-[#e2e8f0]">Connection Priority</span>
                </div>
                <p className="text-[11px] text-[#64748b] mb-3">
                  Drag or reorder preferred connection types
                </p>
                <div className="space-y-2">
                  {connectionPriority.map((type, index) => (
                    <div
                      key={type}
                      className="flex items-center gap-3 bg-[#151d2b] border border-[#1e2a3a] rounded-md px-3 py-2"
                    >
                      <span className="text-xs font-bold text-[#00d4ff] w-4 text-center">{index + 1}</span>
                      {getPriorityIcon(type)}
                      <span className="text-xs font-medium text-[#e2e8f0] flex-1">{type}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePriority(index, 'up')}
                          disabled={index === 0}
                          className={cn(
                            'h-5 w-5 flex items-center justify-center rounded transition-colors',
                            index === 0
                              ? 'text-[#1e2a3a] cursor-not-allowed'
                              : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]'
                          )}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => movePriority(index, 'down')}
                          disabled={index === connectionPriority.length - 1}
                          className={cn(
                            'h-5 w-5 flex items-center justify-center rounded transition-colors',
                            index === connectionPriority.length - 1
                              ? 'text-[#1e2a3a] cursor-not-allowed'
                              : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]'
                          )}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Power Management */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-[#00d4ff]" />
                  <span className="text-sm font-medium text-[#e2e8f0]">Power Management</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['performance', 'balanced', 'power-saver'] as PowerMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPowerMode(mode)}
                      className={cn(
                        'px-3 py-2 rounded-md border text-xs font-medium transition-all',
                        powerMode === mode
                          ? 'border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]'
                          : 'border-[#1e2a3a] bg-[#151d2b] text-[#64748b] hover:text-[#94a3b8] hover:border-[#2d3f55]'
                      )}
                    >
                      {mode === 'performance' && <Zap className="h-3 w-3 mx-auto mb-1" />}
                      {mode === 'balanced' && <Activity className="h-3 w-3 mx-auto mb-1" />}
                      {mode === 'power-saver' && <Clock className="h-3 w-3 mx-auto mb-1" />}
                      <span className="block capitalize text-[10px]">{mode.replace('-', ' ')}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#64748b] mt-2">
                  {powerMode === 'performance' && 'Maximum throughput, higher power consumption'}
                  {powerMode === 'balanced' && 'Optimal balance between performance and power'}
                  {powerMode === 'power-saver' && 'Reduced power consumption, lower throughput'}
                </p>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Data Buffering */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#00d4ff]" />
                    <span className="text-sm font-medium text-[#e2e8f0]">Data Buffering</span>
                  </div>
                  <button onClick={() => setDataBuffering(!dataBuffering)} className="flex-shrink-0">
                    {dataBuffering ? (
                      <ToggleRight className="h-8 w-8 text-[#00d4ff]" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-[#475569]" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#64748b] mb-3">
                  Buffer data during connection interruptions
                </p>
                {dataBuffering && (
                  <div>
                    <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Buffer Size</span>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {(['1MB', '5MB', '10MB', '50MB'] as BufferSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => setBufferSize(size)}
                          className={cn(
                            'px-2 py-1.5 rounded-md border text-xs font-medium transition-all',
                            bufferSize === size
                              ? 'border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]'
                              : 'border-[#1e2a3a] bg-[#151d2b] text-[#64748b] hover:text-[#94a3b8] hover:border-[#2d3f55]'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Failover Mode */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-[#00d4ff]" />
                      <span className="text-sm font-medium text-[#e2e8f0]">Failover Mode</span>
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-1 ml-6">
                      Auto-switch to backup device on primary failure
                    </p>
                  </div>
                  <button onClick={() => setFailoverMode(!failoverMode)} className="flex-shrink-0">
                    {failoverMode ? (
                      <ToggleRight className="h-8 w-8 text-[#00d4ff]" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-[#475569]" />
                    )}
                  </button>
                </div>
                {failoverMode && (
                  <div className="ml-6 mt-2 p-2 bg-[#151d2b] border border-[#1e2a3a] rounded-md">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-[#64748b]">Primary:</span>
                      <span className="text-[#e2e8f0] font-medium">VAS 6154</span>
                      <span className="text-[#1e2a3a]">→</span>
                      <span className="text-[#64748b]">Backup:</span>
                      <span className="text-[#e2e8f0] font-medium">Bosch KTS 560</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Settings Button */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={applySettings}
                  size="sm"
                  className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                >
                  <Save className="h-3 w-3" />
                  Apply Settings
                </Button>
                {showApplySuccess && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                    <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                    <span className="text-xs font-medium text-[#10b981]">Settings applied successfully</span>
                  </div>
                )}
              </div>

              {/* Configuration Summary */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Current Configuration</span>
                <div className="mt-2 space-y-1.5">
                  {[
                    { label: 'Auto-Discovery', value: autoDiscovery ? 'Enabled' : 'Disabled', color: autoDiscovery ? '#10b981' : '#64748b' },
                    { label: 'Priority', value: connectionPriority.join(' → '), color: '#00d4ff' },
                    { label: 'Power Mode', value: powerMode.replace('-', ' '), color: '#f59e0b' },
                    { label: 'Buffering', value: dataBuffering ? `${bufferSize} buffer` : 'Disabled', color: dataBuffering ? '#10b981' : '#64748b' },
                    { label: 'Failover', value: failoverMode ? 'Active' : 'Disabled', color: failoverMode ? '#10b981' : '#64748b' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-[11px] text-[#94a3b8]">{item.label}</span>
                      <span className="text-[11px] font-medium capitalize" style={{ color: item.color }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
