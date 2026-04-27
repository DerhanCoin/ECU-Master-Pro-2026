'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plug,
  Zap,
  Battery,
  BatteryCharging,
  Thermometer,
  Car,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Gauge,
  Cpu,
  ArrowRight,
  ArrowLeftRight,
  CircleDot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ───────────────────────────────────────────────────────────────────

type CellStatus = 'green' | 'yellow' | 'red'
type HybridMode = 'EV Only' | 'Hybrid' | 'Sport' | 'Charge'
type AlertSeverity = 'WARNING' | 'OK' | 'INFO'

interface CellData {
  id: number
  voltage: number
  status: CellStatus
}

interface ChargingSession {
  date: string
  duration: string
  energy: string
  cost: string
  type: string
}

interface EVAlert {
  id: string
  message: string
  severity: AlertSeverity
  timestamp: string
  icon: React.ElementType
}

// ── Generate 96-cell battery pack data ──────────────────────────────────────

function generateCellData(): CellData[] {
  const cells: CellData[] = []
  // Most cells are green (3.6-4.2V), 2-3 yellow (3.4-3.6V), 1 red (below 3.4V)
  const yellowCells = new Set([23, 58, 71])
  const redCells = new Set([47])

  for (let i = 1; i <= 96; i++) {
    let voltage: number
    let status: CellStatus

    if (redCells.has(i)) {
      voltage = 3.28 + Math.random() * 0.08
      status = 'red'
    } else if (yellowCells.has(i)) {
      voltage = 3.42 + Math.random() * 0.16
      status = 'yellow'
    } else {
      voltage = 3.72 + Math.random() * 0.44
      status = 'green'
    }

    cells.push({ id: i, voltage: parseFloat(voltage.toFixed(2)), status })
  }
  return cells
}

const cellData = generateCellData()

const chargingSessions: ChargingSession[] = [
  { date: '2026-02-28', duration: '45 min', energy: '32 kWh', cost: '$4.80', type: 'DC Fast' },
  { date: '2026-02-27', duration: '3h 20min', energy: '58 kWh', cost: '$8.70', type: 'AC Level 2' },
  { date: '2026-02-25', duration: '8h 15min', energy: '64 kWh', cost: '$6.40', type: 'AC Level 1' },
]

const evAlerts: EVAlert[] = [
  {
    id: '1',
    message: 'Cell #47 voltage deviation detected',
    severity: 'WARNING',
    timestamp: '2 min ago',
    icon: AlertTriangle,
  },
  {
    id: '2',
    message: 'Battery cooling system optimal',
    severity: 'OK',
    timestamp: '5 min ago',
    icon: CheckCircle2,
  },
  {
    id: '3',
    message: 'Charger communication: Ready',
    severity: 'INFO',
    timestamp: '1 min ago',
    icon: Info,
  },
]

// ── Charging curve data (0-80% fast charge curve) ───────────────────────────

const chargingCurve = [
  { soc: 10, power: 50 },
  { soc: 20, power: 120 },
  { soc: 30, power: 150 },
  { soc: 40, power: 145 },
  { soc: 50, power: 130 },
  { soc: 60, power: 110 },
  { soc: 70, power: 85 },
  { soc: 80, power: 55 },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCellColor(status: CellStatus): string {
  switch (status) {
    case 'green':
      return '#10b981'
    case 'yellow':
      return '#f59e0b'
    case 'red':
      return '#ef4444'
  }
}

function getAlertColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'WARNING':
      return '#f59e0b'
    case 'OK':
      return '#10b981'
    case 'INFO':
      return '#3b82f6'
  }
}

function getChargeTypeColor(type: string): string {
  switch (type) {
    case 'DC Fast':
      return '#00d4ff'
    case 'AC Level 2':
      return '#10b981'
    case 'AC Level 1':
      return '#94a3b8'
    default:
      return '#64748b'
  }
}

// ── Circular Progress Component (for SOC) ───────────────────────────────────

function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color,
}: {
  value: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e2a3a"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}%
        </span>
        <span className="text-[10px] text-[#64748b] font-medium">SOC</span>
      </div>
    </div>
  )
}

