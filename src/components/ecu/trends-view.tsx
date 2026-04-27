'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  BarChart3,
  AlertTriangle,
  Download,
  GitCompare,
  Target,
  Zap,
  Car,
  Shield,
  LineChart,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y'
type MetricType = 'DTC Frequency' | 'Repair Time' | 'Parts Cost' | 'Vehicle Health Score' | 'AI Prediction Accuracy'

interface DataPoint {
  label: string
  value: number
  isAnomaly?: boolean
}

interface DTCTrend {
  code: string
  description: string
  frequency: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

// ── Mock Data Generators ────────────────────────────────────────────────────

function generateData(range: TimeRange, metric: MetricType): DataPoint[] {
  const pointCounts: Record<TimeRange, number> = { '24h': 24, '7d': 7, '30d': 30, '90d': 12, '1y': 12 }
  const count = pointCounts[range]
  const ranges: Record<MetricType, [number, number]> = {
    'DTC Frequency': [5, 45],
    'Repair Time': [1.5, 6],
    'Parts Cost': [150, 800],
    'Vehicle Health Score': [60, 98],
    'AI Prediction Accuracy': [75, 97],
  }
  const [min, max] = ranges[metric]
  const labels: Record<TimeRange, string[]> = {
    '24h': Array.from({ length: 24 }, (_, i) => `${i}:00`),
    '7d': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    '30d': Array.from({ length: 30 }, (_, i) => `${i + 1}`),
    '90d': ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
    '1y': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  }

  // Use seeded-ish random to be consistent
  const seed = range.length + metric.length
  const pseudoRandom = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297 + 233280) * 49297
    return x - Math.floor(x)
  }

  return Array.from({ length: count }, (_, i) => {
    const raw = min + (max - min) * (0.3 + 0.5 * pseudoRandom(i))
    const isAnomaly = pseudoRandom(i + 100) > 0.85
    return {
      label: labels[range][i] || `${i}`,
      value: isAnomaly ? raw * 1.4 : raw,
      isAnomaly,
    }
  })
}

const topDTCs: DTCTrend[] = [
  { code: 'P0300', description: 'Random/Multiple Misfire', frequency: 47, trend: 'up', change: 12 },
  { code: 'P0420', description: 'Catalyst Efficiency Below Threshold', frequency: 38, trend: 'stable', change: 2 },
  { code: 'P0171', description: 'System Too Lean (Bank 1)', frequency: 31, trend: 'down', change: -8 },
  { code: 'P0700', description: 'Transmission Control System', frequency: 24, trend: 'up', change: 15 },
  { code: 'P0504', description: 'Brake Switch Correlation', frequency: 19, trend: 'down', change: -5 },
]

// ── SVG Chart Component ─────────────────────────────────────────────────────

