'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cpu,
  HardDrive,
  CircuitBoard,
  Microchip,
  Network,
  Shield,
  Fingerprint,
  Calendar,
  Hash,
  Wrench,
  Layers,
  Zap,
  Activity,
  Globe,
  Lock,
  Database,
  Copy,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'

const ecuIdentification = {
  manufacturer: 'Bosch',
  partNumber: '03L 906 018 Q',
  hardwareVersion: 'HW-03 Rev.B',
  softwareVersion: 'SW v4.2.1',
  calibrationId: 'CAL-4A2F8B01',
  serialNumber: 'SN-BOS-2025-047832',
  productionDate: '2025-06-14',
}

const ecuCapabilities = {
  protocols: ['UDS (ISO 14229)', 'KWP2000 (ISO 14230)', 'CAN 2.0B', 'CAN FD', 'LIN'],
  memorySize: '4 MB Flash + 256 KB RAM',
  processor: 'Infineon TriCore TC1797',
  connectivity: ['CAN-High Speed', 'CAN-FD', 'LIN Bus', 'K-Line'],
  maxBaudRate: '5 Mbit/s (CAN FD)',
  securityLevels: 27,
}

interface MemoryRegion {
  name: string
  icon: React.ElementType
  total: string
  used: string
  free: string
  usedPercent: number
  color: string
}

const memoryRegions: MemoryRegion[] = [
  { name: 'Flash', icon: HardDrive, total: '4 MB', used: '3.42 MB', free: '0.58 MB', usedPercent: 85.5, color: '#00d4ff' },
  { name: 'RAM', icon: CircuitBoard, total: '256 KB', used: '178 KB', free: '78 KB', usedPercent: 69.5, color: '#8b5cf6' },
  { name: 'EEPROM', icon: Database, total: '64 KB', used: '32 KB', free: '32 KB', usedPercent: 50, color: '#10b981' },
]

const connectedModules = [
  { name: 'Engine ECU', address: '0x01', protocol: 'CAN', status: 'online' },
  { name: 'Transmission TCU', address: '0x02', protocol: 'CAN', status: 'online' },
  { name: 'ABS/ESP Module', address: '0x03', protocol: 'CAN', status: 'online' },
  { name: 'Airbag Module', address: '0x15', protocol: 'CAN', status: 'online' },
  { name: 'Instrument Cluster', address: '0x17', protocol: 'CAN', status: 'online' },
  { name: 'Gateway Module', address: '0x19', protocol: 'CAN', status: 'online' },
  { name: 'Steering Assist', address: '0x44', protocol: 'CAN', status: 'offline' },
  { name: 'Climate Control', address: '0x08', protocol: 'LIN', status: 'online' },
]

const diagnosticProtocol = {
  currentProtocol: 'UDS (ISO 14229-1)',
  transportLayer: 'ISO 15765-2 (CAN TP)',
  timing: { p2Max: '50ms', p2StarMax: '5000ms', s3Server: '5000ms' },
  checksumAlgo: 'CRC32 + SHA-256',
  blockSize: 4096,
  stMin: '5ms',
}

const adaptationChannels = [
  { id: 1, name: 'Idle Speed Adaptation', current: '740 RPM', target: '720 RPM', status: 'adapted' },
  { id: 2, name: 'Throttle Body Adaptation', current: '4.7%', target: '5.0%', status: 'adapted' },
  { id: 3, name: 'Lambda Probe 1 Adaptation', current: '-2.3%', target: '0.0%', status: 'needs_adapt' },
  { id: 4, name: 'Lambda Probe 2 Adaptation', current: '+1.1%', target: '0.0%', status: 'adapted' },
  { id: 5, name: 'EGR Valve Adaptation', current: 'N/A', target: '0.0%', status: 'not_available' },
  { id: 6, name: 'DPF Soot Loading', current: '34%', target: '<80%', status: 'adapted' },
  { id: 7, name: 'Injector Quantity Adaptation', current: '+0.08 mg/stk', target: '0.00', status: 'adapted' },
  { id: 8, name: 'Turbocharger Actuator', current: '48.2%', target: '50.0%', status: 'needs_adapt' },
]

