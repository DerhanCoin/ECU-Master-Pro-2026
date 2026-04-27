'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cable,
  Usb,
  CheckCircle2,
  XCircle,
  Activity,
  Settings,
  Zap,
  Battery,
  Power,
  RefreshCw,
  Filter,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Cpu,
  Car,
  Plug,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Detected Passthrough Devices
const DETECTED_DEVICES = [
  { id: 'dev1', name: 'Tactrix OpenPort 2.0', manufacturer: 'Tactrix Inc.', serial: 'OP2-0-US-24781', connected: true },
  { id: 'dev2', name: 'Scanmatik 2 Pro', manufacturer: 'Scanmatik LLC', serial: 'SM2P-RU-88312', connected: false },
  { id: 'dev3', name: 'CarDaq-Plus 3', manufacturer: 'Drew Technologies', serial: 'CDP3-US-12045', connected: false },
  { id: 'dev4', name: 'J2534 MultiProtocol', manufacturer: 'AutoEnginuity', serial: 'AE-MP-45123', connected: false },
]

// Device Info for active device
const DEVICE_INFO = {
  manufacturer: 'Tactrix Inc.',
  name: 'OpenPort 2.0',
  serial: 'OP2-0-US-24781',
  firmware: 'v1.3.7 (build 421)',
  dllVersion: 'v2.0.3.10',
  apiVersion: 'SAE J2534-1 (04/2002)',
}

// Protocol definitions
const PROTOCOLS = [
  { id: 'iso9141', name: 'ISO9141', desc: 'K-Line Serial, 5-baud init', speed: '10.4 kbps', connected: false },
  { id: 'iso14230', name: 'ISO14230', desc: 'KWP2000, fast init', speed: '10.4 kbps', connected: true },
  { id: 'iso15765', name: 'ISO15765', desc: 'CAN diagnostics, 4-byte header', speed: '500 kbps', connected: true },
  { id: 'j1850vpw', name: 'J1850 VPW', desc: 'GM Class 2', speed: '10.4 kbps', connected: false },
  { id: 'j1850pwm', name: 'J1850 PWM', desc: 'Ford SCP', speed: '41.6 kbps', connected: false },
  { id: 'sci', name: 'SCI', desc: 'Chrysler SCI', speed: 'N/A', connected: false },
]

// Pin configuration
const PIN_CONFIG = [
  { pin: 1, assignment: 'Vendor Specific', signal: 'N/A' },
  { pin: 2, assignment: 'J1850 PWM Bus+', signal: 'Active' },
  { pin: 3, assignment: 'Vendor Specific', signal: 'N/A' },
  { pin: 4, assignment: 'Chassis Ground', signal: 'Ground' },
  { pin: 5, assignment: 'Signal Ground', signal: 'Ground' },
  { pin: 6, assignment: 'CAN High (ISO15765)', signal: 'Active' },
  { pin: 7, assignment: 'K-Line (ISO9141/14230)', signal: 'Active' },
  { pin: 8, assignment: 'Vendor Specific', signal: 'N/A' },
  { pin: 9, assignment: 'Vendor Specific', signal: 'N/A' },
  { pin: 10, assignment: 'J1850 PWM Bus-', signal: 'Inactive' },
  { pin: 11, assignment: 'Vendor Specific', signal: 'N/A' },
  { pin: 12, assignment: 'Vendor Specific', signal: 'N/A' },
  { pin: 13, assignment: 'Vendor Specific', signal: 'N/A' },
  { pin: 14, assignment: 'CAN Low (ISO15765)', signal: 'Active' },
  { pin: 15, assignment: 'L-Line (ISO9141)', signal: 'Inactive' },
  { pin: 16, assignment: 'Battery Voltage (+12V)', signal: 'Active' },
]

// Communication statistics
const COMM_STATS = {
  msgsPerSec: 47,
  errorRate: 0.2,
  latency: 8,
  totalSent: 12847,
  totalReceived: 11234,
  errors: 23,
}

