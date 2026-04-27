'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cable,
  CheckCircle2,
  XCircle,
  Activity,
  Settings,
  Download,
  Play,
  Square,
  RefreshCw,
  Cpu,
  Zap,
  ArrowRight,
  Clock,
  AlertTriangle,
  Car,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Device info
const DEVICE_INFO = {
  name: 'Tactrix OpenPort 2.0',
  manufacturer: 'Tactrix Inc.',
  driverVersion: 'v2.0.3.10',
  apiVersion: 'J2534-1 (04/2002)',
  serialNumber: 'OP2-0-US-24781',
  status: 'Connected',
  firmware: 'v1.3.7',
}

// Supported protocols
const PROTOCOLS = [
  { name: 'ISO9141', desc: 'K-Line serial, 5 baud init', supported: true, speed: '10.4 kbps', active: false },
  { name: 'ISO14230', desc: 'KWP2000, fast init', supported: true, speed: '10.4 kbps', active: true },
  { name: 'ISO15765', desc: 'CAN diagnostics, 4-byte header', supported: true, speed: '500 kbps', active: true },
  { name: 'SAE J1850 VPW', desc: 'GM Class 2', supported: true, speed: '10.4 kbps', active: false },
  { name: 'SAE J1850 PWM', desc: 'Ford SCP', supported: true, speed: '41.6 kbps', active: false },
  { name: 'SCI', desc: ' Chrysler SCI', supported: false, speed: 'N/A', active: false },
]

// Programming session
const PROGRAMMING_DATA = {
  ecu: 'Engine Control Module',
  ecuAddress: '0x7E0',
  firmwareFile: 'ECM_GOLF8_2023_v9971.bin',
  fileSize: '1.8 MB',
  progress: 0,
  status: 'Ready',
}

// OEM profiles
const OEM_PROFILES = [
  { name: 'GM (General Motors)', protocol: 'J1850 VPW', pin: '2', region: 'North America' },
  { name: 'Ford', protocol: 'J1850 PWM', pin: '2,10', region: 'North America' },
  { name: 'Toyota', protocol: 'ISO15765', pin: '6,14', region: 'Global' },
  { name: 'Honda', protocol: 'ISO9141', pin: '7,15', region: 'Global' },
  { name: 'VW Group', protocol: 'ISO15765', pin: '6,14', region: 'Europe' },
  { name: 'BMW', protocol: 'ISO15765', pin: '6,14', region: 'Europe' },
  { name: 'Mercedes-Benz', protocol: 'ISO15765', pin: '6,14', region: 'Europe' },
  { name: 'Hyundai/Kia', protocol: 'ISO15765', pin: '6,14', region: 'Global' },
]

// API call log
const API_LOG = [
  { time: '12:45:23.456', fn: 'PassThruOpen', params: 'DeviceName="OpenPort 2.0"', result: 'STATUS_NO_ERROR' },
  { time: '12:45:23.460', fn: 'PassThruConnect', params: 'Protocol=ISO15765, Baud=500000', result: 'STATUS_NO_ERROR' },
  { time: '12:45:23.475', fn: 'PassThruIoctl', params: 'SET_CONFIG, Loopback=OFF', result: 'STATUS_NO_ERROR' },
  { time: '12:45:23.480', fn: 'PassThruStartMsgFilter', params: 'Type=PASS_FILTER, Mask=FFFFFF', result: 'STATUS_NO_ERROR' },
  { time: '12:45:24.100', fn: 'PassThruWriteMsgs', params: 'TX: 7E0 01 00 00 00 00 00 00', result: 'STATUS_NO_ERROR' },
  { time: '12:45:24.150', fn: 'PassThruReadMsgs', params: 'RX: 7E8 41 00 80 10 01 01 00', result: 'STATUS_NO_ERROR' },
  { time: '12:45:25.200', fn: 'PassThruWriteMsgs', params: 'TX: 7E0 09 02 00 00 00 00 00', result: 'STATUS_NO_ERROR' },
  { time: '12:45:25.320', fn: 'PassThruReadMsgs', params: 'RX: 7E8 49 02 01 57 56 57 ...', result: 'STATUS_NO_ERROR' },
]

// Device capabilities matrix
const CAPABILITIES = [
  { feature: 'ISO9141', read: true, write: true, filter: true, ioctl: true },
  { feature: 'ISO14230', read: true, write: true, filter: true, ioctl: true },
  { feature: 'ISO15765', read: true, write: true, filter: true, ioctl: true },
  { feature: 'J1850 VPW', read: true, write: true, filter: true, ioctl: false },
  { feature: 'J1850 PWM', read: true, write: true, filter: true, ioctl: false },
  { feature: 'SCI-A', read: false, write: false, filter: false, ioctl: false },
  { feature: 'SCI-B', read: false, write: false, filter: false, ioctl: false },
  { feature: 'CAN 2.0A', read: true, write: true, filter: true, ioctl: true },
  { feature: 'CAN 2.0B', read: true, write: true, filter: true, ioctl: true },
]

