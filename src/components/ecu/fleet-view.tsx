'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Car,
  Search,
  Plus,
  Wifi,
  AlertTriangle,
  WifiOff,
  Wrench,
  ChevronRight,
  Filter,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ───────────────────────────────────────────────────────────────────

type VehicleStatus = 'Healthy' | 'Warning' | 'Critical' | 'Offline'

interface FleetVehicle {
  id: string
  name: string
  brand: string
  vin: string
  status: VehicleStatus
  healthScore: number
  lastConnected: string
  color: string
}

// ── Fallback Sample Data ────────────────────────────────────────────────────

const fallbackVehicles: FleetVehicle[] = [
  {
    id: '1',
    name: '2024 VW Golf GTI',
    brand: 'VW',
    vin: 'WVWZZZ1KZPW000001',
    status: 'Healthy',
    healthScore: 94,
    lastConnected: '2 min ago',
    color: '#00d4ff',
  },
  {
    id: '2',
    name: '2023 Audi A4 B10',
    brand: 'Audi',
    vin: 'WAUZZZ8V7NA000002',
    status: 'Warning',
    healthScore: 72,
    lastConnected: '15 min ago',
    color: '#8b5cf6',
  },
  {
    id: '3',
    name: '2025 BMW 330i G20',
    brand: 'BMW',
    vin: 'WBA5R1C50P000003',
    status: 'Healthy',
    healthScore: 89,
    lastConnected: '5 min ago',
    color: '#10b981',
  },
  {
    id: '4',
    name: '2024 Mercedes C300 W206',
    brand: 'Mercedes',
    vin: 'W1KZF8DB1R000004',
    status: 'Critical',
    healthScore: 38,
    lastConnected: '1 hr ago',
    color: '#f59e0b',
  },
  {
    id: '5',
    name: '2025 Skoda Octavia IV',
    brand: 'Skoda',
    vin: 'TMBAG9NE5N000005',
    status: 'Healthy',
    healthScore: 91,
    lastConnected: '3 min ago',
    color: '#10b981',
  },
  {
    id: '6',
    name: '2024 Porsche 911 992',
    brand: 'Porsche',
    vin: 'WP0AB2A97P000006',
    status: 'Warning',
    healthScore: 67,
    lastConnected: '30 min ago',
    color: '#ef4444',
  },
  {
    id: '7',
    name: '2024 Seat Leon IV',
    brand: 'Seat',
    vin: 'VSSZZZKLZPR000007',
    status: 'Offline',
    healthScore: 82,
    lastConnected: '3 days ago',
    color: '#64748b',
  },
  {
    id: '8',
    name: '2025 Cupra Formentor',
    brand: 'Cupra',
    vin: 'VSSZZZKJZPR000008',
    status: 'Warning',
    healthScore: 58,
    lastConnected: '2 hr ago',
    color: '#8b5cf6',
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

const statusColorMap: Record<VehicleStatus, string> = {
  Healthy: '#10b981',
  Warning: '#f59e0b',
  Critical: '#ef4444',
  Offline: '#64748b',
}

const statusIconMap: Record<VehicleStatus, React.ReactNode> = {
  Healthy: <Wifi className="h-3 w-3" />,
  Warning: <AlertTriangle className="h-3 w-3" />,
  Critical: <AlertTriangle className="h-3 w-3" />,
  Offline: <WifiOff className="h-3 w-3" />,
}

// ── Circular Progress Component ─────────────────────────────────────────────

function CircularProgress({
  value,
  size = 52,
  strokeWidth = 4,
  color,
}: {
  value: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e2a3a"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute text-[11px] font-bold"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  )
}

// ── Vehicle Card Component ──────────────────────────────────────────────────

function VehicleCard({ vehicle }: { vehicle: FleetVehicle }) {
  const statusColor = statusColorMap[vehicle.status]

  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden hover:border-[#2d3f55] transition-all duration-200 group">
      {/* Vehicle image placeholder */}
      <div
        className="h-28 flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: `${vehicle.color}08` }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${vehicle.color}30, transparent 70%)`,
          }}
        />
        <Car className="h-12 w-12 opacity-40" style={{ color: vehicle.color }} />
        <div className="absolute top-2 right-2">
          <Badge
            className="text-[10px] border-0 gap-1 font-medium"
            style={{
              color: statusColor,
              backgroundColor: `${statusColor}18`,
            }}
          >
            {statusIconMap[vehicle.status]}
            {vehicle.status}
          </Badge>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#00d4ff] transition-colors truncate">
            {vehicle.name}
          </h3>
          <p className="text-[10px] text-[#475569] font-mono mt-0.5 truncate">{vehicle.vin}</p>
        </div>

        {/* Health score and last connected */}
        <div className="flex items-center justify-between">
          <CircularProgress value={vehicle.healthScore} color={statusColor} />
          <div className="text-right space-y-1">
            <div className="text-[10px] text-[#64748b]">Last Connected</div>
            <div className="text-[11px] text-[#94a3b8] font-medium">{vehicle.lastConnected}</div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#00d4ff] hover:border-[#00d4ff]/30 gap-1"
          >
            <Wrench className="h-3 w-3" />
            Diagnose
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] hover:border-[#2d3f55] gap-1"
          >
            <ChevronRight className="h-3 w-3" />
            Details
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton Card Component ─────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden animate-pulse">
      {/* Image placeholder skeleton */}
      <div className="h-28 bg-[#1e2a3a]/50" />
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-3.5 bg-[#1e2a3a] rounded w-3/4" />
          <div className="h-2.5 bg-[#1e2a3a] rounded w-1/2" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-[52px] w-[52px] bg-[#1e2a3a] rounded-full" />
          <div className="space-y-1.5">
            <div className="h-2 bg-[#1e2a3a] rounded w-16" />
            <div className="h-2.5 bg-[#1e2a3a] rounded w-12" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-7 bg-[#1e2a3a] rounded" />
          <div className="flex-1 h-7 bg-[#1e2a3a] rounded" />
        </div>
      </div>
    </div>
  )
}

// ── Summary Metric Card Component ───────────────────────────────────────────

function FleetMetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
  isLoading,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  subtitle: string
  isLoading?: boolean
}) {
  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wide">{title}</div>
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      {isLoading ? (
        <div className="h-7 bg-[#1e2a3a] rounded w-16 animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color }}>
            {value}
          </span>
        </div>
      )}
      <div className="text-[11px] text-[#475569] mt-1">{subtitle}</div>
    </div>
  )
}

