'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calendar,
  Plus,
  Clock,
  DollarSign,
  Car,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ───────────────────────────────────────────────────────────────────

type ServiceStatus = 'Completed' | 'Scheduled' | 'Overdue'
type ServiceTypeOption = 'Oil Change' | 'Brake Service' | 'Tire Service' | 'Battery' | 'Inspection' | 'Other'

interface ServiceRecord {
  id: string
  date: string
  vehicle: string
  serviceType: string
  mileage: string
  cost: string
  status: ServiceStatus
  mechanic: string
}

interface UpcomingService {
  name: string
  dueMileage: string
  dueMileageNum: number
  remaining: string
  remainingLabel: string
  urgency: 'warning' | 'normal' | 'info'
  progressPercent: number
}

interface CostCategory {
  name: string
  cost: number
  percent: number
  color: string
}

// ── Sample Data ─────────────────────────────────────────────────────────────

const serviceRecords: ServiceRecord[] = [
  { id: '1', date: '2025-01-15', vehicle: 'VW Golf GTI', serviceType: 'Oil Change', mileage: '42,300 km', cost: '€120', status: 'Completed', mechanic: 'Autohaus Munich' },
  { id: '2', date: '2024-12-20', vehicle: 'Audi A4', serviceType: 'Brake Replacement', mileage: '38,500 km', cost: '€450', status: 'Completed', mechanic: 'Audi Zentrum' },
  { id: '3', date: '2024-12-01', vehicle: 'BMW 3 Series', serviceType: 'Inspection', mileage: '45,000 km', cost: '€280', status: 'Completed', mechanic: 'BMW Partner' },
  { id: '4', date: '2024-11-15', vehicle: 'Mercedes C-Class', serviceType: 'Tire Change', mileage: '41,200 km', cost: '€380', status: 'Completed', mechanic: 'Tire Center' },
  { id: '5', date: '2024-10-28', vehicle: 'VW Golf GTI', serviceType: 'Battery Replacement', mileage: '40,100 km', cost: '€180', status: 'Completed', mechanic: 'Autohaus Munich' },
  { id: '6', date: '2024-10-10', vehicle: 'Skoda Octavia', serviceType: 'Oil Change', mileage: '35,600 km', cost: '€110', status: 'Completed', mechanic: 'Skoda Service' },
  { id: '7', date: '2024-09-22', vehicle: 'Audi A4', serviceType: 'Transmission Service', mileage: '36,200 km', cost: '€650', status: 'Completed', mechanic: 'Audi Zentrum' },
  { id: '8', date: '2024-09-05', vehicle: 'BMW 3 Series', serviceType: 'Air Filter', mileage: '42,800 km', cost: '€45', status: 'Completed', mechanic: 'BMW Partner' },
]

const upcomingServices: UpcomingService[] = [
  { name: 'Oil Change', dueMileage: '45,200 km', dueMileageNum: 45200, remaining: '1,200 km', remainingLabel: 'in 12 days', urgency: 'warning', progressPercent: 93 },
  { name: 'Brake Inspection', dueMileage: '48,000 km', dueMileageNum: 48000, remaining: '4,000 km', remainingLabel: 'in 6 weeks', urgency: 'normal', progressPercent: 87 },
  { name: 'Tire Rotation', dueMileage: '50,000 km', dueMileageNum: 50000, remaining: '6,000 km', remainingLabel: 'in 8 weeks', urgency: 'normal', progressPercent: 83 },
  { name: 'Air Filter', dueMileage: '52,000 km', dueMileageNum: 52000, remaining: '8,000 km', remainingLabel: 'in 10 weeks', urgency: 'normal', progressPercent: 79 },
  { name: 'Timing Belt', dueMileage: '60,000 km', dueMileageNum: 60000, remaining: '16,000 km', remainingLabel: 'in 5 months', urgency: 'info', progressPercent: 67 },
]

const costCategories: CostCategory[] = [
  { name: 'Oil Changes', cost: 230, percent: 5, color: '#00d4ff' },
  { name: 'Brakes', cost: 450, percent: 10, color: '#ef4444' },
  { name: 'Tires', cost: 380, percent: 8, color: '#f59e0b' },
  { name: 'Battery', cost: 180, percent: 4, color: '#10b981' },
  { name: 'Transmission', cost: 650, percent: 15, color: '#8b5cf6' },
  { name: 'Inspection', cost: 280, percent: 6, color: '#06b6d4' },
  { name: 'Other', cost: 110, percent: 3, color: '#64748b' },
]