// ── Key Metric Card ─────────────────────────────────────────────────────────

function KeyMetricCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string
  unit: string
  subtitle: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wide">{title}</div>
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-[#64748b]">{unit}</span>
      </div>
      <div className="text-[11px] text-[#475569] mt-1">{subtitle}</div>
    </div>
  )
}

// ── Motor/Inverter Detail Card ──────────────────────────────────────────────

interface DetailMetric {
  label: string
  value: string
  unit: string
  status: 'normal' | 'warning' | 'critical'
}

function SystemDetailCard({
  title,
  icon,
  metrics,
  color,
}: {
  title: string
  icon: React.ReactNode
  metrics: DetailMetric[]
  color: string
}) {
  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <h3 className="text-sm font-semibold text-[#e2e8f0]">{title}</h3>
      </div>
      <div className="space-y-3">
        {metrics.map((metric) => {
          const statusColor =
            metric.status === 'normal'
              ? '#10b981'
              : metric.status === 'warning'
                ? '#f59e0b'
                : '#ef4444'
          return (
            <div key={metric.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: statusColor, boxShadow: `0 0 4px ${statusColor}40` }}
                />
                <span className="text-xs text-[#94a3b8]">{metric.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold" style={{ color: statusColor }}>
                  {metric.value}
                </span>
                <span className="text-[10px] text-[#64748b]">{metric.unit}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function EVHybridView() {
  const [isBMSConnected, setIsBMSConnected] = useState(false)
  const [hybridMode, setHybridMode] = useState<HybridMode>('Hybrid')

  const soc = 78
  const socColor = soc > 50 ? '#10b981' : soc > 20 ? '#f59e0b' : '#ef4444'

  // Count cells by status
  const greenCells = cellData.filter((c) => c.status === 'green').length
  const yellowCells = cellData.filter((c) => c.status === 'yellow').length
  const redCells = cellData.filter((c) => c.status === 'red').length

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* ─── 1. Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plug className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">EV/Hybrid Diagnostics</h1>
              {isBMSConnected && (
                <Badge
                  className="text-[9px] border-0 px-1.5 font-semibold"
                  style={{
                    color: '#10b981',
                    backgroundColor: '#10b98120',
                  }}
                >
                  BMS Connected
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              Electric vehicle battery management and hybrid system analysis
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsBMSConnected(!isBMSConnected)}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              isBMSConnected
                ? 'bg-[#10b981] text-white hover:bg-[#059669]'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            <Plug className="h-3 w-3" />
            {isBMSConnected ? 'Disconnect BMS' : 'Connect BMS'}
          </Button>
        </div>

        {/* ─── 2. Battery Pack Overview ────────────────────────────────────── */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Battery className="h-4 w-4 text-[#10b981]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Battery Pack Overview</h2>
            <Badge className="text-[9px] border-0 bg-[#1e2a3a] text-[#94a3b8] px-1.5">
              96 Cells
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Cell grid + stats */}
            <div className="space-y-4">
              {/* Cell grid visualization */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider">
                    Cell Voltage Map
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: '#10b981' }} />
                      <span className="text-[9px] text-[#64748b]">3.6-4.2V</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
                      <span className="text-[9px] text-[#64748b]">3.4-3.6V</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                      <span className="text-[9px] text-[#64748b]">&lt;3.4V</span>
                    </div>
                  </div>
                </div>
                {/* 8 rows x 12 cols grid */}
                <div className="grid grid-cols-12 gap-1">
                  {cellData.map((cell) => {
                    const color = getCellColor(cell.status)
                    return (
                      <div
                        key={cell.id}
                        className="aspect-[1.4/1] rounded-sm flex items-center justify-center cursor-default transition-all hover:scale-110 hover:z-10 relative group"
                        style={{
                          backgroundColor: `${color}30`,
                          border: `1px solid ${color}50`,
                        }}
                        title={`Cell #${cell.id}: ${cell.voltage}V`}
                      >
                        <span
                          className="text-[7px] font-medium leading-none"
                          style={{ color }}
                        >
                          {cell.voltage}
                        </span>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20">
                          <div className="bg-[#1e2a3a] border border-[#2d3f55] rounded px-2 py-1 whitespace-nowrap shadow-lg">
                            <span className="text-[9px] text-[#e2e8f0]">
                              Cell #{cell.id}: <span style={{ color }}>{cell.voltage}V</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Cell status counts */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e2a3a]">
                  <span className="text-[10px] text-[#64748b]">
                    <span className="font-semibold" style={{ color: '#10b981' }}>{greenCells}</span> Healthy
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    <span className="font-semibold" style={{ color: '#f59e0b' }}>{yellowCells}</span> Warning
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    <span className="font-semibold" style={{ color: '#ef4444' }}>{redCells}</span> Critical
                  </span>
                </div>
              </div>

              {/* Pack summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="text-[10px] text-[#64748b] mb-1">Pack Voltage</div>
                  <div className="text-lg font-bold text-[#e2e8f0]">384.2<span className="text-xs text-[#64748b] ml-0.5">V</span></div>
                </div>
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="text-[10px] text-[#64748b] mb-1">Pack Current</div>
                  <div className="text-lg font-bold text-[#e2e8f0]">12.4<span className="text-xs text-[#64748b] ml-0.5">A</span></div>
                </div>
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="text-[10px] text-[#64748b] mb-1">State of Health</div>
                  <div className="text-lg font-bold text-[#10b981]">94<span className="text-xs text-[#64748b] ml-0.5">%</span></div>
                </div>
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="text-[10px] text-[#64748b] mb-1">Temperature</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-[#00d4ff]">24°C</span>
                    <span className="text-[9px] text-[#64748b]">-</span>
                    <span className="text-sm font-semibold text-[#f59e0b]">31°C</span>
                    <span className="text-[9px] text-[#64748b]">avg</span>
                    <span className="text-sm font-semibold text-[#94a3b8]">27°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SOC circular display */}
            <div className="flex flex-col items-center justify-center gap-3">
              <CircularProgress value={soc} size={140} strokeWidth={10} color={socColor} />
              <div className="text-center">
                <div className="text-[11px] text-[#94a3b8] font-medium">State of Charge</div>
                <div className="text-[10px] text-[#64748b]">Est. range: 312 km</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. Key Metrics Row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KeyMetricCard
            title="Range"
            value="312"
            unit="km"
            subtitle="Estimated remaining"
            icon={<Car className="h-4 w-4" />}
            color="#00d4ff"
          />
          <KeyMetricCard
            title="Energy"
            value="62.4"
            unit="kWh"
            subtitle="Capacity 80 kWh"
            icon={<Zap className="h-4 w-4" />}
            color="#10b981"
          />
          <KeyMetricCard
            title="Charging Rate"
            value="7.2"
            unit="kW"
            subtitle="Level 2"
            icon={<BatteryCharging className="h-4 w-4" />}
            color="#f59e0b"
          />
          <KeyMetricCard
            title="Cell Delta"
            value="28"
            unit="mV"
            subtitle="Imbalance"
            icon={<Gauge className="h-4 w-4" />}
            color="#8b5cf6"
          />
        </div>

        {/* ─── 4. Charging Analysis Section ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Charging session info */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
            <div className="flex items-center gap-2 mb-4">
              <BatteryCharging className="h-4 w-4 text-[#10b981]" />
              <h3 className="text-sm font-semibold text-[#e2e8f0]">Charging Analysis</h3>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#64748b]" />
                  <span className="text-xs text-[#94a3b8]">Status</span>
                </div>
                <Badge
                  className="text-[10px] border-0 font-medium"
                  style={{ color: '#64748b', backgroundColor: '#1e2a3a' }}
                >
                  Not Charging
                </Badge>
              </div>

              {/* Last session details */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[#64748b] mb-1">Last Session</div>
                  <div className="text-sm font-bold text-[#e2e8f0]">45 <span className="text-[10px] text-[#64748b]">min</span></div>
                </div>
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[#64748b] mb-1">Delivered</div>
                  <div className="text-sm font-bold text-[#10b981]">32 <span className="text-[10px] text-[#64748b]">kWh</span></div>
                </div>
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[#64748b] mb-1">Cost</div>
                  <div className="text-sm font-bold text-[#00d4ff]">$4.80</div>
                </div>
              </div>

              {/* Charging curve */}
              <div>
                <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-2">
                  Fast Charge Curve (0-80%)
                </div>
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="flex items-end gap-1.5 h-24">
                    {chargingCurve.map((point) => {
                      const maxPower = 150
                      const heightPercent = (point.power / maxPower) * 100
                      return (
                        <div key={point.soc} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] text-[#64748b]">{point.power}</span>
                          <div
                            className="w-full rounded-t-sm transition-all duration-500"
                            style={{
                              height: `${heightPercent}%`,
                              background: `linear-gradient(to top, #00d4ff40, #00d4ff)`,
                              minHeight: '4px',
                            }}
                          />
                          <span className="text-[8px] text-[#64748b]">{point.soc}%</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e2a3a]">
                    <span className="text-[9px] text-[#64748b]">SOC (%)</span>
                    <span className="text-[9px] text-[#00d4ff]">Peak: 150 kW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charge history table */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#00d4ff]" />
              <h3 className="text-sm font-semibold text-[#e2e8f0]">Charge History</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    <th className="text-left text-[10px] text-[#64748b] font-medium uppercase tracking-wider pb-2 pr-3">Date</th>
                    <th className="text-left text-[10px] text-[#64748b] font-medium uppercase tracking-wider pb-2 pr-3">Duration</th>
                    <th className="text-left text-[10px] text-[#64748b] font-medium uppercase tracking-wider pb-2 pr-3">Energy</th>
                    <th className="text-left text-[10px] text-[#64748b] font-medium uppercase tracking-wider pb-2 pr-3">Cost</th>
                    <th className="text-left text-[10px] text-[#64748b] font-medium uppercase tracking-wider pb-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {chargingSessions.map((session, i) => {
                    const typeColor = getChargeTypeColor(session.type)
                    return (
                      <tr key={i} className="border-b border-[#1e2a3a] last:border-0">
                        <td className="py-2.5 pr-3">
                          <span className="text-xs text-[#94a3b8]">{session.date}</span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="text-xs text-[#e2e8f0] font-medium">{session.duration}</span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="text-xs text-[#10b981] font-medium">{session.energy}</span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="text-xs text-[#00d4ff]">{session.cost}</span>
                        </td>
                        <td className="py-2.5">
                          <Badge
                            className="text-[9px] border-0 px-1.5 py-0 h-4 font-medium"
                            style={{
                              color: typeColor,
                              backgroundColor: `${typeColor}18`,
                            }}
                          >
                            {session.type}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1e2a3a]">
              <div className="text-center">
                <div className="text-[10px] text-[#64748b] mb-0.5">Total Sessions</div>
                <div className="text-sm font-bold text-[#e2e8f0]">3</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[#64748b] mb-0.5">Total Energy</div>
                <div className="text-sm font-bold text-[#10b981]">154 kWh</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[#64748b] mb-0.5">Total Cost</div>
                <div className="text-sm font-bold text-[#00d4ff]">$19.90</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. Motor & Inverter Section ─────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Motor & Inverter</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SystemDetailCard
              title="Electric Motor"
              icon={<Cpu className="h-4 w-4" />}
              color="#00d4ff"
              metrics={[
                { label: 'RPM', value: '4,200', unit: 'rpm', status: 'normal' },
                { label: 'Power', value: '134', unit: 'kW', status: 'normal' },
                { label: 'Torque', value: '290', unit: 'Nm', status: 'normal' },
                { label: 'Efficiency', value: '95.2', unit: '%', status: 'normal' },
                { label: 'Temperature', value: '68', unit: '°C', status: 'normal' },
              ]}
            />
            <SystemDetailCard
              title="Inverter"
              icon={<Zap className="h-4 w-4" />}
              color="#8b5cf6"
              metrics={[
                { label: 'DC Voltage', value: '384', unit: 'V', status: 'normal' },
                { label: 'AC Output', value: '380', unit: 'V', status: 'normal' },
                { label: 'Switching Freq', value: '10', unit: 'kHz', status: 'normal' },
                { label: 'Efficiency', value: '97.8', unit: '%', status: 'normal' },
                { label: 'IGBT Temp', value: '52', unit: '°C', status: 'normal' },
              ]}
            />
          </div>
        </div>

        {/* ─── 6. Hybrid System Section ────────────────────────────────────── */}
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 lg:p-6 transition-all duration-200 hover:border-[#2d3f55]">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw className="h-4 w-4 text-[#f59e0b]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Hybrid System</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Mode toggle + contribution */}
            <div className="space-y-4">
              {/* Mode toggle */}
              <div>
                <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-2">
                  Drive Mode
                </div>
                <div className="flex gap-1.5">
                  {(['EV Only', 'Hybrid', 'Sport', 'Charge'] as HybridMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setHybridMode(mode)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-[10px] font-medium transition-all',
                        hybridMode === mode
                          ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30 shadow-[0_0_8px_#00d4ff20]'
                          : 'bg-[#0f1923] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8] hover:border-[#2d3f55]'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Engine / Motor contribution */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-3">
                  Power Distribution
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#94a3b8]">Engine</span>
                      <span className="text-xs font-semibold text-[#f59e0b]">45%</span>
                    </div>
                    <div className="h-2 w-full bg-[#1e2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: '45%', backgroundColor: '#f59e0b' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#94a3b8]">Electric Motor</span>
                      <span className="text-xs font-semibold text-[#10b981]">55%</span>
                    </div>
                    <div className="h-2 w-full bg-[#1e2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: '55%', backgroundColor: '#10b981' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Regenerative braking */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <RotateCcw className="h-3.5 w-3.5 text-[#10b981]" />
                  <span className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider">
                    Regenerative Braking
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-[#64748b] mb-0.5">Last 24h Recovered</div>
                    <div className="text-lg font-bold text-[#10b981]">4.2 <span className="text-xs text-[#64748b]">kWh</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#64748b] mb-0.5">Regen Efficiency</div>
                    <div className="text-lg font-bold text-[#00d4ff]">89<span className="text-xs text-[#64748b]">%</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Energy flow diagram */}
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-2">
                  Energy Flow Diagram
                </div>
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 w-full">
                    {/* Top row: Battery ↔ Motor */}
                    <div className="flex items-center justify-center gap-4 w-full">
                      {/* Battery */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-16 h-16 rounded-lg border-2 border-[#10b981] bg-[#10b981]/10 flex items-center justify-center">
                          <Battery className="h-6 w-6 text-[#10b981]" />
                        </div>
                        <span className="text-[10px] text-[#10b981] font-medium">Battery</span>
                        <span className="text-[9px] text-[#64748b]">384.2V</span>
                      </div>

                      {/* Arrow: Battery ↔ Motor */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className="relative w-full h-8 flex items-center justify-center">
                          <div className="absolute inset-x-0 top-1/2 h-px bg-[#10b981]/40" />
                          <ArrowLeftRight className="h-4 w-4 text-[#10b981] relative z-10 bg-[#0f1923]" />
                          <div className="absolute top-0 left-1/2 -translate-x-1/2">
                            <span className="text-[8px] text-[#10b981]">DC</span>
                          </div>
                        </div>
                      </div>

                      {/* Motor */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-16 h-16 rounded-lg border-2 border-[#00d4ff] bg-[#00d4ff]/10 flex items-center justify-center">
                          <Cpu className="h-6 w-6 text-[#00d4ff]" />
                        </div>
                        <span className="text-[10px] text-[#00d4ff] font-medium">Motor</span>
                        <span className="text-[9px] text-[#64748b]">134 kW</span>
                      </div>

                      {/* Arrow: Motor → Wheels */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className="relative w-full h-8 flex items-center justify-center">
                          <div className="absolute inset-x-0 top-1/2 h-px bg-[#00d4ff]/40" />
                          <ArrowRight className="h-4 w-4 text-[#00d4ff] relative z-10 bg-[#0f1923]" />
                          <div className="absolute top-0 left-1/2 -translate-x-1/2">
                            <span className="text-[8px] text-[#00d4ff]">AC</span>
                          </div>
                        </div>
                      </div>

                      {/* Wheels */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-16 h-16 rounded-lg border-2 border-[#94a3b8] bg-[#94a3b8]/10 flex items-center justify-center">
                          <Car className="h-6 w-6 text-[#94a3b8]" />
                        </div>
                        <span className="text-[10px] text-[#94a3b8] font-medium">Wheels</span>
                        <span className="text-[9px] text-[#64748b]">290 Nm</span>
                      </div>
                    </div>

                    {/* Engine → Wheels */}
                    <div className="flex items-center justify-center gap-4 w-full">
                      {/* Engine */}
                      <div className="flex flex-col items-center gap-1.5 ml-[calc(25%-2rem)]">
                        <div className="w-16 h-16 rounded-lg border-2 border-[#f59e0b] bg-[#f59e0b]/10 flex items-center justify-center">
                          <Gauge className="h-6 w-6 text-[#f59e0b]" />
                        </div>
                        <span className="text-[10px] text-[#f59e0b] font-medium">Engine</span>
                        <span className="text-[9px] text-[#64748b]">45%</span>
                      </div>

                      {/* Arrow: Engine → Wheels */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className="relative w-full h-8 flex items-center justify-center">
                          <div className="absolute inset-x-0 top-1/2 h-px bg-[#f59e0b]/40" />
                          <ArrowRight className="h-4 w-4 text-[#f59e0b] relative z-10 bg-[#0f1923]" />
                          <div className="absolute top-0 left-1/2 -translate-x-1/2">
                            <span className="text-[8px] text-[#f59e0b]">Mech</span>
                          </div>
                        </div>
                      </div>

                      {/* Regen indicator */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#10b981]/10 border border-[#10b981]/20">
                        <RotateCcw className="h-3 w-3 text-[#10b981]" />
                        <span className="text-[9px] text-[#10b981] font-medium">Regen Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode info */}
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CircleDot className="h-3.5 w-3.5 text-[#00d4ff]" />
                  <span className="text-[11px] text-[#e2e8f0] font-medium">
                    Current Mode: {hybridMode}
                  </span>
                </div>
                <p className="text-[10px] text-[#64748b] mt-1 ml-5.5">
                  {hybridMode === 'EV Only' && 'Running on battery power only. Engine is disengaged for zero-emission driving.'}
                  {hybridMode === 'Hybrid' && 'Optimal blend of electric and combustion power. System automatically selects the most efficient combination.'}
                  {hybridMode === 'Sport' && 'Maximum performance from both power sources. Prioritizes acceleration and power delivery.'}
                  {hybridMode === 'Charge' && 'Engine runs to charge the battery while driving. Preserves EV range for later use.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 7. Alerts & Warnings ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Alerts & Warnings</h2>
            <Badge className="text-[9px] border-0 bg-[#1e2a3a] text-[#94a3b8] px-1.5">
              {evAlerts.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {evAlerts.map((alert) => {
              const Icon = alert.icon
              const color = getAlertColor(alert.severity)
              return (
                <div
                  key={alert.id}
                  className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3 flex items-center gap-3 transition-all duration-200 hover:border-[#2d3f55]"
                >
                  <div
                    className="p-1.5 rounded-md flex-shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#e2e8f0] font-medium truncate">{alert.message}</p>
                  </div>
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-5 font-semibold flex-shrink-0"
                    style={{
                      color,
                      backgroundColor: `${color}20`,
                    }}
                  >
                    {alert.severity}
                  </Badge>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="h-3 w-3 text-[#64748b]" />
                    <span className="text-[10px] text-[#64748b]">{alert.timestamp}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
