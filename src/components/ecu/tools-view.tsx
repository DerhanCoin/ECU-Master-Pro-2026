'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wrench,
  Flame,
  Gauge,
  Cylinder,
  Fuel,
  Wind,
  Thermometer,
  AlertTriangle,
  ClipboardCheck,
  Battery,
  Zap,
  Activity,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Settings,
  ChevronRight,
  Search,
  Car,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ToolCategory = 'all' | 'engine' | 'electrical' | 'emissions' | 'drivetrain'

interface DiagnosticTool {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: React.ElementType
  categoryColor: string
  lastRun?: string
  status?: 'pass' | 'fail' | 'running' | 'idle'
}

const TOOLS: DiagnosticTool[] = [
  { id: 'smoke', name: 'Smoke Test', description: 'EVAP system leak detection via smoke pressure test', category: 'emissions', icon: Flame, categoryColor: '#f59e0b', lastRun: '2 hours ago', status: 'pass' },
  { id: 'compression', name: 'Compression Test', description: 'Measure cylinder compression pressure for each cylinder', category: 'engine', icon: Gauge, categoryColor: '#00d4ff', lastRun: '1 day ago', status: 'idle' },
  { id: 'balance', name: 'Cylinder Balance', description: 'Compare cylinder contribution to engine output', category: 'engine', icon: Cylinder, categoryColor: '#00d4ff', lastRun: '3 days ago', status: 'idle' },
  { id: 'fuel-pressure', name: 'Fuel Pressure Test', description: 'Verify fuel rail pressure under various load conditions', category: 'engine', icon: Fuel, categoryColor: '#00d4ff', lastRun: '5 hours ago', status: 'pass' },
  { id: 'evap', name: 'EVAP Test', description: 'Evaporative emission system integrity verification', category: 'emissions', icon: Wind, categoryColor: '#f59e0b', lastRun: '1 week ago', status: 'fail' },
  { id: 'o2sensor', name: 'O2 Sensor Test', description: 'Oxygen sensor response time and voltage range check', category: 'emissions', icon: Thermometer, categoryColor: '#f59e0b', lastRun: '12 hours ago', status: 'pass' },
  { id: 'catalyst', name: 'Catalyst Monitor', description: 'Catalytic converter efficiency monitoring test', category: 'emissions', icon: Flame, categoryColor: '#f59e0b', status: 'idle' },
  { id: 'misfire', name: 'Misfire Counter', description: 'Real-time cylinder misfire detection and counting', category: 'engine', icon: AlertTriangle, categoryColor: '#00d4ff', lastRun: '30 min ago', status: 'fail' },
  { id: 'readiness', name: 'Readiness Monitor', description: 'OBD-II readiness flag status verification', category: 'emissions', icon: ClipboardCheck, categoryColor: '#f59e0b', lastRun: '1 hour ago', status: 'pass' },
  { id: 'battery', name: 'Battery Test', description: '12V battery health, CCA, and state of charge test', category: 'electrical', icon: Battery, categoryColor: '#8b5cf6', lastRun: '4 hours ago', status: 'pass' },
  { id: 'alternator', name: 'Alternator Test', description: 'Charging system output and voltage regulation check', category: 'electrical', icon: Zap, categoryColor: '#8b5cf6', lastRun: '4 hours ago', status: 'pass' },
  { id: 'parasitic', name: 'Parasitic Draw', description: 'Identify excessive current draw when vehicle is off', category: 'electrical', icon: Activity, categoryColor: '#8b5cf6', status: 'idle' },
]

const CATEGORY_FILTERS: { key: ToolCategory; label: string; color: string; count: number }[] = [
  { key: 'all', label: 'All Tools', color: '#00d4ff', count: TOOLS.length },
  { key: 'engine', label: 'Engine', color: '#00d4ff', count: TOOLS.filter(t => t.category === 'engine').length },
  { key: 'electrical', label: 'Electrical', color: '#8b5cf6', count: TOOLS.filter(t => t.category === 'electrical').length },
  { key: 'emissions', label: 'Emissions', color: '#f59e0b', count: TOOLS.filter(t => t.category === 'emissions').length },
  { key: 'drivetrain', label: 'Drivetrain', color: '#10b981', count: TOOLS.filter(t => t.category === 'drivetrain').length },
]

const RECENTLY_USED = [
  { name: 'Misfire Counter', time: '30 min ago', result: 'fail' as const },
  { name: 'Readiness Monitor', time: '1 hour ago', result: 'pass' as const },
  { name: 'Smoke Test', time: '2 hours ago', result: 'pass' as const },
  { name: 'Fuel Pressure Test', time: '5 hours ago', result: 'pass' as const },
  { name: 'Battery Test', time: '4 hours ago', result: 'pass' as const },
]

