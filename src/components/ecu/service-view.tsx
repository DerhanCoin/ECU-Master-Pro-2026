'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Wrench,
  Droplets,
  CircleDot,
  Gauge,
  Cog,
  Car,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  FileText,
  Printer,
  Bell,
  Star,
  Sparkles,
  Thermometer,
  Snowflake,
  Shield,
  TrendingUp,
  DollarSign,
  Timer,
  Heart,
  ChevronRight,
  Package,
  ArrowRight,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

type UrgencyLevel = 'overdue' | 'due_soon' | 'upcoming' | 'ok'
type ServiceOrderStatus = 'scheduled' | 'in_progress' | 'waiting_parts' | 'quality_check' | 'complete'
type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent'

interface ScheduledService {
  id: string
  name: string
  icon: React.ReactNode
  dueDate: string
  mileageRemaining: string
  urgency: UrgencyLevel
  progressPercent: number
  intervalKm: string
}

interface ServiceOrder {
  id: string
  vehicle: string
  customer: string
  serviceType: string
  technician: string
  status: ServiceOrderStatus
  estimatedCompletion: string
  priority: PriorityLevel
  bayNumber: number | null
}

interface MaintenanceAlert {
  id: string
  type: 'ai_prediction' | 'seasonal' | 'compliance'
  title: string
  description: string
  confidence?: number
  icon: React.ReactNode
  color: string
}

interface ServicePackage {
  id: string
  name: string
  price: string
  duration: string
  popularity: number
  includedItems: string[]
  tier: 'basic' | 'standard' | 'premium' | 'performance' | 'diagnostic'
}

// ── Data ────────────────────────────────────────────────────────────────────

const urgencyConfig: Record<UrgencyLevel, { label: string; color: string; bgColor: string }> = {
  overdue: { label: 'Overdue', color: '#ef4444', bgColor: '#ef444418' },
  due_soon: { label: 'Due Soon', color: '#f59e0b', bgColor: '#f59e0b18' },
  upcoming: { label: 'Upcoming', color: '#00d4ff', bgColor: '#00d4ff18' },
  ok: { label: 'OK', color: '#10b981', bgColor: '#10b98118' },
}

const statusConfig: Record<ServiceOrderStatus, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: '#00d4ff' },
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  waiting_parts: { label: 'Waiting Parts', color: '#8b5cf6' },
  quality_check: { label: 'Quality Check', color: '#06b6d4' },
  complete: { label: 'Complete', color: '#10b981' },
}

const priorityConfig: Record<PriorityLevel, { color: string; label: string }> = {
  low: { color: '#64748b', label: 'LOW' },
  medium: { color: '#f59e0b', label: 'MED' },
  high: { color: '#ef4444', label: 'HIGH' },
  urgent: { color: '#ef4444', label: 'URGENT' },
}

const scheduledServices: ScheduledService[] = [
  { id: 's1', name: 'Oil Change', icon: <Droplets className="h-4 w-4" />, dueDate: 'Mar 8, 2026', mileageRemaining: '320 km', urgency: 'due_soon', progressPercent: 94, intervalKm: '15,000 km' },
  { id: 's2', name: 'Annual Inspection', icon: <Shield className="h-4 w-4" />, dueDate: 'Mar 15, 2026', mileageRemaining: '1,450 km', urgency: 'upcoming', progressPercent: 88, intervalKm: '12 months' },
  { id: 's3', name: 'Brake Service', icon: <CircleDot className="h-4 w-4" />, dueDate: 'Feb 28, 2026', mileageRemaining: 'Overdue!', urgency: 'overdue', progressPercent: 102, intervalKm: '40,000 km' },
  { id: 's4', name: 'Tire Rotation', icon: <Gauge className="h-4 w-4" />, dueDate: 'Apr 20, 2026', mileageRemaining: '5,800 km', urgency: 'ok', progressPercent: 71, intervalKm: '20,000 km' },
  { id: 's5', name: 'Timing Belt', icon: <Cog className="h-4 w-4" />, dueDate: 'Aug 12, 2026', mileageRemaining: '22,400 km', urgency: 'ok', progressPercent: 44, intervalKm: '60,000 km' },
]

