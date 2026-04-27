'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Cpu,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Lightbulb,
  Wrench,
  ChevronDown,
  ChevronRight,
  Zap,
  Activity,
  Target,
  BarChart3,
  Shield,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ───────────────────────────────────────────────────────────────────

type Severity = 'CRITICAL' | 'WARNING' | 'INFO'

interface AIFault {
  id: string
  title: string
  severity: Severity
  probability: number
  aiConfidence: number
  rootCause: string
  affectedComponents: string[]
  recommendedAction: string
  estimatedCost: string
  urgency: string
}

interface RepairItem {
  id: string
  week: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Scheduled' | 'Routine'
  costEstimate: string
  completed: boolean
}

interface AIInsight {
  id: string
  type: 'Pattern' | 'Trend' | 'Anomaly'
  text: string
}

// ── Mock Data ───────────────────────────────────────────────────────────────

const aiFaults: AIFault[] = [
  {
    id: 'f1',
    title: 'Catalytic Converter Efficiency Below Threshold',
    severity: 'CRITICAL',
    probability: 94,
    aiConfidence: 97,
    rootCause: 'Oxygen sensor degradation causing improper fuel trim adjustment',
    affectedComponents: ['O2 Sensor Bank 1', 'Catalytic Converter', 'ECM'],
    recommendedAction:
      'Replace upstream O2 sensor (P/N: 06A-906-262B) and retest within 500km',
    estimatedCost: '€280-€350',
    urgency: 'Address within 1,000 km',
  },
  {
    id: 'f2',
    title: 'Transmission Slippage Detected',
    severity: 'WARNING',
    probability: 78,
    aiConfidence: 91,
    rootCause: 'Clutch pack wear causing torque converter lock-up delays',
    affectedComponents: ['TCM', 'Torque Converter', 'Valve Body'],
    recommendedAction:
      'Change transmission fluid and monitor slip ratio for 2 weeks',
    estimatedCost: '€150-€200',
    urgency: 'Monitor at next service',
  },
  {
    id: 'f3',
    title: 'Battery Management System Communication Intermittent',
    severity: 'WARNING',
    probability: 65,
    aiConfidence: 84,
    rootCause: 'Loose CAN bus connection at BMS gateway module',
    affectedComponents: ['BMS', 'CAN Gateway', 'BCM'],
    recommendedAction:
      'Inspect and reseat BMS CAN connector, check pin tension',
    estimatedCost: '€50-€80',
    urgency: 'Schedule inspection',
  },
]

const repairTimeline: RepairItem[] = [
  {
    id: 'r1',
    week: 'Week 1',
    description: 'Replace O2 sensor',
    priority: 'Critical',
    costEstimate: '€280-€350',
    completed: false,
  },
  {
    id: 'r2',
    week: 'Week 2',
    description: 'Transmission fluid change',
    priority: 'High',
    costEstimate: '€150-€200',
    completed: false,
  },
  {
    id: 'r3',
    week: 'Week 3',
    description: 'BMS connector inspection',
    priority: 'Medium',
    costEstimate: '€50-€80',
    completed: false,
  },
  {
    id: 'r4',
    week: 'Month 2',
    description: 'Brake pad replacement',
    priority: 'Scheduled',
    costEstimate: '€320-€400',
    completed: false,
  },
  {
    id: 'r5',
    week: 'Month 3',
    description: 'Full vehicle inspection',
    priority: 'Routine',
    costEstimate: '€150-€200',
    completed: false,
  },
]

const aiInsights: AIInsight[] = [
  {
    id: 'i1',
    type: 'Pattern',
    text: 'Short trips causing DPF regeneration issues',
  },
  {
    id: 'i2',
    type: 'Trend',
    text: 'Battery voltage declining 0.1V/month',
  },
  {
    id: 'i3',
    type: 'Anomaly',
    text: 'Unusual CAN message frequency on ID 0x3E8',
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL':
      return '#ef4444'
    case 'WARNING':
      return '#f59e0b'
    case 'INFO':
      return '#3b82f6'
  }
}

function getPriorityColor(priority: RepairItem['priority']): string {
  switch (priority) {
    case 'Critical':
      return '#ef4444'
    case 'High':
      return '#f59e0b'
    case 'Medium':
      return '#00d4ff'
    case 'Scheduled':
      return '#8b5cf6'
    case 'Routine':
      return '#64748b'
  }
}

function getInsightTypeColor(type: AIInsight['type']): string {
  switch (type) {
    case 'Pattern':
      return '#8b5cf6'
    case 'Trend':
      return '#00d4ff'
    case 'Anomaly':
      return '#ef4444'
  }
}

