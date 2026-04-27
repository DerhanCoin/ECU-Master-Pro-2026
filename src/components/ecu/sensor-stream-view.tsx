'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Radio,
  Activity,
  Clock,
  Download,
  Filter,
  Hash,
  Type,
  Server,
  ArrowUpDown,
  Zap,
  Cpu,
  Wifi,
  HardDrive,
  Trash2,
  Play,
  Pause,
  Square,
  Settings,
  ChevronRight,
  Layers,
  Terminal,
  AlertCircle,
  Database,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

interface StreamEntry {
  id: number
  timestamp: string
  direction: 'TX' | 'RX'
  pid: string
  ecu: string
  data: string
  ascii: string
  description: string
}

type DataView = 'hex' | 'ascii'
type StreamRate = 'slow' | 'medium' | 'fast' | 'custom'

const protocolInfo = {
  protocol: 'ISO 15765-4 (CAN)',
  baudRate: '500 kbps',
  ecuId: '0x7E0',
  ecuResponse: '0x7E8',
  protocolVariant: 'CAN 11-bit',
}

const pids = [
  { pid: '0C', name: 'Engine RPM', freq: 'Fast' },
  { pid: '0D', name: 'Vehicle Speed', freq: 'Fast' },
  { pid: '05', name: 'Coolant Temp', freq: 'Medium' },
  { pid: '0F', name: 'Intake Temp', freq: 'Medium' },
  { pid: '11', name: 'Throttle Position', freq: 'Fast' },
  { pid: '0B', name: 'Intake Pressure', freq: 'Fast' },
  { pid: '0E', name: 'Timing Advance', freq: 'Medium' },
  { pid: '44', name: 'Lambda (AFR)', freq: 'Fast' },
  { pid: '2F', name: 'Fuel Level', freq: 'Slow' },
  { pid: '42', name: 'Control Voltage', freq: 'Slow' },
  { pid: '01', name: 'DTC Count', freq: 'Slow' },
  { pid: '21', name: 'Distance MIL', freq: 'Slow' },
]

