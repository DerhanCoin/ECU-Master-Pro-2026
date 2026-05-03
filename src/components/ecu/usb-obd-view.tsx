'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Usb,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Settings,
  Wifi,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Download,
  Shield,
  Zap,
  Gauge,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Monitor,
  Cpu,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type AdapterStatus = 'Connected' | 'Not connected'
type Protocol = 'ISO 15765-4 (CAN)' | 'SAE J1850 PWM' | 'SAE J1850 VPW' | 'ISO 9141-2' | 'KWP2000'
type BaudRate = '500k' | '250k' | '125k' | '100k' | '50k' | 'Auto'
type CANIdFormat = 'Standard 11-bit' | 'Extended 29-bit'
type PortStatus = 'In Use' | 'Available' | 'Error'

interface USBAdapter {
  id: string
  name: string
  comPort: string
  status: AdapterStatus
  protocolSupport: string[]
  connectedAt?: number
  dataRate?: string
}

interface USBPort {
  port: string
  device: string
  driver: string
  status: PortStatus
  speed: string
}

interface FirmwareInfo {
  currentVersion: string
  availableVersion: string | null
  lastChecked: string
  changelog: ChangelogEntry[]
}

interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

// Mock data - use fixed epoch for SSR stability
const STABLE_EPOCH = 1741200000000 // Fixed reference point
const MOCK_ADAPTERS: USBAdapter[] = [
  {
    id: 'tactrix',
    name: 'Tactrix OpenPort 2.0',
    comPort: 'COM3',
    status: 'Connected',
    protocolSupport: ['J2534', 'CAN', 'ISO-9141'],
    connectedAt: STABLE_EPOCH - 1000 * 60 * 47,
    dataRate: '512 B/s',
  },
  {
    id: 'vagcom',
    name: 'VAG-COM KII-USB',
    comPort: 'COM4',
    status: 'Connected',
    protocolSupport: ['VW Group', 'K-Line', 'CAN'],
    connectedAt: STABLE_EPOCH - 1000 * 60 * 23,
    dataRate: '384 B/s',
  },
  {
    id: 'elm327',
    name: 'ELM327 USB',
    comPort: 'COM5',
    status: 'Not connected',
    protocolSupport: ['OBD-II', 'ELM327', 'AT Commands'],
  },
]

const USB_PORTS: USBPort[] = [
  { port: 'USB 1', device: 'Tactrix OpenPort 2.0', driver: 'FTDI VCP', status: 'In Use', speed: '480 Mbps' },
  { port: 'USB 2', device: 'VAG-COM KII-USB', driver: 'VCP Driver', status: 'In Use', speed: '12 Mbps' },
  { port: 'USB 3', device: '—', driver: '—', status: 'Available', speed: '480 Mbps' },
  { port: 'USB 4', device: '—', driver: '—', status: 'Available', speed: '480 Mbps' },
  { port: 'USB 5', device: '—', driver: '—', status: 'Available', speed: '5 Gbps' },
  { port: 'USB 6', device: 'Unrecognized Device', driver: 'Unknown', status: 'Error', speed: '—' },
]

const FIRMWARE_INFO: FirmwareInfo = {
  currentVersion: '2.4.1',
  availableVersion: '2.5.0',
  lastChecked: '2 hours ago',
  changelog: [
    {
      version: '2.5.0',
      date: '2026-02-15',
      changes: [
        'Added ISO 15765-4 multi-frame support',
        'Improved CAN bus error recovery',
        'Fixed intermittent disconnection on high-latency links',
        'Enhanced J2534 passthrough performance',
      ],
    },
    {
      version: '2.4.1',
      date: '2025-12-10',
      changes: [
        'Fixed USB enumeration on Windows 11 24H2',
        'Improved KWP2000 timing accuracy',
        'Reduced CPU usage during idle monitoring',
      ],
    },
    {
      version: '2.4.0',
      date: '2025-10-20',
      changes: [
        'Added SAE J1850 VPW protocol support',
        'New auto-baud detection algorithm',
        'Flow control optimization for CAN',
      ],
    },
  ],
}

