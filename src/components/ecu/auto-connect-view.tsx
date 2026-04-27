'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Radio,
  Wifi,
  Usb,
  Bluetooth,
  Signal,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type SignalStrength = 'Strong' | 'Good' | 'Weak'
type DeviceStatus = 'Available' | 'In Use'

interface DiscoveredDevice {
  id: string
  name: string
  manufacturer: string
  signal: SignalStrength
  signalBars: number
  protocol: string
  status: DeviceStatus
  connectionType: 'WiFi' | 'USB' | 'Bluetooth'
  fullProtocol: string
}

interface ConnectionHistory {
  id: string
  deviceName: string
  timeAgo: string
  duration: string
  parametersRead: number
}

interface ConnectedDevice extends DiscoveredDevice {
  connectedAt: number
}

// Mock data
const MOCK_DEVICES: DiscoveredDevice[] = [
  {
    id: 'vas6154',
    name: 'VAS 6154',
    manufacturer: 'VW Group',
    signal: 'Strong',
    signalBars: 4,
    protocol: 'DOIP',
    status: 'Available',
    connectionType: 'WiFi',
    fullProtocol: 'ISO 15765-4',
  },
  {
    id: 'bosch560',
    name: 'Bosch KTS 560',
    manufacturer: 'Bosch',
    signal: 'Good',
    signalBars: 3,
    protocol: 'SAE J2534',
    status: 'Available',
    connectionType: 'USB',
    fullProtocol: 'SAE J2534',
  },
  {
    id: 'elm327',
    name: 'ELM327 WiFi',
    manufacturer: 'ELM Electronics',
    signal: 'Weak',
    signalBars: 1,
    protocol: 'OBD-II',
    status: 'Available',
    connectionType: 'WiFi',
    fullProtocol: 'ISO 15765-4',
  },
  {
    id: 'daimler',
    name: 'Daimler Xentry Kit',
    manufacturer: 'Daimler AG',
    signal: 'Good',
    signalBars: 3,
    protocol: 'CAN/DoIP',
    status: 'In Use',
    connectionType: 'USB',
    fullProtocol: 'SAE J2534',
  },
]

const CONNECTION_HISTORY: ConnectionHistory[] = [
  {
    id: 'h1',
    deviceName: 'VAS 6154',
    timeAgo: '2 hours ago',
    duration: '45 min',
    parametersRead: 247,
  },
  {
    id: 'h2',
    deviceName: 'ELM327 WiFi',
    timeAgo: 'Yesterday',
    duration: '12 min',
    parametersRead: 84,
  },
  {
    id: 'h3',
    deviceName: 'Bosch KTS 560',
    timeAgo: '3 days ago',
    duration: '1h 20min',
    parametersRead: 523,
  },
]

const TIPS = [
  {
    icon: Usb,
    title: 'USB connections provide the most stable data stream',
  },
  {
    icon: Wifi,
    title: 'WiFi adapters support longer range diagnostics',
  },
  {
    icon: RefreshCw,
    title: 'Keep device firmware updated for best compatibility',
  },
]

