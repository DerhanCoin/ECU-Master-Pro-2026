'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Wifi,
  Bluetooth,
  Usb,
  Plus,
  Signal,
  Battery,
  BatteryCharging,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Cpu,
  Download,
  Link2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type DongleType = 'Bluetooth' | 'WiFi' | 'USB'
type SignalStrength = 'Excellent' | 'Good' | 'Fair' | 'Weak'
type FirmwareStatus = 'Up-to-date' | 'Update Available' | 'Updating'

interface ConnectedDongle {
  id: string
  name: string
  type: DongleType
  mac: string
  signal: SignalStrength
  signalBars: number
  protocolSupport: string[]
  batteryLevel: number
  isCharging: boolean
  firmware: string
  firmwareStatus: FirmwareStatus
  connectedSince: string
}

interface AvailableDongle {
  id: string
  name: string
  type: DongleType
  mac: string
  signal: SignalStrength
  signalBars: number
}

// Mock data
const CONNECTED_DONGLES: ConnectedDongle[] = [
  {
    id: 'd1',
    name: 'VAS 6154/4',
    type: 'WiFi',
    mac: '00:1A:2B:3C:4D:5E',
    signal: 'Excellent',
    signalBars: 4,
    protocolSupport: ['DoIP', 'CAN', 'UDS', 'K-Line'],
    batteryLevel: 87,
    isCharging: false,
    firmware: 'v2.4.1',
    firmwareStatus: 'Up-to-date',
    connectedSince: '12:22 PM',
  },
  {
    id: 'd2',
    name: 'ELM327 OBD-II',
    type: 'Bluetooth',
    mac: 'AA:BB:CC:DD:EE:FF',
    signal: 'Good',
    signalBars: 3,
    protocolSupport: ['OBD-II', 'CAN', 'ISO-9141'],
    batteryLevel: 45,
    isCharging: true,
    firmware: 'v1.5.0',
    firmwareStatus: 'Update Available',
    connectedSince: '11:45 AM',
  },
]

const AVAILABLE_DONGLES: AvailableDongle[] = [
  { id: 'a1', name: 'OBDLink MX+', type: 'Bluetooth', mac: '11:22:33:44:55:66', signal: 'Good', signalBars: 3 },
  { id: 'a2', name: 'Veepeak OBDCheck', type: 'WiFi', mac: '77:88:99:AA:BB:CC', signal: 'Fair', signalBars: 2 },
  { id: 'a3', name: 'Carista OBD2', type: 'Bluetooth', mac: 'DD:EE:FF:00:11:22', signal: 'Weak', signalBars: 1 },
]

const COMPATIBILITY_MATRIX = [
  { name: 'ELM327', pid: 'PIDs 01-20', basic: true, enhanced: false, manufacturer: false, can: true, doip: false },
  { name: 'OBDLink MX+', pid: 'PIDs 01-60', basic: true, enhanced: true, manufacturer: false, can: true, doip: false },
  { name: 'Veepeak', pid: 'PIDs 01-40', basic: true, enhanced: false, manufacturer: false, can: true, doip: false },
  { name: 'Carista', pid: 'PIDs 01-30 + OEM', basic: true, enhanced: true, manufacturer: true, can: true, doip: false },
  { name: 'FIXD', pid: 'PIDs 01-20', basic: true, enhanced: false, manufacturer: false, can: true, doip: false },
]

const SIGNAL_COLORS: Record<SignalStrength, string> = {
  Excellent: '#10b981',
  Good: '#00d4ff',
  Fair: '#f59e0b',
  Weak: '#ef4444',
}

const TYPE_ICONS: Record<DongleType, React.ElementType> = {
  Bluetooth: Bluetooth,
  WiFi: Wifi,
  USB: Usb,
}

