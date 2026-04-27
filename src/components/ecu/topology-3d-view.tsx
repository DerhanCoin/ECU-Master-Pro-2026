'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Tag,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wifi,
  X,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

type NodeStatus = 'online' | 'offline' | 'error'
type BusType = 'HS-CAN' | 'LS-CAN' | 'LIN' | 'DoIP' | 'MOST'

interface ECUNode {
  id: string
  name: string
  type: string
  address: string
  protocol: string
  status: NodeStatus
  messageCount: number
  x: number
  y: number
}

interface BusLine {
  id: string
  type: BusType
  color: string
  nodes: string[]
}

// ── Mock Data ───────────────────────────────────────────────────────────────

const ecuNodes: ECUNode[] = [
  { id: 'engine', name: 'Engine ECU', type: 'Powertrain', address: '0x01', protocol: 'HS-CAN', status: 'online', messageCount: 14832, x: 400, y: 80 },
  { id: 'tcu', name: 'TCU', type: 'Powertrain', address: '0x02', protocol: 'HS-CAN', status: 'online', messageCount: 8241, x: 600, y: 80 },
  { id: 'abs', name: 'ABS/ESP', type: 'Chassis', address: '0x0B', protocol: 'HS-CAN', status: 'online', messageCount: 6430, x: 200, y: 180 },
  { id: 'airbag', name: 'Airbag', type: 'Safety', address: '0x15', protocol: 'HS-CAN', status: 'error', messageCount: 2310, x: 400, y: 180 },
  { id: 'bcm', name: 'BCM', type: 'Body', address: '0x09', protocol: 'LS-CAN', status: 'online', messageCount: 11240, x: 150, y: 320 },
  { id: 'gateway', name: 'Gateway', type: 'Gateway', address: '0x00', protocol: 'HS-CAN/LS-CAN', status: 'online', messageCount: 42510, x: 400, y: 280 },
  { id: 'info', name: 'Infotainment', type: 'Infotainment', address: '0x37', protocol: 'MOST', status: 'online', messageCount: 9650, x: 650, y: 320 },
  { id: 'cluster', name: 'Cluster', type: 'Display', address: '0x17', protocol: 'HS-CAN', status: 'online', messageCount: 5480, x: 650, y: 180 },
  { id: 'adas', name: 'ADAS', type: 'ADAS', address: '0x30', protocol: 'DoIP', status: 'offline', messageCount: 0, x: 200, y: 380 },
  { id: 'hvac', name: 'HVAC', type: 'Comfort', address: '0x24', protocol: 'LIN', status: 'online', messageCount: 3240, x: 550, y: 380 },
]

const busLines: BusLine[] = [
  { id: 'hs-can-1', type: 'HS-CAN', color: '#00d4ff', nodes: ['engine', 'tcu', 'abs', 'airbag', 'gateway', 'cluster'] },
  { id: 'ls-can', type: 'LS-CAN', color: '#10b981', nodes: ['gateway', 'bcm'] },
  { id: 'lin', type: 'LIN', color: '#f59e0b', nodes: ['bcm', 'hvac'] },
  { id: 'doip', type: 'DoIP', color: '#8b5cf6', nodes: ['gateway', 'adas'] },
  { id: 'most', type: 'MOST', color: '#ef4444', nodes: ['gateway', 'info'] },
]

const busLoadData: Record<BusType, number> = {
  'HS-CAN': 62,
  'LS-CAN': 28,
  'LIN': 14,
  'DoIP': 0,
  'MOST': 45,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const statusColor: Record<NodeStatus, string> = {
  online: '#10b981',
  offline: '#64748b',
  error: '#f59e0b',
}

const statusLabel: Record<NodeStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  error: 'Error',
}

const busColorMap: Record<BusType, string> = {
  'HS-CAN': '#00d4ff',
  'LS-CAN': '#10b981',
  'LIN': '#f59e0b',
  'DoIP': '#8b5cf6',
  'MOST': '#ef4444',
}

