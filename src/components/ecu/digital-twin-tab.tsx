'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Cpu,
  Radio,
  Shield,
  Car,
  Gauge,
  ThermometerSun,
  MonitorSpeaker,
  Lock,
  Eye,
  RefreshCw,
  Play,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Database,
  Target,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ModuleStatus = 'Active' | 'Standby' | 'Error' | 'Offline'

interface ECUModule {
  id: string
  name: string
  status: ModuleStatus
  dataFlow: number
  icon: React.ReactNode
  connections: string[]
}

const statusConfig: Record<ModuleStatus, { color: string; bgColor: string; label: string }> = {
  Active: { color: '#10b981', bgColor: '#10b98115', label: 'Active' },
  Standby: { color: '#f59e0b', bgColor: '#f59e0b15', label: 'Standby' },
  Error: { color: '#ef4444', bgColor: '#ef444415', label: 'Error' },
  Offline: { color: '#64748b', bgColor: '#64748b15', label: 'Offline' },
}

const ecuModules: ECUModule[] = [
  {
    id: 'engine',
    name: 'Engine ECU',
    status: 'Active',
    dataFlow: 245,
    icon: <Cpu className="h-5 w-5" />,
    connections: ['transmission', 'abs', 'instrument'],
  },
  {
    id: 'transmission',
    name: 'Transmission ECU',
    status: 'Active',
    dataFlow: 180,
    icon: <ArrowRight className="h-5 w-5" />,
    connections: ['engine', 'abs'],
  },
  {
    id: 'abs',
    name: 'ABS Module',
    status: 'Active',
    dataFlow: 120,
    icon: <Shield className="h-5 w-5" />,
    connections: ['engine', 'transmission', 'adas'],
  },
  {
    id: 'airbag',
    name: 'Airbag Module',
    status: 'Standby',
    dataFlow: 15,
    icon: <Radio className="h-5 w-5" />,
    connections: ['body', 'instrument'],
  },
  {
    id: 'body',
    name: 'Body Control Module',
    status: 'Active',
    dataFlow: 95,
    icon: <Car className="h-5 w-5" />,
    connections: ['climate', 'infotainment', 'airbag', 'immobilizer'],
  },
  {
    id: 'instrument',
    name: 'Instrument Cluster',
    status: 'Active',
    dataFlow: 68,
    icon: <Gauge className="h-5 w-5" />,
    connections: ['engine', 'airbag', 'adas'],
  },
  {
    id: 'climate',
    name: 'Climate Control',
    status: 'Standby',
    dataFlow: 32,
    icon: <ThermometerSun className="h-5 w-5" />,
    connections: ['body'],
  },
  {
    id: 'infotainment',
    name: 'Infotainment',
    status: 'Active',
    dataFlow: 210,
    icon: <MonitorSpeaker className="h-5 w-5" />,
    connections: ['body', 'adas'],
  },
  {
    id: 'immobilizer',
    name: 'Immobilizer',
    status: 'Active',
    dataFlow: 8,
    icon: <Lock className="h-5 w-5" />,
    connections: ['body', 'engine'],
  },
  {
    id: 'adas',
    name: 'ADAS Module',
    status: 'Error',
    dataFlow: 156,
    icon: <Eye className="h-5 w-5" />,
    connections: ['abs', 'infotainment', 'instrument'],
  },
]

// Define which modules connect to which for the visual grid connections
// Grid positions: row/col
const modulePositions: Record<string, { row: number; col: number }> = {
  engine: { row: 0, col: 0 },
  transmission: { row: 0, col: 1 },
  abs: { row: 0, col: 2 },
  airbag: { row: 1, col: 0 },
  body: { row: 1, col: 1 },
  instrument: { row: 1, col: 2 },
  climate: { row: 2, col: 0 },
  infotainment: { row: 2, col: 1 },
  immobilizer: { row: 2, col: 2 },
  adas: { row: 3, col: 0 },
}

type SimulationType = 'stress' | 'lifetime' | 'whatif'

