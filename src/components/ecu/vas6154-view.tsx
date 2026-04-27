'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cpu,
  Wifi,
  WifiOff,
  Search,
  Settings,
  Wrench,
  Car,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  Cable,
  Signal,
  RotateCcw,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type VAGBrand = 'VW' | 'Audi' | 'Skoda' | 'Seat' | 'Porsche' | 'Bentley' | 'Lamborghini'
type ProtocolType = 'DoIP' | 'CAN' | 'K-Line' | 'UDS'
type ModuleStatus = 'OK' | 'Fault' | 'Not Responding'

interface ECUModule {
  id: string
  name: string
  shortName: string
  status: ModuleStatus
  address: string
  supplier: string
  swVersion: string
}

// Mock data
const VAG_BRANDS: { name: VAGBrand; color: string; models: number }[] = [
  { name: 'VW', color: '#00d4ff', models: 1247 },
  { name: 'Audi', color: '#e2e8f0', models: 834 },
  { name: 'Skoda', color: '#10b981', models: 456 },
  { name: 'Seat', color: '#f59e0b', models: 312 },
  { name: 'Porsche', color: '#ef4444', models: 189 },
  { name: 'Bentley', color: '#8b5cf6', models: 67 },
  { name: 'Lamborghini', color: '#f97316', models: 43 },
]

const PROTOCOLS: { name: ProtocolType; active: boolean; speed: string }[] = [
  { name: 'DoIP', active: true, speed: '100 Mbps' },
  { name: 'CAN', active: true, speed: '500 kbps' },
  { name: 'K-Line', active: false, speed: '10.4 kbps' },
  { name: 'UDS', active: true, speed: '500 kbps' },
]

const ECU_MODULES: ECUModule[] = [
  { id: 'm1', name: 'Engine Control Unit', shortName: 'ECM', status: 'Fault', address: '0x01', supplier: 'Bosch MED17.5', swVersion: '9971.4.2.1' },
  { id: 'm2', name: 'Transmission Control', shortName: 'TCM', status: 'OK', address: '0x02', supplier: 'Bosch DSG7', swVersion: '4521.8.0.3' },
  { id: 'm3', name: 'Anti-lock Brake System', shortName: 'ABS', status: 'OK', address: '0x03', supplier: 'Continental MK100', swVersion: '7823.1.5.0' },
  { id: 'm4', name: 'Airbag Control Module', shortName: 'SRS', status: 'OK', address: '0x15', supplier: 'Autoliv', swVersion: '3310.0.2.7' },
  { id: 'm5', name: 'Infotainment MIB3', shortName: 'INF', status: 'OK', address: '0x5F', supplier: 'Panasonic', swVersion: '0164.3.1.9' },
  { id: 'm6', name: 'Body Control Module', shortName: 'BCM', status: 'Fault', address: '0x09', supplier: 'Hella', swVersion: '6692.7.4.2' },
  { id: 'm7', name: 'Gateway Module', shortName: 'GW', status: 'OK', address: '0x19', supplier: 'VW Group', swVersion: '1100.2.0.5' },
  { id: 'm8', name: 'Instrument Cluster', shortName: 'IC', status: 'OK', address: '0x17', supplier: 'VDO', swVersion: '5520.9.3.1' },
  { id: 'm9', name: 'Steering Assist', shortName: 'EPS', status: 'OK', address: '0x44', supplier: 'ZF', swVersion: '2287.1.6.0' },
  { id: 'm10', name: 'Climate Control', shortName: 'HVAC', status: 'Not Responding', address: '0x08', supplier: 'Valeo', swVersion: '4410.5.2.8' },
  { id: 'm11', name: 'Park Assist', shortName: 'PAS', status: 'OK', address: '0x10', supplier: 'Hella', swVersion: '9912.0.1.4' },
  { id: 'm12', name: 'Keyless Entry', shortName: 'KES', status: 'OK', address: '0x27', supplier: 'Marquardt', swVersion: '7743.2.8.1' },
]