const busBadgeMap: Record<BusType, string> = {
  'HS-CAN': 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30',
  'LS-CAN': 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
  'LIN': 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
  'DoIP': 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30',
  'MOST': 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30',
}

// ── Animated Dots on Bus Lines ──────────────────────────────────────────────

function BusFlowDots({ nodes, color }: { nodes: string[]; color: string }) {
  const nodePositions = nodes
    .map((nid) => ecuNodes.find((n) => n.id === nid))
    .filter(Boolean) as ECUNode[]

  const dots: React.ReactNode[] = []
  for (let i = 0; i < nodePositions.length - 1; i++) {
    const from = nodePositions[i]
    const to = nodePositions[i + 1]
    dots.push(
      <circle key={`dot-${from.id}-${to.id}`} r="3" fill={color} opacity="0.9">
        <animateMotion
          dur={`${1.5 + i * 0.3}s`}
          repeatCount="indefinite"
          path={`M${from.x},${from.y} L${to.x},${to.y}`}
        />
      </circle>
    )
  }
  return <>{dots}</>
}

// ── Main Component ──────────────────────────────────────────────────────────

export function Topology3DView() {
  const [selectedNode, setSelectedNode] = useState<ECUNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [animEnabled, setAnimEnabled] = useState(true)

  const onlineCount = ecuNodes.filter((n) => n.status === 'online').length
  const errorCount = ecuNodes.filter((n) => n.status === 'error').length
  const offlineCount = ecuNodes.filter((n) => n.status === 'offline').length

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5))
  const handleReset = () => { setZoom(1); setSelectedNode(null) }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Vehicle Network Topology</h1>
          </div>
          <p className="text-xs text-[#64748b]">Visualize ECU connections, bus topology, and network health</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-7 w-7 p-0 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:text-[#00d4ff]"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-7 w-7 p-0 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:text-[#00d4ff]"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-7 w-7 p-0 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:text-[#00d4ff]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
            className={`h-7 text-[10px] gap-1 border-[#1e2a3a] ${
              showLabels ? 'bg-[#00d4ff]/15 text-[#00d4ff]' : 'bg-[#151d2b] text-[#94a3b8]'
            }`}
          >
            <Tag className="h-3 w-3" />
            Labels
          </Button>
        </div>
      </div>

      {/* Network Health Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Total Nodes</div>
            <div className="text-2xl font-bold text-[#e2e8f0]">{ecuNodes.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Active</div>
            <div className="text-2xl font-bold text-[#10b981]">{onlineCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Errors</div>
            <div className="text-2xl font-bold text-[#f59e0b]">{errorCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Offline</div>
            <div className="text-2xl font-bold text-[#64748b]">{offlineCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Topology Diagram */}
        <div className="lg:col-span-2">
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardContent className="p-4">
              <div className="overflow-hidden rounded-lg bg-[#0a1018] border border-[#1e2a3a]">
                <svg
                  viewBox="0 0 800 460"
                  className="w-full"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                >
                  {/* Grid lines */}
                  {Array.from({ length: 17 }).map((_, i) => (
                    <line
                      key={`vg-${i}`}
                      x1={i * 50}
                      y1="0"
                      x2={i * 50}
                      y2="460"
                      stroke="#1e2a3a"
                      strokeWidth="0.5"
                      opacity="0.3"
                    />
                  ))}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <line
                      key={`hg-${i}`}
                      x1="0"
                      y1={i * 50}
                      x2="800"
                      y2={i * 50}
                      stroke="#1e2a3a"
                      strokeWidth="0.5"
                      opacity="0.3"
                    />
                  ))}

                  {/* Bus Lines */}
                  {busLines.map((bus) => {
                    const nodePositions = bus.nodes
                      .map((nid) => ecuNodes.find((n) => n.id === nid))
                      .filter(Boolean) as ECUNode[]

                    const pathParts = nodePositions
                      .map((n, i) => `${i === 0 ? 'M' : 'L'}${n.x},${n.y}`)
                      .join(' ')

                    return (
                      <g key={bus.id}>
                        <path
                          d={pathParts}
                          fill="none"
                          stroke={bus.color}
                          strokeWidth="2.5"
                          opacity="0.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {animEnabled && <BusFlowDots nodes={bus.nodes} color={bus.color} />}
                      </g>
                    )
                  })}

                  {/* ECU Nodes */}
                  {ecuNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id
                    return (
                      <g
                        key={node.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedNode(node)}
                      >
                        {/* Glow */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 32 : 24}
                          fill={statusColor[node.status]}
                          opacity={isSelected ? 0.15 : 0.06}
                        />
                        {/* Node body */}
                        <rect
                          x={node.x - 26}
                          y={node.y - 18}
                          width="52"
                          height="36"
                          rx="6"
                          fill="#151d2b"
                          stroke={isSelected ? '#00d4ff' : statusColor[node.status]}
                          strokeWidth={isSelected ? 2 : 1.5}
                          opacity="0.95"
                        />
                        {/* Icon area */}
                        <rect
                          x={node.x - 22}
                          y={node.y - 14}
                          width="44"
                          height="10"
                          rx="3"
                          fill={statusColor[node.status]}
                          opacity="0.15"
                        />
                        <text
                          x={node.x}
                          y={node.y - 7}
                          textAnchor="middle"
                          fill={statusColor[node.status]}
                          fontSize="6"
                          fontWeight="600"
                          fontFamily="monospace"
                        >
                          {node.type}
                        </text>
                        <text
                          x={node.x}
                          y={node.y + 6}
                          textAnchor="middle"
                          fill="#e2e8f0"
                          fontSize="7"
                          fontWeight="500"
                        >
                          {node.name}
                        </text>
                        {/* Status dot */}
                        <circle
                          cx={node.x + 20}
                          cy={node.y - 12}
                          r="4"
                          fill={statusColor[node.status]}
                          opacity="0.9"
                        />
                        {node.status === 'online' && (
                          <circle
                            cx={node.x + 20}
                            cy={node.y - 12}
                            r="4"
                            fill={statusColor[node.status]}
                            opacity="0.5"
                          >
                            <animate
                              attributeName="r"
                              values="4;7;4"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0.5;0;0.5"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                        {/* Label */}
                        {showLabels && (
                          <text
                            x={node.x}
                            y={node.y + 30}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="7"
                            fontFamily="monospace"
                          >
                            {node.address}
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {/* Bus Labels */}
                  {showLabels && busLines.map((bus) => {
                    const nodePositions = bus.nodes
                      .map((nid) => ecuNodes.find((n) => n.id === nid))
                      .filter(Boolean) as ECUNode[]
                    if (nodePositions.length < 2) return null
                    const midIdx = Math.floor(nodePositions.length / 2)
                    const mid = nodePositions[midIdx - 1]
                    const midNext = nodePositions[midIdx]
                    if (!mid || !midNext) return null
                    const mx = (mid.x + midNext.x) / 2
                    const my = (mid.y + midNext.y) / 2 - 12
                    return (
                      <text
                        key={`label-${bus.id}`}
                        x={mx}
                        y={my}
                        textAnchor="middle"
                        fill={bus.color}
                        fontSize="8"
                        fontWeight="600"
                        fontFamily="monospace"
                        opacity="0.7"
                      >
                        {bus.type}
                      </text>
                    )
                  })}
                </svg>
              </div>

              {/* Bus Legend */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {busLines.map((bus) => (
                  <div key={bus.id} className="flex items-center gap-1.5">
                    <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: bus.color }} />
                    <span className="text-[9px] text-[#64748b]">{bus.type}</span>
                  </div>
                ))}
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                    <span className="text-[9px] text-[#64748b]">Online</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                    <span className="text-[9px] text-[#64748b]">Error</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-[#64748b]" />
                    <span className="text-[9px] text-[#64748b]">Offline</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Node Detail Panel */}
          {selectedNode ? (
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                    <Cpu className="h-4 w-4" style={{ color: statusColor[selectedNode.status] }} />
                    {selectedNode.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-[#64748b] hover:text-[#e2e8f0]"
                    onClick={() => setSelectedNode(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0f1923] rounded-lg p-2.5">
                    <div className="text-[9px] text-[#64748b] uppercase">Address</div>
                    <div className="text-xs font-mono text-[#00d4ff]">{selectedNode.address}</div>
                  </div>
                  <div className="bg-[#0f1923] rounded-lg p-2.5">
                    <div className="text-[9px] text-[#64748b] uppercase">Protocol</div>
                    <div className="text-xs text-[#e2e8f0]">{selectedNode.protocol}</div>
                  </div>
                  <div className="bg-[#0f1923] rounded-lg p-2.5">
                    <div className="text-[9px] text-[#64748b] uppercase">Status</div>
                    <Badge className={`${selectedNode.status === 'online' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : selectedNode.status === 'error' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'} text-[9px] border`}>
                      {statusLabel[selectedNode.status]}
                    </Badge>
                  </div>
                  <div className="bg-[#0f1923] rounded-lg p-2.5">
                    <div className="text-[9px] text-[#64748b] uppercase">Messages</div>
                    <div className="text-xs text-[#e2e8f0] font-mono">{selectedNode.messageCount.toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-[#0f1923] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#64748b] uppercase mb-1">Type</div>
                  <div className="text-xs text-[#e2e8f0]">{selectedNode.type}</div>
                </div>
                <div className="bg-[#0f1923] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#64748b] uppercase mb-1.5">Connected Buses</div>
                  <div className="flex flex-wrap gap-1">
                    {busLines
                      .filter((b) => b.nodes.includes(selectedNode.id))
                      .map((b) => (
                        <Badge key={b.id} className={`${busBadgeMap[b.type]} text-[8px] border`}>
                          {b.type}
                        </Badge>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardContent className="p-8 text-center">
                <Network className="h-8 w-8 text-[#475569] mx-auto mb-2" />
                <p className="text-xs text-[#64748b]">Click a node to view details</p>
              </CardContent>
            </Card>
          )}

          {/* Bus Load */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00d4ff]" />
                Bus Load
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.entries(busLoadData) as [BusType, number][]).map(([bus, load]) => (
                <div key={bus}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: busColorMap[bus] }} />
                      <span className="text-[10px] text-[#94a3b8]">{bus}</span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: load > 70 ? '#ef4444' : load > 40 ? '#f59e0b' : '#10b981' }}>
                      {load}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${load}%`,
                        backgroundColor: load > 70 ? '#ef4444' : load > 40 ? '#f59e0b' : busColorMap[bus],
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Node List */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Wifi className="h-4 w-4 text-[#10b981]" />
                All Nodes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-56 overflow-y-auto">
              {ecuNodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between bg-[#0f1923] rounded-lg p-2 cursor-pointer hover:bg-[#1e2a3a]/50 transition-colors"
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: statusColor[node.status] }}
                    />
                    <span className="text-[11px] text-[#e2e8f0]">{node.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#475569]">{node.address}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Animation Toggle */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8]">Message Flow Animation</span>
                <button
                  onClick={() => setAnimEnabled(!animEnabled)}
                  className={`h-5 w-9 rounded-full transition-all flex items-center ${
                    animEnabled ? 'bg-[#00d4ff]/30 justify-end' : 'bg-[#1e2a3a] justify-start'
                  }`}
                >
                  <div
                    className={`h-3.5 w-3.5 rounded-full mx-0.5 transition-all ${
                      animEnabled ? 'bg-[#00d4ff]' : 'bg-[#475569]'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