const variantConfig = [
  { code: 'V03L906018Q_AWD', description: 'All-Wheel Drive Configuration', value: 'Enabled' },
  { code: 'V03L906018Q_DSG', description: 'DSG Transmission Mating', value: 'DQ381-7F' },
  { code: 'V03L906018Q_EMIS', description: 'Emissions Standard', value: 'Euro 6d-ISC' },
  { code: 'V03L906018Q_START', description: 'Start/Stop System', value: 'Enabled' },
  { code: 'V03L906018Q_CYL', description: 'Cylinder Deactivation', value: 'Disabled' },
  { code: 'V03L906018Q_FUEL', description: 'Fuel Type', value: 'Diesel B7' },
]

export function ECUInfoView() {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">ECU Information</h1>
            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">
              CONNECTED
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">Detailed ECU identification and data</p>
        </div>
        <Button size="sm" className="h-8 text-xs bg-[#151d2b] text-[#94a3b8] border border-[#1e2a3a] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5">
          <RefreshCw className="h-3 w-3" />
          Refresh Data
        </Button>
      </div>

      {/* ECU Identification */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-[#00d4ff]" />
            ECU Identification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Manufacturer', value: ecuIdentification.manufacturer, icon: Wrench },
              { label: 'Part Number', value: ecuIdentification.partNumber, icon: Hash, copyable: true },
              { label: 'Hardware Version', value: ecuIdentification.hardwareVersion, icon: Microchip },
              { label: 'Software Version', value: ecuIdentification.softwareVersion, icon: Layers },
              { label: 'Calibration ID', value: ecuIdentification.calibrationId, icon: Fingerprint, copyable: true },
              { label: 'Serial Number', value: ecuIdentification.serialNumber, icon: Hash, copyable: true },
              { label: 'Production Date', value: ecuIdentification.productionDate, icon: Calendar },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <item.icon className="h-3 w-3 text-[#475569]" />
                    <span className="text-[10px] text-[#475569]">{item.label}</span>
                  </div>
                  {item.copyable && (
                    <button
                      onClick={() => handleCopy(item.value, item.label)}
                      className="text-[#475569] hover:text-[#00d4ff] transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="text-sm font-mono font-bold text-[#e2e8f0]">
                  {copiedField === item.label ? 'Copied!' : item.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ECU Capabilities */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#8b5cf6]" />
            ECU Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supported Protocols */}
            <div>
              <div className="text-[10px] text-[#475569] mb-2 flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                Supported Protocols
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ecuCapabilities.protocols.map(p => (
                  <Badge key={p} className="bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20 text-[9px]">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Connectivity */}
            <div>
              <div className="text-[10px] text-[#475569] mb-2 flex items-center gap-1.5">
                <Network className="h-3 w-3" />
                Connectivity
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ecuCapabilities.connectivity.map(c => (
                  <Badge key={c} className="bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20 text-[9px]">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Processor & Memory */}
            <div>
              <div className="text-[10px] text-[#475569] mb-2 flex items-center gap-1.5">
                <Microchip className="h-3 w-3" />
                Processor
              </div>
              <div className="text-sm font-mono font-bold text-[#e2e8f0]">{ecuCapabilities.processor}</div>
            </div>

            <div>
              <div className="text-[10px] text-[#475569] mb-2 flex items-center gap-1.5">
                <CircuitBoard className="h-3 w-3" />
                Total Memory
              </div>
              <div className="text-sm font-mono font-bold text-[#e2e8f0]">{ecuCapabilities.memorySize}</div>
            </div>

            {/* Baud Rate & Security */}
            <div>
              <div className="text-[10px] text-[#475569] mb-2 flex items-center gap-1.5">
                <Activity className="h-3 w-3" />
                Max Baud Rate
              </div>
              <div className="text-sm font-mono font-bold text-[#e2e8f0]">{ecuCapabilities.maxBaudRate}</div>
            </div>

            <div>
              <div className="text-[10px] text-[#475569] mb-2 flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Security Levels
              </div>
              <div className="text-sm font-mono font-bold text-[#e2e8f0]">{ecuCapabilities.securityLevels} access levels</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Map */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Database className="h-4 w-4 text-[#10b981]" />
            Memory Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memoryRegions.map(region => (
              <div key={region.name} className="p-4 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-2 mb-3">
                  <region.icon className="h-4 w-4" style={{ color: region.color }} />
                  <span className="text-xs font-semibold text-[#e2e8f0]">{region.name}</span>
                </div>

                {/* Usage bar */}
                <div className="w-full h-3 bg-[#1e2a3a] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${region.usedPercent}%`,
                      backgroundColor: region.color,
                      opacity: region.usedPercent > 80 ? 1 : 0.7,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-[#475569]">Total</div>
                    <div className="text-xs font-mono font-bold text-[#e2e8f0]">{region.total}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#475569]">Used</div>
                    <div className="text-xs font-mono font-bold" style={{ color: region.color }}>{region.used}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#475569]">Free</div>
                    <div className="text-xs font-mono font-bold text-[#10b981]">{region.free}</div>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <span className="text-[10px] text-[#64748b]">{region.usedPercent}% utilized</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connected ECU Modules */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Network className="h-4 w-4 text-[#00d4ff]" />
            Connected ECU Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {connectedModules.map(mod => (
              <div key={mod.address} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    mod.status === 'online' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                  }`} />
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">{mod.name}</div>
                    <div className="text-[10px] text-[#475569]">Protocol: {mod.protocol}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#64748b]">{mod.address}</span>
                  <Badge className={`text-[9px] ${
                    mod.status === 'online'
                      ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                      : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                  }`}>
                    {mod.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Protocol Info */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#f59e0b]" />
            Diagnostic Protocol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Current Protocol</div>
                <div className="text-sm font-mono font-bold text-[#00d4ff]">{diagnosticProtocol.currentProtocol}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Transport Layer</div>
                <div className="text-sm font-mono font-bold text-[#e2e8f0]">{diagnosticProtocol.transportLayer}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Checksum Algorithm</div>
                <div className="text-sm font-mono font-bold text-[#e2e8f0]">{diagnosticProtocol.checksumAlgo}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Timing Parameters</div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center">
                    <div className="text-[9px] text-[#475569]">P2 Max</div>
                    <div className="text-xs font-mono text-[#e2e8f0]">{diagnosticProtocol.timing.p2Max}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-[#475569]">P2* Max</div>
                    <div className="text-xs font-mono text-[#e2e8f0]">{diagnosticProtocol.timing.p2StarMax}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-[#475569]">S3 Server</div>
                    <div className="text-xs font-mono text-[#e2e8f0]">{diagnosticProtocol.timing.s3Server}</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="text-[10px] text-[#475569] mb-1">Block Size</div>
                  <div className="text-sm font-mono font-bold text-[#e2e8f0]">{diagnosticProtocol.blockSize} bytes</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="text-[10px] text-[#475569] mb-1">STmin</div>
                  <div className="text-sm font-mono font-bold text-[#e2e8f0]">{diagnosticProtocol.stMin}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ECU Coding & Variant Configuration */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#8b5cf6]" />
            ECU Coding & Variant Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {variantConfig.map(vc => (
              <div key={vc.code} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div>
                  <div className="text-xs font-medium text-[#e2e8f0]">{vc.description}</div>
                  <div className="text-[10px] font-mono text-[#475569]">{vc.code}</div>
                </div>
                <Badge className="bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55] text-[9px]">
                  {vc.value}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Adaptation Channels */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[#10b981]" />
            Adaptation Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {adaptationChannels.map(ch => (
              <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#475569] w-6">#{ch.id}</span>
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">{ch.name}</div>
                    <div className="text-[10px] text-[#475569]">Target: {ch.target}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#64748b]">{ch.current}</span>
                  <Badge className={`text-[9px] ${
                    ch.status === 'adapted'
                      ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                      : ch.status === 'needs_adapt'
                      ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                      : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'
                  }`}>
                    {ch.status === 'adapted' ? 'ADAPTED' : ch.status === 'needs_adapt' ? 'NEEDS ADAPT' : 'N/A'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