const serviceOrders: ServiceOrder[] = [
  { id: 'SO-4871', vehicle: '2025 VW Golf GTI', customer: 'Marcus Weber', serviceType: '60K Major Service', technician: 'Lukas Braun', status: 'in_progress', estimatedCompletion: 'Today 16:30', priority: 'high', bayNumber: 1 },
  { id: 'SO-4872', vehicle: '2024 BMW 330e', customer: 'Anna Schmidt', serviceType: 'Hybrid System Check', technician: 'Peter Fischer', status: 'waiting_parts', estimatedCompletion: 'Tomorrow 11:00', priority: 'medium', bayNumber: 2 },
  { id: 'SO-4873', vehicle: '2026 Audi Q5', customer: 'Thomas Mueller', serviceType: 'First Inspection', technician: 'Stefan Weber', status: 'scheduled', estimatedCompletion: 'Mar 5, 09:00', priority: 'low', bayNumber: null },
  { id: 'SO-4874', vehicle: '2023 Mercedes GLC', customer: 'Sophie Klein', serviceType: 'ADAS Recalibration', technician: 'Maria Hoffmann', status: 'quality_check', estimatedCompletion: 'Today 14:00', priority: 'high', bayNumber: 3 },
  { id: 'SO-4875', vehicle: '2024 Skoda Kodiaq', customer: 'Jan Novak', serviceType: 'DSG Transmission Service', technician: 'Jan Richter', status: 'in_progress', estimatedCompletion: 'Today 17:45', priority: 'urgent', bayNumber: 4 },
  { id: 'SO-4876', vehicle: '2025 Seat Cupra', customer: 'Carlos Garcia', serviceType: 'Brake Overhaul + Rotors', technician: 'Lukas Braun', status: 'scheduled', estimatedCompletion: 'Mar 6, 08:30', priority: 'medium', bayNumber: null },
]

const maintenanceAlerts: MaintenanceAlert[] = [
  { id: 'a1', type: 'ai_prediction', title: 'Battery Degradation Predicted', description: 'AI model predicts battery failure within 3 months based on cranking voltage trends. Recommend proactive replacement.', confidence: 87, icon: <Sparkles className="h-4 w-4" />, color: '#8b5cf6' },
  { id: 'a2', type: 'ai_prediction', title: 'Turbocharger Boost Deviation', description: 'Measured boost 12% below target. AI suggests wastegate actuator inspection at next service window.', confidence: 73, icon: <Sparkles className="h-4 w-4" />, color: '#8b5cf6' },
  { id: 'a3', type: 'seasonal', title: 'Winter Preparation Due', description: 'Schedule coolant flush, winter tire change, and antifreeze test before November. Fleet vehicles require priority handling.', icon: <Snowflake className="h-4 w-4" />, color: '#00d4ff' },
  { id: 'a4', type: 'seasonal', title: 'Summer AC System Check', description: 'Annual AC refrigerant level test and cabin filter replacement recommended before June heat wave.', icon: <Thermometer className="h-4 w-4" />, color: '#f59e0b' },
  { id: 'a5', type: 'compliance', title: 'Service Interval Compliance: 91%', description: '9% of fleet vehicles have overdue service intervals. 3 vehicles require immediate attention to maintain warranty.', icon: <Shield className="h-4 w-4" />, color: '#10b981' },
]

const servicePackages: ServicePackage[] = [
  { id: 'p1', name: 'Basic Service', price: '€149', duration: '1.5h', popularity: 78, tier: 'basic', includedItems: ['Oil & Filter Change', 'Multi-point Inspection', 'Fluid Level Check', 'Tire Pressure Adjust', 'Vehicle Health Report'] },
  { id: 'p2', name: 'Standard Service', price: '€299', duration: '3h', popularity: 85, tier: 'standard', includedItems: ['All Basic Items', 'Air Filter Replacement', 'Cabin Filter Replacement', 'Brake Inspection', 'Battery Test', 'Diagnostic Scan'] },
  { id: 'p3', name: 'Premium Service', price: '€499', duration: '5h', popularity: 62, tier: 'premium', includedItems: ['All Standard Items', 'Spark Plug Replacement', 'Coolant Flush', 'Brake Fluid Change', 'Full ECU Diagnostics', 'ADAS Calibration Check', 'Interior Detail'] },
  { id: 'p4', name: 'Performance Check', price: '€199', duration: '2h', popularity: 54, tier: 'performance', includedItems: ['Dyno Run & Report', 'Boost Pressure Test', 'Lambda Sensor Check', 'Transmission Adaptation', 'ECU Tune Verification'] },
  { id: 'p5', name: 'Full Diagnostic', price: '€349', duration: '4h', popularity: 71, tier: 'diagnostic', includedItems: ['Full OBD-II Scan', 'All Module Diagnostics', 'CAN Bus Analysis', 'Live Data Logging', 'Fault Code Analysis', 'Technical Report + TSB Cross-Ref'] },
]

