'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Globe,
  Wifi,
  ArrowUpRight,
  ArrowDownLeft,
  Server,
  Monitor,
  Clock,
  Activity,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Network,
  Zap,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// DoIP Connection Data
const CONNECTION_INFO = {
  ipAddress: '192.168.1.100',
  port: 13400,
  protocolVersion: 'ISO 13400-2:2019',
  version: '0x03',
  status: 'Connected',
  interface: 'Ethernet 100BASE-TX',
  macAddress: '00:1A:2B:3C:4D:5E',
}

// Vehicle Announcement Data
const VEHICLE_ANNOUNCEMENT = {
  vin: 'W0L000000Y2S21234',
  ecuName: 'ECM_GW_01',
  logicalAddress: '0x0E00',
  ip: '192.168.1.50',
  eid: '00:1B:2C:3D:4E:5F',
  gid: '00:1B:2C:3D:4E:5F',
  furtherAction: '0x00',
  vinGidStatus: 'Valid',
}

// Routing Table
const ROUTING_TABLE = [
  { source: '0x0E00', target: '0x1000', description: 'Gateway → ECM', protocol: 'DoIP', active: true },
  { source: '0x0E00', target: '0x1001', description: 'Gateway → TCM', protocol: 'DoIP', active: true },
  { source: '0x0E00', target: '0x1002', description: 'Gateway → ABS', protocol: 'DoIP', active: true },
  { source: '0x0E00', target: '0x1003', description: 'Gateway → BCM', protocol: 'DoIP', active: false },
  { source: '0x0E00', target: '0x1004', description: 'Gateway → SRS', protocol: 'DoIP', active: true },
  { source: '0x0E00', target: '0x1005', description: 'Gateway → HVAC', protocol: 'DoIP', active: true },
]

// DoIP Message Monitor
const DOIP_MESSAGES = [
  { time: '14:32:15.234', dir: 'out' as const, type: 'Routing Activation Request', payload: '0x0E00 → 0x1000', size: '24 B' },
  { time: '14:32:15.256', dir: 'in' as const, type: 'Routing Activation Response', payload: '0x1000 → 0x0E00, Code: 0x10', size: '20 B' },
  { time: '14:32:15.300', dir: 'out' as const, type: 'Diagnostic Message', payload: '0x22 F1 90 (Read VIN)', size: '48 B' },
  { time: '14:32:15.412', dir: 'in' as const, type: 'Diagnostic Message ACK', payload: '0x62 F1 90 57 30 4C ...', size: '56 B' },
  { time: '14:32:16.001', dir: 'out' as const, type: 'Alive Check Request', payload: 'Source: 0x0E00', size: '8 B' },
  { time: '14:32:16.015', dir: 'in' as const, type: 'Alive Check Response', payload: 'Source: 0x0E00, Status: OK', size: '12 B' },
  { time: '14:32:17.450', dir: 'out' as const, type: 'Diagnostic Message', payload: '0x22 11 00 (Read DTC)', size: '48 B' },
  { time: '14:32:17.520', dir: 'in' as const, type: 'Diagnostic Message NACK', payload: 'Code: 0x05 (Target Unreachable)', size: '12 B' },
  { time: '14:32:18.100', dir: 'out' as const, type: 'Entity Status Request', payload: 'Target: 0x1003', size: '8 B' },
  { time: '14:32:18.115', dir: 'in' as const, type: 'Entity Status Response', payload: 'Node Type: Gateway, Status: Offline', size: '16 B' },
  { time: '14:32:19.200', dir: 'out' as const, type: 'Diagnostic Message', payload: '0x10 03 (Extended Session)', size: '48 B' },
  { time: '14:32:19.280', dir: 'in' as const, type: 'Diagnostic Message ACK', payload: '0x50 03 (Session Accepted)', size: '20 B' },
]

