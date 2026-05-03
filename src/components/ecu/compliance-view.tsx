'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  FileText,
  Download,
  Scale,
  Lock,
  Eye,
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCw,
  Bug,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface ComplianceCategory {
  id: string
  name: string
  standard: string
  score: number
  checks: ComplianceCheck[]
}

interface ComplianceCheck {
  id: string
  name: string
  status: 'pass' | 'fail' | 'partial' | 'not_assessed'
  description: string
  evidence?: string
  last_assessed: string
}

interface TARAEntry {
  id: string
  asset: string
  threat: string
  impact: 'critical' | 'high' | 'medium' | 'low'
  likelihood: 'high' | 'medium' | 'low'
  risk_level: 'critical' | 'high' | 'medium' | 'low'
  mitigation: string
  status: 'mitigated' | 'partially_mitigated' | 'open'
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: ComplianceCategory[] = [
  {
    id: 'cat-r155',
    name: 'Cyber Security Management System',
    standard: 'UNECE R155',
    score: 82,
    checks: [
      { id: 'chk-r155-01', name: 'CSMS Process Established', status: 'pass', description: 'Cyber Security Management System process documented and operational', evidence: 'CSMS-PRO-001 v3.2', last_assessed: '2026-02-28' },
      { id: 'chk-r155-02', name: 'Risk Assessment Completed', status: 'pass', description: 'Vehicle type risk assessment per Annex 5', evidence: 'RA-2026-001', last_assessed: '2026-03-01' },
      { id: 'chk-r155-03', name: 'Vulnerability Monitoring Active', status: 'partial', description: 'Continuous monitoring for threats and vulnerabilities', evidence: 'MON-DASH-URL', last_assessed: '2026-03-10' },
      { id: 'chk-r155-04', name: 'Incident Response Plan', status: 'pass', description: 'Incident response procedures documented and tested', evidence: 'IRP-2026-003', last_assessed: '2026-01-15' },
      { id: 'chk-r155-05', name: 'Supply Chain Security', status: 'fail', description: 'Supplier cybersecurity requirements and verification', evidence: undefined, last_assessed: '2026-03-12' },
      { id: 'chk-r155-06', name: 'Data Forensic Capability', status: 'pass', description: 'Capability to support forensic analysis of cyber incidents', evidence: 'FOR-TOOLS-002', last_assessed: '2026-02-20' },
    ],
  },
  {
    id: 'cat-r156',
    name: 'Software Update Management System',
    standard: 'UNECE R156',
    score: 75,
    checks: [
      { id: 'chk-r156-01', name: 'SUMS Process Established', status: 'pass', description: 'Software Update Management System documented and operational', evidence: 'SUMS-PRO-002 v2.1', last_assessed: '2026-02-28' },
      { id: 'chk-r156-02', name: 'Update Integrity Verification', status: 'pass', description: 'Cryptographic verification of update packages', evidence: 'SIG-VER-003', last_assessed: '2026-03-05' },
      { id: 'chk-r156-03', name: 'Rollback Mechanism', status: 'partial', description: 'Safe rollback if update fails or degraded operation', evidence: 'ROLL-PROC-001', last_assessed: '2026-03-08' },
      { id: 'chk-r156-04', name: 'Version Tracking', status: 'pass', description: 'Software version identification and tracking per vehicle', evidence: 'SBOM-TRACK-001', last_assessed: '2026-03-10' },
      { id: 'chk-r156-05', name: 'User Notification Protocol', status: 'fail', description: 'Driver notification about software updates and their purpose', evidence: undefined, last_assessed: '2026-03-12' },
    ],
  },
  {
    id: 'cat-iso21434',
    name: 'TARA Process Compliance',
    standard: 'ISO 21434',
    score: 88,
    checks: [
      { id: 'chk-iso-01', name: 'Asset Identification', status: 'pass', description: 'All cybersecurity assets identified and classified', evidence: 'TARA-ASSET-001', last_assessed: '2026-03-01' },
      { id: 'chk-iso-02', name: 'Threat Analysis', status: 'pass', description: 'Threat scenarios identified per ISO 21434 clause 15', evidence: 'TARA-THREAT-001', last_assessed: '2026-03-01' },
      { id: 'chk-iso-03', name: 'Impact Assessment', status: 'pass', description: 'Impact ratings assigned for safety, financial, operational, privacy', evidence: 'TARA-IMPACT-001', last_assessed: '2026-03-01' },
      { id: 'chk-iso-04', name: 'Risk Evaluation', status: 'pass', description: 'Risk levels determined using impact × likelihood matrix', evidence: 'TARA-RISK-001', last_assessed: '2026-03-02' },
      { id: 'chk-iso-05', name: 'Risk Treatment Decision', status: 'partial', description: 'Treatment options documented (mitigate, transfer, accept, avoid)', evidence: 'TARA-TREAT-001 (partial)', last_assessed: '2026-03-05' },
      { id: 'chk-iso-06', name: 'Residual Risk Acceptance', status: 'not_assessed', description: 'Residual risks formally accepted by management', evidence: undefined, last_assessed: '2026-03-15' },
    ],
  },
  {
    id: 'cat-gdpr',
    name: 'Data Protection Compliance',
    standard: 'GDPR',
    score: 68,
    checks: [
      { id: 'chk-gdpr-01', name: 'Data Processing Legal Basis', status: 'pass', description: 'Legal basis established for all personal data processing', evidence: 'GDPR-LB-001', last_assessed: '2026-02-15' },
      { id: 'chk-gdpr-02', name: 'Data Minimization', status: 'partial', description: 'Only necessary data collected and retained', evidence: 'DATA-MIN-001 (partial)', last_assessed: '2026-02-20' },
      { id: 'chk-gdpr-03', name: 'Right to Erasure', status: 'fail', description: 'Mechanism for data subjects to request deletion', evidence: undefined, last_assessed: '2026-03-10' },
      { id: 'chk-gdpr-04', name: 'Data Processor Agreements', status: 'pass', description: 'DPAs signed with all data processors', evidence: 'DPA-ALL-2026', last_assessed: '2026-01-30' },
      { id: 'chk-gdpr-05', name: 'Privacy Impact Assessment', status: 'partial', description: 'DPIA conducted for high-risk processing activities', evidence: 'DPIA-2026-001 (partial)', last_assessed: '2026-03-05' },
    ],
  },
]

const MOCK_TARA: TARAEntry[] = [
  { id: 'tara-01', asset: 'OTA Update Channel', threat: 'Man-in-the-middle attack on firmware update', impact: 'high', likelihood: 'medium', risk_level: 'high', mitigation: 'Code signing + TLS 1.3 + certificate pinning', status: 'mitigated' },
  { id: 'tara-02', asset: 'CAN Bus Network', threat: 'Message injection via OBD-II port', impact: 'critical', likelihood: 'medium', risk_level: 'critical', mitigation: 'CAN message authentication (SecOC)', status: 'partially_mitigated' },
  { id: 'tara-03', asset: 'Telematics Unit', threat: 'Remote compromise via cellular interface', impact: 'high', likelihood: 'high', risk_level: 'critical', mitigation: 'Network segmentation + IDPS monitoring', status: 'mitigated' },
  { id: 'tara-04', asset: 'Infotainment System', threat: 'USB media malware propagation', impact: 'medium', likelihood: 'high', risk_level: 'high', mitigation: 'USB sandboxing + file type restrictions', status: 'mitigated' },
  { id: 'tara-05', asset: 'Keyless Entry', threat: 'Relay attack on key fob signal', impact: 'medium', likelihood: 'high', risk_level: 'high', mitigation: 'UWB ranging + motion detection in fob', status: 'partially_mitigated' },
  { id: 'tara-06', asset: 'Sensor Data (LiDAR/Camera)', threat: 'Sensor spoofing / blinding', impact: 'high', likelihood: 'low', risk_level: 'medium', mitigation: 'Multi-sensor fusion + anomaly detection', status: 'mitigated' },
  { id: 'tara-07', asset: 'Vehicle GPS Data', threat: 'Location tracking and profiling', impact: 'medium', likelihood: 'medium', risk_level: 'medium', mitigation: 'Data anonymization + consent management', status: 'open' },
  { id: 'tara-08', asset: 'Diagnostic Interface (OBD)', threat: 'Unauthorized firmware extraction', impact: 'medium', likelihood: 'low', risk_level: 'low', mitigation: 'Access control + firmware encryption', status: 'mitigated' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ComplianceCheck['status'], { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  pass: { color: '#10b981', bgColor: '#10b98120', icon: CheckCircle2, label: 'PASS' },
  fail: { color: '#ef4444', bgColor: '#ef444420', icon: XCircle, label: 'FAIL' },
  partial: { color: '#f59e0b', bgColor: '#f59e0b20', icon: AlertTriangle, label: 'PARTIAL' },
  not_assessed: { color: '#64748b', bgColor: '#64748b20', icon: Clock, label: 'N/A' },
}

const RISK_COLORS: Record<TARAEntry['risk_level'], string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#00d4ff',
  low: '#10b981',
}

const IMPACT_COLORS: Record<TARAEntry['impact'], string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

const LIKELIHOOD_COLORS: Record<TARAEntry['likelihood'], string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

const TARA_STATUS_COLORS: Record<TARAEntry['status'], string> = {
  mitigated: '#10b981',
  partially_mitigated: '#f59e0b',
  open: '#ef4444',
}

// ── HUD Card ───────────────────────────────────────────────────────────────

function HudCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative rounded-lg border border-[#1e2a3a] bg-[#151d2b] p-4', className)}>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00d4ff]" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00d4ff]" />
      {children}
    </div>
  )
}

// ── Circular Score ─────────────────────────────────────────────────────────

function CircularScore({ score, size = 64, strokeWidth = 5 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e2a3a" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function ComplianceView() {
  const [categories] = useState<ComplianceCategory[]>(MOCK_CATEGORIES)
  const [taraEntries] = useState<TARAEntry[]>(MOCK_TARA)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('cat-r155')
  const [searchQuery, setSearchQuery] = useState('')
  const [taraFilter, setTaraFilter] = useState<TARAEntry['risk_level'] | 'ALL'>('ALL')

  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length)

  const totalChecks = categories.reduce((sum, c) => sum + c.checks.length, 0)
  const passCount = categories.reduce((sum, c) => sum + c.checks.filter(ch => ch.status === 'pass').length, 0)
  const failCount = categories.reduce((sum, c) => sum + c.checks.filter(ch => ch.status === 'fail').length, 0)
  const partialCount = categories.reduce((sum, c) => sum + c.checks.filter(ch => ch.status === 'partial').length, 0)

  const filteredTara = taraEntries.filter(entry => taraFilter === 'ALL' || entry.risk_level === taraFilter)

  const gdprCategory = categories.find(c => c.id === 'cat-gdpr')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center">
              <Scale className="h-5 w-5 text-[#10b981]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#e2e8f0]">Regulatory Compliance</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#10b981]/15 text-[#10b981]">
                  ISO 21434
                </Badge>
                <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#00d4ff]/15 text-[#00d4ff]">
                  UNECE R155/R156
                </Badge>
                <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#8b5cf6]/15 text-[#8b5cf6]">
                  GDPR
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Overall Score */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748b] font-medium">Overall Score</span>
              <CircularScore score={overallScore} size={44} strokeWidth={4} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
            >
              <Download className="h-3 w-3" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* ── Summary Bar ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
              <span className="text-[10px] text-[#64748b] font-medium">Passed</span>
            </div>
            <span className="text-lg font-bold text-[#10b981] font-mono">{passCount}<span className="text-[10px] text-[#64748b] font-normal">/{totalChecks}</span></span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-3 w-3 text-[#ef4444]" />
              <span className="text-[10px] text-[#64748b] font-medium">Failed</span>
            </div>
            <span className="text-lg font-bold text-[#ef4444] font-mono">{failCount}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-[#f59e0b]" />
              <span className="text-[10px] text-[#64748b] font-medium">Partial</span>
            </div>
            <span className="text-lg font-bold text-[#f59e0b] font-mono">{partialCount}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="h-3 w-3 text-[#00d4ff]" />
              <span className="text-[10px] text-[#64748b] font-medium">Standards</span>
            </div>
            <span className="text-lg font-bold text-[#00d4ff] font-mono">{categories.length}</span>
          </HudCard>
        </div>

        {/* ── Compliance Category Cards ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const isExpanded = expandedCategory === category.id
            const passInCat = category.checks.filter(c => c.status === 'pass').length
            const failInCat = category.checks.filter(c => c.status === 'fail').length
            const scoreColor = category.score >= 80 ? '#10b981' : category.score >= 60 ? '#f59e0b' : '#ef4444'

            return (
              <HudCard key={category.id} className="p-0 overflow-hidden">
                {/* Card Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-[#1e2a3a]/30 transition-colors text-left"
                >
                  <CircularScore score={category.score} size={48} strokeWidth={4} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#e2e8f0] truncate">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-bold" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
                        {category.standard}
                      </Badge>
                      <span className="text-[10px] text-[#64748b]">{passInCat}/{category.checks.length} checks passed</span>
                      {failInCat > 0 && (
                        <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-bold bg-[#ef4444]/15 text-[#ef4444]">
                          {failInCat} failed
                        </Badge>
                      )}
                    </div>
                    {/* Score Bar */}
                    <div className="h-1 w-full bg-[#0c1219] rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${category.score}%`, backgroundColor: scoreColor }}
                      />
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#64748b] shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#64748b] shrink-0" />
                  )}
                </button>