const packageTierColors: Record<string, { color: string; bgColor: string }> = {
  basic: { color: '#64748b', bgColor: '#64748b18' },
  standard: { color: '#00d4ff', bgColor: '#00d4ff18' },
  premium: { color: '#f59e0b', bgColor: '#f59e0b18' },
  performance: { color: '#ef4444', bgColor: '#ef444418' },
  diagnostic: { color: '#8b5cf6', bgColor: '#8b5cf618' },
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ServiceView() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [alertFilter, setAlertFilter] = useState<'all' | 'ai_prediction' | 'seasonal' | 'compliance'>('all')

  const filteredAlerts = alertFilter === 'all'
    ? maintenanceAlerts
    : maintenanceAlerts.filter(a => a.type === alertFilter)

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Scheduled Services & Maintenance</h1>
          </div>
          <p className="text-xs text-[#64748b]">
            Workshop service scheduling, active orders & predictive maintenance planning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px] gap-1">
            <AlertTriangle className="h-3 w-3" /> 1 Overdue
          </Badge>
          <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px] gap-1">
            <Clock className="h-3 w-3" /> 1 Due Soon
          </Badge>
        </div>
      </div>

      {/* ── Service Statistics ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Completed This Month', value: '47', icon: CheckCircle2, color: '#10b981', subtitle: '+12% vs last month' },
          { label: 'Monthly Revenue', value: '€18.4k', icon: DollarSign, color: '#8b5cf6', subtitle: '+8.3% growth' },
          { label: 'Avg Completion Time', value: '2.4h', icon: Timer, color: '#00d4ff', subtitle: '-15min improvement' },
          { label: 'Satisfaction Score', value: '4.8★', icon: Heart, color: '#f59e0b', subtitle: 'Based on 142 reviews' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="bg-[#151d2b] border-[#1e2a3a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#475569] font-medium uppercase tracking-wide">{stat.label}</span>
                  <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stat.color}15` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#e2e8f0]">{stat.value}</div>
                <div className="text-[10px] text-[#475569] mt-1">{stat.subtitle}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Service Schedule Overview ───────────────────────────────────── */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#00d4ff]" />
            Service Schedule Overview
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">{scheduledServices.length} Items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledServices.map((service) => {
              const config = urgencyConfig[service.urgency]
              const isOverdue = service.urgency === 'overdue'
              return (
                <div key={service.id} className={`p-3 rounded-lg border transition-all hover:border-[#2d3f55] ${isOverdue ? 'bg-[#ef4444]/5 border-[#ef4444]/20' : 'bg-[#0f1923] border-[#1e2a3a]'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.color}15` }}>
                        <span style={{ color: config.color }}>{service.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-[#e2e8f0]">{service.name}</span>
                          <Badge className="text-[9px] border-0 font-medium px-1.5 py-0" style={{ color: config.color, backgroundColor: config.bgColor }}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-[#94a3b8]">Due: <span className="text-[#e2e8f0] font-medium">{service.dueDate}</span></span>
                          <span className="text-[#475569]">•</span>
                          <span style={{ color: isOverdue ? '#ef4444' : '#94a3b8' }}>{service.mileageRemaining}{!isOverdue ? ' remaining' : ''}</span>
                          <span className="text-[#475569]">•</span>
                          <span className="text-[#475569]">Interval: {service.intervalKm}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:w-56">
                      <div className="flex-1">
                        <div className="relative h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.min(service.progressPercent, 100)}%`,
                              backgroundColor: config.color,
                              boxShadow: `0 0 8px ${config.color}40`,
                            }}
                          />
                        </div>
                        <div className="text-[9px] text-[#475569] mt-1 text-right">{service.progressPercent}% to next service</div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#475569] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] flex-shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Active Service Orders ───────────────────────────────────────── */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[#f59e0b]" />
            Active Service Orders
            <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">{serviceOrders.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#0f1923] [&::-webkit-scrollbar-thumb]:bg-[#2d3f55] [&::-webkit-scrollbar-thumb]:rounded-full">
            {serviceOrders.map((order) => {
              const sConfig = statusConfig[order.status]
              const pConfig = priorityConfig[order.priority]
              return (
                <div key={order.id} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] hover:border-[#00d4ff]/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${sConfig.color}15` }}>
                        <Car className="h-4 w-4" style={{ color: sConfig.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-[#e2e8f0] font-mono">{order.id}</span>
                          <Badge variant="outline" className="text-[8px] h-4 font-bold px-1" style={{ color: pConfig.color, borderColor: `${pConfig.color}30` }}>
                            {pConfig.label}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-[#94a3b8]">{order.vehicle} • {order.serviceType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-12 sm:pl-0">
                      <div className="text-right flex-1 sm:flex-none">
                        <div className="text-[10px] text-[#475569] flex items-center gap-1 justify-end sm:justify-end">
                          <UserCheck className="h-3 w-3" /> {order.technician}
                        </div>
                        <div className="text-[10px] text-[#475569] flex items-center gap-1 justify-end sm:justify-end">
                          <Clock className="h-3 w-3" /> {order.estimatedCompletion}
                          {order.bayNumber && <span> • Bay {order.bayNumber}</span>}
                        </div>
                      </div>
                      <Badge className="text-[9px] border-0 font-medium whitespace-nowrap" style={{ color: sConfig.color, backgroundColor: `${sConfig.color}20` }}>
                        {sConfig.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Maintenance Planner ─────────────────────────────────────────── */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
              AI Maintenance Planner
            </CardTitle>
            <div className="flex gap-1.5">
              {(['all', 'ai_prediction', 'seasonal', 'compliance'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant="ghost"
                  onClick={() => setAlertFilter(filter)}
                  className={`h-6 text-[9px] px-2 ${alertFilter === filter ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' : 'text-[#64748b] hover:text-[#e2e8f0]'}`}
                >
                  {filter === 'all' ? 'All' : filter === 'ai_prediction' ? 'AI' : filter === 'seasonal' ? 'Seasonal' : 'Compliance'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${alert.color}15` }}>
                    <span style={{ color: alert.color }}>{alert.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#e2e8f0]">{alert.title}</span>
                      {alert.type === 'ai_prediction' && (
                        <Badge className="text-[8px] border-0 px-1.5 py-0 bg-[#8b5cf6]/20 text-[#8b5cf6]">AI</Badge>
                      )}
                      {alert.type === 'seasonal' && (
                        <Badge className="text-[8px] border-0 px-1.5 py-0 bg-[#00d4ff]/20 text-[#00d4ff]">Seasonal</Badge>
                      )}
                      {alert.type === 'compliance' && (
                        <Badge className="text-[8px] border-0 px-1.5 py-0 bg-[#10b981]/20 text-[#10b981]">Compliance</Badge>
                      )}
                      {alert.confidence && (
                        <Badge className="text-[8px] border-0 px-1.5 py-0 bg-[#f59e0b]/20 text-[#f59e0b]">
                          {alert.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">{alert.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#475569] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] flex-shrink-0">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Tracker */}
          <div className="mt-4 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#94a3b8] font-medium">Service Interval Compliance</span>
              <span className="text-sm font-bold text-[#10b981]">91%</span>
            </div>
            <div className="relative h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: '91%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b98140' }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] text-[#475569]">Target: 95% on-time</span>
              <span className="text-[9px] text-[#f59e0b]">3 vehicles need attention</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Service Packages ────────────────────────────────────────────── */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <Package className="h-4 w-4 text-[#00d4ff]" />
            Service Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {servicePackages.map((pkg) => {
              const tierColor = packageTierColors[pkg.tier]
              const isSelected = selectedPackage === pkg.id
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-[#0f1923] border-[#00d4ff]/40 shadow-[0_0_12px_rgba(0,212,255,0.1)]' : 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#e2e8f0]">{pkg.name}</span>
                      <Badge className="text-[8px] border-0 px-1.5 py-0" style={{ color: tierColor.color, backgroundColor: tierColor.bgColor }}>
                        {pkg.tier.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-xl font-bold" style={{ color: tierColor.color }}>{pkg.price}</span>
                    <span className="text-[10px] text-[#475569]">/ service</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-[10px] text-[#475569]">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {pkg.duration}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-[#f59e0b]" /> {pkg.popularity}% popular</span>
                  </div>

                  {/* Popularity bar */}
                  <div className="relative h-1 bg-[#1e2a3a] rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width: `${pkg.popularity}%`, backgroundColor: tierColor.color }} />
                  </div>

                  <div className="space-y-1.5">
                    {pkg.includedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-[#10b981] flex-shrink-0" />
                        <span className="text-[10px] text-[#94a3b8]">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Button size="sm" className="w-full mt-3 h-7 text-[10px] font-semibold gap-1.5" style={{ backgroundColor: `${tierColor.color}20`, color: tierColor.color }}>
                    Select Package <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#f59e0b]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Schedule Service', icon: Calendar, color: '#00d4ff', desc: 'Book maintenance slot' },
              { label: 'Create Work Order', icon: FileText, color: '#8b5cf6', desc: 'New service order' },
              { label: 'Print Service Sheet', icon: Printer, color: '#10b981', desc: 'Generate PDF report' },
              { label: 'Send Reminder', icon: Bell, color: '#f59e0b', desc: 'Notify customers' },
            ].map((action, i) => {
              const Icon = action.icon
              return (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1.5 bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55] transition-all"
                >
                  <Icon className="h-5 w-5" style={{ color: action.color }} />
                  <span className="text-[10px] font-medium">{action.label}</span>
                  <span className="text-[8px] text-[#475569]">{action.desc}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