// Node Discovery
const DISCOVERED_NODES = [
  { address: '0x1000', name: 'Engine Control Module', ip: '192.168.1.51', status: 'online' as const, sync: true },
  { address: '0x1001', name: 'Transmission Control', ip: '192.168.1.52', status: 'online' as const, sync: true },
  { address: '0x1002', name: 'ABS/ESP Module', ip: '192.168.1.53', status: 'online' as const, sync: true },
  { address: '0x1003', name: 'Body Control Module', ip: '192.168.1.54', status: 'offline' as const, sync: false },
  { address: '0x1004', name: 'Airbag Control', ip: '192.168.1.55', status: 'online' as const, sync: true },
  { address: '0x1005', name: 'Climate Control', ip: '192.168.1.56', status: 'online' as const, sync: false },
  { address: '0x1006', name: 'Instrument Cluster', ip: '192.168.1.57', status: 'online' as const, sync: true },
  { address: '0x1007', name: 'Infotainment MIB3', ip: '192.168.1.58', status: 'online' as const, sync: true },
]

// Connection Parameters
const CONNECTION_PARAMS = {
  generalInactivityTimeout: '5000 ms',
  aliveCheckTimeout: '2000 ms',
  diagnosticMessageTimeout: '2000 ms',
  routingActivationTimeout: '2000 ms',
  ackTimeout: '1000 ms',
  maxPayloadSize: '65535 bytes',
  tcpKeepAlive: 'Enabled',
  nasTimeout: '5000 ms',
}

// DoIP Statistics
const DOIP_STATS = {
  messagesSent: 4827,
  messagesReceived: 3956,
  routingActivations: 12,
  nackCount: 3,
  errorCount: 1,
  uptime: '02:34:17',
  avgLatency: '12 ms',
  throughput: '1.2 MB/s',
}

type SessionMode = 'default' | 'extended' | 'programming'