                {/* Expanded Checks */}
                {isExpanded && (
                  <div className="border-t border-[#1e2a3a]">
                    <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
                      {category.checks.map((check) => {
                        const cfg = STATUS_CONFIG[check.status]
                        const StatusIcon = cfg.icon
                        return (
                          <div
                            key={check.id}
                            className="px-4 py-2.5 border-b border-[#1e2a3a]/50 last:border-b-0 hover:bg-[#1e2a3a]/20 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <StatusIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: cfg.color }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[11px] font-medium text-[#e2e8f0]">{check.name}</span>
                                  <Badge
                                    className="text-[8px] border-0 px-1 py-0 h-3.5 font-bold"
                                    style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                                  >
                                    {cfg.label}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-[#94a3b8] leading-relaxed">{check.description}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  {check.evidence && (
                                    <span className="text-[9px] text-[#64748b]">
                                      Evidence: <span className="text-[#94a3b8] font-mono">{check.evidence}</span>
                                    </span>
                                  )}
                                  <span className="text-[9px] text-[#475569]">
                                    Assessed: {new Date(check.last_assessed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </HudCard>
            )
          })}
        </div>

        {/* ── TARA Matrix ─────────────────────────────────────────────── */}
        <HudCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a]">
            <div className="flex items-center gap-2">
              <Bug className="h-3.5 w-3.5 text-[#ef4444]" />
              <span className="text-xs font-semibold text-[#e2e8f0]">TARA — Threat Assessment & Remediation Analysis</span>
              <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#8b5cf6]/15 text-[#8b5cf6]">
                ISO 21434
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {(['ALL', 'critical', 'high', 'medium', 'low'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setTaraFilter(level)}
                  className={cn(
                    'h-6 px-2 rounded text-[9px] font-semibold transition-colors',
                    taraFilter === level
                      ? 'text-[#0f1923]'
                      : 'bg-[#151d2b] border border-[#1e2a3a] text-[#64748b] hover:text-[#94a3b8]'
                  )}
                  style={taraFilter === level && level !== 'ALL' ? { backgroundColor: RISK_COLORS[level] } : taraFilter === level ? { backgroundColor: '#00d4ff' } : undefined}
                >
                  {level === 'ALL' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_1fr_70px_70px_70px_1fr_90px] gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#475569] border-b border-[#1e2a3a]">
            <span>Asset</span>
            <span>Threat</span>
            <span>Impact</span>
            <span>Likelihood</span>
            <span>Risk</span>
            <span>Mitigation</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          <div
            className="max-h-[320px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}
          >
            {filteredTara.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[1fr_1fr_70px_70px_70px_1fr_90px] gap-2 px-4 py-2.5 text-[10px] border-b border-[#1e2a3a]/50 hover:bg-[#1e2a3a]/20 transition-colors"
              >
                <span className="text-[#e2e8f0] font-medium truncate">{entry.asset}</span>
                <span className="text-[#94a3b8] truncate">{entry.threat}</span>
                <span>
                  <Badge
                    className="text-[8px] border-0 px-1.5 py-0 h-3.5 font-bold"
                    style={{ backgroundColor: `${IMPACT_COLORS[entry.impact]}20`, color: IMPACT_COLORS[entry.impact] }}
                  >
                    {entry.impact.toUpperCase()}
                  </Badge>
                </span>
                <span>
                  <Badge
                    className="text-[8px] border-0 px-1.5 py-0 h-3.5 font-bold"
                    style={{ backgroundColor: `${LIKELIHOOD_COLORS[entry.likelihood]}20`, color: LIKELIHOOD_COLORS[entry.likelihood] }}
                  >
                    {entry.likelihood.toUpperCase()}
                  </Badge>
                </span>
                <span>
                  <Badge
                    className="text-[8px] border-0 px-1.5 py-0 h-3.5 font-bold"
                    style={{ backgroundColor: `${RISK_COLORS[entry.risk_level]}20`, color: RISK_COLORS[entry.risk_level] }}
                  >
                    {entry.risk_level.toUpperCase()}
                  </Badge>
                </span>
                <span className="text-[#94a3b8] truncate">{entry.mitigation}</span>
                <span>
                  <Badge
                    className="text-[8px] border-0 px-1.5 py-0 h-3.5 font-bold"
                    style={{ backgroundColor: `${TARA_STATUS_COLORS[entry.status]}20`, color: TARA_STATUS_COLORS[entry.status] }}
                  >
                    {entry.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </span>
              </div>
            ))}
          </div>

          {/* Risk Matrix Legend */}
          <div className="px-4 py-2.5 border-t border-[#1e2a3a] bg-[#0f1923]/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] mr-3">Risk Matrix:</span>
            <span className="inline-flex items-center gap-1 text-[9px] mr-3"><span className="h-2 w-2 rounded-full bg-[#ef4444]" /> <span className="text-[#94a3b8]">Critical</span></span>
            <span className="inline-flex items-center gap-1 text-[9px] mr-3"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> <span className="text-[#94a3b8]">High</span></span>
            <span className="inline-flex items-center gap-1 text-[9px] mr-3"><span className="h-2 w-2 rounded-full bg-[#00d4ff]" /> <span className="text-[#94a3b8]">Medium</span></span>
            <span className="inline-flex items-center gap-1 text-[9px]"><span className="h-2 w-2 rounded-full bg-[#10b981]" /> <span className="text-[#94a3b8]">Low</span></span>
          </div>
        </HudCard>

        {/* ── GDPR Section ────────────────────────────────────────────── */}
        {gdprCategory && (
          <HudCard className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a]">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-[#8b5cf6]" />
                <span className="text-xs font-semibold text-[#e2e8f0]">GDPR — Data Protection Overview</span>
                <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#8b5cf6]/15 text-[#8b5cf6]">
                  EU 2016/679
                </Badge>
              </div>
              <CircularScore score={gdprCategory.score} size={36} strokeWidth={3} />
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Data Categories */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Data Categories</span>
                  {[
                    { name: 'Vehicle Location Data', sensitivity: 'high', retained: '30 days' },
                    { name: 'Driving Behavior Data', sensitivity: 'medium', retained: '90 days' },
                    { name: 'Vehicle Diagnostics', sensitivity: 'low', retained: '1 year' },
                    { name: 'Personal Identifiers (VIN)', sensitivity: 'high', retained: 'Vehicle lifetime' },
                    { name: 'Biometric (Voice)', sensitivity: 'high', retained: 'Session only' },
                    { name: 'Payment Information', sensitivity: 'critical', retained: 'Per PCI-DSS' },
                  ].map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between py-1.5 px-2 bg-[#0c1219] border border-[#1e2a3a] rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        <Eye className="h-3 w-3 shrink-0" style={{
                          color: cat.sensitivity === 'critical' ? '#ef4444' : cat.sensitivity === 'high' ? '#f59e0b' : cat.sensitivity === 'medium' ? '#00d4ff' : '#10b981'
                        }} />
                        <span className="text-[10px] text-[#94a3b8] truncate">{cat.name}</span>
                      </div>
                      <Badge
                        className="text-[7px] border-0 px-1 py-0 h-3 font-bold shrink-0"
                        style={{
                          backgroundColor: `${cat.sensitivity === 'critical' ? '#ef4444' : cat.sensitivity === 'high' ? '#f59e0b' : cat.sensitivity === 'medium' ? '#00d4ff' : '#10b981'}20`,
                          color: cat.sensitivity === 'critical' ? '#ef4444' : cat.sensitivity === 'high' ? '#f59e0b' : cat.sensitivity === 'medium' ? '#00d4ff' : '#10b981',
                        }}
                      >
                        {cat.sensitivity.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Retention Policies */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Retention Policies</span>
                  {[
                    { policy: 'Connected Services', period: '30 days', status: 'active' as const },
                    { policy: 'OTA Update Logs', period: '1 year', status: 'active' as const },
                    { policy: 'Crash Event Data', period: 'Vehicle lifetime', status: 'active' as const },
                    { policy: 'Diagnostic Sessions', period: '90 days', status: 'active' as const },
                    { policy: 'User Profile Data', period: 'Until deletion request', status: 'partial' as const },
                    { policy: 'Anonymized Telemetry', period: '5 years', status: 'active' as const },
                  ].map((ret) => (
                    <div key={ret.policy} className="flex items-center justify-between py-1.5 px-2 bg-[#0c1219] border border-[#1e2a3a] rounded">
                      <span className="text-[10px] text-[#94a3b8] truncate">{ret.policy}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#64748b] font-mono whitespace-nowrap">{ret.period}</span>
                        <span className="h-1.5 w-1.5 rounded-full" style={{
                          backgroundColor: ret.status === 'active' ? '#10b981' : '#f59e0b'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Data Processor Agreements */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Processor Agreements</span>
                  {[
                    { processor: 'Cloud Infra Provider', signed: true, expiry: '2027-12-31' },
                    { processor: 'Map Data Provider', signed: true, expiry: '2027-06-30' },
                    { processor: 'Voice AI Processor', signed: true, expiry: '2027-03-15' },
                    { processor: 'Insurance Partner', signed: false, expiry: '—' },
                    { processor: 'Fleet Analytics SaaS', signed: true, expiry: '2027-09-01' },
                    { processor: 'Emergency Call Service', signed: true, expiry: '2028-01-01' },
                  ].map((dpa) => (
                    <div key={dpa.processor} className="flex items-center justify-between py-1.5 px-2 bg-[#0c1219] border border-[#1e2a3a] rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        {dpa.signed ? (
                          <CheckCircle2 className="h-3 w-3 text-[#10b981] shrink-0" />
                        ) : (
                          <XCircle className="h-3 w-3 text-[#ef4444] shrink-0" />
                        )}
                        <span className="text-[10px] text-[#94a3b8] truncate">{dpa.processor}</span>
                      </div>
                      <span className="text-[9px] text-[#64748b] font-mono whitespace-nowrap">{dpa.expiry}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </HudCard>
        )}
      </div>
    </div>
  )
}