export function DigitalTwinTab() {
  const [simulationType, setSimulationType] = useState<SimulationType>('stress')
  const [isRunning, setIsRunning] = useState(false)
  const [simulationResult, setSimulationResult] = useState<string | null>(null)

  const handleRunSimulation = () => {
    setIsRunning(true)
    setSimulationResult(null)
    setTimeout(() => {
      setIsRunning(false)
      setSimulationResult('completed')
    }, 3000)
  }

  const totalDataFlow = ecuModules.reduce((sum, m) => sum + m.dataFlow, 0)
  const activeCount = ecuModules.filter((m) => m.status === 'Active').length

  return (
    <div className="space-y-6">
      {/* Digital Twin Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#64748b] font-medium uppercase tracking-wide">
              Sync Status
            </span>
            <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b98150',
              }}
            />
            <span className="text-lg font-bold text-[#10b981]">Active</span>
          </div>
        </div>

        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#64748b] font-medium uppercase tracking-wide">
              Last Sync
            </span>
            <Clock className="h-4 w-4 text-[#00d4ff]" />
          </div>
          <div className="text-lg font-bold text-[#e2e8f0]">2 min ago</div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Auto-refresh enabled</div>
        </div>

        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#64748b] font-medium uppercase tracking-wide">
              Data Points
            </span>
            <Database className="h-4 w-4 text-[#8b5cf6]" />
          </div>
          <div className="text-lg font-bold text-[#e2e8f0]">1,247</div>
          <div className="text-[10px] text-[#64748b] mt-0.5">
            {totalDataFlow} bytes/sec total flow
          </div>
        </div>

        <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#64748b] font-medium uppercase tracking-wide">
              Model Accuracy
            </span>
            <Target className="h-4 w-4 text-[#f59e0b]" />
          </div>
          <div className="text-lg font-bold text-[#e2e8f0]">94.2%</div>
          <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full rounded-full"
              style={{
                width: '94.2%',
                backgroundColor: '#f59e0b',
              }}
            />
          </div>
        </div>
      </div>

      {/* ECU Module Diagram */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#00d4ff]" />
            ECU Module Diagram
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-[10px]">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-[#64748b]">{config.label}</span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Module Grid with connections */}
        <div className="relative bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-6">
          {/* Connection Lines - SVG overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ top: 0 }}>
            {/* Draw connections between modules */}
            {ecuModules.map((mod) =>
              mod.connections.map((targetId) => {
                const source = modulePositions[mod.id]
                const target = modulePositions[targetId]
                if (!source || !target) return null
                // Only draw each connection once (lower id to higher id)
                if (mod.id > targetId) return null
                return (
                  <line
                    key={`${mod.id}-${targetId}`}
                    x1={`${(source.col / 2) * 100 + 16.6}%`}
                    y1={`${(source.row / 3.5) * 100 + 12}%`}
                    x2={`${(target.col / 2) * 100 + 16.6}%`}
                    y2={`${(target.row / 3.5) * 100 + 12}%`}
                    stroke="#1e2a3a"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                )
              })
            )}
          </svg>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {ecuModules.map((mod) => {
              const config = statusConfig[mod.status]
              return (
                <div
                  key={mod.id}
                  className={cn(
                    'bg-[#0f1923] border rounded-lg p-4 transition-all duration-200 hover:border-[#2d3f55] cursor-pointer group',
                    mod.status === 'Error' ? 'border-[#ef4444]/30' : 'border-[#1e2a3a]'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-md"
                        style={{ backgroundColor: config.bgColor }}
                      >
                        <span style={{ color: config.color }}>{mod.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-[#e2e8f0] group-hover:text-[#00d4ff] transition-colors">
                          {mod.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: config.color,
                              boxShadow: `0 0 4px ${config.color}50`,
                            }}
                          />
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: config.color }}
                          >
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-[#64748b]" />
                      <span className="text-[10px] text-[#64748b]">Data Flow</span>
                    </div>
                    <span
                      className="text-[11px] font-mono font-semibold"
                      style={{
                        color: mod.dataFlow > 100 ? '#00d4ff' : mod.dataFlow > 30 ? '#94a3b8' : '#64748b',
                      }}
                    >
                      {mod.dataFlow} B/s
                    </span>
                  </div>

                  {/* Mini data flow bar */}
                  <div className="w-full h-1 bg-[#1e2a3a] rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((mod.dataFlow / 250) * 100, 100)}%`,
                        backgroundColor: config.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>

                  {/* Connection count */}
                  <div className="flex items-center gap-1 mt-2">
                    <Zap className="h-3 w-3 text-[#64748b]" />
                    <span className="text-[10px] text-[#475569]">
                      {mod.connections.length} connection{mod.connections.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Simulation Section */}
      <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Play className="h-4 w-4 text-[#00d4ff]" />
            Simulation
          </h2>
          <div className="flex items-center gap-3">
            <Select
              value={simulationType}
              onValueChange={(val) => {
                setSimulationType(val as SimulationType)
                setSimulationResult(null)
              }}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151d2b] border-[#1e2a3a]">
                <SelectItem value="stress" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                  Stress Test
                </SelectItem>
                <SelectItem value="lifetime" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                  Lifetime Prediction
                </SelectItem>
                <SelectItem value="whatif" className="text-xs text-[#94a3b8] focus:text-[#e2e8f0] focus:bg-[#1e2a3a]">
                  What-If Analysis
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
              onClick={handleRunSimulation}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Simulation description */}
        <div className="mb-4">
          {simulationType === 'stress' && (
            <p className="text-[11px] text-[#64748b]">
              Simulates extreme operating conditions to evaluate component resilience and failure thresholds.
            </p>
          )}
          {simulationType === 'lifetime' && (
            <p className="text-[11px] text-[#64748b]">
              Predicts remaining useful life for each ECU component based on historical and real-time data.
            </p>
          )}
          {simulationType === 'whatif' && (
            <p className="text-[11px] text-[#64748b]">
              Explore &quot;what-if&quot; scenarios by modifying parameters and observing predicted outcomes.
            </p>
          )}
        </div>

        {/* Results Area */}
        <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-6">
          {isRunning ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative mb-4">
                <div className="h-16 w-16 rounded-full border-2 border-[#1e2a3a] border-t-[#00d4ff] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-[#00d4ff] animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-medium text-[#e2e8f0] mb-1">Running Simulation...</p>
              <p className="text-[11px] text-[#64748b]">
                Processing digital twin data with{' '}
                {simulationType === 'stress'
                  ? 'Stress Test'
                  : simulationType === 'lifetime'
                    ? 'Lifetime Prediction'
                    : 'What-If Analysis'}{' '}
                model
              </p>
            </div>
          ) : simulationResult === 'completed' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
                <h3 className="text-sm font-semibold text-[#e2e8f0]">Simulation Complete</h3>
              </div>
              {simulationType === 'stress' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Max Stress Threshold
                    </div>
                    <div className="text-lg font-bold text-[#ef4444]">92%</div>
                    <div className="text-[10px] text-[#64748b]">ADAS Module exceeded</div>
                  </div>
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Components Stable
                    </div>
                    <div className="text-lg font-bold text-[#10b981]">{activeCount}/10</div>
                    <div className="text-[10px] text-[#64748b]">Under normal parameters</div>
                  </div>
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Risk Assessment
                    </div>
                    <div className="text-lg font-bold text-[#f59e0b]">Moderate</div>
                    <div className="text-[10px] text-[#64748b]">1 module in error state</div>
                  </div>
                </div>
              )}
              {simulationType === 'lifetime' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Avg. Remaining Life
                    </div>
                    <div className="text-lg font-bold text-[#00d4ff]">4.2 yrs</div>
                    <div className="text-[10px] text-[#64748b]">Across all modules</div>
                  </div>
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Shortest Life
                    </div>
                    <div className="text-lg font-bold text-[#ef4444]">1.8 yrs</div>
                    <div className="text-[10px] text-[#64748b]">ADAS Module</div>
                  </div>
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Confidence
                    </div>
                    <div className="text-lg font-bold text-[#10b981]">89.3%</div>
                    <div className="text-[10px] text-[#64748b]">Model prediction accuracy</div>
                  </div>
                </div>
              )}
              {simulationType === 'whatif' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Scenario Impact
                    </div>
                    <div className="text-lg font-bold text-[#8b5cf6]">+23%</div>
                    <div className="text-[10px] text-[#64748b]">Load increase projected</div>
                  </div>
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Affected Modules
                    </div>
                    <div className="text-lg font-bold text-[#f59e0b]">4</div>
                    <div className="text-[10px] text-[#64748b]">Require recalibration</div>
                  </div>
                  <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">
                      Recommended Action
                    </div>
                    <div className="text-lg font-bold text-[#00d4ff]">Optimize</div>
                    <div className="text-[10px] text-[#64748b]">Firmware update suggested</div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
                  onClick={() => setSimulationResult(null)}
                >
                  Clear Results
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[11px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="p-3 rounded-full bg-[#1e2a3a]/50 mb-3">
                <Cpu className="h-8 w-8 text-[#64748b]" />
              </div>
              <p className="text-sm font-medium text-[#94a3b8] mb-1">No Simulation Results</p>
              <p className="text-[11px] text-[#64748b]">
                Run a simulation to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
