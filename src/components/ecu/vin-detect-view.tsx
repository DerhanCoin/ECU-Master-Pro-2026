'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Hash,
  Search,
  ClipboardPaste,
  Camera,
  Car,
  Cog,
  Calendar,
  Gauge,
  Shield,
  Zap,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DecodedVIN {
  wmi: string
  vds: string
  vis: string
  make: string
  model: string
  year: number
  engine: string
  trim: string
  transmission: string
  driveType: string
  bodyStyle: string
  manufacturer: string
  plant: string
  checkDigit: string
}

interface VINHistoryItem {
  id: string
  vin: string
  make: string
  model: string
  year: number
  date: string
}

interface RecallItem {
  id: string
  nhtsaId: string
  title: string
  date: string
  severity: 'safety' | 'emissions' | 'equipment'
  status: 'open' | 'completed' | 'not applicable'
}

interface TSBItem {
  id: string
  number: string
  title: string
  date: string
  summary: string
}

const sampleVIN = 'WVWZZZ1KZAM000001'
const sampleDecoded: DecodedVIN = {
  wmi: 'WVW',
  vds: 'ZZZ1KZA',
  vis: 'M000001',
  make: 'Volkswagen',
  model: 'Golf GTI',
  year: 2010,
  engine: '2.0L TSI (CCZB) - 200HP / 147kW',
  trim: 'GTI (Mk6)',
  transmission: '6-Speed DSG (DQ250)',
  driveType: 'Front-Wheel Drive (FWD)',
  bodyStyle: '3-Door Hatchback',
  manufacturer: 'Volkswagen AG',
  plant: 'Wolfsburg, Germany',
  checkDigit: 'A',
}

const vinHistory: VINHistoryItem[] = [
  { id: '1', vin: 'WVWZZZ1KZAM000001', make: 'Volkswagen', model: 'Golf GTI', year: 2010, date: '2 hours ago' },
  { id: '2', vin: 'WAUZZZ8K9JA000002', make: 'Audi', model: 'A4 B9', year: 2018, date: 'Yesterday' },
  { id: '3', vin: 'WBA3A5C50CF000003', make: 'BMW', model: '330i F30', year: 2012, date: '3 days ago' },
  { id: '4', vin: 'WDDGF4HB1EA000004', make: 'Mercedes', model: 'C200 W205', year: 2014, date: '1 week ago' },
  { id: '5', vin: 'TMBK33BV0G000005', make: 'Skoda', model: 'Octavia RS', year: 2016, date: '2 weeks ago' },
]

const recalls: RecallItem[] = [
  {
    id: 'r1',
    nhtsaId: '16V-902',
    title: 'Timing Chain Tensioner Failure',
    date: '2016-12-20',
    severity: 'safety',
    status: 'open',
  },
  {
    id: 'r2',
    nhtsaId: '18V-405',
    title: 'Fuel Pump Control Module Software Update',
    date: '2018-06-28',
    severity: 'safety',
    status: 'completed',
  },
  {
    id: 'r3',
    nhtsaId: '19E-032',
    title: 'Emissions Control Software Update (Dieselgate)',
    date: '2019-04-15',
    severity: 'emissions',
    status: 'completed',
  },
]

const tsbs: TSBItem[] = [
  {
    id: 't1',
    number: 'VW-21-045',
    title: 'Rough Idle and DTC P0300 — Ignition Coil Replacement',
    date: '2021-03-10',
    summary: 'Updated ignition coil part number available. Replace all four coils with revised PN 06K-905-115E.',
  },
  {
    id: 't2',
    number: 'VW-20-112',
    title: 'DSG Transmission Shudder — Mechatronic Unit Update',
    date: '2020-08-22',
    summary: 'Software update available for DQ250 mechatronic unit to address low-speed shudder. Flash to SW version 0AM-927-750-C.',
  },
  {
    id: 't3',
    number: 'VW-19-087',
    title: 'DTC P0420 Catalyst Efficiency — Oxygen Sensor Update',
    date: '2019-11-05',
    summary: 'Revised post-cat O2 sensor available. Replace with PN 06A-906-265-BR if DTC P0420 persists after catalytic converter verification.',
  },
]

function getRecallSeverityColor(severity: string): string {
  switch (severity) {
    case 'safety': return '#ef4444'
    case 'emissions': return '#f59e0b'
    case 'equipment': return '#8b5cf6'
    default: return '#64748b'
  }
}

function getRecallStatusColor(status: string): string {
  switch (status) {
    case 'open': return '#ef4444'
    case 'completed': return '#10b981'
    case 'not applicable': return '#64748b'
    default: return '#64748b'
  }
}

