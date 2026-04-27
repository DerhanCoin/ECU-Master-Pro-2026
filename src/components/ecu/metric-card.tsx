'use client'

import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  color?: string
  trend?: 'up' | 'down' | 'neutral'
  glowColor?: 'teal' | 'green' | 'yellow' | 'purple' | 'red'
}

export function MetricCard({ title, value, subtitle, icon, color = '#00d4ff', trend, glowColor }: MetricCardProps) {
  const glowMap = {
    teal: 'glow-teal',
    green: 'glow-teal',
    yellow: 'glow-warning',
    purple: 'glow-purple',
    red: 'glow-warning',
  }

  return (
    <div
      className={cn(
        'bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]',
        glowColor && glowMap[glowColor]
      )}
    >
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
      <div className="text-[11px] text-[#475569] mt-1">{subtitle}</div>
    </div>
  )
}