function TrendChart({
  data,
  color,
  height = 200,
  showAnomalies = true,
  comparisonData,
}: {
  data: DataPoint[]
  color: string
  height?: number
  showAnomalies?: boolean
  comparisonData?: DataPoint[]
}) {
  const width = 700
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const allValues = [...data.map((d) => d.value), ...(comparisonData?.map((d) => d.value) || [])]
  const minVal = Math.min(...allValues) * 0.9
  const maxVal = Math.max(...allValues) * 1.1
  const range = maxVal - minVal || 1

  const toX = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * chartW
  const toY = (v: number) => padding.top + chartH - ((v - minVal) / range) * chartH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.value)}`).join(' ')
  const areaPath = `${linePath} L${toX(data.length - 1)},${padding.top + chartH} L${padding.left},${padding.top + chartH} Z`

  const compLinePath = comparisonData
    ? comparisonData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.value)}`).join(' ')
    : ''

  const yTicks = 5
  const yStep = range / (yTicks - 1)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Y-axis grid lines */}
      {Array.from({ length: yTicks }).map((_, i) => {
        const val = minVal + i * yStep
        const y = toY(val)
        return (
          <g key={`yt-${i}`}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e2a3a" strokeWidth="0.5" />
            <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="#475569" fontSize="8" fontFamily="monospace">
              {val.toFixed(0)}
            </text>
          </g>
        )
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const showEvery = data.length > 15 ? Math.ceil(data.length / 12) : 1
        if (i % showEvery !== 0) return null
        return (
          <text key={`xl-${i}`} x={toX(i)} y={height - 5} textAnchor="middle" fill="#475569" fontSize="7">
            {d.label}
          </text>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill={color} opacity="0.08" />

      {/* Comparison line */}
      {comparisonData && compLinePath && (
        <path d={compLinePath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      )}

      {/* Main line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {data.map((d, i) => {
        if (data.length > 20 && i % 2 !== 0) return null
        return (
          <circle
            key={`dp-${i}`}
            cx={toX(i)}
            cy={toY(d.value)}
            r={d.isAnomaly && showAnomalies ? 4 : 2.5}
            fill={d.isAnomaly && showAnomalies ? '#ef4444' : color}
            stroke={d.isAnomaly && showAnomalies ? '#ef4444' : color}
            strokeWidth="1"
          />
        )
      })}

      {/* Anomaly markers */}
      {showAnomalies &&
        data.map(
          (d, i) =>
            d.isAnomaly && (
              <g key={`anom-${i}`}>
                <circle cx={toX(i)} cy={toY(d.value)} r="8" fill="#ef4444" opacity="0.15">
                  <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0;0.15" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x={toX(i)} y={toY(d.value) - 12} textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="600">
                  Anomaly
                </text>
              </g>
            )
        )}
    </svg>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function TrendsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [metric, setMetric] = useState<MetricType>('DTC Frequency')
  const [comparisonMode, setComparisonMode] = useState(false)

  const data = useMemo(() => generateData(timeRange, metric), [timeRange, metric])
  const comparisonData = useMemo(
    () => (comparisonMode ? generateData('30d', metric) : undefined),
    [comparisonMode, metric]
  )

  const metricColors: Record<MetricType, string> = {
    'DTC Frequency': '#ef4444',
    'Repair Time': '#f59e0b',
    'Parts Cost': '#8b5cf6',
    'Vehicle Health Score': '#10b981',
    'AI Prediction Accuracy': '#00d4ff',
  }

  const metricIcons: Record<MetricType, React.ReactNode> = {
    'DTC Frequency': <AlertTriangle className="h-4 w-4" />,
    'Repair Time': <Clock className="h-4 w-4" />,
    'Parts Cost': <BarChart3 className="h-4 w-4" />,
    'Vehicle Health Score': <Car className="h-4 w-4" />,
    'AI Prediction Accuracy': <Target className="h-4 w-4" />,
  }

  const currentColor = metricColors[metric]
  const latestValue = data[data.length - 1]?.value ?? 0
  const prevValue = data[data.length - 2]?.value ?? 0
  const changePercent = prevValue ? (((latestValue - prevValue) / prevValue) * 100).toFixed(1) : '0'
  const isPositiveChange = Number(changePercent) >= 0
  const anomalyCount = data.filter((d) => d.isAnomaly).length

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Trends & Analytics</h1>
          </div>
          <p className="text-xs text-[#64748b]">Data trends, pattern analysis, and anomaly detection</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setComparisonMode(!comparisonMode)}
            className={`h-7 text-[10px] gap-1 border-[#1e2a3a] ${
              comparisonMode
                ? 'bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30'
                : 'bg-[#151d2b] text-[#94a3b8]'
            }`}
          >
            <GitCompare className="h-3 w-3" />
            Compare
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:text-[#e2e8f0]"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#64748b]" />
          {(['24h', '7d', '30d', '90d', '1y'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                timeRange === r
                  ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                  : 'bg-[#151d2b] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Activity className="h-3.5 w-3.5 text-[#64748b]" />
          {(Object.keys(metricColors) as MetricType[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${
                metric === m
                  ? `border`
                  : 'bg-[#151d2b] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8]'
              }`}
              style={
                metric === m
                  ? { backgroundColor: `${metricColors[m]}15`, color: metricColors[m], borderColor: `${metricColors[m]}30` }
                  : undefined
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Current</div>
            <div className="text-2xl font-bold" style={{ color: currentColor }}>
              {latestValue.toFixed(1)}
            </div>
            <div className="text-[10px] text-[#475569]">{metric}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Change</div>
            <div className={`text-2xl font-bold flex items-center gap-1 ${isPositiveChange ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
              {isPositiveChange ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {changePercent}%
            </div>
            <div className="text-[10px] text-[#475569]">vs previous period</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Anomalies</div>
            <div className="text-2xl font-bold text-[#ef4444]">{anomalyCount}</div>
            <div className="text-[10px] text-[#475569]">Detected in range</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Data Points</div>
            <div className="text-2xl font-bold text-[#8b5cf6]">{data.length}</div>
            <div className="text-[10px] text-[#475569]">In selected range</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                  {metricIcons[metric]}
                  {metric} Trend
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`${comparisonMode ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30' : 'bg-[#1e2a3a] text-[#64748b] border-[#1e2a3a]'} text-[9px] border`}>
                    <LineChart className="h-3 w-3 mr-1" />
                    {timeRange}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={data}
                color={currentColor}
                comparisonData={comparisonData}
                showAnomalies
              />
              {comparisonMode && (
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#1e2a3a]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: currentColor }} />
                    <span className="text-[9px] text-[#64748b]">Current Period</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-0.5 w-4 rounded-full bg-[#8b5cf6]" style={{ borderStyle: 'dashed' }} />
                    <span className="text-[9px] text-[#64748b]">Comparison Period</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
                    <span className="text-[9px] text-[#64748b]">Anomaly</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fleet Health Trend */}
          <Card className="bg-[#151d2b] border-[#1e2a3a] mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#10b981]" />
                Fleet Health Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={generateData(timeRange, 'Vehicle Health Score')}
                color="#10b981"
                height={150}
                showAnomalies={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Most Common DTCs Trend */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                Top DTCs Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topDTCs.map((dtc, i) => (
                <div key={dtc.code} className="bg-[#0f1923] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#ef4444]">{dtc.code}</span>
                      <Badge
                        className={`text-[8px] border ${
                          dtc.trend === 'up'
                            ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                            : dtc.trend === 'down'
                            ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                            : 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                        }`}
                      >
                        {dtc.trend === 'up' ? '↑' : dtc.trend === 'down' ? '↓' : '→'}{' '}
                        {Math.abs(dtc.change)}%
                      </Badge>
                    </div>
                    <span className="text-xs text-[#e2e8f0] font-mono">{dtc.frequency}</span>
                  </div>
                  <div className="text-[10px] text-[#64748b] mb-1.5">{dtc.description}</div>
                  <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(dtc.frequency / topDTCs[0].frequency) * 100}%`,
                        backgroundColor:
                          dtc.trend === 'up' ? '#ef4444' : dtc.trend === 'down' ? '#10b981' : '#f59e0b',
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Prediction Accuracy Trend */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Target className="h-4 w-4 text-[#00d4ff]" />
                AI Prediction Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={generateData(timeRange, 'AI Prediction Accuracy')}
                color="#00d4ff"
                height={140}
                showAnomalies={false}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-[#0f1923] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#64748b] uppercase">Avg Accuracy</div>
                  <div className="text-sm font-bold text-[#00d4ff]">91.2%</div>
                </div>
                <div className="bg-[#0f1923] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#64748b] uppercase">Improvement</div>
                  <div className="text-sm font-bold text-[#10b981]">+3.4%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#f59e0b]" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Peak DTC Hour', value: '2:00 PM', color: '#ef4444' },
                { label: 'Avg Repair Time', value: '3.2 hrs', color: '#f59e0b' },
                { label: 'Cost Trend', value: '+8% MoM', color: '#8b5cf6' },
                { label: 'Fleet Avg Health', value: '87.3%', color: '#10b981' },
                { label: 'Prediction Model', value: 'v4.2', color: '#00d4ff' },
              ].map((insight) => (
                <div key={insight.label} className="flex items-center justify-between bg-[#0f1923] rounded-lg p-2.5">
                  <span className="text-[10px] text-[#94a3b8]">{insight.label}</span>
                  <span className="text-xs font-semibold" style={{ color: insight.color }}>
                    {insight.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
