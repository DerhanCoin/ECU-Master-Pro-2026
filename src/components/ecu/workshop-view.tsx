'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wrench,
  Users,
  DollarSign,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  LayoutGrid,
  Plus,
  UserPlus,
  FileText,
  Zap,
  Star,
  Monitor,
  ChevronRight,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { useState } from 'react'

type JobStatus = 'in_progress' | 'waiting' | 'diagnosis' | 'parts_ordered' | 'completed'

interface Job {
  id: string
  vehicle: string
  customer: string
  technician: string
  service: string
  status: JobStatus
  estimatedTime: string
  bay: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface Technician {
  id: string
  name: string
  currentJob: string | null
  availability: 'available' | 'busy' | 'break' | 'off'
  skills: string[]
  rating: number
  jobsCompleted: number
}

const jobs: Job[] = [
  { id: 'J-1001', vehicle: '2024 VW Golf GTI', customer: 'Marcus Weber', technician: 'Lukas Braun', service: 'ECU Diagnostics & DTC Scan', status: 'in_progress', estimatedTime: '1.5h', bay: 1, priority: 'high' },
  { id: 'J-1002', vehicle: '2023 BMW 330e', customer: 'Anna Schmidt', technician: 'Peter Fischer', service: 'Hybrid Battery Diagnosis', status: 'diagnosis', estimatedTime: '3h', bay: 2, priority: 'urgent' },
  { id: 'J-1003', vehicle: '2025 Audi A4', customer: 'Thomas Mueller', technician: 'Stefan Weber', service: 'Oil Change & Inspection', status: 'in_progress', estimatedTime: '45m', bay: 3, priority: 'low' },
  { id: 'J-1004', vehicle: '2024 Mercedes C300', customer: 'Sophie Klein', technician: 'Lukas Braun', service: 'ADAS Calibration', status: 'waiting', estimatedTime: '2h', bay: 0, priority: 'medium' },
  { id: 'J-1005', vehicle: '2023 Skoda Octavia', customer: 'Jan Novak', technician: null, service: 'Brake Replacement', status: 'waiting', estimatedTime: '2.5h', bay: 0, priority: 'medium' },
  { id: 'J-1006', vehicle: '2024 Seat Leon', customer: 'Carlos Garcia', technician: 'Peter Fischer', service: 'Transmission Service', status: 'parts_ordered', estimatedTime: '4h', bay: 4, priority: 'high' },
]

const technicians: Technician[] = [
  { id: 'T1', name: 'Lukas Braun', currentJob: 'ECU Diagnostics (J-1001)', availability: 'busy', skills: ['ECU', 'Diagnostics', 'Flash'], rating: 4.9, jobsCompleted: 342 },
  { id: 'T2', name: 'Peter Fischer', currentJob: 'Hybrid Battery (J-1002)', availability: 'busy', skills: ['EV/Hybrid', 'High Voltage', 'Battery'], rating: 4.7, jobsCompleted: 278 },
  { id: 'T3', name: 'Stefan Weber', currentJob: 'Oil Change (J-1003)', availability: 'busy', skills: ['Maintenance', 'Brakes', 'Suspension'], rating: 4.5, jobsCompleted: 456 },
  { id: 'T4', name: 'Maria Hoffmann', currentJob: null, availability: 'available', skills: ['ADAS', 'Calibration', 'Electrical'], rating: 4.8, jobsCompleted: 198 },
  { id: 'T5', name: 'Jan Richter', currentJob: null, availability: 'break', skills: ['Transmission', 'Engine', 'Turbo'], rating: 4.6, jobsCompleted: 312 },
]

const jobStatusConfig: Record<JobStatus, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: '#00d4ff' },
  waiting: { label: 'Waiting', color: '#f59e0b' },
  diagnosis: { label: 'Diagnosis', color: '#8b5cf6' },
  parts_ordered: { label: 'Parts Ordered', color: '#64748b' },
  completed: { label: 'Completed', color: '#10b981' },
}

const availabilityConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Available', color: '#10b981' },
  busy: { label: 'Busy', color: '#ef4444' },
  break: { label: 'On Break', color: '#f59e0b' },
  off: { label: 'Off Duty', color: '#475569' },
}

const priorityConfig: Record<string, { color: string }> = {
  low: { color: '#64748b' },
  medium: { color: '#f59e0b' },
  high: { color: '#ef4444' },
  urgent: { color: '#ef4444' },
}

const bays = [
  { id: 1, vehicle: 'VW Golf GTI', job: 'J-1001', occupied: true },
  { id: 2, vehicle: 'BMW 330e', job: 'J-1002', occupied: true },
  { id: 3, vehicle: 'Audi A4', job: 'J-1003', occupied: true },
  { id: 4, vehicle: 'Seat Leon', job: 'J-1006', occupied: true },
  { id: 5, vehicle: null, job: null, occupied: false },
  { id: 6, vehicle: null, job: null, occupied: false },
]