export function DonglesView() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDongleName, setNewDongleName] = useState('')
  const [newDongleMac, setNewDongleMac] = useState('')
  const [newDongleType, setNewDongleType] = useState<DongleType>('Bluetooth')
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleConnect = (id: string) => {
    setConnectingId(id)
    setTimeout(() => setConnectingId(null), 2000)
  }

  const handleFirmwareUpdate = (id: string) => {
    setUpdatingId(id)
    setTimeout(() => setUpdatingId(null), 3000)
  }

  const getBatteryIcon = (level: number, charging: boolean) => {
    if (charging) return BatteryCharging
    if (level > 60) return Battery
    if (level > 25) return Battery
    return Battery
  }

  const getBatteryColor = (level: number) => {
    if (level > 60) return '#10b981'
    if (level > 25) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">OBD Dongles</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
              {CONNECTED_DONGLES.length} CONNECTED
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Manage Bluetooth, WiFi, and USB OBD diagnostic adapters
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
        >
          {showAddForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showAddForm ? 'Cancel' : 'Add Dongle'}
        </Button>
      </div>

      {/* Add Dongle Form */}
      {showAddForm && (
        <Card className="bg-[#151d2b] border-[#00d4ff]/30 shadow-[0_0_12px_#00d4ff10]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#00d4ff]" />
              Register New Dongle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold block mb-1">Dongle Name</label>
                <Input
                  placeholder="e.g., My OBDLink MX+"
                  value={newDongleName}
                  onChange={(e) => setNewDongleName(e.target.value)}
                  className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:border-[#00d4ff]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold block mb-1">MAC Address</label>
                <Input
                  placeholder="AA:BB:CC:DD:EE:FF"
                  value={newDongleMac}
                  onChange={(e) => setNewDongleMac(e.target.value)}
                  className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:border-[#00d4ff] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold block mb-1">Connection Type</label>
                <div className="flex gap-2">
                  {(['Bluetooth', 'WiFi', 'USB'] as DongleType[]).map((type) => {
                    const Icon = TYPE_ICONS[type]
                    return (
                      <button
                        key={type}
                        onClick={() => setNewDongleType(type)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border text-xs font-medium transition-all',
                          newDongleType === type
                            ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40 text-[#00d4ff]'
                            : 'bg-[#0f1923] border-[#1e2a3a] text-[#64748b] hover:border-[#2d3f55]'
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
              >
                <CheckCircle2 className="h-3 w-3" />
                Register Dongle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Dongles */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-4 w-4 text-[#10b981]" />
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Connected Dongles</h2>
          <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">{CONNECTED_DONGLES.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONNECTED_DONGLES.map((dongle) => {
            const TypeIcon = TYPE_ICONS[dongle.type]
            const BatteryIcon = getBatteryIcon(dongle.batteryLevel, dongle.isCharging)
            const batteryColor = getBatteryColor(dongle.batteryLevel)
            return (
              <Card key={dongle.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#2d3f55] transition-colors">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                        <TypeIcon className="h-4 w-4 text-[#00d4ff]" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#e2e8f0]">{dongle.name}</div>
                        <div className="text-[9px] font-mono text-[#475569]">{dongle.mac}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_4px_#10b981]" />
                      <span className="text-[10px] text-[#10b981] font-medium">Connected</span>
                    </div>
                  </div>

                  {/* Signal & Battery */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-[#475569]">Signal</span>
                        <Signal className="h-3 w-3" style={{ color: SIGNAL_COLORS[dongle.signal] }} />
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'w-1.5 rounded-sm',
                              i < dongle.signalBars ? '' : 'bg-[#1e2a3a]'
                            )}
                            style={{
                              height: `${8 + i * 3}px`,
                              backgroundColor: i < dongle.signalBars ? SIGNAL_COLORS[dongle.signal] : undefined,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium" style={{ color: SIGNAL_COLORS[dongle.signal] }}>
                        {dongle.signal}
                      </span>
                    </div>
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-[#475569]">Battery</span>
                        <BatteryIcon className="h-3 w-3" style={{ color: batteryColor }} />
                      </div>
                      <div className="h-1.5 w-full bg-[#1e2a3a] rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${dongle.batteryLevel}%`, backgroundColor: batteryColor, boxShadow: `0 0 4px ${batteryColor}40` }}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium" style={{ color: batteryColor }}>
                          {dongle.batteryLevel}%
                        </span>
                        {dongle.isCharging && (
                          <span className="text-[9px] text-[#10b981] flex items-center gap-0.5">
                            <BatteryCharging className="h-2.5 w-2.5" /> Charging
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Protocol Support */}
                  <div>
                    <span className="text-[9px] text-[#475569] uppercase tracking-wider font-semibold">Protocols</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dongle.protocolSupport.map((proto) => (
                        <Badge key={proto} className="bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20 text-[9px] px-1.5 py-0 h-4">
                          {proto}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Firmware */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1e2a3a]">
                    <div>
                      <span className="text-[9px] text-[#475569]">Firmware {dongle.firmware}</span>
                      {dongle.firmwareStatus === 'Update Available' && (
                        <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[9px] ml-1.5 px-1.5 py-0 h-4">
                          Update Available
                        </Badge>
                      )}
                      {dongle.firmwareStatus === 'Up-to-date' && (
                        <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px] ml-1.5 px-1.5 py-0 h-4">
                          Up-to-date
                        </Badge>
                      )}
                    </div>
                    {dongle.firmwareStatus === 'Update Available' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFirmwareUpdate(dongle.id)}
                        disabled={updatingId === dongle.id}
                        className="h-6 text-[9px] gap-1 border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10"
                      >
                        {updatingId === dongle.id ? (
                          <><RotateCcw className="h-2.5 w-2.5 animate-spin" />Updating...</>
                        ) : (
                          <><Download className="h-2.5 w-2.5" />Update</>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="text-[9px] text-[#475569]">Connected since {dongle.connectedSince}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Available Dongles */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Signal className="h-4 w-4 text-[#f59e0b]" />
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Available Dongles</h2>
          <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">{AVAILABLE_DONGLES.length} NEARBY</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {AVAILABLE_DONGLES.map((dongle) => {
            const TypeIcon = TYPE_ICONS[dongle.type]
            const isConnecting = connectingId === dongle.id
            return (
              <Card key={dongle.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#2d3f55] transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-md bg-[#1e2a3a] flex items-center justify-center">
                      <TypeIcon className="h-4 w-4 text-[#64748b]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#e2e8f0] truncate">{dongle.name}</div>
                      <div className="text-[9px] font-mono text-[#475569]">{dongle.mac}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn('w-1.5 rounded-sm', i < dongle.signalBars ? '' : 'bg-[#1e2a3a]')}
                          style={{
                            height: `${8 + i * 3}px`,
                            backgroundColor: i < dongle.signalBars ? SIGNAL_COLORS[dongle.signal] : undefined,
                          }}
                        />
                      ))}
                      <span className="text-[10px] ml-1" style={{ color: SIGNAL_COLORS[dongle.signal] }}>{dongle.signal}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleConnect(dongle.id)}
                      disabled={isConnecting}
                      className={cn(
                        'h-7 text-[10px] gap-1',
                        isConnecting
                          ? 'bg-[#10b981] text-white hover:bg-[#059669]'
                          : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                      )}
                    >
                      {isConnecting ? (
                        <><CheckCircle2 className="h-3 w-3" />Connecting...</>
                      ) : (
                        <><Link2 className="h-3 w-3" />Connect</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Protocol Compatibility Matrix */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#00d4ff]" />
            Protocol Compatibility Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  <th className="text-left text-[10px] text-[#475569] uppercase tracking-wider font-semibold py-2 pr-4">Dongle</th>
                  <th className="text-left text-[10px] text-[#475569] uppercase tracking-wider font-semibold py-2 pr-4">PID Support</th>
                  <th className="text-center text-[10px] text-[#475569] uppercase tracking-wider font-semibold py-2 pr-4">Basic OBD</th>
                  <th className="text-center text-[10px] text-[#475569] uppercase tracking-wider font-semibold py-2 pr-4">Enhanced</th>
                  <th className="text-center text-[10px] text-[#475569] uppercase tracking-wider font-semibold py-2 pr-4">OEM</th>
                  <th className="text-center text-[10px] text-[#475569] uppercase tracking-wider font-semibold py-2 pr-4">CAN</th>
                  <th className="text-center text-[10px] text-[#475569] uppercase tracking-wider font-semibold py-2">DoIP</th>
                </tr>
              </thead>
              <tbody>
                {COMPATIBILITY_MATRIX.map((row) => (
                  <tr key={row.name} className="border-b border-[#1e2a3a]/50 hover:bg-[#1e2a3a]/20 transition-colors">
                    <td className="py-2.5 pr-4 font-semibold text-[#e2e8f0]">{row.name}</td>
                    <td className="py-2.5 pr-4 font-mono text-[#94a3b8] text-[10px]">{row.pid}</td>
                    <td className="py-2.5 pr-4 text-center">
                      {row.basic ? (
                        <CheckCircle2 className="h-4 w-4 text-[#10b981] mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[#ef4444] mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      {row.enhanced ? (
                        <CheckCircle2 className="h-4 w-4 text-[#10b981] mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[#475569] mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      {row.manufacturer ? (
                        <CheckCircle2 className="h-4 w-4 text-[#8b5cf6] mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[#475569] mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      {row.can ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00d4ff] mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[#475569] mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {row.doip ? (
                        <CheckCircle2 className="h-4 w-4 text-[#f59e0b] mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[#475569] mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e2a3a]">
            <div className="flex items-center gap-1.5 text-[9px] text-[#64748b]">
              <CheckCircle2 className="h-3 w-3 text-[#10b981]" /> Supported
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-[#64748b]">
              <CheckCircle2 className="h-3 w-3 text-[#8b5cf6]" /> OEM Access
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-[#64748b]">
              <CheckCircle2 className="h-3 w-3 text-[#00d4ff]" /> CAN Protocol
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-[#64748b]">
              <XCircle className="h-3 w-3 text-[#475569]" /> Not Supported
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
