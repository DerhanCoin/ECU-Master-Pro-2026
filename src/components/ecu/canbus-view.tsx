'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BusFront,
  Play,
  Square,
  Search,
  Filter,
  ArrowDown,
  ArrowUp,
  Activity,
  AlertCircle,
  Gauge,
  Thermometer,
  Fuel,
  Car,
  Disc,
  DoorOpen,
  RotateCcw,
  Hash,
  Radio,
  AlertTriangle,
  Zap,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type Protocol = 'CAN 2.0A' | 'CAN 2.0B' | 'ISO-TP' | 'UDS'
type Direction = 'RX' | 'TX'
type ProtocolFilter = 'All' | 'CAN 2.0A' | 'CAN 2.0B' | 'ISO-TP' | 'UDS'
type DirectionFilter = 'All' | 'RX' | 'TX'

interface CANMessage {
  id: string
  time: number
  canId: string
  dlc: number
  data: string
  protocol: Protocol
  direction: Direction
}

interface DecodedSignal {
  name: string
  value: string
  unit: string
  sourceId: string
  timestamp: number
  color: string
  icon: React.ElementType
}

// CAN ID pools for realistic simulation
const CAN_IDS = [
  '0x0C0', '0x0C1', '0x1A2', '0x1A3', '0x3E8', '0x3E9',
  '0x100', '0x101', '0x200', '0x201', '0x410', '0x411',
  '0x500', '0x501', '0x618', '0x619', '0x700', '0x7DF',
  '0x7E0', '0x7E8',
]

const PROTOCOLS: Protocol[] = ['CAN 2.0A', 'CAN 2.0B', 'ISO-TP', 'UDS']
const DIRECTIONS: Direction[] = ['RX', 'TX']

function generateHexData(dlc: number): string {
  const bytes: string[] = []
  for (let i = 0; i < dlc; i++) {
    bytes.push(Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0'))
  }
  return bytes.join(' ')
}

function generateCANMessage(timeOffset: number): CANMessage {
  const canId = CAN_IDS[Math.floor(Math.random() * CAN_IDS.length)]
  const dlc = Math.floor(Math.random() * 5) + 4 // 4-8
  const protocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)]
  const direction = DIRECTIONS[Math.random() > 0.3 ? 0 : 1] // 70% RX, 30% TX

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: timeOffset,
    canId,
    dlc,
    data: generateHexData(dlc),
    protocol,
    direction,
  }
}

function formatTime(ms: number): string {
  const totalSec = ms / 1000
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min.toString().padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0')}`
}

// Decoded signals data
function generateDecodedSignals(time: number): DecodedSignal[] {
  const rpmFluctuation = Math.floor(Math.random() * 60) - 30
  const speedFluctuation = Math.floor(Math.random() * 6) - 3
  const coolantFluctuation = Math.round((Math.random() * 2 - 1) * 10) / 10
  const throttleFluctuation = Math.round((Math.random() * 4 - 2) * 10) / 10
  const fuelFluctuation = Math.round((Math.random() * 2 - 1) * 10) / 10
  const brakeFluctuation = Math.round(Math.random() * 5 * 10) / 10
  const steeringFluctuation = Math.round((Math.random() * 6 - 3) * 10) / 10

  return [
    {
      name: 'Engine RPM',
      value: (3240 + rpmFluctuation).toLocaleString(),
      unit: 'rpm',
      sourceId: '0x0C0',
      timestamp: time,
      color: '#00d4ff',
      icon: Gauge,
    },
    {
      name: 'Vehicle Speed',
      value: (87 + speedFluctuation).toString(),
      unit: 'km/h',
      sourceId: '0x0C0',
      timestamp: time,
      color: '#10b981',
      icon: Car,
    },
    {
      name: 'Coolant Temp',
      value: (89 + coolantFluctuation).toFixed(1),
      unit: '°C',
      sourceId: '0x0C0',
      timestamp: time,
      color: '#f59e0b',
      icon: Thermometer,
    },
    {
      name: 'Throttle Position',
      value: (34 + throttleFluctuation).toFixed(1),
      unit: '%',
      sourceId: '0x1A2',
      timestamp: time,
      color: '#8b5cf6',
      icon: Activity,
    },
    {
      name: 'Fuel Level',
      value: (72 + fuelFluctuation).toFixed(1),
      unit: '%',
      sourceId: '0x3E8',
      timestamp: time,
      color: '#06b6d4',
      icon: Fuel,
    },
    {
      name: 'Brake Pressure',
      value: brakeFluctuation.toFixed(1),
      unit: 'bar',
      sourceId: '0x1A2',
      timestamp: time,
      color: '#ef4444',
      icon: Disc,
    },
    {
      name: 'Steering Angle',
      value: (steeringFluctuation).toFixed(1),
      unit: '°',
      sourceId: '0x0C0',
      timestamp: time,
      color: '#a855f7',
      icon: RotateCcw,
    },
    {
      name: 'Door Status',
      value: 'Closed',
      unit: '',
      sourceId: '0x3E8',
      timestamp: time,
      color: '#10b981',
      icon: DoorOpen,
    },
  ]
}