// Custom tool builder form state
interface CustomTool {
  name: string
  pids: string[]
  thresholds: string
}

export function ToolsView() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all')
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [runningTool, setRunningTool] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [customTool, setCustomTool] = useState<CustomTool>({ name: '', pids: [], thresholds: '' })
  const [customTools, setCustomTools] = useState<CustomTool[]>([])

  const filteredTools = activeCategory === 'all' ? TOOLS : TOOLS.filter(t => t.category === activeCategory)

  const handleRunTool = (toolId: string) => {
    setRunningTool(toolId)
    setTimeout(() => setRunningTool(null), 3000)
  }

  const handleAddCustomTool = () => {
    if (customTool.name.trim()) {
      setCustomTools([...customTools, { ...customTool }])
      setCustomTool({ name: '', pids: [], thresholds: '' })
      setShowBuilder(false)
    }
  }

  const selectedToolData = TOOLS.find(t => t.id === selectedTool)

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Diagnostic Tools</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">{TOOLS.length} Tools</Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Comprehensive diagnostic utilities suite for vehicle testing and analysis
          </p>
        </div>
        <Button size="sm" onClick={() => setShowBuilder(!showBuilder)} className="h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
          <Plus className="h-3 w-3" />Custom Tool
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap transition-all',
              activeCategory === cat.key
                ? 'border-2 shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                : 'border-[#1e2a3a] bg-[#0f1923] text-[#64748b] hover:border-[#2d3f55] hover:text-[#94a3b8]'
            )}
            style={{
              borderColor: activeCategory === cat.key ? cat.color : undefined,
              backgroundColor: activeCategory === cat.key ? `${cat.color}10` : undefined,
              color: activeCategory === cat.key ? cat.color : undefined,
            }}
          >
            {cat.label}
            <span className={cn(
              'text-[9px] px-1.5 py-0.5 rounded-full',
              activeCategory === cat.key ? 'bg-white/10' : 'bg-[#1e2a3a]'
            )}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Custom Tool Builder */}
      {showBuilder && (
        <Card className="bg-[#151d2b] border-[#00d4ff]/30 shadow-[0_0_12px_#00d4ff10]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#00d4ff]" />
              Custom Tool Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Tool Name</label>
                <input
                  type="text"
                  value={customTool.name}
                  onChange={(e) => setCustomTool({ ...customTool, name: e.target.value })}
                  placeholder="e.g., Boost Leak Test"
                  className="w-full h-8 mt-1 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#00d4ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">PIDs to Monitor</label>
                <input
                  type="text"
                  value={customTool.pids.join(', ')}
                  onChange={(e) => setCustomTool({ ...customTool, pids: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="0x01, 0x0C, 0x0D"
                  className="w-full h-8 mt-1 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] font-mono placeholder:text-[#475569] focus:border-[#00d4ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Alert Thresholds</label>
                <input
                  type="text"
                  value={customTool.thresholds}
                  onChange={(e) => setCustomTool({ ...customTool, thresholds: e.target.value })}
                  placeholder="RPM>6000, TEMP>105"
                  className="w-full h-8 mt-1 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] font-mono placeholder:text-[#475569] focus:border-[#00d4ff] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCustomTool} disabled={!customTool.name.trim()} className="h-7 text-[10px] gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
                <Plus className="h-3 w-3" />Add Tool
              </Button>
              <Button size="sm" onClick={() => setShowBuilder(false)} variant="outline" className="h-7 text-[10px] border-[#1e2a3a] bg-[#151d2b] text-[#64748b]">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tool Cards Grid + Recently Used */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tools Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredTools.map((tool) => {
              const ToolIcon = tool.icon
              const isRunning = runningTool === tool.id
              const isSelected = selectedTool === tool.id
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-lg border transition-all text-left group',
                    isSelected
                      ? 'border-[#00d4ff]/40 bg-[#00d4ff]/10 shadow-[0_0_8px_#00d4ff15]'
                      : 'border-[#1e2a3a] bg-[#151d2b] hover:border-[#2d3f55] hover:bg-[#1e2a3a]/30'
                  )}
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${tool.categoryColor}15` }}>
                    <ToolIcon className="h-5 w-5" style={{ color: tool.categoryColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[12px] font-semibold', isSelected ? 'text-[#00d4ff]' : 'text-[#e2e8f0]')}>
                      {tool.name}
                    </div>
                    <div className="text-[10px] text-[#64748b] mt-0.5 line-clamp-2">{tool.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn(
                        'text-[8px] border px-1.5 py-0',
                        tool.category === 'engine' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' :
                        tool.category === 'electrical' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30' :
                        tool.category === 'emissions' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' :
                        'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                      )}>
                        {tool.category}
                      </Badge>
                      {tool.lastRun && (
                        <span className="text-[8px] text-[#475569]">Last: {tool.lastRun}</span>
                      )}
                      {tool.status === 'pass' && <CheckCircle2 className="h-3 w-3 text-[#10b981]" />}
                      {tool.status === 'fail' && <XCircle className="h-3 w-3 text-[#ef4444]" />}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#475569] group-hover:text-[#00d4ff] flex-shrink-0 mt-1 transition-colors" />
                </button>
              )
            })}

            {/* Custom Tools */}
            {customTools.map((ct, i) => (
              <div key={`custom-${i}`} className="flex items-start gap-3 p-4 rounded-lg border border-[#8b5cf6]/30 bg-[#8b5cf6]/5">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#8b5cf6]/15">
                  <Settings className="h-5 w-5 text-[#8b5cf6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[#e2e8f0]">{ct.name}</div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">
                    PIDs: {ct.pids.length > 0 ? ct.pids.join(', ') : 'None set'} · Thresholds: {ct.thresholds || 'None set'}
                  </div>
                  <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[8px] mt-2">Custom</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Used + Execution Status */}
        <div className="space-y-4">
          {/* Recently Used Tools */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#00d4ff]" />
                Recently Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
                {RECENTLY_USED.map((tool, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-[#0f1923] border border-[#1e2a3a] hover:border-[#2d3f55] transition-colors">
                    <div className={cn(
                      'h-6 w-6 rounded flex items-center justify-center flex-shrink-0',
                      tool.result === 'pass' ? 'bg-[#10b981]/15' : 'bg-[#ef4444]/15'
                    )}>
                      {tool.result === 'pass' ? (
                        <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                      ) : (
                        <XCircle className="h-3 w-3 text-[#ef4444]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-[#e2e8f0]">{tool.name}</div>
                      <div className="text-[8px] text-[#475569]">{tool.time}</div>
                    </div>
                    <Badge className={cn(
                      'text-[8px] border px-1 py-0 h-3.5',
                      tool.result === 'pass' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                    )}>
                      {tool.result.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tool Execution Status */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00d4ff]" />
                Execution Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedToolData ? (
                <>
                  <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
                    <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-1">Selected Tool</div>
                    <div className="text-sm font-semibold text-[#e2e8f0]">{selectedToolData.name}</div>
                    <div className="text-[10px] text-[#64748b] mt-1">{selectedToolData.description}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5 text-center">
                      <div className="text-[10px] text-[#475569]">Category</div>
                      <Badge className={cn(
                        'text-[9px] mt-1',
                        selectedToolData.category === 'engine' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' :
                        selectedToolData.category === 'electrical' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30' :
                        selectedToolData.category === 'emissions' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' :
                        'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                      )}>
                        {selectedToolData.category}
                      </Badge>
                    </div>
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2.5 text-center">
                      <div className="text-[10px] text-[#475569]">Last Result</div>
                      <Badge className={cn(
                        'text-[9px] mt-1',
                        selectedToolData.status === 'pass' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' :
                        selectedToolData.status === 'fail' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' :
                        'bg-[#1e2a3a] text-[#64748b]'
                      )}>
                        {selectedToolData.status?.toUpperCase() || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  {runningTool === selectedToolData.id && (
                    <div className="bg-[#0f1923] border border-[#00d4ff]/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-[#00d4ff] animate-pulse shadow-[0_0_6px_#00d4ff]" />
                        <span className="text-[10px] text-[#00d4ff] font-semibold">Running test...</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00d4ff] rounded-full animate-pulse" style={{ width: '60%', boxShadow: '0 0 8px #00d4ff40' }} />
                      </div>
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={() => handleRunTool(selectedToolData.id)}
                    disabled={runningTool === selectedToolData.id}
                    className="w-full h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                  >
                    <Play className="h-3 w-3" />
                    {runningTool === selectedToolData.id ? 'Running...' : 'Run Tool'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Search className="h-8 w-8 text-[#475569] mx-auto mb-2" />
                  <div className="text-xs text-[#475569]">Select a tool to view details</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#10b981] tabular-nums">{TOOLS.filter(t => t.status === 'pass').length}</div>
                  <div className="text-[9px] text-[#475569]">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#ef4444] tabular-nums">{TOOLS.filter(t => t.status === 'fail').length}</div>
                  <div className="text-[9px] text-[#475569]">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