// ── Map API status to display status ────────────────────────────────────────

function mapApiStatus(status: string): VehicleStatus {
  switch (status.toLowerCase()) {
    case 'healthy': return 'Healthy'
    case 'warning': return 'Warning'
    case 'critical': return 'Critical'
    case 'offline': return 'Offline'
    default: return 'Offline'
  }
}

const brandColorMap: Record<string, string> = {
  VW: '#00d4ff',
  Audi: '#8b5cf6',
  BMW: '#10b981',
  Mercedes: '#f59e0b',
  Skoda: '#10b981',
  Porsche: '#ef4444',
  Seat: '#64748b',
  Cupra: '#8b5cf6',
}

function formatLastConnected(date: Date | null): string {
  if (!date) return 'Never'
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// ── Main Fleet View Component ───────────────────────────────────────────────

export function FleetView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'All' | VehicleStatus>('All')
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(fallbackVehicles)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  // Summary metrics derived from vehicles
  const summaryMetrics = [
    {
      title: 'Total Vehicles',
      value: vehicles.length,
      icon: <Car className="h-4 w-4" />,
      color: '#00d4ff',
      subtitle: 'Registered in fleet',
    },
    {
      title: 'Active',
      value: vehicles.filter(v => v.status === 'Healthy' || v.status === 'Warning').length,
      icon: <Wifi className="h-4 w-4" />,
      color: '#10b981',
      subtitle: 'Currently online',
    },
    {
      title: 'Needs Attention',
      value: vehicles.filter(v => v.status === 'Critical' || v.status === 'Warning').length,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: '#f59e0b',
      subtitle: 'Warning or critical',
    },
    {
      title: 'Offline',
      value: vehicles.filter(v => v.status === 'Offline').length,
      icon: <WifiOff className="h-4 w-4" />,
      color: '#64748b',
      subtitle: 'Not connected',
    },
  ]

  // Fetch vehicles from API on mount
  useEffect(() => {
    let cancelled = false

    async function fetchVehicles() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/vehicles')
        if (!res.ok) throw new Error('API error')
        const data = await res.json()

        if (cancelled) return

        if (data.success && data.vehicles && data.vehicles.length > 0) {
          const mapped: FleetVehicle[] = data.vehicles.map((v: Record<string, unknown>) => ({
            id: v.id as string,
            name: v.name as string,
            brand: (v.brand as string) || 'Unknown',
            vin: v.vin as string,
            status: mapApiStatus(v.status as string),
            healthScore: (v.health as number) ?? 80,
            lastConnected: formatLastConnected(v.lastConnected as Date | null),
            color: brandColorMap[(v.brand as string)] ?? '#64748b',
          }))
          setVehicles(mapped)
          setIsLive(true)
        } else {
          // Fallback to mock data
          setVehicles(fallbackVehicles)
          setIsLive(false)
        }
      } catch {
        if (!cancelled) {
          // Fallback to mock data on error
          setVehicles(fallbackVehicles)
          setIsLive(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchVehicles()
    return () => { cancelled = true }
  }, [])

  const allBrands = ['All', ...Array.from(new Set(vehicles.map((v) => v.brand)))]
  const allStatuses: Array<'All' | VehicleStatus> = ['All', 'Healthy', 'Warning', 'Critical', 'Offline']

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vin.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBrand = brandFilter === 'All' || v.brand === brandFilter
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter
    return matchesSearch && matchesBrand && matchesStatus
  })

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Fleet Management</h1>
              <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px] font-semibold">
                NEW
              </Badge>
              {/* Live / Demo indicator */}
              {isLoading ? (
                <Badge className="bg-[#1e2a3a] text-[#64748b] border-[#2d3f55] text-[10px] gap-1 animate-pulse">
                  <Radio className="h-2.5 w-2.5" />
                  Loading
                </Badge>
              ) : isLive ? (
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px] gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px] gap-1">
                  Demo
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              Monitor and manage your vehicle fleet with centralized diagnostics
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Vehicle
          </Button>
        </div>

        {/* Summary metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {summaryMetrics.map((metric) => (
            <FleetMetricCard key={metric.title} {...metric} isLoading={isLoading} />
          ))}
        </div>

        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
            <Input
              placeholder="Search vehicles or VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-9 text-xs bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#00d4ff]/50 focus:ring-[#00d4ff]/20"
            />
          </div>

          {/* Brand filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[#64748b] flex-shrink-0" />
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {allBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setBrandFilter(brand)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap',
                    brandFilter === brand
                      ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                      : 'bg-[#151d2b] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8] hover:border-[#2d3f55]'
                  )}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {allStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap',
                  statusFilter === status
                    ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                    : 'bg-[#151d2b] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8] hover:border-[#2d3f55]'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredVehicles.length === 0 && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-8 text-center">
            <Car className="h-10 w-10 text-[#64748b] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">No vehicles found</h3>
            <p className="text-xs text-[#64748b]">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
