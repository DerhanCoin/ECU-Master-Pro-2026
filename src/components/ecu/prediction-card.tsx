'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Eye, TrendingUp, DollarSign, BarChart3, Activity } from 'lucide-react'

interface PredictionCardProps {
  component: string
  probability: number
  severity: 'WARNING' | 'MONITOR' | 'OK'
  timeline: string
  estCost: number
  confidence: number
  symptoms: string[]
  recommendation: string
}

const severityConfig = {
  WARNING: {
    color: '#f59e0b',
    bgColor: 'bg-[#f59e0b]/10',
    borderColor: 'border-[#f59e0b]/40',
    icon: AlertTriangle,
    glowClass: 'glow-warning',
  },
  MONITOR: {
    color: '#00d4ff',
    bgColor: 'bg-[#00d4ff]/10',
    borderColor: 'border-[#00d4ff]/40',
    icon: Eye,
    glowClass: 'glow-teal',
  },
  OK: {
    color: '#10b981',
    bgColor: 'bg-[#10b981]/10',
    borderColor: 'border-[#10b981]/40',
    icon: Activity,
    glowClass: 'glow-teal',
  },
}

export function PredictionCard({
  component,
  probability,
  severity,
  timeline,
  estCost,
  confidence,
  symptoms,
  recommendation,
}: PredictionCardProps) {
  const config = severityConfig[severity]
  const SeverityIcon = config.icon

  return (
    <div
      className={cn(
        'bg-[#151d2b] rounded-lg p-4 border-l-4 transition-all duration-200 hover:scale-[1.01]',
        config.borderColor,
        config.glowClass
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SeverityIcon className="h-4 w-4" style={{ color: config.color }} />
          <h4 className="text-sm font-semibold text-[#e2e8f0]">{component}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded font-bold"
            style={{
              color: config.color,
              backgroundColor: `${config.color}20`,
            }}
          >
            {severity}
          </span>
        </div>
      </div>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-[#64748b]">Failure Probability</span>
          <span className="text-sm font-bold" style={{ color: config.color }}>
            {probability}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full animate-progress"
            style={{
              width: `${probability}%`,
              backgroundColor: config.color,
              '--progress-width': `${probability}%`,
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-[11px]">
          <TrendingUp className="h-3 w-3 text-[#64748b]" />
          <span className="text-[#94a3b8]">{timeline}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <DollarSign className="h-3 w-3 text-[#64748b]" />
          <span className="text-[#94a3b8]">${estCost}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <BarChart3 className="h-3 w-3 text-[#64748b]" />
          <span className="text-[#94a3b8]">{confidence}% conf.</span>
        </div>
      </div>

      {/* Symptoms */}
      <div className="mb-3">
        <div className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider mb-1.5">Symptoms</div>
        <div className="flex flex-wrap gap-1">
          {symptoms.map((symptom, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2a3a] text-[#94a3b8]"
            >
              {symptom}
            </span>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="pt-2 border-t border-[#1e2a3a]">
        <div className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider mb-1">Recommendation</div>
        <p className="text-[11px] text-[#94a3b8]">{recommendation}</p>
      </div>
    </div>
  )
}