function getInsightTypeIcon(type: AIInsight['type']) {
  switch (type) {
    case 'Pattern':
      return <Lightbulb className="h-3 w-3" />
    case 'Trend':
      return <TrendingUp className="h-3 w-3" />
    case 'Anomaly':
      return <AlertTriangle className="h-3 w-3" />
  }
}

// ── Circular Health Score ───────────────────────────────────────────────────

function CircularHealthScore({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  // Determine color based on score
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

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
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] text-[#64748b] font-medium">/100</span>
      </div>
    </div>
  )
}

// ── Fault Card Component ────────────────────────────────────────────────────

function FaultCard({ fault }: { fault: AIFault }) {
  const [expanded, setExpanded] = useState(false)
  const severityColor = getSeverityColor(fault.severity)

  return (
    <div className="border border-[#1e2a3a] rounded-lg overflow-hidden transition-all hover:border-[#2d3f55]">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left bg-[#151d2b] hover:bg-[#1a2435] transition-colors"
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[#64748b]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#64748b]" />
          )}
        </div>

        {/* Severity dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: severityColor }}
        />

        {/* Title */}
        <span className="text-xs font-semibold text-[#e2e8f0] flex-1 truncate">
          {fault.title}
        </span>

        {/* Severity badge */}
        <Badge
          className="text-[9px] border-0 px-2 py-0.5 h-5 font-semibold flex-shrink-0"
          style={{
            color: severityColor,
            backgroundColor: `${severityColor}20`,
          }}
        >
          {fault.severity}
        </Badge>

        {/* Probability */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <Target className="h-3 w-3 text-[#8b5cf6]" />
          <span className="text-[10px] font-semibold text-[#8b5cf6]">
            {fault.probability}%
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-[#0f1923] border-t border-[#1e2a3a] p-4 space-y-4">
          {/* Probability & Confidence row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Probability</span>
                <span className="text-xs font-bold" style={{ color: severityColor }}>
                  {fault.probability}%
                </span>
              </div>
              <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${fault.probability}%`, backgroundColor: severityColor }}
                />
              </div>
            </div>
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider">AI Confidence</span>
                <span className="text-xs font-bold text-[#8b5cf6]">
                  {fault.aiConfidence}%
                </span>
              </div>
              <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${fault.aiConfidence}%`, backgroundColor: '#8b5cf6' }}
                />
              </div>
            </div>
          </div>

          {/* Root Cause */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="h-3 w-3 text-[#f59e0b]" />
              <span className="text-[11px] font-semibold text-[#e2e8f0]">Root Cause</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-relaxed bg-[#151d2b] border border-[#1e2a3a] rounded-md p-3">
              {fault.rootCause}
            </p>
          </div>

          {/* Affected Components */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Cpu className="h-3 w-3 text-[#00d4ff]" />
              <span className="text-[11px] font-semibold text-[#e2e8f0]">Affected Components</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fault.affectedComponents.map((comp, i) => (
                <Badge
                  key={i}
                  className="text-[10px] border-0 px-2 py-0.5 h-5 font-medium"
                  style={{
                    color: '#00d4ff',
                    backgroundColor: '#00d4ff15',
                  }}
                >
                  {comp}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recommended Action */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Wrench className="h-3 w-3 text-[#10b981]" />
              <span className="text-[11px] font-semibold text-[#e2e8f0]">Recommended Action</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-relaxed bg-[#151d2b] border border-[#1e2a3a] rounded-md p-3">
              {fault.recommendedAction}
            </p>
          </div>

          {/* Cost & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-md p-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#10b981] flex-shrink-0" />
              <div>
                <div className="text-[9px] text-[#64748b] uppercase tracking-wider">Estimated Cost</div>
                <div className="text-xs font-semibold text-[#e2e8f0]">{fault.estimatedCost}</div>
              </div>
            </div>
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-md p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#f59e0b] flex-shrink-0" />
              <div>
                <div className="text-[9px] text-[#64748b] uppercase tracking-wider">Urgency</div>
                <div className="text-xs font-semibold" style={{ color: severityColor }}>
                  {fault.urgency}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function AIDiagnosticsView() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [scheduledRepairs, setScheduledRepairs] = useState<Set<string>>(new Set())
  const [modelProgress, setModelProgress] = useState(0)

  // Simulate model loading on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setModelProgress(100)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const runAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisComplete(false)
    setAnalysisProgress(0)

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsAnalyzing(false)
          setAnalysisComplete(true)
          return 100
        }
        return prev + Math.random() * 5 + 2
      })
    }, 100)

    // Ensure completion after 3 seconds
    setTimeout(() => {
      clearInterval(interval)
      setAnalysisProgress(100)
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, 3000)
  }

  const toggleScheduled = (id: string) => {
    setScheduledRepairs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-5 w-5 text-[#8b5cf6]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">AI Diagnostics</h1>
              <Badge
                className="text-[9px] border-0 px-2 py-0.5 h-5 font-bold"
                style={{
                  color: '#8b5cf6',
                  backgroundColor: '#8b5cf620',
                }}
              >
                AI
              </Badge>
            </div>
            <p className="text-xs text-[#64748b]">
              Intelligent fault detection and automated repair suggestions
            </p>
          </div>

          <Button
            size="sm"
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              isAnalyzing
                ? 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            {isAnalyzing ? (
              <>
                <Activity className="h-3 w-3 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>

        {/* ── Analysis Progress Bar ────────────────────────────────────── */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#94a3b8] flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-[#8b5cf6] animate-pulse" />
                Running AI diagnostic analysis...
              </span>
              <span className="text-[11px] text-[#8b5cf6] font-medium">
                {Math.min(Math.round(analysisProgress), 100)}%
              </span>
            </div>
            <Progress
              value={Math.min(analysisProgress, 100)}
              className="h-1.5 bg-[#1e2a3a] [&>[data-slot=progress-indicator]]:bg-[#8b5cf6]"
            />
          </div>
        )}

        {/* ── AI Analysis Summary ──────────────────────────────────────── */}
        {analysisComplete && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-[#8b5cf6]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">AI Analysis Summary</h2>
              <Badge
                className="text-[9px] border-0 px-1.5 py-0.5 h-4 font-semibold"
                style={{
                  color: '#10b981',
                  backgroundColor: '#10b98120',
                }}
              >
                Complete
              </Badge>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Circular Health Score */}
              <div className="flex flex-col items-center gap-1">
                <CircularHealthScore score={82} />
                <span className="text-[10px] text-[#64748b] font-medium mt-1">Overall Health Score</span>
              </div>

              {/* Metrics grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Critical</span>
                  </div>
                  <span className="text-2xl font-bold text-[#ef4444]">2</span>
                  <div className="text-[9px] text-[#475569] mt-0.5">Issues</div>
                </div>

                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Warnings</span>
                  </div>
                  <span className="text-2xl font-bold text-[#f59e0b]">5</span>
                  <div className="text-[9px] text-[#475569] mt-0.5">Active</div>
                </div>

                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Resolved</span>
                  </div>
                  <span className="text-2xl font-bold text-[#10b981]">12</span>
                  <div className="text-[9px] text-[#475569] mt-0.5">Issues</div>
                </div>

                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-3.5 w-3.5" style={{ color: '#8b5cf6' }} />
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Confidence</span>
                  </div>
                  <span className="text-2xl font-bold text-[#8b5cf6]">96.3</span>
                  <div className="text-[9px] text-[#475569] mt-0.5">Percent</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Fault Detection */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI-Powered Fault Detection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">AI-Powered Fault Detection</h2>
                {analysisComplete && (
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0.5 h-4"
                    style={{
                      color: '#f59e0b',
                      backgroundColor: '#f59e0b20',
                    }}
                  >
                    {aiFaults.length} detected
                  </Badge>
                )}
              </div>

              {analysisComplete ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {aiFaults.map((fault) => (
                    <FaultCard key={fault.id} fault={fault} />
                  ))}
                </div>
              ) : (
                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-8 text-center">
                  <Brain className="h-10 w-10 text-[#8b5cf6] mx-auto mb-3 opacity-40" />
                  <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">
                    No Analysis Performed
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    Click &quot;Run AI Analysis&quot; to begin intelligent fault detection and diagnostics.
                  </p>
                </div>
              )}
            </div>

            {/* Repair Suggestion Timeline */}
            {analysisComplete && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-[#00d4ff]" />
                  <h2 className="text-sm font-semibold text-[#e2e8f0]">Repair Suggestion Timeline</h2>
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0.5 h-4"
                    style={{
                      color: '#00d4ff',
                      backgroundColor: '#00d4ff20',
                    }}
                  >
                    {repairTimeline.length} items
                  </Badge>
                </div>

                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
                  <div className="space-y-3">
                    {repairTimeline.map((item, index) => {
                      const priorityColor = getPriorityColor(item.priority)
                      const isScheduled = scheduledRepairs.has(item.id)

                      return (
                        <div key={item.id} className="flex items-start gap-3">
                          {/* Timeline dot and line */}
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div
                              className={cn(
                                'w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 mt-1',
                                isScheduled
                                  ? 'bg-[#10b981] border-[#10b981]'
                                  : 'bg-transparent border-[#1e2a3a]'
                              )}
                              style={!isScheduled ? { borderColor: priorityColor } : undefined}
                            />
                            {index < repairTimeline.length - 1 && (
                              <div className="w-px h-8 bg-[#1e2a3a]" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-[#64748b] font-medium">{item.week}</span>
                              <ArrowRight className="h-3 w-3 text-[#1e2a3a]" />
                              <span className="text-xs text-[#e2e8f0] font-medium">{item.description}</span>
                              <Badge
                                className="text-[8px] border-0 px-1.5 py-0 h-4 font-semibold"
                                style={{
                                  color: priorityColor,
                                  backgroundColor: `${priorityColor}20`,
                                }}
                              >
                                {item.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-[#64748b]" />
                                <span className="text-[10px] text-[#94a3b8]">{item.costEstimate}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Checkbox
                                  checked={isScheduled}
                                  onCheckedChange={() => toggleScheduled(item.id)}
                                  className="h-3.5 w-3.5 border-[#1e2a3a] data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
                                />
                                <span className="text-[10px] text-[#64748b]">
                                  {isScheduled ? 'Scheduled' : 'Mark as scheduled'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column: AI Model Status + Learning Panel */}
          <div className="space-y-6">
            {/* AI Model Status Panel */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-[#8b5cf6]" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">AI Model Status</h2>
              </div>

              <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 space-y-3">
                {/* Model name */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Model</span>
                  <span className="text-xs font-semibold text-[#e2e8f0]">Transformer-XL Ensemble v3.2</span>
                </div>

                {/* Training data */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Training Data</span>
                  <span className="text-xs font-medium text-[#94a3b8]">12.4M diagnostic records</span>
                </div>

                {/* Last updated */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Last Updated</span>
                  <span className="text-xs font-medium text-[#94a3b8]">2 hours ago</span>
                </div>

                {/* Accuracy */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Accuracy</span>
                  <span className="text-xs font-bold text-[#10b981]">96.3%</span>
                </div>

                {/* Active inference */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Active Inference</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-xs font-medium text-[#10b981]">Yes</span>
                  </div>
                </div>

                {/* Model loading bar */}
                <div className="pt-2 border-t border-[#1e2a3a]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#64748b]">Model Status</span>
                    <span className="text-[10px] font-medium" style={{ color: modelProgress >= 100 ? '#10b981' : '#8b5cf6' }}>
                      {modelProgress >= 100 ? 'Ready' : 'Loading...'}
                    </span>
                  </div>
                  <Progress
                    value={modelProgress}
                    className="h-1.5 bg-[#1e2a3a] [&>[data-slot=progress-indicator]]:bg-[#8b5cf6]"
                  />
                </div>
              </div>
            </div>

            {/* Learning & Adaptation Panel */}
            {analysisComplete && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-[#8b5cf6]" />
                  <h2 className="text-sm font-semibold text-[#e2e8f0]">Learning & Adaptation</h2>
                </div>

                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 space-y-4">
                  {/* Learning banner */}
                  <div className="bg-[#8b5cf6]10 border border-[#8b5cf6]20 rounded-md p-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-[#8b5cf6] flex-shrink-0" />
                    <span className="text-[11px] text-[#e2e8f0] leading-relaxed">
                      AI has learned <span className="font-bold text-[#8b5cf6]">47 new patterns</span> from your vehicle data
                    </span>
                  </div>

                  {/* Knowledge base coverage */}
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-2">
                      Knowledge Base Coverage
                    </span>
                    <div className="space-y-2">
                      {[
                        { brand: 'VW Group', coverage: 94, color: '#00d4ff' },
                        { brand: 'BMW', coverage: 89, color: '#8b5cf6' },
                        { brand: 'Mercedes', coverage: 91, color: '#10b981' },
                      ].map((item) => (
                        <div key={item.brand}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-[#94a3b8]">{item.brand}</span>
                            <span className="text-[11px] font-semibold" style={{ color: item.color }}>
                              {item.coverage}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${item.coverage}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent insights */}
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-2">
                      Recent Insights
                    </span>
                    <div className="space-y-2">
                      {aiInsights.map((insight) => {
                        const typeColor = getInsightTypeColor(insight.type)
                        return (
                          <div
                            key={insight.id}
                            className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2.5 flex items-start gap-2"
                          >
                            <div
                              className="p-1 rounded flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: `${typeColor}15` }}
                            >
                              <span style={{ color: typeColor }}>{getInsightTypeIcon(insight.type)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Badge
                                  className="text-[8px] border-0 px-1 py-0 h-3.5 font-semibold"
                                  style={{
                                    color: typeColor,
                                    backgroundColor: `${typeColor}20`,
                                  }}
                                >
                                  {insight.type}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-[#94a3b8] leading-relaxed">
                                {insight.text}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
