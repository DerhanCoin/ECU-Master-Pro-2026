'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  FileText,
  Bookmark,
  BookmarkCheck,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  Car,
  AlertTriangle,
  Wrench,
  Package,
  Link2,
  BarChart3,
  X,
  Calendar,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

type Severity = 'Critical' | 'Important' | 'Moderate' | 'Low'
type SystemType = 'Engine' | 'Transmission' | 'Electrical' | 'Body' | 'Safety'

interface TSB {
  id: string
  number: string
  title: string
  date: string
  manufacturer: string
  modelYear: string
  system: SystemType
  severity: Severity
  affectedModels: string[]
  description: string
  repairProcedure: string
  partsRequired: string[]
  laborHours: number
  linkedTSBs: string[]
  bookmarked: boolean
}

// ── Mock Data ───────────────────────────────────────────────────────────────

const mockTSBs: TSB[] = [
  {
    id: '1',
    number: 'TSB-2026-VW-001',
    title: 'Engine Misfire Under Load — EA888 Gen 4',
    date: '2026-01-15',
    manufacturer: 'Volkswagen',
    modelYear: '2024-2026',
    system: 'Engine',
    severity: 'Critical',
    affectedModels: ['Golf GTI MK8', 'Tiguan 3', 'Passat B9'],
    description:
      'Customers may experience engine misfire codes (P0300-P0304) under heavy acceleration. Root cause identified as faulty fuel injector seals on EA888 Gen 4 engines produced between March 2024 and November 2025.',
    repairProcedure:
      '1. Verify DTC codes P0300 through P0304.\n2. Perform fuel pressure test at rail.\n3. Replace all four fuel injector seals (P/N: 04E-906-049-A).\n4. Clear adaptations and relearn idle.\n5. Road test for 15 minutes under varying load.',
    partsRequired: ['Fuel injector seal kit (04E-906-049-A)', 'Intake manifold gasket (06K-129-717-D)'],
    laborHours: 3.2,
    linkedTSBs: ['TSB-2025-VW-018', 'TSB-2025-VW-031'],
    bookmarked: false,
  },
  {
    id: '2',
    number: 'TSB-2026-AUD-007',
    title: 'Transmission Harsh Shift 2→3 — DL382 DSG',
    date: '2026-02-03',
    manufacturer: 'Audi',
    modelYear: '2023-2026',
    system: 'Transmission',
    severity: 'Important',
    affectedModels: ['A4 B10', 'A5 F5', 'Q5 FY'],
    description:
      'Harsh or jerky shifting from 2nd to 3rd gear on DL382 7-speed DSG transmissions. TCU software calibration issue identified in mechatronics unit.',
    repairProcedure:
      '1. Read TCU software version.\n2. If version < 9S1035000, perform software update.\n3. Reset transmission adaptations.\n4. Perform adaptation drive cycle.\n5. Verify smooth 2→3 shift.',
    partsRequired: ['TCU software update (9S1035000)'],
    laborHours: 1.5,
    linkedTSBs: ['TSB-2025-AUD-012'],
    bookmarked: true,
  },
  {
    id: '3',
    number: 'TSB-2026-BMW-014',
    title: 'Electrical Drain — B48 Fuse Box Water Ingress',
    date: '2026-01-28',
    manufacturer: 'BMW',
    modelYear: '2022-2025',
    system: 'Electrical',
    severity: 'Important',
    affectedModels: ['330i G20', 'X3 G01', '530i G30'],
    description:
      'Battery drain overnight caused by water ingress into main fuse box through cowl panel seal. Corrosion on terminal connections creates parasitic draw exceeding 500mA.',
    repairProcedure:
      '1. Measure parasitic draw at battery.\n2. Inspect fuse box for corrosion/water marks.\n3. Replace cowl panel seal (P/N: 51-17-9-139-842).\n4. Clean all corroded terminals.\n5. Apply dielectric grease to connections.',
    partsRequired: ['Cowl panel seal (51-17-9-139-842)', 'Dielectric grease (83-23-0-397-814)'],
    laborHours: 2.8,
    linkedTSBs: ['TSB-2024-BMW-045'],
    bookmarked: false,
  },
  {
    id: '4',
    number: 'TSB-2026-MB-003',
    title: 'ADAS False Warnings — Distronic Radar Alignment',
    date: '2026-02-10',
    manufacturer: 'Mercedes-Benz',
    modelYear: '2024-2026',
    system: 'Safety',
    severity: 'Moderate',
    affectedModels: ['C300 W206', 'E300 W214', 'GLC X254'],
    description:
      'Intermittent false collision warnings from Distronic Plus system. Radar sensor alignment drift identified after front-end service or bumper removal.',
    repairProcedure:
      '1. Calibrate radar sensor using XENTRY calibration rig.\n2. Verify sensor mounting bracket alignment.\n3. Perform test drive on calibrated route.\n4. Clear all ADAS fault codes.',
    partsRequired: ['Radar sensor bracket (A205-900-06-07)'],
    laborHours: 2.0,
    linkedTSBs: ['TSB-2025-MB-022', 'TSB-2025-MB-038'],
    bookmarked: false,
  },
  {
    id: '5',
    number: 'TSB-2026-VW-022',
    title: 'Door Lock Actuator Failure — MQB Platform',
    date: '2026-01-05',
    manufacturer: 'Volkswagen',
    modelYear: '2023-2026',
    system: 'Body',
    severity: 'Low',
    affectedModels: ['Golf MK8', 'T-Roc', 'Tiguan 3', 'Passat B9'],
    description:
      'Front door lock actuators may fail to lock/unlock via remote. Internal microswitch contact degradation identified in units produced by supplier Brose.',
    repairProcedure:
      '1. Verify lock actuator function via VCDS output test.\n2. Replace front door lock actuator.\n3. Recode door control module if needed.\n4. Verify remote lock/unlock operation.',
    partsRequired: ['Front door lock actuator (5QD-837-016-C)'],
    laborHours: 1.8,
    linkedTSBs: [],
    bookmarked: true,
  },
  {
    id: '6',
    number: 'TSB-2026-POR-005',
    title: 'Coolant Leak — 9A2 Engine Thermostat Housing',
    date: '2026-02-18',
    manufacturer: 'Porsche',
    modelYear: '2022-2026',
    system: 'Engine',
    severity: 'Critical',
    affectedModels: ['911 992', '718 Cayman', 'Macan 95B'],
    description:
      'Coolant loss from thermostat housing crack on 9A2 turbo engines. Hairline crack develops at housing casting seam under thermal cycling. Risk of engine overheating.',
    repairProcedure:
      '1. Pressure test cooling system.\n2. Inspect thermostat housing for external coolant residue.\n3. Replace thermostat housing with revised part.\n4. Refill with prescribed coolant mix.\n5. Bleed cooling system per WIS procedure.',
    partsRequired: ['Thermostat housing revised (9A2-104-521-B)', 'Coolant G12++ (G012-A8F-A1)'],
    laborHours: 4.5,
    linkedTSBs: ['TSB-2025-POR-011'],
    bookmarked: false,
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

const severityColors: Record<Severity, string> = {
  Critical: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30',
  Important: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
  Moderate: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30',
  Low: 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30',
}

const systemColors: Record<SystemType, string> = {
  Engine: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30',
  Transmission: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
  Electrical: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30',
  Body: 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30',
  Safety: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
}

const manufacturers = ['All', 'Volkswagen', 'Audi', 'BMW', 'Mercedes-Benz', 'Porsche']
const systems: Array<'All' | SystemType> = ['All', 'Engine', 'Transmission', 'Electrical', 'Body', 'Safety']
const severities: Array<'All' | Severity> = ['All', 'Critical', 'Important', 'Moderate', 'Low']

// ── Main Component ──────────────────────────────────────────────────────────

export function TSBView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mfrFilter, setMfrFilter] = useState('All')
  const [systemFilter, setSystemFilter] = useState<'All' | SystemType>('All')
  const [severityFilter, setSeverityFilter] = useState<'All' | Severity>('All')
  const [tsbs, setTsbs] = useState<TSB[]>(mockTSBs)
  const [selectedTSB, setSelectedTSB] = useState<TSB | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const toggleBookmark = (id: string) => {
    setTsbs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, bookmarked: !t.bookmarked } : t))
    )
  }

  const filteredTSBs = tsbs.filter((t) => {
    const matchesSearch =
      t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMfr = mfrFilter === 'All' || t.manufacturer === mfrFilter
    const matchesSystem = systemFilter === 'All' || t.system === systemFilter
    const matchesSeverity = severityFilter === 'All' || t.severity === severityFilter
    return matchesSearch && matchesMfr && matchesSystem && matchesSeverity
  })

  const bookmarkedTSBs = tsbs.filter((t) => t.bookmarked)
  const recentTSBs = [...tsbs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const mfrBreakdown = manufacturers.slice(1).map((m) => ({
    name: m,
    count: tsbs.filter((t) => t.manufacturer === m).length,
  }))

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Technical Service Bulletins</h1>
          </div>
          <p className="text-xs text-[#64748b]">
            Search and view manufacturer TSBs for diagnostic guidance
          </p>
        </div>
        <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-xs font-semibold self-start">
          {tsbs.length} Bulletins
        </Badge>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Total Bulletins</div>
            <div className="text-2xl font-bold text-[#e2e8f0]">{tsbs.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Critical</div>
            <div className="text-2xl font-bold text-[#ef4444]">
              {tsbs.filter((t) => t.severity === 'Critical').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Bookmarked</div>
            <div className="text-2xl font-bold text-[#f59e0b]">{bookmarkedTSBs.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Manufacturers</div>
            <div className="text-2xl font-bold text-[#8b5cf6]">
              {new Set(tsbs.map((t) => t.manufacturer)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
            <Input
              placeholder="Search by TSB number, keyword, or component..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#00d4ff]/50"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-9 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#00d4ff] gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {showFilters && (
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardContent className="p-4 space-y-3">
              <div>
                <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-2">Manufacturer</div>
                <div className="flex flex-wrap gap-1.5">
                  {manufacturers.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMfrFilter(m)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                        mfrFilter === m
                          ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                          : 'bg-[#0f1923] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-2">System</div>
                <div className="flex flex-wrap gap-1.5">
                  {systems.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSystemFilter(s)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                        systemFilter === s
                          ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                          : 'bg-[#0f1923] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-2">Severity</div>
                <div className="flex flex-wrap gap-1.5">
                  {severities.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeverityFilter(s)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                        severityFilter === s
                          ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                          : 'bg-[#0f1923] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TSB List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#e2e8f0]">
              {filteredTSBs.length} Result{filteredTSBs.length !== 1 ? 's' : ''}
            </div>
          </div>

          {filteredTSBs.map((tsb) => (
            <Card
              key={tsb.id}
              className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/30 transition-all cursor-pointer"
              onClick={() => setSelectedTSB(tsb)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-[#00d4ff]">{tsb.number}</span>
                      <Badge className={`${severityColors[tsb.severity]} text-[9px] border`}>
                        {tsb.severity}
                      </Badge>
                      <Badge className={`${systemColors[tsb.system]} text-[9px] border`}>
                        {tsb.system}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1 truncate">{tsb.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-[#64748b]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {tsb.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {tsb.manufacturer}
                      </span>
                      <span>{tsb.modelYear}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {tsb.affectedModels.slice(0, 3).map((model) => (
                        <Badge
                          key={model}
                          className="bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55] text-[9px]"
                        >
                          {model}
                        </Badge>
                      ))}
                      {tsb.affectedModels.length > 3 && (
                        <span className="text-[9px] text-[#64748b]">
                          +{tsb.affectedModels.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-[#64748b] hover:text-[#f59e0b]"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBookmark(tsb.id)
                    }}
                  >
                    {tsb.bookmarked ? (
                      <BookmarkCheck className="h-4 w-4 text-[#f59e0b]" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTSBs.length === 0 && (
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 text-[#475569] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">No TSBs found</h3>
                <p className="text-xs text-[#64748b]">Try adjusting your search or filter criteria</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Detail + Stats */}
        <div className="space-y-4">
          {/* TSB Detail Panel */}
          {selectedTSB ? (
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-mono text-[#00d4ff]">{selectedTSB.number}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-[#64748b] hover:text-[#e2e8f0]"
                    onClick={() => setSelectedTSB(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">{selectedTSB.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${severityColors[selectedTSB.severity]} text-[9px] border`}>
                      {selectedTSB.severity}
                    </Badge>
                    <Badge className={`${systemColors[selectedTSB.system]} text-[9px] border`}>
                      {selectedTSB.system}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">Description</div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{selectedTSB.description}</p>
                </div>

                <div>
                  <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">Affected Vehicles</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTSB.affectedModels.map((model) => (
                      <Badge key={model} className="bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55] text-[9px]">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    Repair Procedure
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-line">
                    {selectedTSB.repairProcedure}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Parts Required
                  </div>
                  <ul className="space-y-1">
                    {selectedTSB.partsRequired.map((part, i) => (
                      <li key={i} className="text-xs text-[#94a3b8] flex items-start gap-1.5">
                        <span className="text-[#00d4ff] mt-1">•</span>
                        {part}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between bg-[#0f1923] rounded-lg p-3">
                  <div>
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide">Labor Time</div>
                    <div className="text-lg font-bold text-[#f59e0b]">{selectedTSB.laborHours} hrs</div>
                  </div>
                  <Clock className="h-6 w-6 text-[#f59e0b]/30" />
                </div>

                {selectedTSB.linkedTSBs.length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      Linked Bulletins
                    </div>
                    <div className="space-y-1">
                      {selectedTSB.linkedTSBs.map((linked) => (
                        <div key={linked} className="text-xs font-mono text-[#00d4ff] cursor-pointer hover:underline">
                          {linked}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardContent className="p-8 text-center">
                <FileText className="h-8 w-8 text-[#475569] mx-auto mb-2" />
                <p className="text-xs text-[#64748b]">Select a TSB to view details</p>
              </CardContent>
            </Card>
          )}

          {/* Manufacturer Breakdown */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#8b5cf6]" />
                By Manufacturer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mfrBreakdown.map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00d4ff] rounded-full"
                        style={{ width: `${(m.count / tsbs.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#e2e8f0] font-mono w-4 text-right">{m.count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent TSBs */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#10b981]" />
                Recent TSBs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-48 overflow-y-auto">
              {recentTSBs.slice(0, 5).map((tsb) => (
                <div
                  key={tsb.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[#1e2a3a]/50 rounded p-1.5 -m-1.5 transition-colors"
                  onClick={() => setSelectedTSB(tsb)}
                >
                  <AlertTriangle className="h-3 w-3 text-[#64748b] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono text-[#00d4ff]">{tsb.number}</div>
                    <div className="text-[11px] text-[#94a3b8] truncate">{tsb.title}</div>
                  </div>
                  <span className="text-[9px] text-[#475569] whitespace-nowrap">{tsb.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
