'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  DollarSign,
  Car,
  Download,
  ChevronRight,
  Wrench,
  RotateCcw,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Priority = 'Critical' | 'High' | 'Normal' | 'Low'

interface ServiceItem {
  id: number
  relativeDate: string
  exactDate: string
  serviceType: string
  priority: Priority
  vehicle: string
  estimatedCost: number
  estimatedDuration: string
}

const priorityConfig: Record<Priority, { color: string; bgColor: string; borderColor: string }> = {
  Critical: {
    color: '#ef4444',
    bgColor: '#ef444415',
    borderColor: 'border-[#ef4444]/40',
  },
  High: {
    color: '#f59e0b',
    bgColor: '#f59e0b15',
    borderColor: 'border-[#f59e0b]/40',
  },
  Normal: {
    color: '#00d4ff',
    bgColor: '#00d4ff15',
    borderColor: 'border-[#00d4ff]/40',
  },
  Low: {
    color: '#64748b',
    bgColor: '#64748b15',
    borderColor: 'border-[#64748b]/40',
  },
}

const serviceItems: ServiceItem[] = [
  {
    id: 1,
    relativeDate: 'In 5 days',
    exactDate: 'Mar 9, 2026',
    serviceType: 'Oil Change',
    priority: 'Critical',
    vehicle: 'BMW 3 Series (2024)',
    estimatedCost: 120,
    estimatedDuration: '45 min',
  },
  {
    id: 2,
    relativeDate: 'In 1 week',
    exactDate: 'Mar 11, 2026',
    serviceType: 'Brake Replacement',
    priority: 'Critical',
    vehicle: 'Mercedes C-Class (2023)',
    estimatedCost: 450,
    estimatedDuration: '2.5 hrs',
  },
  {
    id: 3,
    relativeDate: 'In 2 weeks',
    exactDate: 'Mar 18, 2026',
    serviceType: 'Tire Rotation',
    priority: 'Normal',
    vehicle: 'Audi A4 (2025)',
    estimatedCost: 60,
    estimatedDuration: '30 min',
  },
  {
    id: 4,
    relativeDate: 'In 3 weeks',
    exactDate: 'Mar 25, 2026',
    serviceType: 'Battery Check',
    priority: 'High',
    vehicle: 'VW Golf (2022)',
    estimatedCost: 35,
    estimatedDuration: '20 min',
  },
  {
    id: 5,
    relativeDate: 'In 1 month',
    exactDate: 'Apr 4, 2026',
    serviceType: 'Transmission Service',
    priority: 'High',
    vehicle: 'BMW 3 Series (2024)',
    estimatedCost: 280,
    estimatedDuration: '3 hrs',
  },
  {
    id: 6,
    relativeDate: 'In 5 weeks',
    exactDate: 'Apr 9, 2026',
    serviceType: 'Spark Plug Replacement',
    priority: 'Normal',
    vehicle: 'Mercedes C-Class (2023)',
    estimatedCost: 170,
    estimatedDuration: '1.5 hrs',
  },
  {
    id: 7,
    relativeDate: 'In 2 months',
    exactDate: 'May 5, 2026',
    serviceType: 'Oil Change',
    priority: 'Normal',
    vehicle: 'Audi A4 (2025)',
    estimatedCost: 120,
    estimatedDuration: '45 min',
  },
  {
    id: 8,
    relativeDate: 'In 3 months',
    exactDate: 'Jun 2, 2026',
    serviceType: 'Brake Replacement',
    priority: 'Low',
    vehicle: 'VW Golf (2022)',
    estimatedCost: 380,
    estimatedDuration: '2 hrs',
  },
]

const monthlyOverview = [
  { label: 'This Month', services: 3, cost: 780, color: '#ef4444' },
  { label: 'Next Month', services: 2, cost: 450, color: '#f59e0b' },
  { label: 'Following', services: 3, cost: 1200, color: '#00d4ff' },
]

const serviceIcons: Record<string, React.ReactNode> = {
  'Oil Change': <Wrench className="h-3.5 w-3.5" />,
  'Brake Replacement': <Wrench className="h-3.5 w-3.5" />,
  'Tire Rotation': <RotateCcw className="h-3.5 w-3.5" />,
  'Battery Check': <DollarSign className="h-3.5 w-3.5" />,
  'Transmission Service': <Wrench className="h-3.5 w-3.5" />,
  'Spark Plug Replacement': <Wrench className="h-3.5 w-3.5" />,
}