export function DoIPView() {
  const [sessionMode, setSessionMode] = useState<SessionMode>('default')
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>('0x1000')

  const handleDiscover = () => {
    setIsDiscovering(true)
    setTimeout(() => setIsDiscovering(false), 3000)
  }

  const onlineCount = DISCOVERED_NODES.filter(n => n.status === 'online').length
  const offlineCount = DISCOVERED_NODES.filter(n => n.status === 'offline').length

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">DoIP Diagnostics</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
              ISO 13400
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Diagnostic over Internet Protocol — Ethernet-based vehicle communication interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] mr-1.5 shadow-[0_0_4px_#10b981]" />
            {CONNECTION_INFO.status}
          </Badge>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
            <RefreshCw className="h-3 w-3" />Reconnect
          </Button>
        </div>
      </div>

      {/* Connection Status + Vehicle Announcement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connection Status */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Wifi className="h-4 w-4 text-[#00d4ff]" />
              DoIP Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'IP Address', value: CONNECTION_INFO.ipAddress, icon: '🌐' },
              { label: 'Port', value: CONNECTION_INFO.port.toString(), icon: '🔌' },
              { label: 'Protocol Version', value: CONNECTION_INFO.protocolVersion, icon: '📋' },
              { label: 'Version Code', value: CONNECTION_INFO.version, icon: '🔢' },
              { label: 'Interface', value: CONNECTION_INFO.interface, icon: '🔗' },
              { label: 'MAC Address', value: CONNECTION_INFO.macAddress, icon: '📡' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1e2a3a]/50 last:border-0">
                <span className="text-[11px] text-[#64748b]">{item.label}</span>
                <span className="text-[11px] font-mono text-[#e2e8f0]">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vehicle Announcement */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#00d4ff]" />
              Vehicle Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 mb-2">
              <div className="text-[9px] text-[#475569] uppercase tracking-wider font-semibold mb-1">VIN</div>
              <div className="text-sm font-mono font-bold text-[#00d4ff] tracking-wider">{VEHICLE_ANNOUNCEMENT.vin}</div>
            </div>
            {[
              { label: 'ECU Name', value: VEHICLE_ANNOUNCEMENT.ecuName },
              { label: 'Logical Address', value: VEHICLE_ANNOUNCEMENT.logicalAddress },
              { label: 'IP Address', value: VEHICLE_ANNOUNCEMENT.ip },
              { label: 'EID', value: VEHICLE_ANNOUNCEMENT.eid },
              { label: 'GID', value: VEHICLE_ANNOUNCEMENT.gid },
              { label: 'Further Action', value: VEHICLE_ANNOUNCEMENT.furtherAction },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1e2a3a]/50 last:border-0">
                <span className="text-[11px] text-[#64748b]">{item.label}</span>
                <span className="text-[11px] font-mono text-[#e2e8f0]">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Routing Table + Session Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Routing Table */}
        <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Network className="h-4 w-4 text-[#00d4ff]" />
              Routing Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 pr-3">Source</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">→</th>
                    <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Target</th>
                    <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 px-3">Description</th>
                    <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 px-3">Protocol</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ROUTING_TABLE.map((route, i) => (
                    <tr key={i} className="border-b border-[#1e2a3a]/30 hover:bg-[#1e2a3a]/20 transition-colors">
                      <td className="py-2 pr-3 font-mono text-[#00d4ff]">{route.source}</td>
                      <td className="text-center py-2 px-2 text-[#475569]">→</td>
                      <td className="py-2 px-2 font-mono text-[#e2e8f0]">{route.target}</td>
                      <td className="py-2 px-3 text-[#94a3b8]">{route.description}</td>
                      <td className="py-2 px-3 text-[#64748b]">{route.protocol}</td>
                      <td className="text-center py-2 px-2">
                        {route.active ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981] mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-[#ef4444] mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Session Control */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#00d4ff]" />
              Session Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {([
              { mode: 'default' as SessionMode, label: 'Default Session', desc: 'Standard diagnostic mode', code: '0x01', color: '#10b981' },
              { mode: 'extended' as SessionMode, label: 'Extended Session', desc: 'Enhanced diagnostics', code: '0x03', color: '#00d4ff' },
              { mode: 'programming' as SessionMode, label: 'Programming Mode', desc: 'Flash/reprogramming', code: '0x02', color: '#f59e0b' },
            ]).map((session) => (
              <button
                key={session.mode}
                onClick={() => setSessionMode(session.mode)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  sessionMode === session.mode
                    ? 'border-2 shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                    : 'border border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                )}
                style={{
                  borderColor: sessionMode === session.mode ? session.color : undefined,
                  backgroundColor: sessionMode === session.mode ? `${session.color}10` : undefined,
                }}
              >
                <div className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${session.color}20` }}>
                  <Zap className="h-4 w-4" style={{ color: session.color }} />
                </div>
                <div className="flex-1">
                  <div className={cn('text-[11px] font-semibold', sessionMode === session.mode ? 'text-[#e2e8f0]' : 'text-[#94a3b8]')}>
                    {session.label}
                  </div>
                  <div className="text-[9px] text-[#475569]">{session.desc} · {session.code}</div>
                </div>
                {sessionMode === session.mode && (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: session.color }} />
                )}
              </button>
            ))}

            {/* Connection Parameters */}
            <div className="mt-3 pt-3 border-t border-[#1e2a3a]">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Connection Parameters</div>
              <div className="space-y-1.5">
                {[
                  { label: 'ACK Timeout', value: CONNECTION_PARAMS.ackTimeout },
                  { label: 'Max Payload', value: CONNECTION_PARAMS.maxPayloadSize },
                  { label: 'Alive Check', value: CONNECTION_PARAMS.aliveCheckTimeout },
                  { label: 'TCP KeepAlive', value: CONNECTION_PARAMS.tcpKeepAlive },
                ].map((param, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[10px] text-[#64748b]">{param.label}</span>
                    <span className="text-[10px] font-mono text-[#e2e8f0]">{param.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DoIP Message Monitor */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              DoIP Message Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px]">
                <ArrowUpRight className="h-2.5 w-2.5 mr-1" />TX: {DOIP_STATS.messagesSent.toLocaleString()}
              </Badge>
              <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px]">
                <ArrowDownLeft className="h-2.5 w-2.5 mr-1" />RX: {DOIP_STATS.messagesReceived.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
            {DOIP_MESSAGES.map((msg, i) => (
              <div key={i} className={cn(
                'flex items-center gap-3 p-2 rounded-md border transition-colors hover:bg-[#1e2a3a]/30',
                msg.dir === 'out' ? 'bg-[#0f1923] border-[#1e2a3a]' : 'bg-[#0f1923] border-[#1e2a3a]'
              )}>
                <div className={cn(
                  'h-6 w-6 rounded flex items-center justify-center flex-shrink-0',
                  msg.dir === 'out' ? 'bg-[#00d4ff]/15' : 'bg-[#10b981]/15'
                )}>
                  {msg.dir === 'out' ? (
                    <ArrowUpRight className="h-3 w-3 text-[#00d4ff]" />
                  ) : (
                    <ArrowDownLeft className="h-3 w-3 text-[#10b981]" />
                  )}
                </div>
                <span className="text-[9px] font-mono text-[#475569] tabular-nums w-20 flex-shrink-0">{msg.time}</span>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'text-[10px] font-semibold truncate',
                    msg.type.includes('NACK') ? 'text-[#ef4444]' : msg.dir === 'out' ? 'text-[#00d4ff]' : 'text-[#10b981]'
                  )}>
                    {msg.type}
                  </div>
                  <div className="text-[9px] text-[#64748b] font-mono truncate">{msg.payload}</div>
                </div>
                <Badge className="bg-[#1e2a3a] text-[#64748b] text-[8px] border-0">{msg.size}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Node Discovery + Entity Status + Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Node Discovery */}
        <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Server className="h-4 w-4 text-[#00d4ff]" />
                Node Discovery
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">{onlineCount} Online</Badge>
                <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">{offlineCount} Offline</Badge>
              </CardTitle>
              <Button size="sm" onClick={handleDiscover} disabled={isDiscovering} className="h-7 text-[10px] gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
                {isDiscovering ? (
                  <><RefreshCw className="h-3 w-3 animate-spin" />Discovering...</>
                ) : (
                  <><Network className="h-3 w-3" />Rediscover</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isDiscovering && (
              <div className="mb-3">
                <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00d4ff] rounded-full animate-pulse" style={{ width: '55%', boxShadow: '0 0 8px #00d4ff40' }} />
                </div>
                <p className="text-[10px] text-[#64748b] mt-1.5">Scanning DoIP nodes on network...</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DISCOVERED_NODES.map((node) => (
                <button
                  key={node.address}
                  onClick={() => setSelectedNode(node.address)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                    selectedNode === node.address
                      ? 'border-[#00d4ff]/40 bg-[#00d4ff]/10 shadow-[0_0_6px_#00d4ff15]'
                      : 'border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0',
                    node.status === 'online' ? 'bg-[#10b981]/15' : 'bg-[#ef4444]/15'
                  )}>
                    {node.status === 'online' ? (
                      <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#ef4444]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[11px] font-semibold', selectedNode === node.address ? 'text-[#00d4ff]' : 'text-[#e2e8f0]')}>
                      {node.name}
                    </div>
                    <div className="text-[9px] text-[#475569] font-mono">{node.address} · {node.ip}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={cn(
                      'text-[8px] border px-1 py-0 h-3.5',
                      node.status === 'online' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                    )}>
                      {node.status}
                    </Badge>
                    {node.sync && (
                      <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[8px] border px-1 py-0 h-3.5">Synced</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* DoIP Statistics */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#00d4ff]" />
              DoIP Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-[#00d4ff] tabular-nums">{DOIP_STATS.messagesSent.toLocaleString()}</div>
                <div className="text-[9px] text-[#475569]">Messages Sent</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-[#10b981] tabular-nums">{DOIP_STATS.messagesReceived.toLocaleString()}</div>
                <div className="text-[9px] text-[#475569]">Messages Received</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-[#f59e0b] tabular-nums">{DOIP_STATS.errorCount}</div>
                <div className="text-[9px] text-[#475569]">Errors</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-[#8b5cf6] tabular-nums">{DOIP_STATS.routingActivations}</div>
                <div className="text-[9px] text-[#475569]">Routing Activations</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1e2a3a]">
              {[
                { label: 'Uptime', value: DOIP_STATS.uptime, icon: Clock, color: '#00d4ff' },
                { label: 'Avg Latency', value: DOIP_STATS.avgLatency, icon: Activity, color: '#10b981' },
                { label: 'Throughput', value: DOIP_STATS.throughput, icon: Zap, color: '#f59e0b' },
                { label: 'NACK Count', value: DOIP_STATS.nackCount.toString(), icon: AlertTriangle, color: '#ef4444' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1e2a3a]/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                    <span className="text-[11px] text-[#64748b]">{stat.label}</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#e2e8f0]">{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