// Connection parameters
const CONNECTION_PARAMS = {
  baudRate: 500000,
  loopback: false,
  filterType: 'PASS_FILTER',
  msgTimeout: 1000,
  p1Min: 0,
  p1Max: 20,
  p2Min: 25,
  p2Max: 50,
  p3Min: 55,
  p3Max: 5000,
  p4Min: 5,
  p4Max: 20,
}

// Session management
const SESSIONS = [
  { id: 1, protocol: 'ISO15765', ecu: 'ECM (0x7E0)', start: '12:45:23', msgsTx: 1247, msgsRx: 1184, status: 'Active' },
  { id: 2, protocol: 'ISO14230', ecu: 'TCM (0x7E1)', start: '12:30:00', msgsTx: 0, msgsRx: 0, status: 'Closed' },
]

export function J2534View() {
  const [isProgramming, setIsProgramming] = useState(false)
  const [progProgress, setProgProgress] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState<string | null>('VW Group')

  const handleStartProgramming = () => {
    setIsProgramming(true)
    setProgProgress(0)
    const interval = setInterval(() => {
      setProgProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProgramming(false)
          return 100
        }
        return prev + 1
      })
    }, 150)
  }

  const handleStopProgramming = () => {
    setIsProgramming(false)
    setProgProgress(0)
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cable className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">J2534 Passthrough</h1>
            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">Connected</Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            SAE J2534 passthrough device management, protocol selection, and ECU programming
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
          <RefreshCw className="h-3 w-3" />Reconnect Device
        </Button>
      </div>

      {/* Device Status + Protocol Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Device Status */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#00d4ff]" />
              J2534 Device Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: 'Device', value: DEVICE_INFO.name },
                { label: 'Driver Version', value: DEVICE_INFO.driverVersion },
                { label: 'API Version', value: DEVICE_INFO.apiVersion },
                { label: 'Serial Number', value: DEVICE_INFO.serialNumber },
                { label: 'Firmware', value: DEVICE_INFO.firmware },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1e2a3a]/50 last:border-0">
                  <span className="text-[11px] text-[#64748b]">{item.label}</span>
                  <span className="text-[11px] font-mono text-[#e2e8f0]">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />
              <span className="text-xs text-[#10b981] font-semibold">Device Connected</span>
            </div>
          </CardContent>
        </Card>

        {/* Protocol Selection */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#00d4ff]" />
              Supported Protocols
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {PROTOCOLS.map((proto) => (
                <div key={proto.name} className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
                  proto.active ? 'bg-[#00d4ff]/5 border-[#00d4ff]/30' :
                  proto.supported ? 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]' :
                  'bg-[#0f1923] border-[#1e2a3a] opacity-50'
                )}>
                  <div className={cn(
                    'h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0',
                    proto.active ? 'bg-[#00d4ff]/20' : 'bg-[#1e2a3a]'
                  )}>
                    <Activity className="h-3.5 w-3.5" style={{ color: proto.active ? '#00d4ff' : '#475569' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[11px] font-semibold', proto.active ? 'text-[#00d4ff]' : 'text-[#e2e8f0]')}>
                      {proto.name}
                    </div>
                    <div className="text-[9px] text-[#475569]">{proto.desc} · {proto.speed}</div>
                  </div>
                  {proto.active ? (
                    <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px]">Active</Badge>
                  ) : proto.supported ? (
                    <Badge className="bg-[#1e2a3a] text-[#64748b] text-[9px]">Available</Badge>
                  ) : (
                    <Badge className="bg-[#ef4444]/10 text-[#ef4444] text-[9px]">N/A</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programming Session + Capabilities Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Programming Session */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Download className="h-4 w-4 text-[#00d4ff]" />
              Programming Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5">
                <div className="text-[9px] text-[#475569]">Target ECU</div>
                <div className="text-[11px] font-semibold text-[#e2e8f0]">{PROGRAMMING_DATA.ecu}</div>
                <div className="text-[9px] font-mono text-[#475569]">{PROGRAMMING_DATA.ecuAddress}</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5">
                <div className="text-[9px] text-[#475569]">Firmware File</div>
                <div className="text-[11px] font-semibold text-[#e2e8f0] truncate">{PROGRAMMING_DATA.firmwareFile}</div>
                <div className="text-[9px] font-mono text-[#475569]">{PROGRAMMING_DATA.fileSize}</div>
              </div>
            </div>

            {/* Connection Parameters */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Connection Parameters</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">Baud Rate</span>
                  <span className="text-[10px] font-mono text-[#e2e8f0]">{CONNECTION_PARAMS.baudRate.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">Loopback</span>
                  <span className="text-[10px] font-mono text-[#475569]">OFF</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">P1 Max</span>
                  <span className="text-[10px] font-mono text-[#e2e8f0]">{CONNECTION_PARAMS.p1Max} ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">P2 Max</span>
                  <span className="text-[10px] font-mono text-[#e2e8f0]">{CONNECTION_PARAMS.p2Max} ms</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            {isProgramming && (
              <div className="bg-[#0f1923] border border-[#00d4ff]/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#00d4ff] font-semibold">Programming in progress...</span>
                  <span className="text-xs font-bold text-[#00d4ff] tabular-nums">{progProgress}%</span>
                </div>
                <div className="h-2 w-full bg-[#0f1923] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#00d4ff] transition-all" style={{ width: `${progProgress}%`, boxShadow: '0 0 8px #00d4ff40' }} />
                </div>
                <div className="text-[9px] text-[#475569] mt-1">Do not disconnect or turn off ignition</div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={handleStartProgramming} disabled={isProgramming} className="flex-1 h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
                <Play className="h-3 w-3" />Start Programming
              </Button>
              <Button size="sm" onClick={handleStopProgramming} disabled={!isProgramming} variant="outline" className="h-8 text-xs gap-1.5 border-[#1e2a3a] bg-[#151d2b] text-[#ef4444] hover:bg-[#ef4444]/10">
                <Square className="h-3 w-3" />Abort
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Device Capabilities Matrix */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#00d4ff]" />
              Device Capabilities Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    <th className="text-left text-[#475569] uppercase tracking-wider font-bold py-2 pr-3">Feature</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Read</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Write</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Filter</th>
                    <th className="text-center text-[#475569] uppercase tracking-wider font-bold py-2 px-2">Ioctl</th>
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITIES.map((cap, i) => (
                    <tr key={i} className="border-b border-[#1e2a3a]/30 hover:bg-[#1e2a3a]/20 transition-colors">
                      <td className="py-2 pr-3 font-semibold text-[#94a3b8]">{cap.feature}</td>
                      <td className="text-center py-2 px-2">{cap.read ? <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981] mx-auto" /> : <XCircle className="h-3.5 w-3.5 text-[#475569] mx-auto" />}</td>
                      <td className="text-center py-2 px-2">{cap.write ? <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981] mx-auto" /> : <XCircle className="h-3.5 w-3.5 text-[#475569] mx-auto" />}</td>
                      <td className="text-center py-2 px-2">{cap.filter ? <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981] mx-auto" /> : <XCircle className="h-3.5 w-3.5 text-[#475569] mx-auto" />}</td>
                      <td className="text-center py-2 px-2">{cap.ioctl ? <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981] mx-auto" /> : <XCircle className="h-3.5 w-3.5 text-[#475569] mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OEM Profiles + API Log + Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* OEM Profiles */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Car className="h-4 w-4 text-[#00d4ff]" />
              Manufacturer Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {OEM_PROFILES.map((profile) => (
                <button
                  key={profile.name}
                  onClick={() => setSelectedProfile(profile.name)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left',
                    selectedProfile === profile.name
                      ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30 shadow-[0_0_6px_#00d4ff15]'
                      : 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[11px] font-semibold', selectedProfile === profile.name ? 'text-[#00d4ff]' : 'text-[#e2e8f0]')}>
                      {profile.name}
                    </div>
                    <div className="text-[9px] text-[#475569]">{profile.protocol} · Pin {profile.pin} · {profile.region}</div>
                  </div>
                  {selectedProfile === profile.name && <CheckCircle2 className="h-4 w-4 text-[#00d4ff] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Function Call Log */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              J2534 API Call Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {API_LOG.map((entry, i) => {
                const isError = entry.result !== 'STATUS_NO_ERROR'
                return (
                  <div key={i} className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2 hover:border-[#2d3f55] transition-colors">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono text-[#475569] tabular-nums">{entry.time}</span>
                      <span className="text-[10px] font-mono font-bold text-[#00d4ff]">{entry.fn}</span>
                    </div>
                    <div className="text-[9px] text-[#94a3b8] font-mono truncate">{entry.params}</div>
                    <div className={cn('text-[9px] font-mono mt-0.5', isError ? 'text-[#ef4444]' : 'text-[#10b981]')}>
                      → {entry.result}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00d4ff]" />
              Session Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SESSIONS.map((session) => (
              <div key={session.id} className={cn(
                'bg-[#0f1923] border rounded-lg p-3',
                session.status === 'Active' ? 'border-[#10b981]/30' : 'border-[#1e2a3a]'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#e2e8f0]">Session #{session.id}</span>
                  <Badge className={cn(
                    'text-[9px] border-0',
                    session.status === 'Active' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#1e2a3a] text-[#64748b]'
                  )}>
                    {session.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <span className="text-[#475569]">Protocol: </span>
                    <span className="text-[#94a3b8] font-mono">{session.protocol}</span>
                  </div>
                  <div>
                    <span className="text-[#475569]">ECU: </span>
                    <span className="text-[#94a3b8] font-mono">{session.ecu}</span>
                  </div>
                  <div>
                    <span className="text-[#475569]">TX: </span>
                    <span className="text-[#94a3b8] font-mono tabular-nums">{session.msgsTx.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#475569]">RX: </span>
                    <span className="text-[#94a3b8] font-mono tabular-nums">{session.msgsRx.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Totals</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] text-[#475569]">Messages Sent</div>
                  <div className="text-sm font-bold text-[#00d4ff] tabular-nums">1,247</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#475569]">Messages Received</div>
                  <div className="text-sm font-bold text-[#10b981] tabular-nums">1,184</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