function getSignalColor(strength: SignalStrength): string {
  switch (strength) {
    case 'Strong':
      return '#10b981'
    case 'Good':
      return '#f59e0b'
    case 'Weak':
      return '#ef4444'
  }
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Signal Bars Component
function SignalBars({ strength, bars }: { strength: SignalStrength; bars: number }) {
  const color = getSignalColor(strength)
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

// Connection Type Icon
function ConnectionTypeIcon({ type }: { type: 'WiFi' | 'USB' | 'Bluetooth' }) {
  switch (type) {
    case 'WiFi':
      return <Wifi className="h-3.5 w-3.5 text-[#00d4ff]" />
    case 'USB':
      return <Usb className="h-3.5 w-3.5 text-[#00d4ff]" />
    case 'Bluetooth':
      return <Bluetooth className="h-3.5 w-3.5 text-[#00d4ff]" />
  }
}

export function AutoConnectView() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([])
  const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice | null>(null)
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null)
  const [connectionTimer, setConnectionTimer] = useState(0)
  const [animatedDots, setAnimatedDots] = useState(1)
  const [scanComplete, setScanComplete] = useState(false)

  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scan progress animation: 0-100% over 4 seconds
  const startScan = useCallback(() => {
    setIsScanning(true)
    setScanProgress(0)
    setDiscoveredDevices([])
    setScanComplete(false)
    setConnectedDevice(null)
    setConnectionTimer(0)
    setConnectingDeviceId(null)

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current)

    const startTime = Date.now()
    const duration = 4000

    scanIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, (elapsed / duration) * 100)
      setScanProgress(progress)

      if (progress >= 100) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
        setIsScanning(false)
        setScanComplete(true)
        setDiscoveredDevices(MOCK_DEVICES)
      }
    }, 50)

    // Animated dots
    dotsIntervalRef.current = setInterval(() => {
      setAnimatedDots((prev) => (prev % 3) + 1)
    }, 500)
  }, [])

  // Cancel scan
  const cancelScan = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current)
    setIsScanning(false)
    setScanProgress(0)
    setScanComplete(false)
  }, [])

  // Connect to device
  const connectToDevice = useCallback((device: DiscoveredDevice) => {
    setConnectingDeviceId(device.id)

    connectingTimeoutRef.current = setTimeout(() => {
      setConnectedDevice({
        ...device,
        connectedAt: Date.now(),
      })
      setConnectingDeviceId(null)
      setConnectionTimer(0)
    }, 2000)
  }, [])

  // Disconnect
  const disconnectDevice = useCallback(() => {
    setConnectedDevice(null)
    setConnectionTimer(0)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    if (connectingTimeoutRef.current) clearTimeout(connectingTimeoutRef.current)
    setConnectingDeviceId(null)
  }, [])

  // Connection timer
  useEffect(() => {
    if (connectedDevice) {
      timerIntervalRef.current = setInterval(() => {
        setConnectionTimer((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [connectedDevice])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
      if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (connectingTimeoutRef.current) clearTimeout(connectingTimeoutRef.current)
    }
  }, [])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Auto Connect</h1>
              {connectedDevice && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]" />
                  <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">
                    Connected
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              Automatically detect and connect to diagnostic devices
            </p>
          </div>

          <Button
            size="sm"
            onClick={startScan}
            disabled={isScanning || !!connectedDevice}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              isScanning
                ? 'bg-[#00d4ff]/50 text-[#0f1923] cursor-not-allowed'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            <Search className="h-3 w-3" />
            Start Scan
          </Button>
        </div>

        {/* Scan Animation */}
        {isScanning && (
          <div className="flex flex-col items-center justify-center py-10">
            {/* Radar Pulse Circles */}
            <div className="relative h-48 w-48 flex items-center justify-center mb-6">
              {/* Outer ring 3 */}
              <div
                className="absolute inset-0 rounded-full border-2"
                style={{
                  animation: 'radar-pulse 2s ease-out infinite 1s',
                  borderColor: 'rgba(0,212,255,0.2)',
                }}
              />
              {/* Outer ring 2 */}
              <div
                className="absolute inset-4 rounded-full border-2"
                style={{
                  animation: 'radar-pulse 2s ease-out infinite 0.5s',
                  borderColor: 'rgba(0,212,255,0.3)',
                }}
              />
              {/* Outer ring 1 */}
              <div
                className="absolute inset-8 rounded-full border-2"
                style={{
                  animation: 'radar-pulse 2s ease-out infinite',
                  borderColor: 'rgba(0,212,255,0.4)',
                }}
              />
              {/* Center dot */}
              <div className="relative h-10 w-10 rounded-full bg-[#00d4ff]/20 flex items-center justify-center border border-[#00d4ff]/50">
                <Radio className="h-5 w-5 text-[#00d4ff] animate-pulse" />
              </div>
            </div>

            {/* Scanning text with animated dots */}
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-[#00d4ff] animate-pulse" />
              <span className="text-sm font-medium text-[#e2e8f0]">
                Scanning for devices{'.'.repeat(animatedDots)}
              </span>
            </div>

            {/* Scan Progress */}
            <div className="w-64 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[#64748b]">Scan Progress</span>
                <span className="text-[11px] font-semibold text-[#00d4ff] tabular-nums">
                  {Math.round(scanProgress)}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#0f1923] rounded-full overflow-hidden border border-[#1e2a3a]">
                <div
                  className="h-full rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${scanProgress}%`,
                    backgroundColor: '#00d4ff',
                    boxShadow: '0 0 8px #00d4ff60',
                  }}
                />
              </div>
            </div>

            {/* Cancel button */}
            <Button
              variant="outline"
              size="sm"
              onClick={cancelScan}
              className="h-8 text-xs gap-1.5 border-[#ef4444]/50 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444]"
            >
              <XCircle className="h-3 w-3" />
              Cancel Scan
            </Button>

            {/* Radar pulse animation keyframes */}
            <style>{`@keyframes radar-pulse{0%{transform:scale(0.3);opacity:1;border-color:rgba(0,212,255,0.6)}100%{transform:scale(1);opacity:0;border-color:rgba(0,212,255,0)}}`}</style>
          </div>
        )}

        {/* Discovered Devices List */}
        {scanComplete && !connectedDevice && discoveredDevices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Discovered Devices</h2>
              <Badge
                className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                style={{
                  backgroundColor: '#00d4ff20',
                  color: '#00d4ff',
                }}
              >
                {discoveredDevices.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discoveredDevices.map((device) => {
                const isConnecting = connectingDeviceId === device.id
                const isUnavailable = device.status === 'In Use'
                const signalColor = getSignalColor(device.signal)

                return (
                  <div
                    key={device.id}
                    className={cn(
                      'bg-[#151d2b] border rounded-lg p-4 transition-all',
                      isUnavailable
                        ? 'border-[#1e2a3a] opacity-60'
                        : 'border-[#1e2a3a] hover:border-[#2d3f55]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left side: icon + info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={cn(
                          'h-9 w-9 rounded-md flex items-center justify-center shrink-0',
                          isUnavailable ? 'bg-[#1e2a3a]' : 'bg-[#00d4ff]/10'
                        )}>
                          <Wifi className={cn(
                            'h-4 w-4',
                            isUnavailable ? 'text-[#475569]' : 'text-[#00d4ff]'
                          )} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn(
                              'text-sm font-semibold truncate',
                              isUnavailable ? 'text-[#64748b]' : 'text-[#e2e8f0]'
                            )}>
                              {device.name}
                            </span>
                          </div>
                          <span className={cn(
                            'text-[11px]',
                            isUnavailable ? 'text-[#475569]' : 'text-[#94a3b8]'
                          )}>
                            {device.manufacturer}
                          </span>
                        </div>
                      </div>

                      {/* Right side: signal bars */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <SignalBars strength={device.signal} bars={device.signalBars} />
                        <span className="text-[10px] font-medium" style={{ color: signalColor }}>
                          {device.signal}
                        </span>
                      </div>
                    </div>

                    {/* Bottom row: protocol, status, connect button */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e2a3a]">
                      <div className="flex items-center gap-2">
                        <Badge
                          className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                          style={{
                            backgroundColor: '#8b5cf620',
                            color: '#8b5cf6',
                          }}
                        >
                          {device.protocol}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              device.status === 'Available' ? 'bg-[#10b981]' : 'bg-[#64748b]'
                            )}
                          />
                          <span className={cn(
                            'text-[10px]',
                            device.status === 'Available' ? 'text-[#94a3b8]' : 'text-[#64748b]'
                          )}>
                            {device.status}
                          </span>
                        </div>
                        {device.status === 'In Use' && (
                          <span className="text-[9px] text-[#64748b]">(by another session)</span>
                        )}
                      </div>

                      {isUnavailable ? (
                        <Button
                          size="sm"
                          disabled
                          className="h-7 text-[10px] font-semibold bg-[#1e2a3a] text-[#475569] cursor-not-allowed border-0"
                        >
                          Unavailable
                        </Button>
                      ) : isConnecting ? (
                        <Button
                          size="sm"
                          disabled
                          className="h-7 text-[10px] font-semibold bg-[#00d4ff]/20 text-[#00d4ff] border-0"
                        >
                          <Activity className="h-3 w-3 animate-spin mr-1" />
                          Connecting...
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => connectToDevice(device)}
                          className="h-7 text-[10px] font-semibold gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Connection Status Card */}
        {connectedDevice && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Connection Status</h2>
            </div>

            <div className="bg-[#151d2b] border border-[#10b981]/30 rounded-lg overflow-hidden"
              style={{ boxShadow: '0 0 16px #10b98110' }}
            >
              {/* Connected header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-[#10b981]/5 border-b border-[#1e2a3a]">
                <div className="h-10 w-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#e2e8f0]">{connectedDevice.name}</span>
                  <span className="text-[11px] text-[#94a3b8] ml-2">{connectedDevice.manufacturer}</span>
                </div>
                <Badge
                  className="ml-auto text-[9px] border-0 px-2 py-0.5 h-5 font-semibold"
                  style={{
                    backgroundColor: '#10b98120',
                    color: '#10b981',
                  }}
                >
                  CONNECTED
                </Badge>
              </div>

              {/* Connection details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
                {/* Connection Type */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">
                    Connection Type
                  </span>
                  <div className="flex items-center gap-2">
                    <ConnectionTypeIcon type={connectedDevice.connectionType} />
                    <span className="text-sm font-semibold text-[#e2e8f0]">
                      {connectedDevice.connectionType}
                    </span>
                  </div>
                </div>

                {/* Protocol */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">
                    Protocol
                  </span>
                  <div className="flex items-center gap-2">
                    <Radio className="h-3.5 w-3.5 text-[#8b5cf6]" />
                    <span className="text-sm font-semibold text-[#e2e8f0]">
                      {connectedDevice.fullProtocol}
                    </span>
                  </div>
                </div>

                {/* Connected For */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">
                    Connected For
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#00d4ff]" />
                    <span className="text-sm font-semibold text-[#e2e8f0] tabular-nums">
                      {formatTimer(connectionTimer)}
                    </span>
                  </div>
                </div>

                {/* Latency */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">
                    Latency
                  </span>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-[#10b981] animate-pulse" />
                    <span className="text-sm font-semibold text-[#10b981] tabular-nums">12ms</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-ping" />
                  </div>
                </div>
              </div>

              {/* Disconnect button */}
              <div className="px-5 py-3 border-t border-[#1e2a3a] bg-[#0f1923]/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectDevice}
                  className="h-8 text-xs gap-1.5 border-[#ef4444]/50 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444]"
                >
                  <XCircle className="h-3 w-3" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Connection History */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Connection History</h2>
            <Badge
              className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
              style={{
                backgroundColor: '#00d4ff20',
                color: '#00d4ff',
              }}
            >
              {CONNECTION_HISTORY.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {CONNECTION_HISTORY.map((entry) => (
              <div
                key={entry.id}
                className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                      <Wifi className="h-3.5 w-3.5 text-[#00d4ff]" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#e2e8f0]">{entry.deviceName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#64748b]">{entry.timeAgo}</span>
                        <span className="h-1 w-1 rounded-full bg-[#1e2a3a]" />
                        <span className="text-[10px] text-[#94a3b8]">
                          <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                          Duration: {entry.duration}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                      style={{
                        backgroundColor: '#10b98120',
                        color: '#10b981',
                      }}
                    >
                      {entry.parametersRead} parameters
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Connect Tips */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Quick Connect Tips</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TIPS.map((tip, index) => {
              const Icon = tip.icon
              return (
                <div
                  key={index}
                  className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-[#00d4ff]/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-[#00d4ff]" />
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      {tip.title}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
