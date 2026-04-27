'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Car,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react'

interface Vehicle {
  id: string
  name: string
  brand: string
  health: number
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  brandColor: string
}

const vehicles: Vehicle[] = [
  { id: 'vehicle-1', name: 'VW Golf GTI', brand: 'VW', health: 94, status: 'healthy', brandColor: '#00d4ff' },
  { id: 'vehicle-2', name: 'Audi A4 B9', brand: 'Audi', health: 78, status: 'warning', brandColor: '#e80c1c' },
  { id: 'vehicle-3', name: 'BMW 330e', brand: 'BMW', health: 91, status: 'healthy', brandColor: '#3b82f6' },
  { id: 'vehicle-4', name: 'Mercedes C-Class', brand: 'Mercedes', health: 45, status: 'critical', brandColor: '#94a3b8' },
  { id: 'vehicle-5', name: 'Porsche Cayenne', brand: 'Porsche', health: 96, status: 'healthy', brandColor: '#ef4444' },
  { id: 'vehicle-6', name: 'Skoda Octavia', brand: 'Skoda', health: 82, status: 'offline', brandColor: '#22c55e' },
]

const statusConfig = {
  healthy: { color: '#10b981', label: 'Healthy' },
  warning: { color: '#f59e0b', label: 'Warning' },
  critical: { color: '#ef4444', label: 'Critical' },
  offline: { color: '#64748b', label: 'Offline' },
}

function HealthBar({ health, status }: { health: number; status: Vehicle['status'] }) {
  const statusColor = statusConfig[status].color
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${health}%`,
            backgroundColor: statusColor,
            boxShadow: `0 0 6px ${statusColor}40`,
          }}
        />
      </div>
      <span className="text-[10px] font-medium w-7 text-right" style={{ color: statusColor }}>
        {health}%
      </span>
    </div>
  )
}

export function VehicleSelector() {
  const { selectedVehicleId, setSelectedVehicleId } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0]
  const filteredVehicles = vehicles.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    setOpen(false)
    setSearchQuery('')
  }

  const selectedStatusConfig = statusConfig[selectedVehicle.status]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-xs text-[#e2e8f0] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] border border-[#1e2a3a] px-3"
        >
          <Car className="h-3.5 w-3.5" style={{ color: selectedVehicle.brandColor }} />
          <span className="hidden sm:inline max-w-[120px] truncate">{selectedVehicle.name}</span>
          <span
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: selectedStatusConfig.color,
              boxShadow: `0 0 6px ${selectedStatusConfig.color}60`,
            }}
          />
          <ChevronDown className="h-3 w-3 text-[#475569]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-[300px] p-0 bg-[#151d2b] border-[#1e2a3a] shadow-2xl shadow-black/40 rounded-lg overflow-hidden"
      >
        {/* Search */}
        <div className="p-3 border-b border-[#1e2a3a]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#475569]" />
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] text-xs focus:border-[#00d4ff] focus:ring-[#00d4ff]/20"
            />
          </div>
        </div>

        {/* Vehicle List */}
        <ScrollArea className="max-h-[300px]">
          <div className="py-1">
            {filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-[#475569]">
                <Car className="h-6 w-6 mb-1.5 opacity-30" />
                <span className="text-xs">No vehicles found</span>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => {
                const isSelected = vehicle.id === selectedVehicleId
                const vStatus = statusConfig[vehicle.status]
                return (
                  <div
                    key={vehicle.id}
                    onClick={() => handleSelect(vehicle.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#00d4ff]/8 border-l-2 border-[#00d4ff]'
                        : 'hover:bg-[#1e2a3a]/60 border-l-2 border-transparent'
                    }`}
                  >
                    {/* Car icon with brand color */}
                    <div
                      className="flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${vehicle.brandColor}15` }}
                    >
                      <Car className="h-4 w-4" style={{ color: vehicle.brandColor }} />
                    </div>

                    {/* Vehicle info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-medium truncate ${isSelected ? 'text-[#00d4ff]' : 'text-[#e2e8f0]'}`}>
                          {vehicle.name}
                        </span>
                        <Badge
                          className="flex-shrink-0 h-4 px-1.5 text-[9px] font-medium border-0 rounded"
                          style={{
                            backgroundColor: `${vStatus.color}15`,
                            color: vStatus.color,
                          }}
                        >
                          {vStatus.label}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        <HealthBar health={vehicle.health} status={vehicle.status} />
                      </div>
                    </div>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#00d4ff] flex-shrink-0" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
