'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Zap,
  Network,
  Info,
} from 'lucide-react'

interface NetworkNode {
  id: string
  name: string
  abbr: string
  status: 'active' | 'standby' | 'error'
  dataRate: number
  x: number
  y: number
}

interface SignalPath {
  source: string
  destination: string
  quality: 'Excellent' | 'Good' | 'Degraded' | 'Poor'
  qualityPercent: number
  dataRate: number
  errors: number
}

interface NetworkEvent {
  time: string
  type: 'INFO' | 'WARNING' | 'ERROR'
  message: string
}

const nodes: NetworkNode[] = [
  { id: 'gateway', name: 'CAN Gateway', abbr: 'GW', status: 'active', dataRate: 823, x: 50, y: 50 },
  { id: 'engine', name: 'Engine ECU', abbr: 'ECM', status: 'active', dataRate: 245, x: 20, y: 20 },
  { id: 'tcm', name: 'Transmission', abbr: 'TCM', status: 'active', dataRate: 180, x: 50, y: 15 },
  { id: 'abs', name: 'ABS Module', abbr: 'ABS', status: 'active', dataRate: 120, x: 80, y: 20 },
  { id: 'srs', name: 'Airbag (SRS)', abbr: 'SRS', status: 'standby', dataRate: 15, x: 80, y: 80 },
  { id: 'bcm', name: 'Body Control', abbr: 'BCM', status: 'active', dataRate: 95, x: 50, y: 85 },
  { id: 'cluster', name: 'Instrument Cluster', abbr: 'IC', status: 'active', dataRate: 68, x: 20, y: 80 },
]

const signalPaths: SignalPath[] = [
  { source: 'Engine ECU', destination: 'Gateway', quality: 'Excellent', qualityPercent: 98, dataRate: 245, errors: 0 },
  { source: 'TCM', destination: 'Gateway', quality: 'Good', qualityPercent: 94, dataRate: 180, errors: 0 },
  { source: 'ABS Module', destination: 'Gateway', quality: 'Good', qualityPercent: 91, dataRate: 120, errors: 1 },
  { source: 'Airbag (SRS)', destination: 'Gateway', quality: 'Excellent', qualityPercent: 99, dataRate: 15, errors: 0 },
  { source: 'Body Control', destination: 'Gateway', quality: 'Degraded', qualityPercent: 76, dataRate: 95, errors: 3 },
  { source: 'Instrument Cluster', destination: 'Gateway', quality: 'Good', qualityPercent: 88, dataRate: 68, errors: 0 },
]

const initialEvents: NetworkEvent[] = [
  { time: '10:42:18', type: 'INFO', message: 'Gateway heartbeat received' },
  { time: '10:42:15', type: 'WARNING', message: 'BCM response timeout (retry 3/3)' },
  { time: '10:42:12', type: 'INFO', message: 'Engine ECU data update (8 signals)' },
  { time: '10:42:10', type: 'ERROR', message: 'ABS checksum mismatch on frame 0x1A2' },
  { time: '10:42:08', type: 'INFO', message: 'TCU shift position update' },
  { time: '10:42:05', type: 'INFO', message: 'Gateway routing table refreshed' },
  { time: '10:42:02', type: 'WARNING', message: 'SRS module standby mode confirmed' },
  { time: '10:42:00', type: 'INFO', message: 'Network scan completed (6 nodes)' },
]

const protocols = [
  { name: 'CAN 2.0A', percent: 45, messages: 562, color: '#00d4ff' },
  { name: 'CAN 2.0B', percent: 28, messages: 349, color: '#8b5cf6' },
  { name: 'ISO-TP', percent: 18, messages: 224, color: '#10b981' },
  { name: 'UDS', percent: 9, messages: 112, color: '#f59e0b' },
]

