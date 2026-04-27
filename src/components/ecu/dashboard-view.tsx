'use client'

import { MetricCard } from './metric-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  Wifi,
  Activity,
  Cpu,
  Plug,
  Gauge,
  BusFront,
  AlertTriangle,
  Zap,
  Play,
  Car,
  Radio,
} from 'lucide-react'

export function DashboardView() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Dashboard</h1>
            </div>
            <p className="text-xs text-[#64748b]">
              Vehicle diagnostics overview and system status
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
          >
            <Play className="h-3 w-3" />
            Quick Scan
          </Button>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Vehicle Health"
            value="87%"
            subtitle="Overall condition"
            icon={<Heart className="h-4 w-4" />}
            color="#10b981"
            glowColor="green"
          />
          <MetricCard
            title="Active DTCs"
            value={3}
            subtitle="Diagnostic trouble codes"
            icon={<AlertTriangle className="h-4 w-4" />}
            color="#f59e0b"
            glowColor="yellow"
          />
          <MetricCard
            title="ECU Modules"
            value={12}
            subtitle="Connected modules"
            icon={<Cpu className="h-4 w-4" />}
            color="#8b5cf6"
            glowColor="purple"
          />
          <MetricCard
            title="Data Streams"
            value={48}
            subtitle="Active parameters"
            icon={<Activity className="h-4 w-4" />}
            color="#00d4ff"
            glowColor="teal"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* System status */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#00d4ff]" />
              System Status
            </h3>
            <div className="space-y-3">
              {[
                { label: 'OBD-II Connection', status: 'Disconnected', color: '#ef4444', icon: Wifi },
                { label: 'CAN Bus', status: 'Inactive', color: '#64748b', icon: BusFront },
                { label: 'EV/Hybrid Module', status: 'Standby', color: '#f59e0b', icon: Plug },
                { label: 'Performance Monitor', status: 'Ready', color: '#10b981', icon: Gauge },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-[#64748b]" />
                      <span className="text-xs text-[#94a3b8]">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px]" style={{ color: item.color }}>{item.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick diagnostics */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#8b5cf6]" />
              Quick Diagnostics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Full Scan', icon: Activity, color: '#00d4ff' },
                { label: 'DTC Check', icon: AlertTriangle, color: '#f59e0b' },
                { label: 'Live Data', icon: Gauge, color: '#10b981' },
                { label: 'ECU Info', icon: Cpu, color: '#8b5cf6' },
              ].map((action, i) => {
                const Icon = action.icon
                return (
                  <button
                    key={i}
                    className="flex items-center gap-2 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55] transition-all"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: action.color }} />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent vehicles */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <Car className="h-4 w-4 text-[#00d4ff]" />
            Recent Vehicles
          </h3>
          <div className="space-y-2">
            {[
              { name: '2024 VW Golf GTI', vin: 'WVWZZZ1KZPW000001', status: 'Healthy', color: '#10b981' },
              { name: '2023 Audi A4 B10', vin: 'WAUZZZ8V7NA000002', status: 'Warning', color: '#f59e0b' },
              { name: '2025 Skoda Octavia', vin: 'TMBAG9NE5N000003', status: 'Healthy', color: '#10b981' },
            ].map((vehicle, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-all cursor-pointer"
              >
                <div>
                  <div className="text-xs font-medium text-[#e2e8f0]">{vehicle.name}</div>
                  <div className="text-[10px] text-[#475569] font-mono">{vehicle.vin}</div>
                </div>
                <Badge
                  className="text-[10px] border-0"
                  style={{
                    color: vehicle.color,
                    backgroundColor: `${vehicle.color}20`,
                  }}
                >
                  {vehicle.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