const monthlyCosts = [
  { month: 'Jan', cost: 320 },
  { month: 'Feb', cost: 150 },
  { month: 'Mar', cost: 450 },
  { month: 'Apr', cost: 280 },
  { month: 'May', cost: 120 },
  { month: 'Jun', cost: 380 },
  { month: 'Jul', cost: 200 },
  { month: 'Aug', cost: 90 },
  { month: 'Sep', cost: 695 },
  { month: 'Oct', cost: 290 },
  { month: 'Nov', cost: 380 },
  { month: 'Dec', cost: 450 },
]

const vehicleOptions = ['VW Golf GTI', 'Audi A4', 'BMW 3 Series', 'Mercedes C-Class', 'Skoda Octavia']
const serviceTypeOptions: ServiceTypeOption[] = ['Oil Change', 'Brake Service', 'Tire Service', 'Battery', 'Inspection', 'Other']

// ── Helpers ─────────────────────────────────────────────────────────────────

const statusColorMap: Record<ServiceStatus, string> = {
  Completed: '#10b981',
  Scheduled: '#00d4ff',
  Overdue: '#ef4444',
}

const urgencyConfig: Record<string, { color: string; label: string; bgColor: string }> = {
  warning: { color: '#f59e0b', label: 'Due Soon', bgColor: '#f59e0b18' },
  normal: { color: '#00d4ff', label: 'Upcoming', bgColor: '#00d4ff18' },
  info: { color: '#3b82f6', label: 'Planned', bgColor: '#3b82f618' },
}