const customerQueue = [
  { name: 'Sophie Klein', vehicle: 'Mercedes C300', service: 'ADAS Calibration', waitTime: '~30 min', priority: 'medium' },
  { name: 'Jan Novak', vehicle: 'Skoda Octavia', service: 'Brake Replacement', waitTime: '~1h', priority: 'medium' },
  { name: 'Elena Petrova', vehicle: 'VW Tiguan', service: 'Full Inspection', waitTime: '~2h', priority: 'low' },
]

const revenueData = [
  { day: 'Mon', value: 2400 },
  { day: 'Tue', value: 1800 },
  { day: 'Wed', value: 3200 },
  { day: 'Thu', value: 2800 },
  { day: 'Fri', value: 3600 },
  { day: 'Sat', value: 1500 },
  { day: 'Sun', value: 800 },
]

const equipmentStatus = [
  { name: 'VAS 6154+ #1', status: 'In Use', usedBy: 'Lukas Braun', color: '#ef4444' },
  { name: 'VAS 6154+ #2', status: 'Available', usedBy: null, color: '#10b981' },
  { name: 'J2534 Passthru', status: 'In Use', usedBy: 'Peter Fischer', color: '#ef4444' },
  { name: 'OBDLink MX+', status: 'Available', usedBy: null, color: '#10b981' },
  { name: 'ADAS Calibration Rig', status: 'Maintenance', usedBy: null, color: '#f59e0b' },
  { name: 'Battery Tester', status: 'In Use', usedBy: 'Stefan Weber', color: '#ef4444' },
]