export function NetworkAnalysisView() {
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [events, setEvents] = useState<NetworkEvent[]>(initialEvents)

  const handleScan = () => {
    setScanning(true)
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setScanning(false)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 400)
  }

  const qualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return '#10b981'
      case 'Good': return '#00d4ff'
      case 'Degraded': return '#f59e0b'
      case 'Poor': return '#ef4444'
      default: return '#64748b'
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'standby': return '#f59e0b'
      case 'error': return '#ef4444'
      default: return '#64748b'
    }
  }

  const eventTypeColor = (type: string) => {
    switch (type) {
      case 'INFO': return '#00d4ff'
      case 'WARNING': return '#f59e0b'
      case 'ERROR': return '#ef4444'
      default: return '#64748b'
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Network Analysis</h1>
            </div>
            <p className="text-xs text-[#64748b]">
              ECU network topology and signal quality analysis
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleScan}
            disabled={scanning}
            className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
          >
            {scanning ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Scanning... {Math.min(Math.round(scanProgress), 100)}%
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Scan Network
              </>
            )}
          </Button>
        </div>

        {/* Scan Progress */}
        {scanning && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#94a3b8]">Scanning ECU network...</span>
              <span className="text-xs font-mono text-[#00d4ff]">{Math.min(Math.round(scanProgress), 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00bcd4] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(scanProgress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Network Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Connected ECUs', value: '12', color: '#10b981', icon: Cpu },
            { label: 'Active Signals', value: '247', color: '#00d4ff', icon: Activity },
            { label: 'Bus Load', value: '34%', color: '#f59e0b', icon: Zap },
            { label: 'Error Rate', value: '0.02%', color: '#10b981', icon: AlertTriangle },
          ].map((metric, i) => {
            const Icon = metric.icon
            return (
              <div key={i} className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" style={{ color: metric.color }} />
                  <span className="text-xs text-[#64748b]">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: metric.color }}>{metric.value}</div>
              </div>
            )
          })}
        </div>

        {/* Network Topology Diagram */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Network className="h-4 w-4 text-[#00d4ff]" />
              ECU Network Topology
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#10b981]" /> Active</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Standby</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" /> Error</span>
            </div>
          </div>

          {/* SVG Network Diagram */}
          <div className="relative w-full" style={{ paddingBottom: '60%' }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Connection lines */}
              {nodes.filter(n => n.id !== 'gateway').map(node => {
                const gw = nodes.find(n => n.id === 'gateway')!
                const isSelected = selectedNode === node.id || selectedNode === 'gateway'
                const lineColor = node.id === 'bcm' ? '#f59e0b' : '#1e2a3a'
                return (
                  <line
                    key={node.id}
                    x1={gw.x}
                    y1={gw.y}
                    x2={node.x}
                    y2={node.y}
                    stroke={isSelected && selectedNode ? lineColor : '#1e2a3a'}
                    strokeWidth={isSelected && selectedNode ? 0.8 : 0.4}
                    strokeDasharray={node.id === 'bcm' ? '2,1' : undefined}
                  />
                )
              })}

              {/* Nodes */}
              {nodes.map(node => {
                const isSelected = selectedNode === node.id
                const isConnected = selectedNode
                  ? (node.id === selectedNode || node.id === 'gateway' || selectedNode === 'gateway')
                  : false
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.id === 'gateway' ? 7 : 5}
                      fill={node.id === 'gateway' ? '#00d4ff20' : '#151d2b'}
                      stroke={isSelected ? '#00d4ff' : (isConnected && selectedNode ? '#2d3f55' : '#1e2a3a')}
                      strokeWidth={isSelected ? 1 : 0.5}
                      className="transition-all duration-200"
                    />
                    {node.status === 'active' && (
                      <circle
                        cx={node.x + (node.id === 'gateway' ? 5 : 3.5)}
                        cy={node.y - (node.id === 'gateway' ? 5 : 3.5)}
                        r={1}
                        fill={statusColor(node.status)}
                        className="animate-pulse"
                      />
                    )}
                    <text
                      x={node.x}
                      y={node.y + 1.5}
                      textAnchor="middle"
                      className="fill-[#e2e8f0] text-[3px] font-bold"
                    >
                      {node.abbr}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + (node.id === 'gateway' ? 11 : 9)}
                      textAnchor="middle"
                      className="fill-[#64748b] text-[2px]"
                    >
                      {node.dataRate} B/s
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {selectedNode && (
            <div className="mt-3 p-3 bg-[#0f1923] rounded-lg border border-[#1e2a3a]">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor(nodes.find(n => n.id === selectedNode)?.status || '') }} />
                <span className="text-xs font-medium text-[#e2e8f0]">
                  {nodes.find(n => n.id === selectedNode)?.name}
                </span>
                <Badge className="text-[9px] h-4" style={{
                  backgroundColor: `${statusColor(nodes.find(n => n.id === selectedNode)?.status || '')}20`,
                  color: statusColor(nodes.find(n => n.id === selectedNode)?.status || ''),
                  border: 'none',
                }}>
                  {nodes.find(n => n.id === selectedNode)?.status?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-[10px] text-[#64748b]">
                Data Rate: {nodes.find(n => n.id === selectedNode)?.dataRate} B/s • Connected to CAN Gateway
              </p>
            </div>
          )}
        </div>

        {/* Signal Quality & Protocol Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Signal Quality Analysis */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              Signal Quality Analysis
            </h3>
            <div className="space-y-3">
              {signalPaths.map((path, i) => (
                <div key={i} className="p-3 bg-[#0f1923] rounded-lg border border-[#1e2a3a]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#94a3b8]">{path.source}</span>
                      <span className="text-[10px] text-[#475569]">→</span>
                      <span className="text-xs text-[#94a3b8]">{path.destination}</span>
                    </div>
                    <Badge
                      className="text-[9px] h-4 border-0"
                      style={{
                        backgroundColor: `${qualityColor(path.quality)}20`,
                        color: qualityColor(path.quality),
                      }}
                    >
                      {path.quality}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${path.qualityPercent}%`,
                            backgroundColor: qualityColor(path.quality),
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748b] w-12 text-right">{path.qualityPercent}%</span>
                    <span className="text-[10px] text-[#475569]">{path.dataRate} B/s</span>
                    <span className={`text-[10px] ${path.errors > 0 ? 'text-[#f59e0b]' : 'text-[#64748b]'}`}>
                      {path.errors} err
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Distribution */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#8b5cf6]" />
              Protocol Distribution
            </h3>
            <div className="space-y-4">
              {protocols.map((proto, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#94a3b8]">{proto.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#64748b]">{proto.messages} msgs</span>
                      <span className="text-xs font-mono font-semibold" style={{ color: proto.color }}>
                        {proto.percent}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${proto.percent}%`,
                        backgroundColor: proto.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Protocol Summary */}
            <div className="mt-6 pt-4 border-t border-[#1e2a3a]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-[#0f1923] rounded-lg text-center">
                  <div className="text-lg font-bold text-[#00d4ff]">1,247</div>
                  <div className="text-[10px] text-[#64748b]">Total Messages/s</div>
                </div>
                <div className="p-2 bg-[#0f1923] rounded-lg text-center">
                  <div className="text-lg font-bold text-[#10b981]">4</div>
                  <div className="text-[10px] text-[#64748b]">Active Protocols</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Events Log */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Info className="h-4 w-4 text-[#00d4ff]" />
              Network Events
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEvents([])}
              className="h-6 text-[10px] text-[#64748b] hover:text-[#e2e8f0]"
            >
              Clear Log
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
            {events.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#475569]">No events logged</div>
            ) : (
              events.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-colors"
                >
                  <span className="text-[10px] font-mono text-[#475569] w-16 shrink-0">{event.time}</span>
                  <Badge
                    className="text-[8px] h-4 border-0 px-1"
                    style={{
                      backgroundColor: `${eventTypeColor(event.type)}20`,
                      color: eventTypeColor(event.type),
                    }}
                  >
                    {event.type}
                  </Badge>
                  <span className="text-[11px] text-[#94a3b8] truncate">{event.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