// Connection log
const CONNECTION_LOG = [
  { time: '12:45:23.456', event: 'PassThruOpen', detail: 'Device="OpenPort 2.0"', result: 'OK' },
  { time: '12:45:23.460', event: 'PassThruConnect', detail: 'Protocol=ISO15765, Baud=500000', result: 'OK' },
  { time: '12:45:23.475', event: 'PassThruIoctl', detail: 'SET_CONFIG, Loopback=OFF', result: 'OK' },
  { time: '12:45:23.480', event: 'PassThruStartMsgFilter', detail: 'Type=PASS_FILTER', result: 'OK' },
  { time: '12:45:24.100', event: 'PassThruWriteMsgs', detail: 'TX: 7E0 01 00 00 00 00 00 00', result: 'OK' },
  { time: '12:45:24.150', event: 'PassThruReadMsgs', detail: 'RX: 7E8 41 00 80 10 01 01 00', result: 'OK' },
  { time: '12:45:25.200', event: 'PassThruWriteMsgs', detail: 'TX: 7E0 09 02 00 00 00 00 00', result: 'OK' },
  { time: '12:45:25.320', event: 'PassThruReadMsgs', detail: 'RX: 7E8 49 02 01 57 56 57 ...', result: 'OK' },
  { time: '12:45:30.100', event: 'PassThruWriteMsgs', detail: 'TX: 7E1 22 10 00 00 00 00 00', result: 'OK' },
  { time: '12:45:30.200', event: 'PassThruReadMsgs', detail: 'RX: 7E9 62 10 00 FF 03 E0 ...', result: 'TIMEOUT' },
]

type ProgrammingMode = 'reprogramming' | 'diagnostic' | 'passthrough'