export function CANBusView() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [messages, setMessages] = useState<CANMessage[]>([])
  const [searchId, setSearchId] = useState('')
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>('All')
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('All')
  const [autoScroll, setAutoScroll] = useState(true)
  const [busLoad, setBusLoad] = useState(34)
  const [msgPerSec, setMsgPerSec] = useState(1247)
  const [errorCount, setErrorCount] = useState(0)
  const [decodedSignals, setDecodedSignals] = useState<DecodedSignal[]>(generateDecodedSignals(0))
  const [totalMessages, setTotalMessages] = useState(0)
  const [errorFrames, setErrorFrames] = useState(0)
  const [remoteFrames, setRemoteFrames] = useState(12)
  const [overruns, setOverruns] = useState(0)

  const tableRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const messageCounterRef = useRef(0)

  const addMessages = useCallback(() => {
    const count = Math.floor(Math.random() * 3) + 1 // 1-3 messages per tick
    const now = Date.now()
    const elapsed = now - startTimeRef.current

    const newMsgs: CANMessage[] = []
    for (let i = 0; i < count; i++) {
      newMsgs.push(generateCANMessage(elapsed))
    }

    setMessages((prev) => {
      const updated = [...prev, ...newMsgs]
      messageCounterRef.current += count
      // Limit to 200 messages
      if (updated.length > 200) {
        return updated.slice(updated.length - 200)
      }
      return updated
    })

    setTotalMessages((prev) => prev + count)

    // Update bus load with some variation
    setBusLoad((prev) => {
      const delta = (Math.random() - 0.5) * 4
      return Math.max(5, Math.min(95, prev + delta))
    })

    // Update messages/sec
    setMsgPerSec((prev) => {
      const delta = Math.floor((Math.random() - 0.5) * 80)
      return Math.max(200, Math.min(3000, prev + delta))
    })

    // Occasionally increment error count (very rare)
    if (Math.random() < 0.002) {
      setErrorCount((prev) => prev + 1)
      setErrorFrames((prev) => prev + 1)
    }

    // Update decoded signals
    setDecodedSignals(generateDecodedSignals(elapsed))
  }, [])

  useEffect(() => {
    if (isCapturing) {
      startTimeRef.current = Date.now()
      intervalRef.current = setInterval(addMessages, 200)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isCapturing, addMessages])

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight
    }
  }, [messages, autoScroll])

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = !searchId || msg.canId.toLowerCase().includes(searchId.toLowerCase())
    const matchesProtocol = protocolFilter === 'All' || msg.protocol === protocolFilter
    const matchesDirection = directionFilter === 'All' || msg.direction === directionFilter
    return matchesSearch && matchesProtocol && matchesDirection
  })

  const handleClearBuffer = () => {
    setMessages([])
    setTotalMessages(0)
    setErrorCount(0)
    setErrorFrames(0)
    setRemoteFrames(12)
    setOverruns(0)
    setBusLoad(0)
    setMsgPerSec(0)
  }

  const busLoadColor = busLoad < 60 ? '#10b981' : busLoad < 80 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BusFront className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">CAN Bus Monitor</h1>
              {isCapturing && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]" />
                  <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">
                    Live
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              Real-time CAN bus traffic analysis and protocol decoding
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsCapturing(!isCapturing)}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              isCapturing
                ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            {isCapturing ? (
              <>
                <Square className="h-3 w-3" />
                Stop Capture
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Start Capture
              </>
            )}
          </Button>
        </div>

        {/* Bus Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Bus Load */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#64748b] font-medium">Bus Load</span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: busLoadColor }}
              >
                {busLoad.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${busLoad}%`,
                  backgroundColor: busLoadColor,
                  boxShadow: isCapturing ? `0 0 6px ${busLoadColor}60` : 'none',
                }}
              />
            </div>
          </div>

          {/* Messages/sec */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#64748b] font-medium">Messages/sec</span>
              <Activity className="h-3.5 w-3.5 text-[#00d4ff]" />
            </div>
            <span className="text-lg font-bold text-[#e2e8f0] tabular-nums">
              {msgPerSec.toLocaleString()}
            </span>
          </div>

          {/* Errors */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#64748b] font-medium">Errors</span>
              <AlertCircle
                className="h-3.5 w-3.5"
                style={{ color: errorCount === 0 ? '#10b981' : '#ef4444' }}
              />
            </div>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: errorCount === 0 ? '#10b981' : '#ef4444' }}
            >
              {errorCount}
            </span>
          </div>

          {/* Protocol */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#64748b] font-medium">Protocol</span>
              <Radio className="h-3.5 w-3.5 text-[#00d4ff]" />
            </div>
            <span className="text-sm font-bold text-[#e2e8f0]">ISO 15765-4</span>
            <span className="text-[10px] text-[#64748b] ml-1">(CAN)</span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
            <Input
              placeholder="Filter by CAN ID (e.g. 0x0C0)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="h-8 text-xs pl-8 bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:border-[#00d4ff] focus-visible:ring-[#00d4ff]/20"
            />
          </div>

          <Select
            value={protocolFilter}
            onValueChange={(v) => setProtocolFilter(v as ProtocolFilter)}
          >
            <SelectTrigger
              size="sm"
              className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] w-[140px]"
            >
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
              <SelectItem value="All" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                All Protocols
              </SelectItem>
              <SelectItem value="CAN 2.0A" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                CAN 2.0A
              </SelectItem>
              <SelectItem value="CAN 2.0B" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                CAN 2.0B
              </SelectItem>
              <SelectItem value="ISO-TP" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                ISO-TP
              </SelectItem>
              <SelectItem value="UDS" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                UDS
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={directionFilter}
            onValueChange={(v) => setDirectionFilter(v as DirectionFilter)}
          >
            <SelectTrigger
              size="sm"
              className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] w-[120px]"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
              <SelectItem value="All" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                All Directions
              </SelectItem>
              <SelectItem value="RX" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                RX Only
              </SelectItem>
              <SelectItem value="TX" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                TX Only
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearBuffer}
            className="h-8 text-xs gap-1.5 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] hover:border-[#2d3f55]"
          >
            <RotateCcw className="h-3 w-3" />
            Clear Buffer
          </Button>
        </div>

        {/* Main Content: Traffic Table + Decoded Signals */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Message Traffic Table - takes 2 columns */}
          <div className="xl:col-span-2">
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a]">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-[#00d4ff]" />
                  <span className="text-xs font-semibold text-[#e2e8f0]">Message Traffic</span>
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                    style={{
                      backgroundColor: '#00d4ff20',
                      color: '#00d4ff',
                    }}
                  >
                    {filteredMessages.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={autoScroll}
                      onCheckedChange={(checked) => setAutoScroll(checked === true)}
                      className="h-3.5 w-3.5 border-[#1e2a3a] data-[state=checked]:bg-[#00d4ff] data-[state=checked]:border-[#00d4ff]"
                    />
                    <span className="text-[10px] text-[#64748b]">Auto-scroll</span>
                  </label>
                </div>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-[80px_80px_50px_1fr_90px_60px] gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#475569] border-b border-[#1e2a3a]">
                <span>Time</span>
                <span>CAN ID</span>
                <span>DLC</span>
                <span>Data (hex)</span>
                <span>Protocol</span>
                <span>Dir</span>
              </div>

              {/* Message Rows */}
              <div
                ref={tableRef}
                className="max-h-96 overflow-y-auto overflow-x-hidden"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#1e2a3a #0f1923',
                }}
              >
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BusFront className="h-8 w-8 text-[#00d4ff] mb-2 opacity-40" />
                    <p className="text-xs text-[#64748b]">
                      {isCapturing ? 'Waiting for messages...' : 'Click "Start Capture" to begin monitoring CAN traffic'}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="grid grid-cols-[80px_80px_50px_1fr_90px_60px] gap-2 px-4 py-1.5 text-[11px] border-b border-[#1e2a3a]/50 hover:bg-[#1e2a3a]/30 transition-colors"
                    >
                      <span className="text-[#64748b] font-mono tabular-nums text-[10px]">
                        {formatTime(msg.time)}
                      </span>
                      <span
                        className={cn(
                          'font-mono font-semibold text-[11px]',
                          msg.direction === 'RX' ? 'text-[#00d4ff]' : 'text-[#a855f7]'
                        )}
                      >
                        {msg.canId}
                      </span>
                      <span className="text-[#94a3b8] font-mono tabular-nums">{msg.dlc}</span>
                      <span className="font-mono text-[#94a3b8] text-[10px] truncate tracking-wider">
                        {msg.data}
                      </span>
                      <span className="text-[#64748b] text-[10px]">{msg.protocol}</span>
                      <span className="flex items-center gap-1">
                        {msg.direction === 'RX' ? (
                          <>
                            <ArrowDown className="h-3 w-3 text-[#00d4ff]" />
                            <span className="text-[#00d4ff] text-[10px] font-semibold">RX</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp className="h-3 w-3 text-[#a855f7]" />
                            <span className="text-[#a855f7] text-[10px] font-semibold">TX</span>
                          </>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[#1e2a3a] bg-[#0f1923]/50">
                <span className="text-[10px] text-[#475569]">
                  Showing {filteredMessages.length} of {messages.length} messages
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px]">
                    <ArrowDown className="h-3 w-3 text-[#00d4ff]" />
                    <span className="text-[#00d4ff] font-semibold">
                      {messages.filter((m) => m.direction === 'RX').length}
                    </span>
                    <span className="text-[#475569]">RX</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px]">
                    <ArrowUp className="h-3 w-3 text-[#a855f7]" />
                    <span className="text-[#a855f7] font-semibold">
                      {messages.filter((m) => m.direction === 'TX').length}
                    </span>
                    <span className="text-[#475569]">TX</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Decoded Signals Panel */}
          <div className="xl:col-span-1">
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a]">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-[#00d4ff]" />
                  <span className="text-xs font-semibold text-[#e2e8f0]">Decoded Signals</span>
                </div>
                <Badge
                  className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                  style={{
                    backgroundColor: '#10b98120',
                    color: '#10b981',
                  }}
                >
                  {decodedSignals.length}
                </Badge>
              </div>

              <div className="p-3 space-y-2 max-h-[432px] overflow-y-auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#1e2a3a #0f1923',
                }}
              >
                {decodedSignals.map((signal) => {
                  const Icon = signal.icon
                  return (
                    <div
                      key={signal.name}
                      className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-3 hover:border-[#2d3f55] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3 w-3" style={{ color: signal.color }} />
                          <span className="text-[11px] font-medium text-[#94a3b8]">
                            {signal.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[#475569]">
                          {signal.sourceId}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span
                          className="text-lg font-bold tabular-nums"
                          style={{ color: signal.color }}
                        >
                          {isCapturing ? signal.value : '--'}
                        </span>
                        {signal.unit && (
                          <span className="text-[10px] text-[#64748b]">{signal.unit}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 text-[#475569]" />
                        <span className="text-[9px] text-[#475569] tabular-nums">
                          {isCapturing ? formatTime(signal.timestamp) : '--:--.---'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bus Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                <Hash className="h-3.5 w-3.5 text-[#00d4ff]" />
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">Total Messages</span>
            </div>
            <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">
              {totalMessages.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-[#ef4444]/10 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444]" />
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">Error Frames</span>
            </div>
            <span className="text-xl font-bold tabular-nums" style={{ color: errorFrames === 0 ? '#10b981' : '#ef4444' }}>
              {errorFrames}
            </span>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-[#f59e0b]/10 flex items-center justify-center">
                <Radio className="h-3.5 w-3.5 text-[#f59e0b]" />
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">Remote Frames</span>
            </div>
            <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">
              {remoteFrames}
            </span>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-[#8b5cf6]/10 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-[#8b5cf6]" />
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">Overruns</span>
            </div>
            <span className="text-xl font-bold tabular-nums" style={{ color: overruns === 0 ? '#10b981' : '#ef4444' }}>
              {overruns}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