function generateStreamEntry(id: number): StreamEntry {
  const pid = pids[Math.floor(Math.random() * pids.length)]
  const isResponse = Math.random() > 0.4
  const direction = isResponse ? 'RX' : 'TX'

  let data: string
  let ascii: string
  let description: string

  if (!isResponse) {
    data = `01 ${pid.pid}`
    ascii = `[REQ] PID ${pid.pid}`
    description = `Request: ${pid.name}`
  } else {
    const valA = Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
    const valB = Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
    const valC = Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
    data = `41 ${pid.pid} ${valA} ${valB} ${valC}`
    ascii = `[RSP] ${pid.name}`
    description = `Response: ${pid.name} = raw [${valA}, ${valB}, ${valC}]`
  }

  const now = new Date()
  const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`

  return {
    id,
    timestamp: ts,
    direction,
    pid: pid.pid,
    ecu: isResponse ? protocolInfo.ecuResponse : protocolInfo.ecuId,
    data,
    ascii,
    description,
  }
}

const rateConfig: Record<StreamRate, { label: string; hz: number; desc: string }> = {
  slow: { label: 'Slow', hz: 2, desc: '~2 Hz - Basic monitoring' },
  medium: { label: 'Medium', hz: 10, desc: '~10 Hz - Standard logging' },
  fast: { label: 'Fast', hz: 50, desc: '~50 Hz - High-speed capture' },
  custom: { label: 'Custom', hz: 25, desc: '~25 Hz - User defined' },
}

export function SensorStreamView() {
  const [isStreaming, setIsStreaming] = useState(true)
  const [streamEntries, setStreamEntries] = useState<StreamEntry[]>([])
  const [dataView, setDataView] = useState<DataView>('hex')
  const [filterPid, setFilterPid] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<'all' | 'TX' | 'RX'>('all')
  const [streamRate, setStreamRate] = useState<StreamRate>('medium')
  const [msgPerSec, setMsgPerSec] = useState(0)
  const [errorCount, setErrorCount] = useState(2)
  const [uptime, setUptime] = useState(1847)
  const [latency, setLatency] = useState(12)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureSize, setCaptureSize] = useState(0)
  const [pidQueue, setPidQueue] = useState(pids.slice(0, 6).map(p => p.pid))
  const entryIdRef = useRef(0)
  const consoleRef = useRef<HTMLDivElement>(null)

  // Stream simulation
  useEffect(() => {
    if (!isStreaming) return
    const hz = rateConfig[streamRate].hz
    const interval = Math.max(50, Math.round(1000 / hz))

    const timer = setInterval(() => {
      const entry = generateStreamEntry(entryIdRef.current++)
      setStreamEntries(prev => {
        const next = [...prev, entry]
        return next.length > 200 ? next.slice(-150) : next
      })

      // Simulate stats
      setMsgPerSec(Math.round(hz * (0.8 + Math.random() * 0.4)))
      setLatency(Math.round(8 + Math.random() * 12))
      if (Math.random() < 0.005) setErrorCount(prev => prev + 1)
    }, interval)

    return () => clearInterval(timer)
  }, [isStreaming, streamRate])

  // Uptime counter
  useEffect(() => {
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Capture size
  useEffect(() => {
    if (!isCapturing) return
    const timer = setInterval(() => setCaptureSize(prev => prev + Math.round(Math.random() * 1024)), 500)
    return () => clearInterval(timer)
  }, [isCapturing])

  // Auto-scroll
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [streamEntries])

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const filteredEntries = streamEntries.filter(e => {
    if (filterPid !== 'all' && e.pid !== filterPid) return false
    if (filterDirection !== 'all' && e.direction !== filterDirection) return false
    return true
  })

  const addPidToQueue = (pid: string) => {
    if (!pidQueue.includes(pid)) {
      setPidQueue(prev => [...prev, pid])
    }
  }

  const removePidFromQueue = (pid: string) => {
    setPidQueue(prev => prev.filter(p => p !== pid))
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Sensor Stream</h1>
            {isStreaming ? (
              <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                STREAMING
              </Badge>
            ) : (
              <Badge className="bg-[#64748b]/20 text-[#64748b] border-[#64748b]/30 text-[10px]">
                PAUSED
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#64748b]">Raw sensor data streaming visualization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsStreaming(!isStreaming)}
            className={`h-8 text-xs gap-1.5 ${isStreaming ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/30' : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/30'}`}
          >
            {isStreaming ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCapturing(!isCapturing)}
            className={`h-8 text-xs gap-1.5 ${isCapturing ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/30' : 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30'}`}
          >
            {isCapturing ? <><Square className="h-3 w-3" /> Stop Capture</> : <><Download className="h-3 w-3" /> Capture</>}
          </Button>
        </div>
      </div>

      {/* Stream Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Messages/sec', value: msgPerSec.toString(), icon: <Activity className="h-4 w-4 text-[#00d4ff]" /> },
          { label: 'Errors', value: errorCount.toString(), icon: <AlertCircle className="h-4 w-4 text-[#ef4444]" /> },
          { label: 'Uptime', value: formatUptime(uptime), icon: <Clock className="h-4 w-4 text-[#10b981]" /> },
          { label: 'Latency', value: `${latency} ms`, icon: <Zap className="h-4 w-4 text-[#f59e0b]" /> },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#151d2b] border-[#1e2a3a]">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0f1923] flex items-center justify-center shrink-0">{stat.icon}</div>
              <div>
                <div className="text-[10px] text-[#475569]">{stat.label}</div>
                <div className="text-sm font-mono font-bold text-[#e2e8f0]">{stat.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Protocol Info & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Protocol Info */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Wifi className="h-4 w-4 text-[#00d4ff]" />
              Protocol Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Protocol', value: protocolInfo.protocol },
              { label: 'Baud Rate', value: protocolInfo.baudRate },
              { label: 'ECU ID', value: protocolInfo.ecuId },
              { label: 'Response ID', value: protocolInfo.ecuResponse },
              { label: 'Variant', value: protocolInfo.protocolVariant },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[11px] text-[#475569]">{item.label}</span>
                <span className="text-[11px] font-mono text-[#e2e8f0]">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Filter Controls */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#8b5cf6]" />
              Filter Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-[10px] text-[#475569] mb-1">By PID</div>
              <select
                value={filterPid}
                onChange={e => setFilterPid(e.target.value)}
                className="w-full h-7 text-xs bg-[#0f1923] border border-[#1e2a3a] rounded px-2 text-[#e2e8f0] font-mono"
              >
                <option value="all">All PIDs</option>
                {pids.map(p => (
                  <option key={p.pid} value={p.pid}>0x{p.pid} - {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-[#475569] mb-1">By Direction</div>
              <div className="flex gap-1.5">
                {(['all', 'TX', 'RX'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setFilterDirection(dir)}
                    className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                      filterDirection === dir
                        ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30'
                        : 'bg-[#0f1923] text-[#64748b] border border-[#1e2a3a] hover:text-[#e2e8f0]'
                    }`}
                  >
                    {dir === 'all' ? 'All' : dir}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#475569] mb-1">Data View</div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setDataView('hex')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                    dataView === 'hex'
                      ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30'
                      : 'bg-[#0f1923] text-[#64748b] border border-[#1e2a3a] hover:text-[#e2e8f0]'
                  }`}
                >
                  <Hash className="h-3 w-3" /> Hex
                </button>
                <button
                  onClick={() => setDataView('ascii')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                    dataView === 'ascii'
                      ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30'
                      : 'bg-[#0f1923] text-[#64748b] border border-[#1e2a3a] hover:text-[#e2e8f0]'
                  }`}
                >
                  <Type className="h-3 w-3" /> ASCII
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stream Rate & Buffer */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#f59e0b]" />
              Stream Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(rateConfig) as StreamRate[]).map(rate => (
                <button
                  key={rate}
                  onClick={() => setStreamRate(rate)}
                  className={`px-2 py-2 rounded-lg text-left transition-all ${
                    streamRate === rate
                      ? 'bg-[#00d4ff]/10 border border-[#00d4ff]/40 text-[#00d4ff]'
                      : 'bg-[#0f1923] border border-[#1e2a3a] text-[#64748b] hover:text-[#e2e8f0] hover:border-[#2d3f55]'
                  }`}
                >
                  <div className="text-[11px] font-semibold">{rateConfig[rate].label}</div>
                  <div className="text-[9px] opacity-70">{rateConfig[rate].desc}</div>
                </button>
              ))}
            </div>
            {/* Buffer visualization */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#475569]">Stream Buffer</span>
                <span className="text-[10px] font-mono text-[#e2e8f0]">{streamEntries.length} / 200</span>
              </div>
              <div className="w-full h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] rounded-full transition-all"
                  style={{ width: `${(streamEntries.length / 200) * 100}%` }}
                />
              </div>
            </div>
            {isCapturing && (
              <div className="flex items-center gap-2 p-2 rounded bg-[#ef4444]/10 border border-[#ef4444]/30">
                <Download className="h-3 w-3 text-[#ef4444]" />
                <span className="text-[10px] text-[#ef4444]">Capturing: {(captureSize / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Streaming Console */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#10b981]" />
              Stream Console
              {isStreaming && <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
                {filteredEntries.length} entries
              </Badge>
              <Button size="sm" variant="ghost" className="h-6 text-[9px] text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] gap-1" onClick={() => setStreamEntries([])}>
                <Trash2 className="h-2.5 w-2.5" /> Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={consoleRef}
            className="bg-[#0a0e14] border border-[#1e2a3a] rounded-lg p-3 font-mono text-[11px] h-80 overflow-y-auto"
          >
            {filteredEntries.length === 0 ? (
              <div className="text-[#475569] text-center py-8">
                {isStreaming ? 'Waiting for data...' : 'Stream is paused'}
              </div>
            ) : (
              filteredEntries.map(entry => (
                <div key={entry.id} className="flex items-start gap-2 py-0.5 border-b border-[#1e2a3a]/30 last:border-0 hover:bg-[#1e2a3a]/20">
                  <span className="text-[#475569] shrink-0 w-20">{entry.timestamp}</span>
                  <Badge className={`text-[8px] h-4 shrink-0 ${entry.direction === 'TX' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'}`}>
                    {entry.direction}
                  </Badge>
                  <span className="text-[#64748b] shrink-0 w-12">{entry.ecu}</span>
                  <span className="text-[#8b5cf6] shrink-0 w-8">0x{entry.pid}</span>
                  <span className={`${entry.direction === 'TX' ? 'text-[#94a3b8]' : 'text-[#e2e8f0]'} flex-1`}>
                    {dataView === 'hex' ? entry.data : entry.ascii}
                  </span>
                  <span className="text-[#475569] text-[10px] shrink-0 max-w-48 truncate hidden md:inline">{entry.description}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* PID Request Queue */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Database className="h-4 w-4 text-[#8b5cf6]" />
              PID Request Queue
            </CardTitle>
            <Badge className="text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55]">
              {pidQueue.length} PIDs
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {pids.map(pid => {
              const inQueue = pidQueue.includes(pid.pid)
              return (
                <button
                  key={pid.pid}
                  onClick={() => inQueue ? removePidFromQueue(pid.pid) : addPidToQueue(pid.pid)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                    inQueue
                      ? 'border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff]'
                      : 'border-[#1e2a3a] bg-[#0f1923] text-[#64748b] hover:border-[#2d3f55]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${inQueue ? 'bg-[#00d4ff]' : 'bg-[#475569]'}`} />
                  <div className="text-left flex-1">
                    <div className="font-mono text-[10px]">0x{pid.pid}</div>
                    <div className="text-[9px] opacity-70 truncate">{pid.name}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