export function PassthruView() {
  const [selectedDevice, setSelectedDevice] = useState('dev1')
  const [programmingMode, setProgrammingMode] = useState<ProgrammingMode>('diagnostic')
  const [voltage] = useState(12.4)
  const [ignitionOn] = useState(true)

  const activeDevice = DETECTED_DEVICES.find(d => d.id === selectedDevice)
  const connectedProtocols = PROTOCOLS.filter(p => p.connected)

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cable className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Passthrough Device</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">SAE J2534</Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Generic SAE J2534 passthrough device interface for multi-protocol vehicle communication
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
          <RefreshCw className="h-3 w-3" />Scan Devices
        </Button>
      </div>

      {/* Device List + Device Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Detected Devices */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Usb className="h-4 w-4 text-[#00d4ff]" />
              Detected Passthrough Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DETECTED_DEVICES.map((device) => (
              <div
                key={device.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  selectedDevice === device.id
                    ? 'border-[#00d4ff]/40 bg-[#00d4ff]/10 shadow-[0_0_6px_#00d4ff15]'
                    : 'border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                )}
              >
                <div className={cn(
                  'h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0',
                  device.connected ? 'bg-[#10b981]/15' : 'bg-[#1e2a3a]'
                )}>
                  <Plug className="h-4 w-4" style={{ color: device.connected ? '#10b981' : '#475569' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-[11px] font-semibold', selectedDevice === device.id ? 'text-[#00d4ff]' : 'text-[#e2e8f0]')}>
                    {device.name}
                  </div>
                  <div className="text-[9px] text-[#475569]">{device.manufacturer} · {device.serial}</div>
                </div>
                <div className="flex items-center gap-2">
                  {device.connected ? (
                    <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px]">Connected</Badge>
                  ) : (
                    <Button size="sm" className="h-6 text-[9px] gap-1 bg-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/30 border border-[#00d4ff]/30">
                      <Zap className="h-2.5 w-2.5" />Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#00d4ff]" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Manufacturer', value: DEVICE_INFO.manufacturer },
              { label: 'Device Name', value: DEVICE_INFO.name },
              { label: 'Serial Number', value: DEVICE_INFO.serial },
              { label: 'Firmware', value: DEVICE_INFO.firmware },
              { label: 'DLL Version', value: DEVICE_INFO.dllVersion },
              { label: 'API Version', value: DEVICE_INFO.apiVersion },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1e2a3a]/50 last:border-0">
                <span className="text-[11px] text-[#64748b]">{item.label}</span>
                <span className="text-[11px] font-mono text-[#e2e8f0]">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3">
              <span className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />
              <span className="text-xs text-[#10b981] font-semibold">Device Ready</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocol Selection + Pin Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Protocol Selection */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#00d4ff]" />
              Protocol Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {PROTOCOLS.map((proto) => (
                <div key={proto.id} className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
                  proto.connected ? 'bg-[#00d4ff]/5 border-[#00d4ff]/30' : 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]'
                )}>
                  <div className={cn(
                    'h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0',
                    proto.connected ? 'bg-[#00d4ff]/20' : 'bg-[#1e2a3a]'
                  )}>
                    <Activity className="h-3.5 w-3.5" style={{ color: proto.connected ? '#00d4ff' : '#475569' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[11px] font-semibold', proto.connected ? 'text-[#00d4ff]' : 'text-[#e2e8f0]')}>
                      {proto.name}
                    </div>
                    <div className="text-[9px] text-[#475569]">{proto.desc} · {proto.speed}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {proto.connected ? (
                      <>
                        <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px]">Active</Badge>
                        <Button size="sm" variant="outline" className="h-6 text-[9px] border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10">
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="h-6 text-[9px] gap-1 bg-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/30 border border-[#00d4ff]/30">
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pin Configuration */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Car className="h-4 w-4 text-[#00d4ff]" />
              OBD-II Pin Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#1e2a3a] sticky top-0 bg-[#151d2b]">
                    <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 pr-2">Pin</th>
                    <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Assignment</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {PIN_CONFIG.map((pin) => (
                    <tr key={pin.pin} className="border-b border-[#1e2a3a]/30 hover:bg-[#1e2a3a]/20 transition-colors">
                      <td className="py-1.5 pr-2 font-mono font-bold text-[#00d4ff]">{pin.pin}</td>
                      <td className="py-1.5 px-2 text-[#94a3b8]">{pin.assignment}</td>
                      <td className="text-center py-1.5 px-2">
                        <Badge className={cn(
                          'text-[8px] border px-1 py-0 h-3.5',
                          pin.signal === 'Active' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' :
                          pin.signal === 'Ground' ? 'bg-[#64748b]/20 text-[#64748b] border-[#64748b]/30' :
                          pin.signal === 'Inactive' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' :
                          'bg-[#1e2a3a] text-[#475569]'
                        )}>
                          {pin.signal}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Stats + Voltage + Programming Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Communication Statistics */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              Communication Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-[#00d4ff] tabular-nums">{COMM_STATS.msgsPerSec}</div>
                <div className="text-[9px] text-[#475569]">Msgs/sec</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-[#10b981] tabular-nums">{COMM_STATS.errorRate}%</div>
                <div className="text-[9px] text-[#475569]">Error Rate</div>
              </div>
            </div>

            {/* Latency Bar */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#64748b]">Latency</span>
                <span className="text-[10px] font-mono text-[#e2e8f0]">{COMM_STATS.latency} ms</span>
              </div>
              <div className="h-2 w-full bg-[#0f1923] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${Math.min((COMM_STATS.latency / 50) * 100, 100)}%` }} />
              </div>
            </div>

            {/* Throughput indicators */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#64748b]">Messages Sent</span>
                  <span className="text-[10px] font-mono text-[#00d4ff]">{COMM_STATS.totalSent.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#00d4ff]" style={{ width: '75%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#64748b]">Messages Received</span>
                  <span className="text-[10px] font-mono text-[#10b981]">{COMM_STATS.totalReceived.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#10b981]" style={{ width: '65%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#64748b]">Errors</span>
                  <span className="text-[10px] font-mono text-[#ef4444]">{COMM_STATS.errors}</span>
                </div>
                <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#ef4444]" style={{ width: '2%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voltage Monitor + Programming Mode */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Battery className="h-4 w-4 text-[#00d4ff]" />
              Voltage &amp; Ignition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Voltage Display */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#10b981] tabular-nums">{voltage.toFixed(1)}V</div>
              <div className="text-[10px] text-[#475569] mt-1">Battery Voltage</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {voltage >= 12.0 ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                    <span className="text-[10px] text-[#10b981] font-semibold">Voltage OK</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-[#ef4444]" />
                    <span className="text-[10px] text-[#ef4444] font-semibold">Low Voltage</span>
                  </>
                )}
              </div>
            </div>

            {/* Ignition State */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power className="h-4 w-4" style={{ color: ignitionOn ? '#f59e0b' : '#475569' }} />
                  <span className="text-xs text-[#64748b]">Ignition State</span>
                </div>
                <Badge className={ignitionOn ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'}>
                  {ignitionOn ? 'ON' : 'OFF'}
                </Badge>
              </div>
            </div>

            {/* Programming Mode */}
            <div>
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Programming Mode</div>
              <div className="space-y-1.5">
                {([
                  { mode: 'reprogramming' as ProgrammingMode, label: 'Reprogramming', desc: 'Flash ECU firmware', color: '#f59e0b' },
                  { mode: 'diagnostic' as ProgrammingMode, label: 'Diagnostic', desc: 'Read/clear DTCs', color: '#00d4ff' },
                  { mode: 'passthrough' as ProgrammingMode, label: 'Pass-through', desc: 'Raw data bridge', color: '#8b5cf6' },
                ]).map((pm) => (
                  <button
                    key={pm.mode}
                    onClick={() => setProgrammingMode(pm.mode)}
                    className={cn(
                      'w-full flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left',
                      programmingMode === pm.mode
                        ? 'border-2'
                        : 'border border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                    )}
                    style={{
                      borderColor: programmingMode === pm.mode ? pm.color : undefined,
                      backgroundColor: programmingMode === pm.mode ? `${pm.color}10` : undefined,
                    }}
                  >
                    <div className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${pm.color}20` }}>
                      <Settings className="h-3 w-3" style={{ color: pm.color }} />
                    </div>
                    <div className="flex-1">
                      <div className={cn('text-[10px] font-semibold', programmingMode === pm.mode ? 'text-[#e2e8f0]' : 'text-[#94a3b8]')}>
                        {pm.label}
                      </div>
                      <div className="text-[8px] text-[#475569]">{pm.desc}</div>
                    </div>
                    {programmingMode === pm.mode && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: pm.color }} />}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Filter Configuration */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#00d4ff]" />
              Filter Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'f1', type: 'PASS_FILTER', mask: '0xFFFFFF', pattern: '0x0007E8', protocol: 'ISO15765', active: true },
              { id: 'f2', type: 'PASS_FILTER', mask: '0xFFFFFF', pattern: '0x0007E0', protocol: 'ISO15765', active: true },
              { id: 'f3', type: 'BLOCK_FILTER', mask: '0xFFF000', pattern: '0x7DF000', protocol: 'ISO15765', active: false },
              { id: 'f4', type: 'PASS_FILTER', mask: '0xFFFFFFFF', pattern: '0xC0120000', protocol: 'ISO14230', active: true },
            ].map((filter) => (
              <div key={filter.id} className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg border',
                filter.active ? 'bg-[#0f1923] border-[#00d4ff]/20' : 'bg-[#0f1923] border-[#1e2a3a] opacity-60'
              )}>
                <div className={cn(
                  'h-6 w-6 rounded flex items-center justify-center flex-shrink-0',
                  filter.type === 'PASS_FILTER' ? 'bg-[#10b981]/15' : 'bg-[#ef4444]/15'
                )}>
                  {filter.type === 'PASS_FILTER' ? (
                    <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                  ) : (
                    <XCircle className="h-3 w-3 text-[#ef4444]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-[#e2e8f0]">{filter.type}</div>
                  <div className="text-[9px] text-[#475569] font-mono">Mask: {filter.mask} · Pattern: {filter.pattern}</div>
                </div>
                <Badge className="bg-[#1e2a3a] text-[#64748b] text-[8px] border-0">{filter.protocol}</Badge>
              </div>
            ))}

            <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1.5 border-[#1e2a3a] bg-[#0f1923] text-[#00d4ff] hover:bg-[#1e2a3a]">
              <Filter className="h-3 w-3" />Add Filter
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Connection Log */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00d4ff]" />
              Connection Log
            </CardTitle>
            <Badge className="bg-[#1e2a3a] text-[#64748b] text-[9px]">{CONNECTION_LOG.length} entries</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
            {CONNECTION_LOG.map((entry, i) => {
              const isError = entry.result !== 'OK'
              return (
                <div key={i} className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2 hover:border-[#2d3f55] transition-colors">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-mono text-[#475569] tabular-nums">{entry.time}</span>
                    <span className="text-[10px] font-mono font-bold text-[#00d4ff]">{entry.event}</span>
                    {entry.event.includes('Write') ? (
                      <ArrowUpRight className="h-2.5 w-2.5 text-[#00d4ff]" />
                    ) : entry.event.includes('Read') ? (
                      <ArrowDownLeft className="h-2.5 w-2.5 text-[#10b981]" />
                    ) : null}
                  </div>
                  <div className="text-[9px] text-[#94a3b8] font-mono truncate">{entry.detail}</div>
                  <div className={cn('text-[9px] font-mono mt-0.5', isError ? 'text-[#ef4444]' : 'text-[#10b981]')}>
                    → {entry.result}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
