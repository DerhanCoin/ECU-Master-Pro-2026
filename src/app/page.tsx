'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Cpu, Wifi, WifiOff, Activity, Gauge, Thermometer, Zap, Battery,
  Fuel, Car, AlertTriangle, CheckCircle2, XCircle, RotateCcw,
  Search, Settings, Wrench, Shield, Radio, Cable, Signal,
  ChevronRight, Play, Square, Send, RefreshCw, GaugeCircle,
  ThermometerSun, Wind, Droplets, Timer, HardDrive, CircuitBoard,
  Info, Server, Network, Usb, Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTIC SERVICE API CLIENT
// ═══════════════════════════════════════════════════════════════

const DIAG_PORT = 8000

async function diagFetch(path: string, options?: RequestInit): Promise<any> {
  // Use Next.js API proxy route
  const apiPath = `/api/diag${path}`
  const res = await fetch(apiPath, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ConnectionStatus {
  connected: boolean
  mode: 'simulation' | 'hardware'
  dongleIp: string
  vehicleId: string | null
  sessionActive: boolean
  routingActivated: boolean
  tcpConnected: boolean
  uptime: number | null
}

interface DTCCode {
  code: string
  description: string
  status: string
  statusMask: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
}

interface LiveDataReading {
  pid: number
  name: string
  value: number
  unit: string
  min: number
  max: number
  timestamp: number
}

interface ECUInfo {
  vin: string
  make: string
  model: string
  year: string
  engine: string
  ecuHardwareNumber: string
  ecuSoftwareNumber: string
  ecuManufacturer: string
  ecuSerialNumber: string
  softwareVersion: string
  hardwareVersion: string
  bootSoftwareIdent: string
  programmingDate: string
}

interface DongleInfo {
  serialNumber: string
  firmwareVersion: string
  hardwareRevision: string
  interface: string
  ipAddress: string
  macAddress: string
  linkSpeed: string
  protocol: string
}

// ═══════════════════════════════════════════════════════════════
// SENSOR ICON MAP
// ═══════════════════════════════════════════════════════════════

function getSensorIcon(name: string): React.ElementType {
  const iconMap: Record<string, React.ElementType> = {
    'Engine RPM': Gauge,
    'Vehicle Speed': GaugeCircle,
    'Coolant Temperature': Thermometer,
    'Control Module Voltage': Battery,
    'Throttle Position': Zap,
    'Engine Load': Activity,
    'Intake Air Temperature': ThermometerSun,
    'Intake Manifold Pressure': Wind,
    'Fuel Tank Level': Droplets,
    'Fuel Pressure': Fuel,
    'Timing Advance': Timer,
    'Ambient Air Temperature': ThermometerSun,
  }
  return iconMap[name] || Activity
}

function getSensorColor(name: string): string {
  const colorMap: Record<string, string> = {
    'Engine RPM': '#00d4ff',
    'Vehicle Speed': '#10b981',
    'Coolant Temperature': '#f59e0b',
    'Control Module Voltage': '#8b5cf6',
    'Throttle Position': '#f97316',
    'Engine Load': '#ef4444',
    'Intake Air Temperature': '#06b6d4',
    'Intake Manifold Pressure': '#84cc16',
    'Fuel Tank Level': '#3b82f6',
    'Fuel Pressure': '#ec4899',
    'Timing Advance': '#a855f7',
    'Ambient Air Temperature': '#14b8a6',
  }
  return colorMap[name] || '#00d4ff'
}

function getSeverityConfig(severity: string) {
  const configs: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
    critical: { color: '#ef4444', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/30', icon: XCircle },
    high: { color: '#f59e0b', bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/30', icon: AlertTriangle },
    medium: { color: '#00d4ff', bg: 'bg-[#00d4ff]/10', border: 'border-[#00d4ff]/30', icon: Info },
    low: { color: '#64748b', bg: 'bg-[#64748b]/10', border: 'border-[#64748b]/30', icon: CheckCircle2 },
  }
  return configs[severity] || configs.low
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ECUDiagnosticPage() {
  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [dtcCodes, setDtcCodes] = useState<DTCCode[]>([])
  const [liveData, setLiveData] = useState<LiveDataReading[]>([])
  const [ecuInfo, setEcuInfo] = useState<ECUInfo | null>(null)
  const [dongleInfo, setDongleInfo] = useState<DongleInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isReadingLiveData, setIsReadingLiveData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sessionActive, setSessionActive] = useState(false)
  const [activityLog, setActivityLog] = useState<Array<{ time: string; msg: string; type: 'info' | 'success' | 'warning' | 'error' }>>([])
  const liveDataInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Activity logging
  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setActivityLog(prev => [{ time, msg, type }, ...prev].slice(0, 50))
  }, [])

  // Fetch connection status
  const fetchStatus = useCallback(async () => {
    try {
      const result = await diagFetch('/api/status')
      if (result.success) {
        setConnectionStatus(result.data)
      }
    } catch {}
  }, [])

  // Connect
  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    addLog('Connecting to VAS 6154...', 'info')
    try {
      const result = await diagFetch('/api/connect', { method: 'POST' })
      if (result.success) {
        setConnectionStatus(result.data)
        addLog(`Connected (${result.data.mode} mode)`, 'success')
        // Auto-fetch dongle info and ECU info
        fetchDongleInfo()
        fetchECUInfo()
      } else {
        setError(result.error || 'Connection failed')
        addLog(`Connection failed: ${result.error}`, 'error')
      }
    } catch (err) {
      setError('Cannot reach diagnostic service')
      addLog('Cannot reach diagnostic service', 'error')
    } finally {
      setIsConnecting(false)
    }
  }, [addLog])

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      await diagFetch('/api/disconnect', { method: 'POST' })
      setConnectionStatus(null)
      setDtcCodes([])
      setLiveData([])
      setEcuInfo(null)
      setSessionActive(false)
      addLog('Disconnected', 'info')
    } catch {}
  }, [addLog])

  // Read DTC codes
  const readDTCs = useCallback(async () => {
    if (!connectionStatus?.connected) return
    setIsScanning(true)
    addLog('Scanning for DTC codes...', 'info')
    try {
      const result = await diagFetch('/api/dtc')
      if (result.success) {
        setDtcCodes(result.data)
        addLog(`Found ${result.data.length} DTC codes`, result.data.length > 0 ? 'warning' : 'success')
      } else {
        addLog(`DTC scan failed: ${result.error}`, 'error')
      }
    } catch (err) {
      addLog('DTC scan error', 'error')
    } finally {
      setIsScanning(false)
    }
  }, [connectionStatus?.connected, addLog])

  // Clear DTC codes
  const clearDTCs = useCallback(async () => {
    if (!connectionStatus?.connected) return
    try {
      const result = await diagFetch('/api/dtc', { method: 'DELETE' })
      if (result.success) {
        setDtcCodes([])
        addLog('All DTC codes cleared', 'success')
      } else {
        addLog(`Clear DTC failed: ${result.error}`, 'error')
      }
    } catch {}
  }, [connectionStatus?.connected, addLog])

  // Read live data
  const fetchLiveData = useCallback(async () => {
    if (!connectionStatus?.connected) return
    try {
      const result = await diagFetch('/api/live-data')
      if (result.success) {
        setLiveData(result.data)
      }
    } catch {}
  }, [connectionStatus?.connected])

  // Start/stop live data polling
  const toggleLiveData = useCallback(() => {
    if (liveDataInterval.current) {
      clearInterval(liveDataInterval.current)
      liveDataInterval.current = null
      setIsReadingLiveData(false)
      addLog('Live data streaming stopped', 'info')
    } else {
      setIsReadingLiveData(true)
      addLog('Live data streaming started', 'success')
      fetchLiveData()
      liveDataInterval.current = setInterval(fetchLiveData, 1000)
    }
  }, [fetchLiveData, addLog])

  // Fetch ECU info
  const fetchECUInfo = useCallback(async () => {
    if (!connectionStatus?.connected) return
    try {
      const result = await diagFetch('/api/ecu/info')
      if (result.success) {
        setEcuInfo(result.data)
        addLog('ECU information read', 'success')
      }
    } catch {}
  }, [connectionStatus?.connected, addLog])

  // Fetch dongle info
  const fetchDongleInfo = useCallback(async () => {
    try {
      const result = await diagFetch('/api/dongle/info')
      if (result.success) {
        setDongleInfo(result.data)
      }
    } catch {}
  }, [])

  // Toggle session
  const toggleSession = useCallback(async () => {
    if (!connectionStatus?.connected) return
    try {
      const action = sessionActive ? 'stop' : 'start'
      const result = await diagFetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type: 'extended' }),
      })
      if (result.success) {
        setSessionActive(action === 'start')
        addLog(`Diagnostic session ${action === 'start' ? 'started' : 'stopped'}`, 'success')
      }
    } catch {}
  }, [connectionStatus?.connected, sessionActive, addLog])

  // Send tester present
  const sendTesterPresent = useCallback(async () => {
    if (!connectionStatus?.connected) return
    try {
      await diagFetch('/api/tester-present', { method: 'POST' })
      addLog('Tester Present sent', 'info')
    } catch {}
  }, [connectionStatus?.connected, addLog])

  // Initial status check
  useEffect(() => {
    fetchStatus()
    return () => {
      if (liveDataInterval.current) clearInterval(liveDataInterval.current)
    }
  }, [fetchStatus])

  // Check if connected on mount
  useEffect(() => {
    if (connectionStatus?.connected) {
      fetchDongleInfo()
    }
  }, [])

  const isConnected = connectionStatus?.connected ?? false
  const isSimulation = connectionStatus?.mode === 'simulation'

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0f1923] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e2a3a] bg-[#0f1923] sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20">
                <Cpu className="h-5 w-5 text-[#00d4ff]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#e2e8f0] flex items-center gap-2">
                  ECU Master Pro 2026
                  <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px] px-1.5">
                    VAS 6154
                  </Badge>
                </h1>
                <p className="text-[10px] text-[#475569]">DoIP / UDS Diagnostic Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection mode indicator */}
              {isConnected && (
                <Badge variant="outline" className={cn(
                  'text-[10px] border',
                  isSimulation
                    ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
                    : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                )}>
                  {isSimulation ? 'SIMULATION' : 'HARDWARE'}
                </Badge>
              )}

              {/* Session indicator */}
              {sessionActive && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]" />
                  <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">Session</span>
                </div>
              )}

              {/* Connect/Disconnect button */}
              <Button
                size="sm"
                onClick={isConnected ? disconnect : connect}
                disabled={isConnecting}
                className={cn(
                  'h-8 text-xs font-semibold gap-1.5',
                  isConnected
                    ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                    : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                )}
              >
                {isConnecting ? (
                  <><RotateCcw className="h-3 w-3 animate-spin" />Connecting...</>
                ) : isConnected ? (
                  <><WifiOff className="h-3 w-3" />Disconnect</>
                ) : (
                  <><Wifi className="h-3 w-3" />Connect</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1920px] mx-auto p-4 md:p-6 space-y-4">
          {/* Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            <StatusCard
              icon={isConnected ? Wifi : WifiOff}
              label="Connection"
              value={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? '#10b981' : '#64748b'}
              pulse={isConnected}
            />
            <StatusCard
              icon={Radio}
              label="Mode"
              value={isSimulation ? 'Simulation' : 'Hardware'}
              color={isSimulation ? '#f59e0b' : '#10b981'}
            />
            <StatusCard
              icon={Cpu}
              label="Dongle IP"
              value="192.168.13.69"
              color="#00d4ff"
            />
            <StatusCard
              icon={Shield}
              label="Protocol"
              value="DoIP/UDS"
              color="#8b5cf6"
            />
            <StatusCard
              icon={Activity}
              label="DTCs"
              value={dtcCodes.length.toString()}
              color={dtcCodes.length > 0 ? '#ef4444' : '#10b981'}
            />
            <StatusCard
              icon={Gauge}
              label="Live PIDs"
              value={liveData.length.toString()}
              color="#00d4ff"
            />
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#151d2b] border border-[#1e2a3a] h-9 p-0.5">
              <TabsTrigger value="dashboard" className="text-[11px] h-8 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">Dashboard</TabsTrigger>
              <TabsTrigger value="dtc" className="text-[11px] h-8 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">DTC Codes</TabsTrigger>
              <TabsTrigger value="live" className="text-[11px] h-8 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">Live Data</TabsTrigger>
              <TabsTrigger value="ecu" className="text-[11px] h-8 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">ECU Info</TabsTrigger>
              <TabsTrigger value="dongle" className="text-[11px] h-8 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">Dongle</TabsTrigger>
            </TabsList>

            {/* DASHBOARD TAB */}
            <TabsContent value="dashboard" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Quick Actions */}
                <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#00d4ff]" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ActionButton
                      icon={Search}
                      label="Scan DTC Codes"
                      desc="Read all fault codes"
                      onClick={readDTCs}
                      disabled={!isConnected || isScanning}
                      loading={isScanning}
                    />
                    <ActionButton
                      icon={isReadingLiveData ? Square : Activity}
                      label={isReadingLiveData ? 'Stop Live Data' : 'Start Live Data'}
                      desc={isReadingLiveData ? 'Stop streaming' : 'Stream real-time sensors'}
                      onClick={toggleLiveData}
                      disabled={!isConnected}
                      active={isReadingLiveData}
                    />
                    <ActionButton
                      icon={Cpu}
                      label="Read ECU Info"
                      desc="VIN, HW/SW versions"
                      onClick={fetchECUInfo}
                      disabled={!isConnected}
                    />
                    <ActionButton
                      icon={Play}
                      label={sessionActive ? 'End Session' : 'Start Session'}
                      desc="Extended diagnostic session"
                      onClick={toggleSession}
                      disabled={!isConnected}
                      active={sessionActive}
                    />
                    <ActionButton
                      icon={Send}
                      label="Tester Present"
                      desc="Send keepalive signal"
                      onClick={sendTesterPresent}
                      disabled={!isConnected}
                    />
                    <ActionButton
                      icon={RotateCcw}
                      label="Clear DTC Codes"
                      desc="Erase all stored codes"
                      onClick={clearDTCs}
                      disabled={!isConnected || dtcCodes.length === 0}
                    />
                  </CardContent>
                </Card>

                {/* ECU Overview */}
                <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <Car className="h-4 w-4 text-[#00d4ff]" />
                      Vehicle Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ecuInfo ? (
                      <div className="space-y-4">
                        {/* VIN Display */}
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Vehicle Identification Number</div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-mono font-bold text-[#00d4ff] tracking-widest">{ecuInfo.vin}</span>
                            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">Valid</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div>
                              <div className="text-[9px] text-[#475569]">Make</div>
                              <div className="text-xs text-[#e2e8f0] font-medium">{ecuInfo.make}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-[#475569]">Model</div>
                              <div className="text-xs text-[#e2e8f0] font-medium">{ecuInfo.model}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-[#475569]">Year</div>
                              <div className="text-xs text-[#e2e8f0] font-medium">{ecuInfo.year}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-[#475569]">Engine</div>
                              <div className="text-xs text-[#e2e8f0] font-medium">{ecuInfo.engine}</div>
                            </div>
                          </div>
                        </div>

                        {/* Key Sensors */}
                        {liveData.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {liveData.slice(0, 4).map((sensor) => {
                              const Icon = getSensorIcon(sensor.name)
                              const color = getSensorColor(sensor.name)
                              return (
                                <div key={sensor.pid} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                                    <span className="text-[10px] text-[#64748b]">{sensor.name}</span>
                                  </div>
                                  <div className="text-lg font-bold tabular-nums" style={{ color }}>
                                    {sensor.value.toFixed(1)}
                                    <span className="text-[10px] text-[#64748b] ml-1">{sensor.unit}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* ECU Details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2 flex justify-between">
                            <span className="text-[#64748b]">HW Number</span>
                            <span className="font-mono text-[#e2e8f0]">{ecuInfo.ecuHardwareNumber}</span>
                          </div>
                          <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2 flex justify-between">
                            <span className="text-[#64748b]">SW Number</span>
                            <span className="font-mono text-[#e2e8f0]">{ecuInfo.ecuSoftwareNumber}</span>
                          </div>
                          <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2 flex justify-between">
                            <span className="text-[#64748b]">Manufacturer</span>
                            <span className="text-[#e2e8f0]">{ecuInfo.ecuManufacturer}</span>
                          </div>
                          <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2 flex justify-between">
                            <span className="text-[#64748b]">Programming Date</span>
                            <span className="font-mono text-[#e2e8f0]">{ecuInfo.programmingDate}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Car className="h-12 w-12 text-[#1e2a3a] mb-3" />
                        <p className="text-sm text-[#475569]">No vehicle data</p>
                        <p className="text-[10px] text-[#475569] mt-1">Connect and read ECU info to see vehicle details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* DTC Summary + Activity Log */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* DTC Summary */}
                <Card className="bg-[#151d2b] border-[#1e2a3a]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                        DTC Summary
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={readDTCs}
                        disabled={!isConnected || isScanning}
                        className="h-7 text-[10px] gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                      >
                        {isScanning ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                        {isScanning ? 'Scanning...' : 'Scan'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dtcCodes.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {dtcCodes.map((dtc, idx) => {
                          const sev = getSeverityConfig(dtc.severity)
                          const SevIcon = sev.icon
                          return (
                            <div key={idx} className={cn('flex items-center gap-3 p-2.5 rounded-lg border', sev.bg, sev.border)}>
                              <SevIcon className="h-4 w-4 flex-shrink-0" style={{ color: sev.color }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-[#e2e8f0]">{dtc.code}</span>
                                  <Badge className={cn('text-[8px] border px-1 py-0 h-3.5', sev.bg, sev.border)} style={{ color: sev.color }}>
                                    {dtc.severity}
                                  </Badge>
                                </div>
                                <div className="text-[10px] text-[#94a3b8] truncate">{dtc.description}</div>
                              </div>
                              <span className="text-[9px] text-[#475569]">{dtc.status}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle2 className="h-8 w-8 text-[#10b981] mb-2" />
                        <p className="text-xs text-[#64748b]">No DTC codes found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity Log */}
                <Card className="bg-[#151d2b] border-[#1e2a3a]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#00d4ff]" />
                      Activity Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {activityLog.length > 0 ? (
                        <div className="space-y-1.5">
                          {activityLog.map((entry, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[10px]">
                              <span className="text-[#475569] font-mono tabular-nums flex-shrink-0 mt-0.5">{entry.time}</span>
                              <span className={cn(
                                'mt-0.5',
                                entry.type === 'success' ? 'text-[#10b981]' :
                                entry.type === 'warning' ? 'text-[#f59e0b]' :
                                entry.type === 'error' ? 'text-[#ef4444]' :
                                'text-[#94a3b8]'
                              )}>
                                {entry.msg}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-xs text-[#475569]">No activity yet</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* DTC TAB */}
            <TabsContent value="dtc" className="space-y-4 mt-4">
              <Card className="bg-[#151d2b] border-[#1e2a3a]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                      Diagnostic Trouble Codes
                      {dtcCodes.length > 0 && (
                        <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px] ml-1">{dtcCodes.length}</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={clearDTCs}
                        disabled={!isConnected || dtcCodes.length === 0}
                        className="h-7 text-[10px] gap-1 bg-[#ef4444] text-white hover:bg-[#dc2626]"
                      >
                        <RotateCcw className="h-3 w-3" />Clear All
                      </Button>
                      <Button
                        size="sm"
                        onClick={readDTCs}
                        disabled={!isConnected || isScanning}
                        className="h-7 text-[10px] gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                      >
                        {isScanning ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                        {isScanning ? 'Scanning...' : 'Scan DTCs'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dtcCodes.length > 0 ? (
                    <div className="space-y-2">
                      {dtcCodes.map((dtc, idx) => {
                        const sev = getSeverityConfig(dtc.severity)
                        const SevIcon = sev.icon
                        return (
                          <div key={idx} className={cn('flex items-center gap-4 p-4 rounded-lg border', sev.bg, sev.border)}>
                            <div className={cn('h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0', sev.bg)}>
                              <SevIcon className="h-5 w-5" style={{ color: sev.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-mono font-bold text-[#e2e8f0]">{dtc.code}</span>
                                <Badge className={cn('text-[9px] border px-1.5 py-0', sev.bg, sev.border)} style={{ color: sev.color }}>
                                  {dtc.severity.toUpperCase()}
                                </Badge>
                                <Badge className="bg-[#1e2a3a] text-[#94a3b8] border-[#1e2a3a] text-[9px] px-1.5 py-0">
                                  {dtc.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-[#94a3b8]">{dtc.description}</div>
                            </div>
                            <div className="text-[9px] text-[#475569] flex-shrink-0">
                              Mask: 0x{dtc.statusMask.toString(16).toUpperCase()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <CheckCircle2 className="h-16 w-16 text-[#10b981] mb-4" />
                      <p className="text-sm text-[#64748b]">No Diagnostic Trouble Codes</p>
                      <p className="text-[10px] text-[#475569] mt-1">All systems nominal</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* LIVE DATA TAB */}
            <TabsContent value="live" className="space-y-4 mt-4">
              <Card className="bg-[#151d2b] border-[#1e2a3a]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#00d4ff]" />
                      Live Sensor Data
                      {isReadingLiveData && (
                        <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]" />
                      )}
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={toggleLiveData}
                      disabled={!isConnected}
                      className={cn(
                        'h-7 text-[10px] gap-1',
                        isReadingLiveData
                          ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                          : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                      )}
                    >
                      {isReadingLiveData ? (
                        <><Square className="h-3 w-3" />Stop Stream</>
                      ) : (
                        <><Play className="h-3 w-3" />Start Stream</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {liveData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {liveData.map((sensor) => {
                        const Icon = getSensorIcon(sensor.name)
                        const color = getSensorColor(sensor.name)
                        const percentage = Math.min(100, Math.max(0, ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100))
                        return (
                          <div key={sensor.pid} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" style={{ color }} />
                                <span className="text-[11px] text-[#94a3b8]">{sensor.name}</span>
                              </div>
                              <span className="text-[9px] text-[#475569] font-mono">PID 0x{sensor.pid.toString(16).toUpperCase()}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold tabular-nums" style={{ color }}>
                                {sensor.name.includes('Trim') || sensor.name.includes('Ratio')
                                  ? sensor.value.toFixed(3)
                                  : sensor.value.toFixed(1)
                                }
                              </span>
                              <span className="text-[10px] text-[#64748b]">{sensor.unit}</span>
                            </div>
                            <Progress value={percentage} className="h-1 bg-[#1e2a3a]" style={{ ['--progress-color' as string]: color }} />
                            <div className="flex justify-between text-[8px] text-[#475569] tabular-nums">
                              <span>{sensor.min}</span>
                              <span>{sensor.max}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Gauge className="h-16 w-16 text-[#1e2a3a] mb-4" />
                      <p className="text-sm text-[#64748b]">No Live Data</p>
                      <p className="text-[10px] text-[#475569] mt-1">Connect and start streaming to see live sensor data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ECU INFO TAB */}
            <TabsContent value="ecu" className="space-y-4 mt-4">
              <Card className="bg-[#151d2b] border-[#1e2a3a]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <CircuitBoard className="h-4 w-4 text-[#00d4ff]" />
                      ECU Identification
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={fetchECUInfo}
                      disabled={!isConnected}
                      className="h-7 text-[10px] gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                    >
                      <RefreshCw className="h-3 w-3" />Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ecuInfo ? (
                    <div className="space-y-4">
                      {/* VIN */}
                      <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                        <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Vehicle Identification Number</div>
                        <span className="text-xl font-mono font-bold text-[#00d4ff] tracking-widest">{ecuInfo.vin}</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <InfoItem label="Make" value={ecuInfo.make} />
                          <InfoItem label="Model" value={ecuInfo.model} />
                          <InfoItem label="Year" value={ecuInfo.year} />
                          <InfoItem label="Engine" value={ecuInfo.engine} />
                        </div>
                      </div>

                      {/* ECU Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 space-y-2">
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Hardware</div>
                          <InfoRow label="ECU Hardware Number" value={ecuInfo.ecuHardwareNumber} />
                          <InfoRow label="Hardware Version" value={ecuInfo.hardwareVersion} />
                          <InfoRow label="Boot Software ID" value={ecuInfo.bootSoftwareIdent} />
                        </div>
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 space-y-2">
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Software</div>
                          <InfoRow label="ECU Software Number" value={ecuInfo.ecuSoftwareNumber} />
                          <InfoRow label="Software Version" value={ecuInfo.softwareVersion} />
                          <InfoRow label="Programming Date" value={ecuInfo.programmingDate} />
                        </div>
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 space-y-2 md:col-span-2">
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Manufacturer</div>
                          <InfoRow label="ECU Manufacturer" value={ecuInfo.ecuManufacturer} />
                          <InfoRow label="Serial Number" value={ecuInfo.ecuSerialNumber} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <CircuitBoard className="h-16 w-16 text-[#1e2a3a] mb-4" />
                      <p className="text-sm text-[#64748b]">No ECU Information</p>
                      <p className="text-[10px] text-[#475569] mt-1">Connect and read ECU info</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* DONGLE TAB */}
            <TabsContent value="dongle" className="space-y-4 mt-4">
              <Card className="bg-[#151d2b] border-[#1e2a3a]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-[#00d4ff]" />
                      VAS 6154 Dongle Information
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={fetchDongleInfo}
                      className="h-7 text-[10px] gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                    >
                      <RefreshCw className="h-3 w-3" />Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {dongleInfo ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 space-y-2">
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Device</div>
                          <InfoRow label="Serial Number" value={dongleInfo.serialNumber} />
                          <InfoRow label="Firmware Version" value={dongleInfo.firmwareVersion} />
                          <InfoRow label="Hardware Revision" value={dongleInfo.hardwareRevision} />
                          <InfoRow label="Interface" value={dongleInfo.interface} />
                        </div>
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 space-y-2">
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Network</div>
                          <InfoRow label="IP Address" value={dongleInfo.ipAddress} />
                          <InfoRow label="MAC Address" value={dongleInfo.macAddress} />
                          <InfoRow label="Link Speed" value={dongleInfo.linkSpeed} />
                          <InfoRow label="Protocol" value={dongleInfo.protocol} />
                        </div>
                      </div>

                      {/* Connection Diagram */}
                      <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                        <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-3">Connection Architecture</div>
                        <div className="flex items-center justify-center gap-4 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="h-12 w-12 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center">
                              <Usb className="h-6 w-6 text-[#00d4ff]" />
                            </div>
                            <span className="text-[9px] text-[#64748b]">PC / Laptop</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="h-0.5 w-8 bg-[#00d4ff]/30" />
                            <span className="text-[8px] text-[#475569]">USB</span>
                            <div className="h-0.5 w-8 bg-[#00d4ff]/30" />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="h-12 w-12 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center">
                              <HardDrive className="h-6 w-6 text-[#f59e0b]" />
                            </div>
                            <span className="text-[9px] text-[#64748b]">VAS 6154</span>
                            <span className="text-[8px] text-[#475569]">192.168.13.69</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="h-0.5 w-8 bg-[#10b981]/30" />
                            <span className="text-[8px] text-[#475569]">DoIP</span>
                            <div className="h-0.5 w-8 bg-[#10b981]/30" />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="h-12 w-12 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center">
                              <Car className="h-6 w-6 text-[#10b981]" />
                            </div>
                            <span className="text-[9px] text-[#64748b]">Vehicle ECU</span>
                            <span className="text-[8px] text-[#475569]">OBD-II Port</span>
                          </div>
                        </div>
                      </div>

                      {/* Protocol Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                          <Shield className="h-5 w-5 text-[#8b5cf6] mx-auto mb-2" />
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">DoIP</div>
                          <div className="text-xs text-[#e2e8f0] font-medium">ISO 13400</div>
                          <div className="text-[9px] text-[#475569]">Port 13400</div>
                        </div>
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                          <Cpu className="h-5 w-5 text-[#00d4ff] mx-auto mb-2" />
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">UDS</div>
                          <div className="text-xs text-[#e2e8f0] font-medium">ISO 14229</div>
                          <div className="text-[9px] text-[#475569]">TX: 0x7E0 / RX: 0x7E8</div>
                        </div>
                        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                          <Gauge className="h-5 w-5 text-[#10b981] mx-auto mb-2" />
                          <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">OBD-II</div>
                          <div className="text-xs text-[#e2e8f0] font-medium">ISO 15031</div>
                          <div className="text-[9px] text-[#475569]">Mode 01 PIDs</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <HardDrive className="h-16 w-16 text-[#1e2a3a] mb-4" />
                      <p className="text-sm text-[#64748b]">No Dongle Information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatusCard({ icon: Icon, label, value, color, pulse }: {
  icon: React.ElementType
  label: string
  value: string
  color: string
  pulse?: boolean
}) {
  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[10px] text-[#475569] uppercase tracking-wider">{label}</span>
        {pulse && <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />}
      </div>
      <div className="text-xs font-semibold text-[#e2e8f0]">{value}</div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, desc, onClick, disabled, loading, active }: {
  icon: React.ElementType
  label: string
  desc: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 group',
        disabled
          ? 'border-[#1e2a3a] bg-[#0f1923] opacity-50 cursor-not-allowed'
          : active
          ? 'border-[#10b981]/40 bg-[#10b981]/5 shadow-[0_0_8px_#10b98115]'
          : 'border-[#1e2a3a] bg-[#0f1923] hover:bg-[#1e2a3a]/50 hover:border-[#2d3f55]'
      )}
    >
      <div className={cn(
        'h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0',
        active ? 'bg-[#10b981]/20' : 'bg-[#00d4ff]/10',
        !disabled && 'group-hover:bg-[#00d4ff]/20 transition-colors'
      )}>
        {loading ? (
          <RotateCcw className="h-4 w-4 text-[#00d4ff] animate-spin" />
        ) : (
          <Icon className={cn('h-4 w-4', active ? 'text-[#10b981]' : 'text-[#00d4ff]')} />
        )}
      </div>
      <div className="flex-1 text-left">
        <div className={cn(
          'text-xs font-semibold transition-colors',
          active ? 'text-[#10b981]' : 'text-[#e2e8f0]',
          !disabled && 'group-hover:text-[#00d4ff]'
        )}>
          {label}
        </div>
        <div className="text-[9px] text-[#475569]">{desc}</div>
      </div>
      {!disabled && !loading && (
        <ChevronRight className="h-4 w-4 text-[#475569] group-hover:text-[#00d4ff] flex-shrink-0 transition-colors" />
      )}
    </button>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] text-[#475569]">{label}</div>
      <div className="text-xs text-[#e2e8f0] font-medium">{value}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] text-[#64748b]">{label}</span>
      <span className="text-[10px] font-mono text-[#e2e8f0]">{value}</span>
    </div>
  )
}
