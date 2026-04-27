'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Database,
  Search,
  Car,
  Star,
  Clock,
  ChevronRight,
  Filter,
  Heart,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Engine,
  ArrowRight,
  Bookmark,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Vehicle Database
const VEHICLES = [
  {
    id: 'v1', make: 'Volkswagen', model: 'Golf GTI', year: 2023, engine: '2.0L TSI EA888.4',
    transmission: '7-DSG (DQ381)', drivetrain: 'FWD', hp: 241, torque: '273 lb-ft',
    fuelType: 'Gasoline', bodyStyle: 'Hatchback', vin: 'WVWZZZ1KZAM000001',
    commonIssues: ['Carbon buildup on intake valves', 'Water pump failure', 'Timing chain tensioner wear'],
    serviceIntervals: '10,000 mi / 12 months',
    knownTSBs: 3,
  },
  {
    id: 'v2', make: 'BMW', model: '3 Series (G20)', year: 2023, engine: '2.0L B48 I4 Turbo',
    transmission: '8-Speed ZF (8HP50)', drivetrain: 'RWD', hp: 255, torque: '295 lb-ft',
    fuelType: 'Gasoline', bodyStyle: 'Sedan', vin: 'WBA5R1C50PA000002',
    commonIssues: ['Oil filter housing gasket leak', 'Coolant loss from expansion tank', 'Electric water pump failure'],
    serviceIntervals: '10,000 mi / 12 months',
    knownTSBs: 5,
  },
  {
    id: 'v3', make: 'Mercedes-Benz', model: 'C-Class (W206)', year: 2022, engine: '2.0L M254 I4 Turbo',
    transmission: '9G-Tronic (9G-Tronic)', drivetrain: 'RWD', hp: 255, torque: '295 lb-ft',
    fuelType: 'Gasoline', bodyStyle: 'Sedan', vin: 'W1KWF8DB2NR000003',
    commonIssues: ['MBUX infotainment glitches', '48V mild hybrid system faults', 'Airmatic suspension leaks'],
    serviceIntervals: '10,000 mi / 12 months',
    knownTSBs: 4,
  },
  {
    id: 'v4', make: 'Toyota', model: 'Camry', year: 2024, engine: '2.5L A25A-FXS Hybrid',
    transmission: 'e-CVT', drivetrain: 'FWD', hp: 225, torque: '163 lb-ft',
    fuelType: 'Hybrid', bodyStyle: 'Sedan', vin: '4T1G11AK5RU000004',
    commonIssues: ['Hybrid battery degradation (cold climates)', 'Brake booster noise', 'EVAP canister failure'],
    serviceIntervals: '10,000 mi / 12 months',
    knownTSBs: 1,
  },
  {
    id: 'v5', make: 'Ford', model: 'Mustang GT', year: 2024, engine: '5.0L Coyote V8',
    transmission: '10-Speed (10R80)', drivetrain: 'RWD', hp: 480, torque: '415 lb-ft',
    fuelType: 'Gasoline', bodyStyle: 'Coupe', vin: '1FA6P8CF5R5000005',
    commonIssues: ['MT82 manual transmission issues', 'Active exhaust valve rattling', 'Cylinder 8 spark plug fouling'],
    serviceIntervals: '7,500 mi / 6 months',
    knownTSBs: 2,
  },
  {
    id: 'v6', make: 'Audi', model: 'A4 (B9)', year: 2023, engine: '2.0L EA888 Gen3B I4',
    transmission: '7-DSG (DL382)', drivetrain: 'Quattro AWD', hp: 201, torque: '236 lb-ft',
    fuelType: 'Gasoline', bodyStyle: 'Sedan', vin: 'WAUENAF46PN000006',
    commonIssues: ['PCV valve failure', 'Carbon buildup', 'Mechatronics unit seal leak'],
    serviceIntervals: '10,000 mi / 12 months',
    knownTSBs: 3,
  },
  {
    id: 'v7', make: 'Honda', model: 'Civic Type R', year: 2024, engine: '2.0L K20C1 Turbo',
    transmission: '6-Speed Manual', drivetrain: 'FWD', hp: 315, torque: '310 lb-ft',
    fuelType: 'Gasoline', bodyStyle: 'Hatchback', vin: '2HGFE1F98RH000007',
    commonIssues: ['Brake rotor warping', 'Rev hang on upshifts', 'AC compressor clutch failure'],
    serviceIntervals: '7,500 mi / 6 months',
    knownTSBs: 1,
  },
  {
    id: 'v8', make: 'Tesla', model: 'Model 3', year: 2024, engine: 'Dual Motor (Rear+Front)',
    transmission: 'Single-Speed Direct', drivetrain: 'AWD', hp: 346, torque: '389 lb-ft',
    fuelType: 'Electric', bodyStyle: 'Sedan', vin: '5YJ3E1EA9RF000008',
    commonIssues: ['12V battery premature failure', 'MCU2 screen delamination', 'Charge port door stuck'],
    serviceIntervals: '12,500 mi / 12 months',
    knownTSBs: 6,
  },
]