const STATUS_CONFIG: Record<ModuleStatus, { color: string; icon: React.ElementType; badgeClass: string }> = {
  OK: { color: '#10b981', icon: CheckCircle2, badgeClass: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' },
  Fault: { color: '#ef4444', icon: AlertTriangle, badgeClass: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' },
  'Not Responding': { color: '#64748b', icon: XCircle, badgeClass: 'bg-[#64748b]/20 text-[#64748b] border-[#64748b]/30' },
}

export function VAS6154View() {
  const [selectedBrand, setSelectedBrand] = useState<VAGBrand | null>('VW')
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType>('DoIP')
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(true)
  const [activeSession, setActiveSession] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const deviceConnected = true
  const okCount = ECU_MODULES.filter(m => m.status === 'OK').length
  const faultCount = ECU_MODULES.filter(m => m.status === 'Fault').length
  const nrCount = ECU_MODULES.filter(m => m.status === 'Not Responding').length

  const handleScan = () => {
    setIsScanning(true)
    setScanComplete(false)
    setTimeout(() => {
      setIsScanning(false)
      setScanComplete(true)
    }, 3000)
  }

  const handleAction = (action: string) => {
    setActiveAction(action)
    setTimeout(() => setActiveAction(null), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">VAS 6154</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
              VAG GROUP
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            VAG group specific diagnostic interface for VW, Audi, Skoda, Seat, Porsche, Bentley &amp; Lamborghini
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSession && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]" />
              <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">Session Active</span>
            </div>
          )}
          <Button
            size="sm"
            onClick={() => setActiveSession(!activeSession)}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              activeSession
                ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            {activeSession ? (
              <><WifiOff className="h-3 w-3" />End Session</>
            ) : (
              <><Wifi className="h-3 w-3" />Start Session</>
            )}
          </Button>
        </div>
      </div>

      {/* Device Status + Protocol Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device Status Card */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Signal className="h-4 w-4 text-[#00d4ff]" />
              Device Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Connection</span>
              <div className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', deviceConnected ? 'bg-[#10b981] shadow-[0_0_6px_#10b981]' : 'bg-[#ef4444]')} />
                <span className={cn('text-xs font-medium', deviceConnected ? 'text-[#10b981]' : 'text-[#ef4444]')}>
                  {deviceConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Serial Number</span>
              <span className="text-xs font-mono text-[#e2e8f0]">VAS6154-DE-024781</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Firmware Version</span>
              <span className="text-xs font-mono text-[#e2e8f0]">v2.4.1 (build 1247)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Hardware Revision</span>
              <span className="text-xs font-mono text-[#e2e8f0]">Rev.C (2024-Q3)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Interface</span>
              <div className="flex items-center gap-1.5">
                <Cable className="h-3 w-3 text-[#f59e0b]" />
                <span className="text-xs text-[#e2e8f0]">USB 3.0 + Ethernet</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Firmware Update</span>
              <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">
                Update Available
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Protocol Selector */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#00d4ff]" />
              Communication Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PROTOCOLS.map((proto) => (
              <button
                key={proto.name}
                onClick={() => setSelectedProtocol(proto.name)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-150',
                  selectedProtocol === proto.name
                    ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40 shadow-[0_0_8px_#00d4ff15]'
                    : 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55] hover:bg-[#1e2a3a]/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-8 w-8 rounded-md flex items-center justify-center',
                    selectedProtocol === proto.name ? 'bg-[#00d4ff]/20' : 'bg-[#1e2a3a]'
                  )}>
                    {proto.name === 'DoIP' ? <Wifi className="h-4 w-4" style={{ color: selectedProtocol === proto.name ? '#00d4ff' : '#64748b' }} /> :
                     proto.name === 'CAN' ? <Zap className="h-4 w-4" style={{ color: selectedProtocol === proto.name ? '#00d4ff' : '#64748b' }} /> :
                     proto.name === 'K-Line' ? <Cable className="h-4 w-4" style={{ color: selectedProtocol === proto.name ? '#00d4ff' : '#64748b' }} /> :
                     <Shield className="h-4 w-4" style={{ color: selectedProtocol === proto.name ? '#00d4ff' : '#64748b' }} />}
                  </div>
                  <div className="text-left">
                    <div className={cn('text-xs font-semibold', selectedProtocol === proto.name ? 'text-[#00d4ff]' : 'text-[#e2e8f0]')}>
                      {proto.name}
                    </div>
                    <div className="text-[10px] text-[#475569]">{proto.speed}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'h-2 w-2 rounded-full',
                    proto.active ? 'bg-[#10b981] shadow-[0_0_4px_#10b981]' : 'bg-[#475569]'
                  )} />
                  <span className={cn('text-[10px]', proto.active ? 'text-[#10b981]' : 'text-[#475569]')}>
                    {proto.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* VAG Brand Selector */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Car className="h-4 w-4 text-[#00d4ff]" />
            VAG Brand Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {VAG_BRANDS.map((brand) => (
              <button
                key={brand.name}
                onClick={() => setSelectedBrand(brand.name)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-150',
                  selectedBrand === brand.name
                    ? 'border-2 shadow-[0_0_12px_#00d4ff20]'
                    : 'border border-[#1e2a3a] hover:border-[#2d3f55] hover:bg-[#1e2a3a]/50'
                )}
                style={{
                  borderColor: selectedBrand === brand.name ? brand.color : undefined,
                  backgroundColor: selectedBrand === brand.name ? `${brand.color}10` : undefined,
                }}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: `${brand.color}20`,
                    color: brand.color,
                  }}
                >
                  {brand.name.charAt(0)}
                </div>
                <span className={cn(
                  'text-xs font-semibold',
                  selectedBrand === brand.name ? 'text-[#e2e8f0]' : 'text-[#94a3b8]'
                )}>
                  {brand.name}
                </span>
                <span className="text-[9px] text-[#475569]">{brand.models} models</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module Scan Grid */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#00d4ff]" />
              ECU Module Scan
              <div className="flex items-center gap-2 ml-2">
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">{okCount} OK</Badge>
                <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">{faultCount} Fault</Badge>
                <Badge className="bg-[#64748b]/20 text-[#64748b] border-[#64748b]/30 text-[10px]">{nrCount} NR</Badge>
              </div>
            </CardTitle>
            <Button
              size="sm"
              onClick={handleScan}
              disabled={isScanning}
              className="h-7 text-[10px] gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
            >
              {isScanning ? (
                <><RotateCcw className="h-3 w-3 animate-spin" />Scanning...</>
              ) : (
                <><Search className="h-3 w-3" />Rescan Modules</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isScanning && (
            <div className="mb-4">
              <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                <div className="h-full bg-[#00d4ff] rounded-full animate-pulse" style={{ width: '65%', boxShadow: '0 0 8px #00d4ff40' }} />
              </div>
              <p className="text-[10px] text-[#64748b] mt-1.5">Scanning {selectedBrand} modules via {selectedProtocol}...</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {ECU_MODULES.map((module) => {
              const config = STATUS_CONFIG[module.status]
              const StatusIcon = config.icon
              return (
                <div
                  key={module.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 hover:bg-[#1e2a3a]/50',
                    module.status === 'Fault' ? 'border-[#ef4444]/30 bg-[#ef4444]/5' :
                    module.status === 'Not Responding' ? 'border-[#64748b]/30 bg-[#64748b]/5' :
                    'border-[#1e2a3a] bg-[#0f1923]'
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0',
                    module.status === 'Fault' ? 'bg-[#ef4444]/15' :
                    module.status === 'Not Responding' ? 'bg-[#64748b]/15' :
                    'bg-[#10b981]/15'
                  )}>
                    <Cpu className="h-4 w-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-semibold text-[#e2e8f0] truncate">{module.shortName}</span>
                      <Badge className={cn('text-[8px] border px-1 py-0 h-3.5', config.badgeClass)}>
                        {module.status}
                      </Badge>
                    </div>
                    <div className="text-[9px] text-[#475569] truncate">{module.name}</div>
                    <div className="text-[9px] text-[#475569] font-mono">{module.address} · {module.supplier}</div>
                  </div>
                  <StatusIcon className="h-4 w-4 flex-shrink-0" style={{ color: config.color }} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Diagnostic Session + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Diagnostic Session */}
        <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Wifi className="h-4 w-4 text-[#00d4ff]" />
              Live Diagnostic Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* VIN Readout */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Vehicle Identification Number</div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-mono font-bold text-[#00d4ff] tracking-widest">WVWZZZ1KZAM000001</span>
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">Valid</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <div className="text-[9px] text-[#475569]">Make</div>
                  <div className="text-xs text-[#e2e8f0] font-medium">Volkswagen</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Model</div>
                  <div className="text-xs text-[#e2e8f0] font-medium">Golf GTI (MK8)</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Year</div>
                  <div className="text-xs text-[#e2e8f0] font-medium">2023</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Engine</div>
                  <div className="text-xs text-[#e2e8f0] font-medium">2.0 TSI (EA888.4)</div>
                </div>
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-[#00d4ff] tabular-nums">12</div>
                <div className="text-[9px] text-[#475569]">Modules Found</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-[#ef4444] tabular-nums">2</div>
                <div className="text-[9px] text-[#475569]">Fault Codes</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-[#10b981] tabular-nums">9</div>
                <div className="text-[9px] text-[#475569]">Modules OK</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-[#f59e0b] tabular-nums">47</div>
                <div className="text-[9px] text-[#475569]">Live Parameters</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Recent Activity</div>
              <div className="space-y-2">
                {[
                  { time: '12:34:56', msg: 'ECM fault code P0300 read successfully', type: 'info' as const },
                  { time: '12:34:52', msg: 'BCM fault code B1000 detected', type: 'warning' as const },
                  { time: '12:34:48', msg: 'HVAC module not responding on address 0x08', type: 'error' as const },
                  { time: '12:34:45', msg: 'VIN decoded successfully', type: 'success' as const },
                  { time: '12:34:40', msg: `Connected via ${selectedProtocol} protocol`, type: 'success' as const },
                ].map((entry, idx) => (
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
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#00d4ff]" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { id: 'full-scan', label: 'Full Vehicle Scan', desc: 'Scan all ECU modules', icon: Search },
              { id: 'module-scan', label: 'Module Scan', desc: 'Scan selected module', icon: Cpu },
              { id: 'coding', label: 'Coding', desc: 'Read/write module coding', icon: Settings },
              { id: 'adaptation', label: 'Adaptation', desc: 'Run adaptation channels', icon: Wrench },
              { id: 'basic-settings', label: 'Basic Settings', desc: 'Execute basic settings', icon: RotateCcw },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#1e2a3a] bg-[#0f1923] hover:bg-[#1e2a3a]/50 hover:border-[#2d3f55] transition-all duration-150 group"
              >
                <div className="h-8 w-8 rounded-md bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#00d4ff]/20 transition-colors">
                  <action.icon className="h-4 w-4 text-[#00d4ff]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs font-semibold text-[#e2e8f0] group-hover:text-[#00d4ff] transition-colors">{action.label}</div>
                  <div className="text-[9px] text-[#475569]">{action.desc}</div>
                </div>
                {activeAction === action.id ? (
                  <CheckCircle2 className="h-4 w-4 text-[#10b981] flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#475569] group-hover:text-[#00d4ff] flex-shrink-0 transition-colors" />
                )}
              </button>
            ))}

            {/* Session Info */}
            <div className="mt-4 pt-4 border-t border-[#1e2a3a]">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Session Info</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">Protocol</span>
                  <span className="text-[10px] font-mono text-[#00d4ff]">{selectedProtocol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">Brand</span>
                  <span className="text-[10px] font-mono text-[#e2e8f0]">{selectedBrand}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">Duration</span>
                  <span className="text-[10px] font-mono text-[#e2e8f0]">00:12:47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">Requests</span>
                  <span className="text-[10px] font-mono text-[#e2e8f0]">1,247</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
