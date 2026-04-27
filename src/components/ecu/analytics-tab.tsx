'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { TrendingUp, BarChart3, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ── Chart Data ──────────────────────────────────────────────────────────────

const healthTrendData = [
  { month: 'Oct', score: 92 },
  { month: 'Nov', score: 88 },
  { month: 'Dec', score: 85 },
  { month: 'Jan', score: 82 },
  { month: 'Feb', score: 87 },
  { month: 'Mar', score: 84 },
]

const costProjectionData = [
  { month: 'Apr', cost: 320 },
  { month: 'May', cost: 480 },
  { month: 'Jun', cost: 260 },
  { month: 'Jul', cost: 550 },
  { month: 'Aug', cost: 390 },
  { month: 'Sep', cost: 420 },
]

// ── Insights Data ───────────────────────────────────────────────────────────

const insights = [
  {
    title: 'Brake system degradation accelerating',
    confidence: 92,
    severity: 'critical' as const,
    description:
      'Analysis shows brake pad wear rate has increased 23% over the last 3 months. Immediate inspection recommended.',
  },
  {
    title: 'Battery performance seasonal pattern detected',
    confidence: 85,
    severity: 'warning' as const,
    description:
      'Battery voltage drops correlate with temperature changes. Pre-winter replacement may reduce failure risk by 60%.',
  },
  {
    title: 'Transmission fluid analysis suggests extended interval',
    confidence: 78,
    severity: 'info' as const,
    description:
      'Fluid degradation is below expected levels. Service interval could potentially be extended by 5,000 km safely.',
  },
]

// ── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  valueLabel?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-[#64748b] mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-[#e2e8f0]">
        {valueLabel}: {payload[0].value}
        {valueLabel === 'Cost' ? '$' : '%'}
      </p>
    </div>
  )
}

// ── Confidence Bar ──────────────────────────────────────────────────────────

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-bold min-w-[32px] text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function AnalyticsTab() {
  const severityColorMap = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#00d4ff',
  }

  const severityBadgeMap = {
    critical: 'CRITICAL',
    warning: 'WARNING',
    info: 'INSIGHT',
  }

  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Health Trend Line Chart */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[#00d4ff]" />
            <h3 className="text-sm font-semibold text-[#e2e8f0]">Health Trend</h3>
            <Badge className="text-[9px] bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30 ml-auto">
              6 Months
            </Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e2a3a' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[70, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e2a3a' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip valueLabel="Score" />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#00d4ff"
                  strokeWidth={2.5}
                  dot={{ fill: '#00d4ff', r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: '#00d4ff', r: 6, strokeWidth: 2, stroke: '#0f1923' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Projection Bar Chart */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-[#8b5cf6]" />
            <h3 className="text-sm font-semibold text-[#e2e8f0]">Cost Projection</h3>
            <Badge className="text-[9px] bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30 ml-auto">
              Next 6 Months
            </Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costProjectionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e2a3a' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e2a3a' }}
                  tickLine={false}
                  tickFormatter={(val: number) => `$${val}`}
                />
                <Tooltip content={<CustomTooltip valueLabel="Cost" />} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="cost"
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-4 w-4 text-[#f59e0b]" />
          <h3 className="text-sm font-semibold text-[#e2e8f0]">Key Insights</h3>
          <Badge className="text-[9px] bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30 ml-1">
            AI Generated
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, i) => {
            const color = severityColorMap[insight.severity]
            return (
              <div
                key={i}
                className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    className="text-[9px] border-0 font-semibold"
                    style={{
                      color,
                      backgroundColor: `${color}18`,
                    }}
                  >
                    {severityBadgeMap[insight.severity]}
                  </Badge>
                  <span className="text-[9px] text-[#475569]">Confidence</span>
                </div>
                <h4 className="text-xs font-semibold text-[#e2e8f0] mb-2 leading-relaxed">
                  {insight.title}
                </h4>
                <p className="text-[10px] text-[#64748b] mb-3 leading-relaxed">
                  {insight.description}
                </p>
                <ConfidenceBar value={insight.confidence} color={color} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