export function WorkshopView() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'technicians' | 'queue'>('jobs')
  const completedToday = 7
  const revenueToday = 3650
  const activeJobs = jobs.filter(j => j.status === 'in_progress' || j.status === 'diagnosis').length
  const occupiedBays = bays.filter(b => b.occupied).length

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Workshop Management</h1>
          </div>
          <p className="text-xs text-[#64748b]">Manage workshop operations and resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Job
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] hover:bg-[#1e2a3a] gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Assign Tech
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Jobs', value: activeJobs, icon: Activity, color: '#00d4ff' },
          { label: 'Completed Today', value: completedToday, icon: CheckCircle2, color: '#10b981' },
          { label: 'Revenue Today', value: `€${revenueToday.toLocaleString()}`, icon: DollarSign, color: '#8b5cf6' },
          { label: 'Technicians On', value: `${technicians.filter(t => t.availability !== 'off').length}/${technicians.length}`, icon: Users, color: '#f59e0b' },
        ].map((metric, i) => {
          const Icon = metric.icon
          return (
            <Card key={i} className="bg-[#151d2b] border-[#1e2a3a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#475569]">{metric.label}</span>
                  <Icon className="h-4 w-4" style={{ color: metric.color }} />
                </div>
                <div className="text-xl font-bold text-[#e2e8f0]">{metric.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bay Utilization */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[#00d4ff]" />
            Bay Utilization
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">{occupiedBays}/{bays.length} Occupied</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {bays.map(bay => (
              <div key={bay.id} className={`p-3 rounded-lg border text-center ${bay.occupied ? 'bg-[#ef4444]/10 border-[#ef4444]/30' : 'bg-[#10b981]/10 border-[#10b981]/30'}`}>
                <div className="text-[10px] text-[#475569] mb-1">Bay {bay.id}</div>
                <div className={`h-2 w-full rounded-full mb-1.5 ${bay.occupied ? 'bg-[#ef4444]' : 'bg-[#10b981]'}`} />
                <div className="text-[9px] text-[#94a3b8] truncate">{bay.vehicle || 'Empty'}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[#1e2a3a] pb-2">
        {(['jobs', 'technicians', 'queue'] as const).map(tab => (
          <Button key={tab} size="sm" variant="ghost"
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'text-[#00d4ff] bg-[#00d4ff]/10 rounded-b-none border-b-2 border-[#00d4ff] text-xs' : 'text-[#64748b] text-xs hover:text-[#e2e8f0]'}
          >
            {tab === 'jobs' ? <Activity className="h-3.5 w-3.5 mr-1" /> : tab === 'technicians' ? <Users className="h-3.5 w-3.5 mr-1" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Job Board */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Job Board</h2>
            <div className="flex gap-1.5">
              {Object.entries(jobStatusConfig).map(([key, config]) => (
                <Badge key={key} variant="outline" className="text-[9px] h-5 bg-[#0f1923] border-[#1e2a3a]" style={{ color: config.color }}>
                  {config.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {jobs.map(job => {
              const statusConfig = jobStatusConfig[job.status]
              return (
                <Card key={job.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/20 transition-all">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${statusConfig.color}15` }}>
                          <Car className="h-4 w-4" style={{ color: statusConfig.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#e2e8f0]">{job.vehicle}</span>
                            <Badge variant="outline" className="text-[9px] h-4 font-mono" style={{ color: priorityConfig[job.priority].color, borderColor: `${priorityConfig[job.priority].color}30` }}>
                              {job.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-[#475569]">{job.customer} • {job.service}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-[#475569]">Tech: {job.technician || 'Unassigned'}</div>
                          <div className="text-[10px] text-[#475569]">Est: {job.estimatedTime} {job.bay > 0 ? `• Bay ${job.bay}` : ''}</div>
                        </div>
                        <Badge className="text-[10px] border-0" style={{ color: statusConfig.color, backgroundColor: `${statusConfig.color}20` }}>
                          {statusConfig.label}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#475569] hover:text-[#e2e8f0]">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Technicians */}
      {activeTab === 'technicians' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Technician Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {technicians.map(tech => {
              const availConfig = availabilityConfig[tech.availability]
              return (
                <Card key={tech.id} className="bg-[#151d2b] border-[#1e2a3a]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0f1923] flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-[#64748b]" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#e2e8f0]">{tech.name}</div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-[#f59e0b] fill-[#f59e0b]" />
                            <span className="text-[10px] text-[#f59e0b]">{tech.rating}</span>
                            <span className="text-[9px] text-[#475569]">({tech.jobsCompleted} jobs)</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="text-[9px] border-0" style={{ color: availConfig.color, backgroundColor: `${availConfig.color}20` }}>
                        {availConfig.label}
                      </Badge>
                    </div>
                    {tech.currentJob && (
                      <div className="mb-3 p-2 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                        <div className="text-[10px] text-[#475569]">Current Job</div>
                        <div className="text-[11px] text-[#94a3b8]">{tech.currentJob}</div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {tech.skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-[9px] h-4 bg-[#0f1923] border-[#1e2a3a] text-[#64748b]">{skill}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Customer Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Customer Queue</h2>
          {customerQueue.map((customer, i) => (
            <Card key={i} className="bg-[#151d2b] border-[#1e2a3a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0f1923] flex items-center justify-center text-xs font-bold text-[#00d4ff]">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#e2e8f0]">{customer.name}</div>
                      <div className="text-[10px] text-[#475569]">{customer.vehicle} • {customer.service}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-[#f59e0b]">~{customer.waitTime}</div>
                      <Badge variant="outline" className="text-[9px] h-4" style={{ color: priorityConfig[customer.priority].color, borderColor: `${priorityConfig[customer.priority].color}30` }}>
                        {customer.priority}
                      </Badge>
                    </div>
                    <Button size="sm" className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold">
                      Assign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom Row: Stats + Equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workshop Statistics */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#10b981]" />
              Weekly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {revenueData.map((d, i) => {
                const maxVal = Math.max(...revenueData.map(r => r.value))
                const height = (d.value / maxVal) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[9px] text-[#475569]">€{(d.value / 1000).toFixed(1)}k</div>
                    <div className="w-full bg-[#0f1923] rounded-sm relative" style={{ height: '80px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-sm transition-all"
                        style={{ height: `${height}%`, backgroundColor: i === 4 ? '#00d4ff' : '#1e2a3a' }}
                      />
                    </div>
                    <div className="text-[9px] text-[#475569]">{d.day}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold text-[#00d4ff]">2.4h</div>
                <div className="text-[9px] text-[#475569]">Avg Job Time</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#10b981]">4.7★</div>
                <div className="text-[9px] text-[#475569]">Satisfaction</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#8b5cf6]">89%</div>
                <div className="text-[9px] text-[#475569]">On-Time Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Status */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#8b5cf6]" />
              Equipment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {equipmentStatus.map((eq, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: eq.color }} />
                    <span className="text-xs text-[#e2e8f0]">{eq.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: eq.color }}>{eq.status}</span>
                    {eq.usedBy && <span className="text-[9px] text-[#475569]">({eq.usedBy})</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#f59e0b]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'New Job', icon: Plus, color: '#00d4ff' },
              { label: 'Assign Tech', icon: UserPlus, color: '#10b981' },
              { label: 'Complete Job', icon: CheckCircle2, color: '#8b5cf6' },
              { label: 'Create Invoice', icon: FileText, color: '#f59e0b' },
            ].map((action, i) => {
              const Icon = action.icon
              return (
                <Button key={i} variant="outline" className="h-auto py-3 flex-col gap-1.5 bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55]">
                  <Icon className="h-5 w-5" style={{ color: action.color }} />
                  <span className="text-[10px]">{action.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