export function VINDetectView() {
  const [vinInput, setVinInput] = useState('')
  const [decoded, setDecoded] = useState<DecodedVIN | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('breakdown')
  const [pasteSuccess, setPasteSuccess] = useState(false)

  const handleVINChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17)
    setVinInput(cleaned)
  }

  const decodeVIN = useCallback(() => {
    if (vinInput.length !== 17) return
    setIsDecoding(true)
    setTimeout(() => {
      setDecoded(sampleDecoded)
      setIsDecoding(false)
    }, 1200)
  }, [vinInput])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      const cleaned = text.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17)
      setVinInput(cleaned)
      setPasteSuccess(true)
      setTimeout(() => setPasteSuccess(false), 2000)
    } catch {
      // Clipboard access denied
    }
  }, [])

  const isValid = vinInput.length === 17

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">VIN Detection & Decoder</h1>
          </div>
          <p className="text-xs text-[#64748b]">Decode and analyze Vehicle Identification Numbers</p>
        </div>
      </div>

      {/* VIN Input */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Search className="h-4 w-4 text-[#00d4ff]" />
            Enter VIN Number
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={vinInput}
                onChange={(e) => handleVINChange(e.target.value)}
                placeholder="Enter 17-character VIN (e.g., WVWZZZ1KZAM000001)"
                className="bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] font-mono tracking-wider placeholder:text-[#475569] text-sm h-10"
                maxLength={17}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#475569]">
                {vinInput.length}/17
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePaste}
              className="h-10 px-3 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              {pasteSuccess ? 'Pasted!' : 'Paste'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-10 px-3 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5"
            >
              <Camera className="h-3.5 w-3.5" />
              Scan
            </Button>
            <Button
              size="sm"
              onClick={decodeVIN}
              disabled={!isValid || isDecoding}
              className={cn(
                'h-10 text-xs font-semibold gap-1.5',
                isValid && !isDecoding
                  ? 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                  : 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
              )}
            >
              {isDecoding ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              {isDecoding ? 'Decoding...' : 'Decode'}
            </Button>
          </div>

          {/* Validation indicators */}
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-full', vinInput.length === 17 ? 'bg-[#10b981]' : 'bg-[#475569]')} />
              <span className={vinInput.length === 17 ? 'text-[#10b981]' : 'text-[#475569]'}>
                17 characters
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-full', vinInput.length > 0 && !/[IQO]/.test(vinInput) ? 'bg-[#10b981]' : vinInput.length > 0 ? 'bg-[#ef4444]' : 'bg-[#475569]')} />
              <span className={vinInput.length > 0 && !/[IQO]/.test(vinInput) ? 'text-[#10b981]' : vinInput.length > 0 ? 'text-[#ef4444]' : 'text-[#475569]'}>
                No I/Q/O characters
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-full', vinInput.length > 2 ? 'bg-[#10b981]' : 'bg-[#475569]')} />
              <span className={vinInput.length > 2 ? 'text-[#10b981]' : 'text-[#475569]'}>
                WMI valid
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decoded VIN Results */}
      {decoded && (
        <>
          {/* VIN Breakdown */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <button
                onClick={() => setExpandedSection(expandedSection === 'breakdown' ? null : 'breakdown')}
                className="w-full flex items-center justify-between"
              >
                <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#00d4ff]" />
                  VIN Breakdown
                </CardTitle>
                {expandedSection === 'breakdown' ? (
                  <ChevronDown className="h-4 w-4 text-[#64748b]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#64748b]" />
                )}
              </button>
            </CardHeader>
            {expandedSection === 'breakdown' && (
              <CardContent className="space-y-4">
                {/* WMI */}
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">WMI</Badge>
                    <span className="text-[10px] text-[#64748b]">World Manufacturer Identifier (Positions 1-3)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-mono text-[#00d4ff]">{decoded.wmi}</span>
                    <div>
                      <div className="text-xs text-[#e2e8f0] font-semibold">{decoded.manufacturer}</div>
                      <div className="text-[10px] text-[#64748b]">{decoded.make}</div>
                    </div>
                  </div>
                </div>
                {/* VDS */}
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[10px]">VDS</Badge>
                    <span className="text-[10px] text-[#64748b]">Vehicle Descriptor Section (Positions 4-9)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-mono text-[#8b5cf6]">{decoded.vds}</span>
                    <div>
                      <div className="text-xs text-[#e2e8f0] font-semibold">{decoded.model} — {decoded.trim}</div>
                      <div className="text-[10px] text-[#64748b]">Check digit: {decoded.checkDigit}</div>
                    </div>
                  </div>
                </div>
                {/* VIS */}
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">VIS</Badge>
                    <span className="text-[10px] text-[#64748b]">Vehicle Identifier Section (Positions 10-17)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-mono text-[#f59e0b]">{decoded.vis}</span>
                    <div>
                      <div className="text-xs text-[#e2e8f0] font-semibold">Model Year: {decoded.year}</div>
                      <div className="text-[10px] text-[#64748b]">Assembly Plant: {decoded.plant}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Vehicle Details */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Car className="h-4 w-4 text-[#00d4ff]" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Car, label: 'Make', value: decoded.make, color: '#00d4ff' },
                  { icon: Car, label: 'Model', value: decoded.model, color: '#00d4ff' },
                  { icon: Calendar, label: 'Year', value: String(decoded.year), color: '#f59e0b' },
                  { icon: Gauge, label: 'Engine', value: decoded.engine, color: '#8b5cf6' },
                  { icon: Zap, label: 'Trim', value: decoded.trim, color: '#00d4ff' },
                  { icon: Cog, label: 'Transmission', value: decoded.transmission, color: '#10b981' },
                  { icon: Shield, label: 'Drive Type', value: decoded.driveType, color: '#f59e0b' },
                  { icon: Car, label: 'Body Style', value: decoded.bodyStyle, color: '#8b5cf6' },
                ].map((item) => (
                  <div key={item.label} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <item.icon className="h-3 w-3" style={{ color: item.color }} />
                      <span className="text-[10px] text-[#64748b] font-medium">{item.label}</span>
                    </div>
                    <div className="text-xs text-[#e2e8f0] font-semibold leading-tight">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* OEM Data & Recalls/TSBs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* OEM-Specific Data */}
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#00d4ff]" />
                  OEM-Specific Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Engine Code', value: 'CCZB' },
                  { label: 'ECU Type', value: 'Bosch MED17.5' },
                  { label: 'ECU Software', value: '0AM-927-750-B' },
                  { label: 'Part Number', value: '06K-906-016-R' },
                  { label: 'Service Code', value: 'VW-1K0-000' },
                  { label: 'PR Code', value: 'A16/GJN/9Q1' },
                  { label: 'Paint Code', value: 'B4/Bright White' },
                  { label: 'Interior Code', value: 'QL/Titan Black' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#1e2a3a]/50">
                    <span className="text-xs text-[#64748b]">{item.label}</span>
                    <span className="text-xs text-[#e2e8f0] font-mono font-medium">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recalls & TSBs */}
            <div className="space-y-4">
              {/* Recalls */}
              <Card className="bg-[#151d2b] border-[#1e2a3a]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                    Recalls
                    <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">
                      {recalls.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recalls.map((recall) => (
                    <div key={recall.id} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-[#64748b]">{recall.nhtsaId}</span>
                        <Badge
                          className="text-[9px] border-0 px-1.5 py-0 h-4"
                          style={{
                            color: getRecallStatusColor(recall.status),
                            backgroundColor: `${getRecallStatusColor(recall.status)}20`,
                          }}
                        >
                          {recall.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-[#e2e8f0] font-medium">{recall.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className="text-[9px] border-0 px-1.5 py-0 h-4"
                          style={{
                            color: getRecallSeverityColor(recall.severity),
                            backgroundColor: `${getRecallSeverityColor(recall.severity)}20`,
                          }}
                        >
                          {recall.severity.toUpperCase()}
                        </Badge>
                        <span className="text-[9px] text-[#475569]">{recall.date}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* TSBs */}
              <Card className="bg-[#151d2b] border-[#1e2a3a]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#f59e0b]" />
                    Technical Service Bulletins
                    <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">
                      {tsbs.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tsbs.map((tsb) => (
                    <div key={tsb.id} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-[#00d4ff]">{tsb.number}</span>
                        <span className="text-[9px] text-[#475569]">{tsb.date}</span>
                      </div>
                      <div className="text-xs text-[#e2e8f0] font-medium mb-1">{tsb.title}</div>
                      <p className="text-[10px] text-[#64748b] leading-relaxed">{tsb.summary}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* VIN Scan History */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[#64748b]" />
            VIN Scan History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {vinHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setVinInput(item.vin)
                  setDecoded(null)
                }}
                className="w-full flex items-center gap-3 p-3 bg-[#0f1923] border border-[#1e2a3a] rounded-lg hover:border-[#00d4ff]/30 hover:bg-[#1a2435] transition-colors text-left"
              >
                <div className="flex-shrink-0 p-1.5 rounded-md bg-[#00d4ff]/10">
                  <Car className="h-4 w-4 text-[#00d4ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#e2e8f0]">
                    {item.make} {item.model} ({item.year})
                  </div>
                  <div className="text-[10px] font-mono text-[#475569] truncate">{item.vin}</div>
                </div>
                <div className="flex-shrink-0 text-[10px] text-[#475569]">{item.date}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