// Manufacturer stats
const MANUFACTURER_STATS = [
  { name: 'VW Group', count: 2847, color: '#00d4ff' },
  { name: 'BMW', count: 1923, color: '#e2e8f0' },
  { name: 'Mercedes', count: 1654, color: '#10b981' },
  { name: 'Toyota', count: 2103, color: '#f59e0b' },
  { name: 'Ford', count: 1347, color: '#ef4444' },
  { name: 'Honda', count: 987, color: '#8b5cf6' },
  { name: 'Tesla', count: 423, color: '#00d4ff' },
]

const MAKES = ['All Makes', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Toyota', 'Ford', 'Audi', 'Honda', 'Tesla']
const YEARS = ['All Years', '2024', '2023', '2022', '2021', '2020']
const ENGINE_TYPES = ['All Types', 'Gasoline', 'Diesel', 'Hybrid', 'Electric']

export function VehicleDatabaseView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMake, setSelectedMake] = useState('All Makes')
  const [selectedYear, setSelectedYear] = useState('All Years')
  const [selectedEngineType, setSelectedEngineType] = useState('All Types')
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>(['v1'])
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(['v1', 'v5', 'v3'])
  const [visibleCount, setVisibleCount] = useState(6)

  const filteredVehicles = VEHICLES.filter(v => {
    const matchSearch = searchQuery === '' ||
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.year.toString().includes(searchQuery)
    const matchMake = selectedMake === 'All Makes' || v.make === selectedMake
    const matchYear = selectedYear === 'All Years' || v.year.toString() === selectedYear
    const matchEngine = selectedEngineType === 'All Types' || v.fuelType === selectedEngineType
    return matchSearch && matchMake && matchYear && matchEngine
  })

  const selectedVehicleData = VEHICLES.find(v => v.id === selectedVehicle)
  const totalInDb = MANUFACTURER_STATS.reduce((a, b) => a + b.count, 0)
  const maxCount = Math.max(...MANUFACTURER_STATS.map(m => m.count))

  const toggleFavorite = (vehicleId: string) => {
    setFavorites(prev =>
      prev.includes(vehicleId) ? prev.filter(id => id !== vehicleId) : [...prev, vehicleId]
    )
  }

  const handleVehicleClick = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    setRecentlyViewed(prev => [vehicleId, ...prev.filter(id => id !== vehicleId)].slice(0, 5))
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Vehicle Database</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">
              {totalInDb.toLocaleString()} Vehicles
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Comprehensive vehicle information database with specs, common issues, and service data
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by make, model, year, or VIN..."
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[12px] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#00d4ff] focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="h-9 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none"
              >
                {MAKES.map(make => <option key={make} value={make}>{make}</option>)}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none"
              >
                {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
              <select
                value={selectedEngineType}
                onChange={(e) => setSelectedEngineType(e.target.value)}
                className="h-9 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none"
              >
                {ENGINE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Vehicle Grid + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vehicle Cards Grid */}
        <div className={selectedVehicleData ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredVehicles.slice(0, visibleCount).map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleClick(vehicle.id)}
                className={cn(
                  'w-full text-left rounded-lg border transition-all group',
                  selectedVehicle === vehicle.id
                    ? 'border-[#00d4ff]/40 bg-[#00d4ff]/10 shadow-[0_0_8px_#00d4ff15]'
                    : 'border-[#1e2a3a] bg-[#151d2b] hover:border-[#2d3f55]'
                )}
              >
                {/* Vehicle Image Placeholder */}
                <div className="h-28 bg-[#0f1923] rounded-t-lg flex items-center justify-center relative">
                  <Car className="h-10 w-10 text-[#1e2a3a]" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(vehicle.id) }}
                      className="h-6 w-6 rounded-full bg-[#0f1923]/80 flex items-center justify-center hover:bg-[#1e2a3a] transition-colors"
                    >
                      <Heart className={cn('h-3 w-3', favorites.includes(vehicle.id) ? 'text-[#ef4444] fill-[#ef4444]' : 'text-[#475569]')} />
                    </button>
                  </div>
                  <Badge className={cn(
                    'absolute top-2 left-2 text-[8px] border px-1.5 py-0',
                    vehicle.fuelType === 'Gasoline' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' :
                    vehicle.fuelType === 'Hybrid' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' :
                    vehicle.fuelType === 'Electric' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30' :
                    'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                  )}>
                    {vehicle.fuelType}
                  </Badge>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-[#64748b]">{vehicle.year}</span>
                    <span className="text-[9px] text-[#475569] font-mono">{vehicle.hp} HP</span>
                  </div>
                  <div className="text-[13px] font-bold text-[#e2e8f0] group-hover:text-[#00d4ff] transition-colors">
                    {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">{vehicle.engine}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-[#475569]">{vehicle.transmission}</span>
                    <span className="text-[9px] text-[#1e2a3a]">·</span>
                    <span className="text-[9px] text-[#475569]">{vehicle.drivetrain}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {vehicle.knownTSBs > 0 && (
                      <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[8px]">
                        <AlertTriangle className="h-2 w-2 mr-0.5" />{vehicle.knownTSBs} TSBs
                      </Badge>
                    )}
                    {vehicle.commonIssues.length > 0 && (
                      <Badge className="bg-[#ef4444]/10 text-[#ef4444]/80 text-[8px] border-0">
                        {vehicle.commonIssues.length} Issues
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Load More */}
          {visibleCount < filteredVehicles.length && (
            <div className="flex justify-center mt-4">
              <Button size="sm" onClick={() => setVisibleCount(prev => prev + 6)} className="h-8 text-xs gap-1.5 bg-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/30 border border-[#00d4ff]/30">
                Load More ({filteredVehicles.length - visibleCount} remaining)
              </Button>
            </div>
          )}

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-[#475569] mx-auto mb-3" />
              <div className="text-sm text-[#475569]">No vehicles found matching your criteria</div>
              <div className="text-[11px] text-[#475569] mt-1">Try adjusting your search or filters</div>
            </div>
          )}
        </div>

        {/* Vehicle Detail Panel */}
        {selectedVehicleData && (
          <div className="space-y-4">
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                    <Car className="h-4 w-4 text-[#00d4ff]" />
                    Vehicle Details
                  </CardTitle>
                  <button onClick={() => setSelectedVehicle(null)} className="h-6 w-6 rounded-md bg-[#1e2a3a] flex items-center justify-center hover:bg-[#2d3f55] transition-colors">
                    <X className="h-3 w-3 text-[#64748b]" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-base font-bold text-[#00d4ff]">
                  {selectedVehicleData.year} {selectedVehicleData.make} {selectedVehicleData.model}
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Engine', value: selectedVehicleData.engine, icon: Engine },
                    { label: 'Transmission', value: selectedVehicleData.transmission, icon: ArrowRight },
                    { label: 'Drivetrain', value: selectedVehicleData.drivetrain, icon: Car },
                    { label: 'Power', value: `${selectedVehicleData.hp} HP`, icon: Engine },
                    { label: 'Torque', value: selectedVehicleData.torque, icon: Engine },
                    { label: 'Fuel', value: selectedVehicleData.fuelType, icon: Filter },
                    { label: 'Body', value: selectedVehicleData.bodyStyle, icon: Car },
                    { label: 'VIN', value: selectedVehicleData.vin, icon: FileText },
                  ].map((spec, i) => (
                    <div key={i} className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2">
                      <div className="text-[8px] text-[#475569] uppercase tracking-wider font-semibold">{spec.label}</div>
                      <div className="text-[10px] text-[#e2e8f0] font-mono mt-0.5 truncate">{spec.value}</div>
                    </div>
                  ))}
                </div>

                {/* Service Interval */}
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-[#10b981]" />
                    <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Recommended Service</span>
                  </div>
                  <div className="text-[11px] text-[#e2e8f0] font-medium">{selectedVehicleData.serviceIntervals}</div>
                </div>

                {/* Common Issues */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b]" />
                    <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Common Issues</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedVehicleData.commonIssues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-[#0f1923] border border-[#1e2a3a]">
                        <AlertTriangle className="h-3 w-3 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] text-[#94a3b8]">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Known TSBs */}
                <div className="flex items-center justify-between p-2.5 rounded-md bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[#8b5cf6]" />
                    <span className="text-[10px] text-[#64748b]">Known TSBs</span>
                  </div>
                  <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[10px]">{selectedVehicleData.knownTSBs}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Statistics + Recently Viewed + Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Manufacturer Statistics */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Database className="h-4 w-4 text-[#00d4ff]" />
              Database Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-[#00d4ff] tabular-nums">{totalInDb.toLocaleString()}</div>
              <div className="text-[10px] text-[#475569]">Total Vehicles</div>
            </div>
            <div className="space-y-2">
              {MANUFACTURER_STATS.map((mfr) => (
                <div key={mfr.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#64748b]">{mfr.name}</span>
                    <span className="text-[10px] font-mono" style={{ color: mfr.color }}>{mfr.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(mfr.count / maxCount) * 100}%`, backgroundColor: mfr.color }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recently Viewed */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#00d4ff]" />
              Recently Viewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {recentlyViewed.map((vehicleId) => {
                const vehicle = VEHICLES.find(v => v.id === vehicleId)
                if (!vehicle) return null
                return (
                  <button
                    key={vehicleId}
                    onClick={() => handleVehicleClick(vehicleId)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-md bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-md bg-[#1e2a3a] flex items-center justify-center flex-shrink-0">
                      <Car className="h-4 w-4 text-[#64748b]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-[#e2e8f0] truncate">{vehicle.make} {vehicle.model}</div>
                      <div className="text-[9px] text-[#475569]">{vehicle.year} · {vehicle.engine}</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-[#475569] flex-shrink-0" />
                  </button>
                )
              })}
              {recentlyViewed.length === 0 && (
                <div className="text-center py-4">
                  <Clock className="h-6 w-6 text-[#475569] mx-auto mb-1" />
                  <div className="text-[10px] text-[#475569]">No recently viewed vehicles</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-[#00d4ff]" />
              Favorites
              <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[9px]">{favorites.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {favorites.map((vehicleId) => {
                const vehicle = VEHICLES.find(v => v.id === vehicleId)
                if (!vehicle) return null
                return (
                  <div key={vehicleId} className="flex items-center gap-3 p-2.5 rounded-md bg-[#0f1923] border border-[#1e2a3a]">
                    <div className="h-8 w-8 rounded-md bg-[#ef4444]/10 flex items-center justify-center flex-shrink-0">
                      <Heart className="h-4 w-4 text-[#ef4444] fill-[#ef4444]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-[#e2e8f0] truncate">{vehicle.make} {vehicle.model}</div>
                      <div className="text-[9px] text-[#475569]">{vehicle.year} · {vehicle.fuelType}</div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(vehicleId)}
                      className="h-6 w-6 rounded-md bg-[#1e2a3a] flex items-center justify-center hover:bg-[#ef4444]/20 transition-colors"
                    >
                      <X className="h-3 w-3 text-[#64748b]" />
                    </button>
                  </div>
                )
              })}
              {favorites.length === 0 && (
                <div className="text-center py-4">
                  <Star className="h-6 w-6 text-[#475569] mx-auto mb-1" />
                  <div className="text-[10px] text-[#475569]">No favorite vehicles yet</div>
                  <div className="text-[9px] text-[#475569] mt-0.5">Click the heart icon to add favorites</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