export function ScheduleTab() {
  const [schedulingId, setSchedulingId] = useState<number | null>(null)

  const handleSchedule = (id: number) => {
    setSchedulingId(id)
    setTimeout(() => setSchedulingId(null), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Monthly Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {monthlyOverview.map((month) => (
          <div
            key={month.label}
            className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">
                {month.label}
              </span>
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: month.color, boxShadow: `0 0 8px ${month.color}50` }}
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: month.color }}>
                {month.services}
              </span>
              <span className="text-xs text-[#64748b]">services</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <DollarSign className="h-3 w-3 text-[#64748b]" />
              <span className="text-sm font-semibold text-[#e2e8f0]">
                {month.cost.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#64748b]">est.</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header + Export */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#00d4ff]" />
          Upcoming Service Schedule
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5"
        >
          <Download className="h-3 w-3" />
          Export Schedule
        </Button>
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Timeline connecting line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#1e2a3a]" />

        <div className="space-y-4">
          {serviceItems.map((item, index) => {
            const pConfig = priorityConfig[item.priority]
            return (
              <div key={item.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="absolute -left-6 top-4 flex items-center justify-center">
                  <div
                    className={cn(
                      'h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center z-10',
                      'bg-[#0f1923]'
                    )}
                    style={{ borderColor: pConfig.color }}
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: pConfig.color,
                        boxShadow: `0 0 6px ${pConfig.color}60`,
                      }}
                    />
                  </div>
                </div>

                {/* Event Card */}
                <div
                  className={cn(
                    'flex-1 bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]',
                    item.priority === 'Critical' && 'border-l-2 border-l-[#ef4444]'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Left section */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="p-1 rounded"
                          style={{ backgroundColor: pConfig.bgColor }}
                        >
                          <span style={{ color: pConfig.color }}>
                            {serviceIcons[item.serviceType] || <Wrench className="h-3.5 w-3.5" />}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-[#e2e8f0]">
                          {item.serviceType}
                        </h3>
                        <Badge
                          className="text-[10px] font-bold border-0"
                          style={{
                            color: pConfig.color,
                            backgroundColor: pConfig.bgColor,
                          }}
                        >
                          {item.priority}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-[#64748b]" />
                          <span className="text-[11px] text-[#94a3b8]">{item.relativeDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Car className="h-3 w-3 text-[#64748b]" />
                          <span className="text-[11px] text-[#94a3b8]">{item.vehicle}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3 w-3 text-[#64748b]" />
                          <span className="text-[11px] text-[#e2e8f0] font-medium">
                            ${item.estimatedCost}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-[#64748b]" />
                          <span className="text-[11px] text-[#94a3b8]">
                            {item.estimatedDuration}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#475569] mt-1.5">{item.exactDate}</div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 sm:ml-4">
                      <Button
                        size="sm"
                        className={cn(
                          'h-7 text-[11px] font-semibold gap-1',
                          index === 0
                            ? 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                            : 'border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]'
                        )}
                        variant={index === 0 ? 'default' : 'outline'}
                        onClick={() => handleSchedule(item.id)}
                        disabled={schedulingId === item.id}
                      >
                        {schedulingId === item.id ? (
                          <>
                            <ChevronRight className="h-3 w-3 animate-pulse" />
                            Scheduled
                          </>
                        ) : (
                          'Schedule'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] border-[#1e2a3a] bg-[#151d2b] text-[#64748b] hover:bg-[#1e2a3a] hover:text-[#94a3b8]"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] border-[#1e2a3a] bg-[#151d2b] text-[#64748b] hover:bg-[#1e2a3a] hover:text-[#94a3b8]"
                      >
                        <SkipForward className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Total Summary Footer */}
      <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-[#64748b] uppercase tracking-wide font-medium">
              Total Services
            </div>
            <div className="text-lg font-bold text-[#e2e8f0]">8</div>
          </div>
          <div className="h-8 w-px bg-[#1e2a3a]" />
          <div>
            <div className="text-[10px] text-[#64748b] uppercase tracking-wide font-medium">
              Total Est. Cost
            </div>
            <div className="text-lg font-bold text-[#00d4ff]">$2,430</div>
          </div>
          <div className="h-8 w-px bg-[#1e2a3a]" />
          <div>
            <div className="text-[10px] text-[#64748b] uppercase tracking-wide font-medium">
              Critical Items
            </div>
            <div className="text-lg font-bold text-[#ef4444]">2</div>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
        >
          <Calendar className="h-3.5 w-3.5" />
          Auto-Schedule All Critical
        </Button>
      </div>
    </div>
  )
}