function formatUptime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const hrs = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function UsbObdView() {
  // Scanning state
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [adapters, setAdapters] = useState<USBAdapter[]>([])
  const [scanComplete, setScanComplete] = useState(false)

  // Connection state
  const [connectingId, setConnectingId] = useState<string | null>(null)

  // Protocol config state
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>('ISO 15765-4 (CAN)')
  const [selectedBaudRate, setSelectedBaudRate] = useState<BaudRate>('500k')
  const [canIdFormat, setCanIdFormat] = useState<CANIdFormat>('Standard 11-bit')
  const [flowControl, setFlowControl] = useState(true)
  const [blockSize, setBlockSize] = useState('8')
  const [separationTime, setSeparationTime] = useState('5')
  const [applySuccess, setApplySuccess] = useState(false)

  // Connection quality state
  const [signalQuality, setSignalQuality] = useState(87)
  const [errorRate] = useState(0.02)
  const [latency] = useState(8)
  const [bytesTransferred, setBytesTransferred] = useState(142587)
  const [uptimeMs, setUptimeMs] = useState(1000 * 60 * 47)
  const [isDiagnosticsRunning, setIsDiagnosticsRunning] = useState(false)
  const [diagnosticsComplete, setDiagnosticsComplete] = useState(false)

  // Firmware state
  const [firmware] = useState(FIRMWARE_INFO)
  const [expandedChangelog, setExpandedChangelog] = useState<string | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [showFlashConfirm, setShowFlashConfirm] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const [flashComplete, setFlashComplete] = useState(false)

  // Refs
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qualityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const uptimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bytesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Get connected adapters
  const connectedAdapters = adapters.filter((a) => a.status === 'Connected')
  const hasConnectedAdapter = connectedAdapters.length > 0

  // Scan USB ports
  const startScan = useCallback(() => {
    setIsScanning(true)
    setScanProgress(0)
    setScanComplete(false)
    setAdapters([])
    setApplySuccess(false)
    setDiagnosticsComplete(false)

    const startTime = Date.now()
    const duration = 3000

    scanIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, (elapsed / duration) * 100)
      setScanProgress(progress)

      if (progress >= 100) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
        setIsScanning(false)
        setScanComplete(true)
        setAdapters(MOCK_ADAPTERS)
      }
    }, 50)
  }, [])

  // Connect/Disconnect adapter
  const toggleConnection = useCallback((adapterId: string) => {
    setAdapters((prev) =>
      prev.map((a) => {
        if (a.id !== adapterId) return a
        if (a.status === 'Connected') {
          return { ...a, status: 'Not connected' as AdapterStatus, connectedAt: undefined, dataRate: undefined }
        }
        return { ...a, status: 'Connected' as AdapterStatus, connectedAt: Date.now(), dataRate: '256 B/s' }
      })
    )
    setConnectingId(null)
  }, [])

  const handleConnect = useCallback((adapterId: string) => {
    setConnectingId(adapterId)
    setTimeout(() => toggleConnection(adapterId), 1500)
  }, [toggleConnection])

  const handleDisconnect = useCallback((adapterId: string) => {
    toggleConnection(adapterId)
  }, [toggleConnection])

  // Apply configuration
  const handleApplyConfig = useCallback(() => {
    setApplySuccess(false)
    setTimeout(() => setApplySuccess(true), 800)
    setTimeout(() => setApplySuccess(false), 3000)
  }, [])

  // Run diagnostics
  const handleRunDiagnostics = useCallback(() => {
    setIsDiagnosticsRunning(true)
    setDiagnosticsComplete(false)
    setTimeout(() => {
      setIsDiagnosticsRunning(false)
      setDiagnosticsComplete(true)
    }, 3000)
  }, [])

  // Firmware check
  const handleCheckUpdates = useCallback(() => {
    setIsCheckingUpdate(true)
    setTimeout(() => setIsCheckingUpdate(false), 2000)
  }, [])

  // Flash firmware
  const handleFlashFirmware = useCallback(() => {
    setShowFlashConfirm(false)
    setIsFlashing(true)
    setTimeout(() => {
      setIsFlashing(false)
      setFlashComplete(true)
      setTimeout(() => setFlashComplete(false), 3000)
    }, 4000)
  }, [])

  // Live quality + uptime + bytes animation
  useEffect(() => {
    if (hasConnectedAdapter) {
      // Signal quality fluctuation
      qualityIntervalRef.current = setInterval(() => {
        setSignalQuality((prev) => {
          const delta = (Math.random() - 0.5) * 6
          return Math.max(20, Math.min(100, Math.round(prev + delta)))
        })
      }, 800)

      // Uptime counter
      uptimeIntervalRef.current = setInterval(() => {
        setUptimeMs((prev) => prev + 1000)
      }, 1000)

      // Bytes counter
      bytesIntervalRef.current = setInterval(() => {
        setBytesTransferred((prev) => prev + Math.floor(Math.random() * 64) + 16)
      }, 500)
    } else {
      if (qualityIntervalRef.current) clearInterval(qualityIntervalRef.current)
      if (uptimeIntervalRef.current) clearInterval(uptimeIntervalRef.current)
      if (bytesIntervalRef.current) clearInterval(bytesIntervalRef.current)
    }

    return () => {
      if (qualityIntervalRef.current) clearInterval(qualityIntervalRef.current)
      if (uptimeIntervalRef.current) clearInterval(uptimeIntervalRef.current)
      if (bytesIntervalRef.current) clearInterval(bytesIntervalRef.current)
    }
  }, [hasConnectedAdapter])

  // Cleanup scan interval
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    }
  }, [])

  const signalColor = signalQuality >= 70 ? '#10b981' : signalQuality >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Usb className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">USB OBD</h1>
              {hasConnectedAdapter && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]" />
                  <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">
                    {connectedAdapters.length} Connected
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              USB adapter connection and protocol configuration
            </p>
          </div>

          <Button
            size="sm"
            onClick={startScan}
            disabled={isScanning}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              isScanning
                ? 'bg-[#00d4ff]/50 text-[#0f1923] cursor-not-allowed'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            <Search className="h-3 w-3" />
            Scan USB Ports
          </Button>
        </div>

        {/* Scanning Animation */}
        {isScanning && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-[#00d4ff] animate-pulse" />
              <span className="text-sm font-medium text-[#e2e8f0]">Scanning USB ports...</span>
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
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-[#64748b]">Detecting USB OBD adapters</span>
              <span className="text-[11px] font-semibold text-[#00d4ff] tabular-nums">
                {Math.round(scanProgress)}%
              </span>
            </div>
          </div>
        )}

        {/* USB Adapter Detection */}
        {scanComplete && adapters.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Usb className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Detected Adapters</h2>
              <Badge
                className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                style={{ backgroundColor: '#00d4ff20', color: '#00d4ff' }}
              >
                {adapters.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {adapters.map((adapter) => {
                const isConnected = adapter.status === 'Connected'
                const isConnecting = connectingId === adapter.id

                return (
                  <div
                    key={adapter.id}
                    className={cn(
                      'bg-[#151d2b] border rounded-lg p-4 transition-all',
                      isConnected
                        ? 'border-[#10b981]/30 hover:border-[#10b981]/50'
                        : 'border-[#1e2a3a] hover:border-[#2d3f55]'
                    )}
                    style={isConnected ? { boxShadow: '0 0 12px #10b98110' } : undefined}
                  >
                    {/* Adapter header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        'h-9 w-9 rounded-md flex items-center justify-center shrink-0',
                        isConnected ? 'bg-[#10b981]/10' : 'bg-[#1e2a3a]'
                      )}>
                        <Usb className={cn(
                          'h-4 w-4',
                          isConnected ? 'text-[#10b981]' : 'text-[#64748b]'
                        )} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn(
                            'text-sm font-semibold truncate',
                            isConnected ? 'text-[#e2e8f0]' : 'text-[#94a3b8]'
                          )}>
                            {adapter.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748b] font-mono">{adapter.comPort}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={cn(
                          'h-2 w-2 rounded-full',
                          isConnected ? 'bg-[#10b981] shadow-[0_0_4px_#10b981]' : 'bg-[#475569]'
                        )} />
                        <span className={cn(
                          'text-[10px] font-semibold',
                          isConnected ? 'text-[#10b981]' : 'text-[#64748b]'
                        )}>
                          {isConnected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                    </div>

                    {/* Protocol badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {adapter.protocolSupport.map((proto) => (
                        <Badge
                          key={proto}
                          className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                          style={{
                            backgroundColor: isConnected ? '#00d4ff15' : '#1e2a3a',
                            color: isConnected ? '#00d4ff' : '#475569',
                          }}
                        >
                          {proto}
                        </Badge>
                      ))}
                    </div>

                    {/* Connected details */}
                    {isConnected && (
                      <div className="flex items-center gap-4 mb-3 px-3 py-2 bg-[#0f1923] rounded-md border border-[#1e2a3a]">
                        <div className="flex items-center gap-1.5">
                          <ArrowUp className="h-3 w-3 text-[#10b981]" />
                          <span className="text-[10px] text-[#64748b]">Rate:</span>
                          <span className="text-[10px] font-semibold text-[#10b981] tabular-nums">{adapter.dataRate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-[#00d4ff]" />
                          <span className="text-[10px] text-[#64748b]">Duration:</span>
                          <span className="text-[10px] font-semibold text-[#00d4ff] tabular-nums">
                            {adapter.connectedAt ? formatUptime(uptimeMs) : '--:--:--'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Connect/Disconnect button */}
                    {isConnecting ? (
                      <Button
                        size="sm"
                        disabled
                        className="h-7 text-[10px] font-semibold bg-[#00d4ff]/20 text-[#00d4ff] border-0 w-full"
                      >
                        <Activity className="h-3 w-3 animate-spin mr-1" />
                        Connecting...
                      </Button>
                    ) : isConnected ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(adapter.id)}
                        className="h-7 text-[10px] font-semibold gap-1 border-[#ef4444]/50 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444] w-full"
                      >
                        <XCircle className="h-3 w-3" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(adapter.id)}
                        className="h-7 text-[10px] font-semibold gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] w-full"
                      >
                        <Wifi className="h-3 w-3" />
                        Connect
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state before scan */}
        {!isScanning && !scanComplete && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-12 flex flex-col items-center justify-center">
            <Usb className="h-10 w-10 text-[#00d4ff] mb-3 opacity-40" />
            <p className="text-sm text-[#64748b] mb-1">No USB adapters detected</p>
            <p className="text-[11px] text-[#475569]">Click &quot;Scan USB Ports&quot; to detect connected adapters</p>
          </div>
        )}

        {/* Protocol Configuration */}
        {hasConnectedAdapter && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Protocol Configuration</h2>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Protocol Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Protocol</label>
                  <Select value={selectedProtocol} onValueChange={(v) => setSelectedProtocol(v as Protocol)}>
                    <SelectTrigger className="h-8 text-xs border-[#1e2a3a] bg-[#0f1923] text-[#e2e8f0] hover:bg-[#1e2a3a]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                      <SelectItem value="ISO 15765-4 (CAN)" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">ISO 15765-4 (CAN)</SelectItem>
                      <SelectItem value="SAE J1850 PWM" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">SAE J1850 PWM</SelectItem>
                      <SelectItem value="SAE J1850 VPW" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">SAE J1850 VPW</SelectItem>
                      <SelectItem value="ISO 9141-2" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">ISO 9141-2</SelectItem>
                      <SelectItem value="KWP2000" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">KWP2000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Baud Rate */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Baud Rate</label>
                  <Select value={selectedBaudRate} onValueChange={(v) => setSelectedBaudRate(v as BaudRate)}>
                    <SelectTrigger className="h-8 text-xs border-[#1e2a3a] bg-[#0f1923] text-[#e2e8f0] hover:bg-[#1e2a3a]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                      <SelectItem value="500k" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">500 kbps</SelectItem>
                      <SelectItem value="250k" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">250 kbps</SelectItem>
                      <SelectItem value="125k" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">125 kbps</SelectItem>
                      <SelectItem value="100k" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">100 kbps</SelectItem>
                      <SelectItem value="50k" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">50 kbps</SelectItem>
                      <SelectItem value="Auto" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">Auto-detect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* CAN ID Format */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">CAN ID Format</label>
                  <Select value={canIdFormat} onValueChange={(v) => setCanIdFormat(v as CANIdFormat)}>
                    <SelectTrigger className="h-8 text-xs border-[#1e2a3a] bg-[#0f1923] text-[#e2e8f0] hover:bg-[#1e2a3a]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                      <SelectItem value="Standard 11-bit" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">Standard 11-bit</SelectItem>
                      <SelectItem value="Extended 29-bit" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">Extended 29-bit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Flow Control */}
              <div className="mt-5 pt-5 border-t border-[#1e2a3a]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#00d4ff]" />
                    <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Flow Control</span>
                  </div>
                  <button
                    onClick={() => setFlowControl(!flowControl)}
                    className={cn(
                      'relative h-5 w-9 rounded-full transition-colors',
                      flowControl ? 'bg-[#00d4ff]' : 'bg-[#1e2a3a]'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                        flowControl ? 'translate-x-4' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>

                {flowControl && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#475569]">Block Size</label>
                      <Input
                        value={blockSize}
                        onChange={(e) => setBlockSize(e.target.value)}
                        className="h-7 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] focus-visible:border-[#00d4ff] focus-visible:ring-[#00d4ff]/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#475569]">Separation Time (ms)</label>
                      <Input
                        value={separationTime}
                        onChange={(e) => setSeparationTime(e.target.value)}
                        className="h-7 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] focus-visible:border-[#00d4ff] focus-visible:ring-[#00d4ff]/20"
                      />
                    </div>
                    <div className="col-span-2 flex items-end">
                      <span className="text-[10px] text-[#475569] italic">
                        BS={blockSize} | ST={separationTime}ms | FC: {flowControl ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply button */}
              <div className="mt-5 pt-4 border-t border-[#1e2a3a] flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleApplyConfig}
                  className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                >
                  {applySuccess ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Configuration Applied
                    </>
                  ) : (
                    <>
                      <Settings className="h-3.5 w-3.5" />
                      Apply Configuration
                    </>
                  )}
                </Button>
                {applySuccess && (
                  <span className="text-[11px] text-[#10b981] font-medium animate-pulse">
                    Settings saved successfully
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Connection Quality Monitor */}
        {hasConnectedAdapter && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Connection Quality Monitor</h2>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-5">
              {/* Signal Quality Bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[#64748b] font-medium">Signal Quality</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: signalColor }}>
                    {signalQuality}%
                  </span>
                </div>
                <div className="h-3 w-full bg-[#0f1923] rounded-full overflow-hidden border border-[#1e2a3a]">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${signalQuality}%`,
                      backgroundColor: signalColor,
                      boxShadow: `0 0 8px ${signalColor}60`,
                      animation: 'quality-pulse 2s ease-in-out infinite',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[9px] text-[#475569]">0%</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                      <span className="text-[9px] text-[#475569]">Good</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                      <span className="text-[9px] text-[#475569]">Fair</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                      <span className="text-[9px] text-[#475569]">Poor</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-[#475569]">100%</span>
                </div>
              </div>

              {/* Quality Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {/* Error Rate */}
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#64748b] font-medium">Error Rate</span>
                    <AlertCircle className="h-3 w-3 text-[#10b981]" />
                  </div>
                  <span className="text-lg font-bold text-[#10b981] tabular-nums">{errorRate}%</span>
                </div>

                {/* Latency */}
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#64748b] font-medium">Latency</span>
                    <Zap className="h-3 w-3 text-[#10b981]" />
                  </div>
                  <span className="text-lg font-bold text-[#10b981] tabular-nums">{latency}ms</span>
                </div>

                {/* Bytes Transferred */}
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#64748b] font-medium">Transferred</span>
                    <ArrowDown className="h-3 w-3 text-[#00d4ff]" />
                  </div>
                  <span className="text-lg font-bold text-[#00d4ff] tabular-nums">
                    {formatBytes(bytesTransferred)}
                  </span>
                </div>

                {/* Uptime */}
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#64748b] font-medium">Uptime</span>
                    <Clock className="h-3 w-3 text-[#f59e0b]" />
                  </div>
                  <span className="text-lg font-bold text-[#f59e0b] tabular-nums font-mono">
                    {formatUptime(uptimeMs)}
                  </span>
                </div>
              </div>

              {/* Run Diagnostics */}
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleRunDiagnostics}
                  disabled={isDiagnosticsRunning}
                  className={cn(
                    'h-8 text-xs font-semibold gap-1.5',
                    isDiagnosticsRunning
                      ? 'bg-[#00d4ff]/50 text-[#0f1923] cursor-not-allowed'
                      : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                  )}
                >
                  {isDiagnosticsRunning ? (
                    <>
                      <Activity className="h-3 w-3 animate-spin" />
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Monitor className="h-3 w-3" />
                      Run Diagnostics
                    </>
                  )}
                </Button>
                {diagnosticsComplete && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                    <span className="text-[11px] text-[#10b981] font-medium">All checks passed — adapter healthy</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quality pulse animation */}
            <style>{`@keyframes quality-pulse{0%,100%{opacity:1}50%{opacity:0.85}}`}</style>
          </div>
        )}

        {/* USB Port Information */}
        {scanComplete && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">USB Port Information</h2>
              <Badge
                className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                style={{ backgroundColor: '#00d4ff20', color: '#00d4ff' }}
              >
                {USB_PORTS.length}
              </Badge>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[70px_1fr_100px_80px_80px] gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#475569] border-b border-[#1e2a3a]">
                <span>Port</span>
                <span>Device</span>
                <span>Driver</span>
                <span>Status</span>
                <span>Speed</span>
              </div>

              {/* Rows */}
              {USB_PORTS.map((port, index) => (
                <div
                  key={port.port}
                  className={cn(
                    'grid grid-cols-[70px_1fr_100px_80px_80px] gap-2 px-4 py-2.5 text-[11px] border-b border-[#1e2a3a]/50 hover:bg-[#1e2a3a]/30 transition-colors items-center',
                    index === USB_PORTS.length - 1 && 'border-b-0'
                  )}
                >
                  <span className="font-mono font-semibold text-[#e2e8f0]">{port.port}</span>
                  <span className={cn(
                    'truncate',
                    port.device === '—' ? 'text-[#475569]' : 'text-[#94a3b8]'
                  )}>
                    {port.device}
                  </span>
                  <span className="text-[#64748b] truncate text-[10px]">{port.driver}</span>
                  <span>
                    <Badge
                      className={cn(
                        'text-[9px] border-0 px-1.5 py-0 h-4 font-semibold',
                        port.status === 'In Use' && 'bg-[#00d4ff]/15 text-[#00d4ff]',
                        port.status === 'Available' && 'bg-[#10b981]/15 text-[#10b981]',
                        port.status === 'Error' && 'bg-[#ef4444]/15 text-[#ef4444]',
                      )}
                    >
                      {port.status}
                    </Badge>
                  </span>
                  <span className={cn(
                    'font-mono text-[10px] tabular-nums',
                    port.speed === '—' ? 'text-[#475569]' : 'text-[#94a3b8]'
                  )}>
                    {port.speed}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adapter Firmware Section */}
        {hasConnectedAdapter && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Adapter Firmware</h2>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
              {/* Firmware version info */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  {/* Current version */}
                  <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="h-3.5 w-3.5 text-[#00d4ff]" />
                      <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">Current Version</span>
                    </div>
                    <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">v{firmware.currentVersion}</span>
                  </div>

                  {/* Available version */}
                  <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUp className="h-3.5 w-3.5 text-[#f59e0b]" />
                      <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">Available Update</span>
                    </div>
                    {firmware.availableVersion ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-[#f59e0b] tabular-nums">v{firmware.availableVersion}</span>
                        <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#f59e0b]/15 text-[#f59e0b]">
                          NEW
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-sm text-[#10b981] font-medium">Up to date</span>
                    )}
                  </div>

                  {/* Last checked */}
                  <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-3.5 w-3.5 text-[#64748b]" />
                      <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">Last Checked</span>
                    </div>
                    <span className="text-sm text-[#94a3b8]">{firmware.lastChecked}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mb-5">
                  <Button
                    size="sm"
                    onClick={handleCheckUpdates}
                    disabled={isCheckingUpdate}
                    className={cn(
                      'h-8 text-xs font-semibold gap-1.5',
                      isCheckingUpdate
                        ? 'bg-[#00d4ff]/50 text-[#0f1923] cursor-not-allowed'
                        : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                    )}
                  >
                    {isCheckingUpdate ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Search className="h-3 w-3" />
                        Check for Updates
                      </>
                    )}
                  </Button>

                  {firmware.availableVersion && !showFlashConfirm && !isFlashing && !flashComplete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFlashConfirm(true)}
                      className="h-8 text-xs font-semibold gap-1.5 border-[#f59e0b]/50 text-[#f59e0b] hover:bg-[#f59e0b]/10 hover:text-[#f59e0b] hover:border-[#f59e0b]"
                    >
                      <Download className="h-3 w-3" />
                      Flash Firmware
                    </Button>
                  )}

                  {/* Flash confirmation */}
                  {showFlashConfirm && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444]" />
                      <span className="text-[11px] text-[#ef4444] font-medium">Flash v{firmware.availableVersion}?</span>
                      <Button
                        size="sm"
                        onClick={handleFlashFirmware}
                        className="h-6 text-[10px] font-semibold bg-[#ef4444] text-white hover:bg-[#dc2626] px-2"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowFlashConfirm(false)}
                        className="h-6 text-[10px] font-semibold border-[#1e2a3a] text-[#94a3b8] hover:bg-[#1e2a3a] px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Flashing progress */}
                  {isFlashing && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                      <Activity className="h-3.5 w-3.5 text-[#f59e0b] animate-spin" />
                      <span className="text-[11px] text-[#f59e0b] font-medium">Flashing firmware... Do not disconnect!</span>
                    </div>
                  )}

                  {/* Flash complete */}
                  {flashComplete && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981]" />
                      <span className="text-[11px] text-[#10b981] font-medium">Firmware updated to v{firmware.availableVersion}!</span>
                    </div>
                  )}
                </div>

                {/* Changelog */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[#64748b]" />
                    <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Firmware Changelog</span>
                  </div>

                  {firmware.changelog.map((entry) => (
                    <div
                      key={entry.version}
                      className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedChangelog(
                          expandedChangelog === entry.version ? null : entry.version
                        )}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1e2a3a]/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedChangelog === entry.version ? (
                            <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-[#64748b]" />
                          )}
                          <span className={cn(
                            'text-xs font-semibold',
                            entry.version === firmware.currentVersion ? 'text-[#10b981]' : 'text-[#e2e8f0]'
                          )}>
                            v{entry.version}
                          </span>
                          {entry.version === firmware.currentVersion && (
                            <Badge className="text-[8px] border-0 px-1.5 py-0 h-3.5 font-semibold bg-[#10b981]/15 text-[#10b981]">
                              CURRENT
                            </Badge>
                          )}
                          {entry.version === firmware.availableVersion && (
                            <Badge className="text-[8px] border-0 px-1.5 py-0 h-3.5 font-semibold bg-[#f59e0b]/15 text-[#f59e0b]">
                              LATEST
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-[#475569]">{entry.date}</span>
                      </button>

                      {expandedChangelog === entry.version && (
                        <div className="px-4 pb-3 pt-1 border-t border-[#1e2a3a]">
                          <ul className="space-y-1.5">
                            {entry.changes.map((change, i) => (
                              <li key={i} className="flex items-start gap-2 text-[11px] text-[#94a3b8]">
                                <span className="h-1 w-1 rounded-full bg-[#00d4ff] mt-1.5 shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
