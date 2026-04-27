'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Wifi, Bluetooth, Usb, Ethernet, Cable, Search, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Download, Cpu, Microchip, Shield,
  Zap, Activity, Car, Truck, Wrench, Ship, Bike, Factory, Globe2,
  X, ExternalLink, FileDown, MonitorSmartphone, Lock, Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DONGLE_DATABASE, DONGLE_CATEGORIES, DONGLE_BRANDS,
  getDonglesByCategory, searchDongles, getDongleStats,
  type DongleModel, type DongleCategory, type DongleCategoryInfo,
} from '@/lib/dongle-database'
import { webOBD, type ConnectionStatus, type LiveSensorData, type DTCCode } from '@/lib/web-obd-manager'

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'universal-oem': Wrench,
  'luxury-sport': Car,
  'truck-bus': Truck,
  'ev-specific': Zap,
  'chiptuning': Microchip,
  'chinese-oem': Globe2,
  'industry': Factory,
  'motorcycle-nautical': Bike,
}

const CONNECTION_ICONS: Record<string, React.ElementType> = {
  USB: Usb, WiFi: Wifi, Bluetooth: Bluetooth, Ethernet: Ethernet, LAN: Cable,
}

const STATUS_STYLES = {
  supported: { bg: 'bg-[#10b981]/20', text: 'text-[#10b981]', border: 'border-[#10b981]/30', label: 'Supported' },
  beta: { bg: 'bg-[#f59e0b]/20', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30', label: 'Beta' },
  deprecated: { bg: 'bg-[#64748b]/20', text: 'text-[#64748b]', border: 'border-[#64748b]/30', label: 'Legacy' },
}

export function DonglesView() {
  const [activeCategory, setActiveCategory] = useState<DongleCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDongle, setSelectedDongle] = useState<DongleModel | null>(null)
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(webOBD.status)
  const [sensorData, setSensorData] = useState<LiveSensorData | null>(null)
  const [dtcCodes, setDtcCodes] = useState<DTCCode[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const stats = useMemo(() => getDongleStats(), [])

  const filteredDongles = useMemo(() => {
    let results = searchQuery ? searchDongles(searchQuery) : DONGLE_DATABASE
    if (activeCategory !== 'all') {
      results = results.filter(d => d.category === activeCategory)
    }
    return results
  }, [searchQuery, activeCategory])

  const brandsInCategory = useMemo(() => {
    if (activeCategory === 'all') return DONGLE_BRANDS
    return DONGLE_BRANDS.filter(b => b.category === activeCategory)
  }, [activeCategory])

  const donglesByBrand = useMemo(() => {
    const map = new Map<string, DongleModel[]>()
    filteredDongles.forEach(d => {
      const key = `${d.brand}|${d.subcategory}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    })
    return map
  }, [filteredDongles])

  // Connection handlers
  const handleConnectSerial = useCallback(async () => {
    setIsConnecting(true)
    await webOBD.connectSerial(115200)
    const unsub1 = webOBD.onStatusChange(setConnectionStatus)
    const unsub2 = webOBD.onData(setSensorData)
    const unsub3 = webOBD.onDTC(setDtcCodes)
    setIsConnecting(false)
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  const handleConnectBT = useCallback(async () => {
    setIsConnecting(true)
    await webOBD.connectBluetooth()
    const unsub1 = webOBD.onStatusChange(setConnectionStatus)
    const unsub2 = webOBD.onData(setSensorData)
    const unsub3 = webOBD.onDTC(setDtcCodes)
    setIsConnecting(false)
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  const handleDisconnect = useCallback(async () => {
    await webOBD.disconnect()
    setSensorData(null)
    setDtcCodes([])
  }, [])

  const handleReadDTCs = useCallback(async () => {
    await webOBD.readDTCs()
  }, [])

  const handleClearDTCs = useCallback(async () => {
    await webOBD.clearDTCs()
    setDtcCodes([])
  }, [])

  const handleReadVIN = useCallback(async () => {
    const vin = await webOBD.readVIN()
    if (vin) {
      setSelectedDongle(prev => prev) // trigger re-render
    }
  }, [])

  const openDetail = (dongle: DongleModel) => {
    setSelectedDongle(dongle)
    setShowDetailModal(true)
  }

  const engineStateLabel = connectionStatus.engineState === 'running' ? 'Engine Running' :
    connectionStatus.engineState === 'accessory' ? 'Ignition ON' : 'Engine OFF'
  const engineStateColor = connectionStatus.engineState === 'running' ? '#10b981' :
    connectionStatus.engineState === 'accessory' ? '#f59e0b' : '#64748b'

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MonitorSmartphone className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Dongle Database</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
              {stats.total} DEVICES
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Universal & OEM diagnostic adapters with drivers, firmware & protocols
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px]">
            {stats.supported} SUPPORTED
          </Badge>
          <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px]">
            {stats.j2534} J2534
          </Badge>
          <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[9px]">
            {stats.doip} DoIP
          </Badge>
          <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[9px]">
            {stats.canfd} CAN FD
          </Badge>
        </div>
      </div>

      {/* Connection Status Bar */}
      <Card className={cn(
        'border transition-colors',
        connectionStatus.state === 'connected'
          ? 'bg-[#10b981]/5 border-[#10b981]/30'
          : connectionStatus.state === 'connecting'
          ? 'bg-[#f59e0b]/5 border-[#f59e0b]/30'
          : 'bg-[#151d2b] border-[#1e2a3a]'
      )}>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={cn(
                'h-2.5 w-2.5 rounded-full flex-shrink-0',
                connectionStatus.state === 'connected' ? 'bg-[#10b981] shadow-[0_0_6px_#10b981]' :
                connectionStatus.state === 'connecting' ? 'bg-[#f59e0b] animate-pulse' :
                connectionStatus.state === 'error' ? 'bg-[#ef4444]' : 'bg-[#64748b]'
              )} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#e2e8f0] truncate">
                  {connectionStatus.state === 'connected'
                    ? `${connectionStatus.dongleName} Connected`
                    : connectionStatus.state === 'connecting'
                    ? 'Connecting...'
                    : connectionStatus.state === 'error'
                    ? connectionStatus.lastError
                    : 'No Dongle Connected'}
                </div>
                {connectionStatus.state === 'connected' && (
                  <div className="flex items-center gap-2 text-[9px] text-[#64748b]">
                    <span className="flex items-center gap-1">
                      {connectionStatus.type && (() => {
                        const Icon = CONNECTION_ICONS[connectionStatus.type.charAt(0).toUpperCase() + connectionStatus.type.slice(1)] || Usb
                        return <Icon className="h-2.5 w-2.5" />
                      })()}
                      {connectionStatus.type?.toUpperCase()}
                    </span>
                    <span>|</span>
                    <span>{connectionStatus.protocol}</span>
                    <span>|</span>
                    <span style={{ color: engineStateColor }}>{engineStateLabel}</span>
                    {sensorData && (
                      <>
                        <span>|</span>
                        <span className="text-[#00d4ff]">{sensorData.rpm} RPM</span>
                        <span>|</span>
                        <span className="text-[#10b981]">{sensorData.batteryVoltage.toFixed(1)}V</span>
                        <span>|</span>
                        <span className="text-[#f59e0b]">{sensorData.speed} km/h</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {connectionStatus.state === 'connected' && (
                <>
                  <Button size="sm" variant="outline" onClick={handleReadDTCs}
                    className="h-7 text-[9px] gap-1 border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10">
                    <AlertTriangle className="h-2.5 w-2.5" /> Read DTCs
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleClearDTCs}
                    className="h-7 text-[9px] gap-1 border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Clear
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReadVIN}
                    className="h-7 text-[9px] gap-1 border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/10">
                    <Car className="h-2.5 w-2.5" /> VIN
                  </Button>
                  <Button size="sm" onClick={handleDisconnect}
                    className="h-7 text-[9px] gap-1 bg-[#ef4444] text-white hover:bg-[#dc2626]">
                    <X className="h-2.5 w-2.5" /> Disconnect
                  </Button>
                </>
              )}
              {connectionStatus.state === 'disconnected' && (
                <>
                  <Button size="sm" onClick={handleConnectSerial} disabled={isConnecting}
                    className="h-7 text-[9px] gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
                    <Usb className="h-2.5 w-2.5" /> USB Serial
                  </Button>
                  <Button size="sm" onClick={handleConnectBT} disabled={isConnecting}
                    className="h-7 text-[9px] gap-1 bg-[#8b5cf6] text-white hover:bg-[#7c3aed]">
                    <Bluetooth className="h-2.5 w-2.5" /> Bluetooth
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* DTC Results */}
          {dtcCodes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#1e2a3a]">
              <div className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">
                Active DTCs ({dtcCodes.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {dtcCodes.map(dtc => (
                  <Badge key={dtc.code} className={cn(
                    'text-[9px] px-1.5 py-0 h-5',
                    dtc.severity === 'critical' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' :
                    dtc.severity === 'warning' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' :
                    'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
                  )}>
                    {dtc.code} {dtc.description}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
        <Input
          placeholder="Search dongles, brands, protocols, drivers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 pl-9 text-xs bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:border-[#00d4ff]"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-3 w-3 text-[#64748b] hover:text-[#e2e8f0]" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all border',
            activeCategory === 'all'
              ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]'
              : 'bg-[#151d2b] border-[#1e2a3a] text-[#64748b] hover:text-[#e2e8f0] hover:border-[#2d3f55]'
          )}
        >
          All ({stats.total})
        </button>
        {DONGLE_CATEGORIES.map(cat => {
          const count = getDonglesByCategory(cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all border whitespace-nowrap',
                activeCategory === cat.id
                  ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]'
                  : 'bg-[#151d2b] border-[#1e2a3a] text-[#64748b] hover:text-[#e2e8f0] hover:border-[#2d3f55]'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.name.split(' ')[0]}</span>
              <span className="text-[8px] opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Results count */}
      <div className="text-[10px] text-[#64748b]">
        Showing {filteredDongles.length} dongles
        {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
      </div>

      {/* Dongle Grid by Brand */}
      <div className="space-y-2">
        {brandsInCategory
          .filter(b => {
            const key = `${b.name}|${b.subcategory}`
            const dongles = donglesByBrand.get(key)
            return dongles && dongles.length > 0
          })
          .map(brand => {
            const key = `${brand.name}|${brand.subcategory}`
            const dongles = donglesByBrand.get(key) || []
            const isExpanded = expandedBrand === key

            return (
              <Card key={key} className="bg-[#151d2b] border-[#1e2a3a] overflow-hidden">
                <button
                  onClick={() => setExpandedBrand(isExpanded ? null : key)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#1e2a3a]/30 transition-colors"
                >
                  <span className="text-lg">{brand.icon}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-semibold text-[#e2e8f0]">{brand.name}</div>
                    <div className="text-[9px] text-[#64748b] truncate">{brand.description}</div>
                  </div>
                  <Badge className="bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55] text-[9px]">
                    {dongles.length} models
                  </Badge>
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#64748b]" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-[#1e2a3a] p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {dongles.map(dongle => {
                        const st = STATUS_STYLES[dongle.status]
                        const latestFW = dongle.firmwareVersions.find(f => f.status === 'latest') || dongle.firmwareVersions[0]

                        return (
                          <button
                            key={dongle.id}
                            onClick={() => openDetail(dongle)}
                            className="text-left p-3 rounded-lg border border-[#1e2a3a] bg-[#0f1923] hover:border-[#00d4ff]/30 hover:bg-[#0f1923]/80 transition-all group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-semibold text-[#e2e8f0] truncate group-hover:text-[#00d4ff] transition-colors">
                                  {dongle.name}
                                </div>
                                <div className="text-[9px] text-[#475569]">{dongle.releaseYear}</div>
                              </div>
                              <Badge className={cn('text-[8px] px-1.5 py-0 h-4', st.bg, st.text, `border ${st.border}`)}>
                                {st.label}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {dongle.connectionTypes.map(ct => {
                                const Icon = CONNECTION_ICONS[ct] || Cable
                                return (
                                  <span key={ct} className="flex items-center gap-0.5 text-[8px] text-[#64748b]">
                                    <Icon className="h-2.5 w-2.5" />{ct}
                                  </span>
                                )
                              })}
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {dongle.protocols.slice(0, 4).map(p => (
                                <Badge key={p} className="bg-[#00d4ff]/5 text-[#00d4ff]/80 border-[#00d4ff]/10 text-[7px] px-1 py-0 h-3.5">
                                  {p}
                                </Badge>
                              ))}
                              {dongle.protocols.length > 4 && (
                                <Badge className="bg-[#1e2a3a] text-[#64748b] border-[#2d3f55] text-[7px] px-1 py-0 h-3.5">
                                  +{dongle.protocols.length - 4}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[8px] text-[#475569]">
                              <span className="flex items-center gap-0.5">
                                {dongle.j2534Compliant ? <CheckCircle2 className="h-2.5 w-2.5 text-[#10b981]" /> : <XCircle className="h-2.5 w-2.5 text-[#475569]/50" />}
                                J2534
                              </span>
                              <span className="flex items-center gap-0.5">
                                {dongle.doipSupport ? <CheckCircle2 className="h-2.5 w-2.5 text-[#f59e0b]" /> : <XCircle className="h-2.5 w-2.5 text-[#475569]/50" />}
                                DoIP
                              </span>
                              <span className="flex items-center gap-0.5">
                                {dongle.canFdSupport ? <CheckCircle2 className="h-2.5 w-2.5 text-[#8b5cf6]" /> : <XCircle className="h-2.5 w-2.5 text-[#475569]/50" />}
                                CAN FD
                              </span>
                              {latestFW && <span className="ml-auto">FW {latestFW.version}</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDongle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0f1923] border border-[#1e2a3a] rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0f1923] border-b border-[#1e2a3a] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                  <MonitorSmartphone className="h-5 w-5 text-[#00d4ff]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#e2e8f0]">{selectedDongle.name}</h2>
                  <div className="text-[10px] text-[#64748b]">{selectedDongle.brand} • {selectedDongle.subcategory}</div>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 rounded-md hover:bg-[#1e2a3a] transition-colors">
                <X className="h-4 w-4 text-[#64748b]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Status & Description */}
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[10px]', STATUS_STYLES[selectedDongle.status].bg, STATUS_STYLES[selectedDongle.status].text, `border ${STATUS_STYLES[selectedDongle.status].border}`)}>
                  {STATUS_STYLES[selectedDongle.status].label}
                </Badge>
                <Badge className="bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55] text-[10px]">
                  {selectedDongle.releaseYear}
                </Badge>
              </div>
              <p className="text-xs text-[#94a3b8]">{selectedDongle.description}</p>

              {/* Connection Types */}
              <div>
                <h3 className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Connection Types</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDongle.connectionTypes.map(ct => {
                    const Icon = CONNECTION_ICONS[ct] || Cable
                    return (
                      <div key={ct} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#151d2b] border border-[#1e2a3a]">
                        <Icon className="h-3.5 w-3.5 text-[#00d4ff]" />
                        <span className="text-xs text-[#e2e8f0]">{ct}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Protocols */}
              <div>
                <h3 className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Communication Protocols</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDongle.protocols.map(p => (
                    <Badge key={p} className="bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20 text-[10px] px-2 py-0.5">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <h3 className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Capabilities</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className={cn('p-2.5 rounded-md border text-center', selectedDongle.j2534Compliant ? 'bg-[#10b981]/5 border-[#10b981]/20' : 'bg-[#151d2b] border-[#1e2a3a]')}>
                    <div className={cn('text-lg font-bold', selectedDongle.j2534Compliant ? 'text-[#10b981]' : 'text-[#475569]')}>
                      {selectedDongle.j2534Compliant ? '✓' : '✗'}
                    </div>
                    <div className="text-[9px] text-[#64748b]">J2534 Passthru</div>
                  </div>
                  <div className={cn('p-2.5 rounded-md border text-center', selectedDongle.doipSupport ? 'bg-[#f59e0b]/5 border-[#f59e0b]/20' : 'bg-[#151d2b] border-[#1e2a3a]')}>
                    <div className={cn('text-lg font-bold', selectedDongle.doipSupport ? 'text-[#f59e0b]' : 'text-[#475569]')}>
                      {selectedDongle.doipSupport ? '✓' : '✗'}
                    </div>
                    <div className="text-[9px] text-[#64748b]">DoIP Protocol</div>
                  </div>
                  <div className={cn('p-2.5 rounded-md border text-center', selectedDongle.canFdSupport ? 'bg-[#8b5cf6]/5 border-[#8b5cf6]/20' : 'bg-[#151d2b] border-[#1e2a3a]')}>
                    <div className={cn('text-lg font-bold', selectedDongle.canFdSupport ? 'text-[#8b5cf6]' : 'text-[#475569]')}>
                      {selectedDongle.canFdSupport ? '✓' : '✗'}
                    </div>
                    <div className="text-[9px] text-[#64748b]">CAN FD</div>
                  </div>
                </div>
              </div>

              {/* Driver Info */}
              <div>
                <h3 className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Driver Information</h3>
                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#64748b]">Driver Name</span>
                    <span className="text-[11px] text-[#e2e8f0] font-medium">{selectedDongle.driverName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#64748b]">Driver Version</span>
                    <span className="text-[11px] text-[#e2e8f0] font-mono">{selectedDongle.driverVersion}</span>
                  </div>
                </div>
              </div>

              {/* Firmware Versions */}
              <div>
                <h3 className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Firmware Versions</h3>
                <div className="space-y-1.5">
                  {selectedDongle.firmwareVersions.map(fw => (
                    <div key={fw.version} className="flex items-center justify-between bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <Download className="h-3.5 w-3.5 text-[#64748b]" />
                        <span className="text-[11px] text-[#e2e8f0] font-mono">{fw.version}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#475569]">{fw.date}</span>
                        <Badge className={cn('text-[8px] px-1.5 py-0 h-4',
                          fw.status === 'latest' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' :
                          fw.status === 'stable' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' :
                          fw.status === 'beta' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' :
                          'bg-[#64748b]/20 text-[#64748b] border-[#64748b]/30'
                        )}>
                          {fw.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Vehicle Brands */}
              <div>
                <h3 className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Supported Vehicle Brands</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDongle.supportedBrands.map(b => (
                    <Badge key={b} className="bg-[#151d2b] text-[#94a3b8] border-[#2d3f55] text-[9px] px-2 py-0.5">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