// ── Metric Card Component ───────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wide">{title}</div>
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      {subtitle && (
        <div className="text-[11px] text-[#475569] mt-1">{subtitle}</div>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ServiceHistoryView() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    vehicle: '',
    serviceType: '',
    date: '',
    mileage: '',
    cost: '',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [vehicleFilter, setVehicleFilter] = useState('All')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [records, setRecords] = useState<ServiceRecord[]>(serviceRecords)

  // ── Form handlers ───────────────────────────────────────────────────────

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.vehicle) errors.vehicle = 'Vehicle is required'
    if (!formData.serviceType) errors.serviceType = 'Service type is required'
    if (!formData.date) errors.date = 'Date is required'
    if (!formData.mileage) errors.mileage = 'Mileage is required'
    if (!formData.cost) errors.cost = 'Cost is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveRecord = () => {
    if (!validateForm()) return
    const newRecord: ServiceRecord = {
      id: String(records.length + 1),
      date: formData.date,
      vehicle: formData.vehicle,
      serviceType: formData.serviceType,
      mileage: formData.mileage + ' km',
      cost: '€' + formData.cost,
      status: 'Scheduled',
      mechanic: 'Self',
    }
    setRecords([newRecord, ...records])
    setFormData({ vehicle: '', serviceType: '', date: '', mileage: '', cost: '', notes: '' })
    setFormErrors({})
    setShowForm(false)
  }

  const handleCancel = () => {
    setFormData({ vehicle: '', serviceType: '', date: '', mileage: '', cost: '', notes: '' })
    setFormErrors({})
    setShowForm(false)
  }

  // ── Filtered records ────────────────────────────────────────────────────

  const filteredRecords = records.filter((r) => {
    const matchesVehicle = vehicleFilter === 'All' || r.vehicle === vehicleFilter
    const matchesService = serviceFilter === 'All' || r.serviceType === serviceFilter
    return matchesVehicle && matchesService
  })

  // ── Unique filter values ────────────────────────────────────────────────

  const uniqueVehicles = Array.from(new Set(records.map((r) => r.vehicle)))
  const uniqueServiceTypes = Array.from(new Set(records.map((r) => r.serviceType)))

  const maxMonthlyCost = Math.max(...monthlyCosts.map((m) => m.cost))

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Service History</h1>
            </div>
            <p className="text-xs text-[#64748b]">
              Maintenance records and service interval tracking
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
          >
            {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            Add Service Record
          </Button>
        </div>

        {/* ── Service Overview ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Services"
            value="24"
            icon={<Wrench className="h-4 w-4" />}
            color="#00d4ff"
            subtitle="All time records"
          />
          <MetricCard
            title="This Year"
            value="7"
            icon={<Calendar className="h-4 w-4" />}
            color="#10b981"
            subtitle="Services completed"
          />
          <MetricCard
            title="Total Cost"
            value="€4,280"
            icon={<DollarSign className="h-4 w-4" />}
            color="#8b5cf6"
            subtitle="All time expenses"
          />
          <MetricCard
            title="Next Service"
            value="In 12 days"
            icon={<Clock className="h-4 w-4" />}
            color="#f59e0b"
            subtitle="Oil Change due"
          />
        </div>

        {/* ── Add Service Record Form ──────────────────────────────────────── */}
        {showForm && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#e2e8f0]">Add Service Record</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-6 w-6 p-0 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Vehicle */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[#94a3b8] font-medium">Vehicle</Label>
                <Select
                  value={formData.vehicle}
                  onValueChange={(val) => setFormData({ ...formData, vehicle: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] w-full">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                    {vehicleOptions.map((v) => (
                      <SelectItem key={v} value={v} className="text-xs text-[#e2e8f0] focus:bg-[#1e2a3a] focus:text-[#00d4ff]">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.vehicle && (
                  <p className="text-[10px] text-[#ef4444]">{formErrors.vehicle}</p>
                )}
              </div>

              {/* Service Type */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[#94a3b8] font-medium">Service Type</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(val) => setFormData({ ...formData, serviceType: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                    {serviceTypeOptions.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs text-[#e2e8f0] focus:bg-[#1e2a3a] focus:text-[#00d4ff]">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.serviceType && (
                  <p className="text-[10px] text-[#ef4444]">{formErrors.serviceType}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[#94a3b8] font-medium">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] focus:border-[#00d4ff]/50 focus:ring-[#00d4ff]/20"
                />
                {formErrors.date && (
                  <p className="text-[10px] text-[#ef4444]">{formErrors.date}</p>
                )}
              </div>

              {/* Mileage */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[#94a3b8] font-medium">Mileage (km)</Label>
                <Input
                  placeholder="e.g. 44000"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#00d4ff]/50 focus:ring-[#00d4ff]/20"
                />
                {formErrors.mileage && (
                  <p className="text-[10px] text-[#ef4444]">{formErrors.mileage}</p>
                )}
              </div>

              {/* Cost */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[#94a3b8] font-medium">Cost (€)</Label>
                <Input
                  placeholder="e.g. 120"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#00d4ff]/50 focus:ring-[#00d4ff]/20"
                />
                {formErrors.cost && (
                  <p className="text-[10px] text-[#ef4444]">{formErrors.cost}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[#94a3b8] font-medium">Notes</Label>
                <Input
                  placeholder="Optional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#00d4ff]/50 focus:ring-[#00d4ff]/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                size="sm"
                onClick={handleSaveRecord}
                className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Save Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-8 text-xs border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] hover:border-[#2d3f55]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Upcoming Service Intervals ───────────────────────────────────── */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Upcoming Service Intervals</h2>
          </div>

          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[#1e2a3a]" />

            {upcomingServices.map((service, index) => {
              const config = urgencyConfig[service.urgency]
              return (
                <div key={service.name} className="relative flex items-start gap-4 py-3">
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-0.5">
                    <div
                      className="h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: config.color,
                        backgroundColor: `${config.color}20`,
                      }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#e2e8f0]">{service.name}</span>
                        <Badge
                          className="text-[9px] border-0 font-medium px-1.5 py-0"
                          style={{
                            color: config.color,
                            backgroundColor: config.bgColor,
                          }}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-[#94a3b8]">Due at <span className="text-[#e2e8f0] font-medium">{service.dueMileage}</span></span>
                        <span className="text-[#64748b]">•</span>
                        <span style={{ color: config.color }}>{service.remaining} remaining</span>
                        <span className="text-[#64748b]">•</span>
                        <span className="text-[#64748b]">{service.remainingLabel}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${service.progressPercent}%`,
                          backgroundColor: config.color,
                          boxShadow: `0 0 8px ${config.color}40`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#64748b]">{service.progressPercent}% completed</span>
                      <span className="text-[10px] text-[#475569]">{service.remaining} to go</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Service Records Table ────────────────────────────────────────── */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Service Records</h2>
              <Badge className="text-[9px] border-0 bg-[#1e2a3a] text-[#94a3b8] font-medium">
                {filteredRecords.length}
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#64748b]" />

              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger className="h-7 text-[10px] bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8] w-[130px]" size="sm">
                  <SelectValue placeholder="Vehicle" />
                </SelectTrigger>
                <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                  <SelectItem value="All" className="text-xs text-[#e2e8f0] focus:bg-[#1e2a3a] focus:text-[#00d4ff]">All Vehicles</SelectItem>
                  {uniqueVehicles.map((v) => (
                    <SelectItem key={v} value={v} className="text-xs text-[#e2e8f0] focus:bg-[#1e2a3a] focus:text-[#00d4ff]">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="h-7 text-[10px] bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8] w-[130px]" size="sm">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                  <SelectItem value="All" className="text-xs text-[#e2e8f0] focus:bg-[#1e2a3a] focus:text-[#00d4ff]">All Types</SelectItem>
                  {uniqueServiceTypes.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs text-[#e2e8f0] focus:bg-[#1e2a3a] focus:text-[#00d4ff]">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scrollable table */}
          <div className="max-h-96 overflow-y-auto rounded-md [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#0f1923] [&::-webkit-scrollbar-thumb]:bg-[#2d3f55] [&::-webkit-scrollbar-thumb]:rounded-full">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1e2a3a] hover:bg-transparent">
                  <TableHead className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">Vehicle</TableHead>
                  <TableHead className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">Service Type</TableHead>
                  <TableHead className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">Mileage</TableHead>
                  <TableHead className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">Cost</TableHead>
                  <TableHead className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">Mechanic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} className="border-[#1e2a3a]/50 hover:bg-[#1e2a3a]/30">
                    <TableCell className="text-xs text-[#94a3b8] font-mono">{record.date}</TableCell>
                    <TableCell className="text-xs text-[#e2e8f0] font-medium">
                      <div className="flex items-center gap-1.5">
                        <Car className="h-3 w-3 text-[#64748b]" />
                        {record.vehicle}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[#94a3b8]">{record.serviceType}</TableCell>
                    <TableCell className="text-xs text-[#94a3b8] font-mono tabular-nums">{record.mileage}</TableCell>
                    <TableCell className="text-xs text-[#e2e8f0] font-medium tabular-nums">{record.cost}</TableCell>
                    <TableCell>
                      <Badge
                        className="text-[9px] border-0 font-medium px-1.5 py-0 gap-1"
                        style={{
                          color: statusColorMap[record.status],
                          backgroundColor: `${statusColorMap[record.status]}18`,
                        }}
                      >
                        {record.status === 'Completed' && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {record.status === 'Scheduled' && <Clock className="h-2.5 w-2.5" />}
                        {record.status === 'Overdue' && <AlertTriangle className="h-2.5 w-2.5" />}
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#64748b]">{record.mechanic}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Empty state */}
          {filteredRecords.length === 0 && (
            <div className="py-8 text-center">
              <Wrench className="h-8 w-8 text-[#64748b] mx-auto mb-2" />
              <p className="text-xs text-[#64748b]">No records match your filters</p>
            </div>
          )}
        </div>

        {/* ── Cost Analysis ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cost Breakdown by Category */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Year-to-Date Cost Breakdown</h2>
            </div>

            <div className="space-y-3">
              {costCategories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#94a3b8] font-medium">{cat.name}</span>
                    <span className="text-[11px] text-[#e2e8f0] font-semibold tabular-nums">€{cat.cost}</span>
                  </div>
                  <div className="relative h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${cat.percent * 5}%`,
                        backgroundColor: cat.color,
                        boxShadow: `0 0 6px ${cat.color}40`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total YTD */}
            <div className="mt-4 pt-3 border-t border-[#1e2a3a] flex items-center justify-between">
              <span className="text-xs text-[#64748b] font-medium">Total Year-to-Date</span>
              <span className="text-lg font-bold text-[#00d4ff] tabular-nums">€2,280</span>
            </div>
          </div>

          {/* Monthly Cost Trend */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Monthly Cost Trend</h2>
            </div>

            <div className="flex items-end gap-1.5 h-40">
              {monthlyCosts.map((m) => {
                const heightPercent = (m.cost / maxMonthlyCost) * 100
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-[#64748b] tabular-nums">€{m.cost}</span>
                    <div className="w-full relative" style={{ height: '110px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-sm transition-all duration-500 ease-out"
                        style={{
                          height: `${heightPercent}%`,
                          background: `linear-gradient(to top, #00d4ff40, #00d4ff)`,
                          boxShadow: '0 0 6px #00d4ff30',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-[#64748b] font-medium">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
