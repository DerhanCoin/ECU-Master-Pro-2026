'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Cpu,
  Microchip,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Shield,
  FileText,
  Download,
  Eye,
  X,
  ChevronDown,
  ChevronRight,
  Bug,
  Server,
  Lock,
  RefreshCw,
  FileCheck,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface SBOMComponent {
  id: string
  name: string
  version: string
  purl: string
  supplier: string
  license: string | null
  hash_sha256: string
  location: string
  is_open_source: boolean
  vulnerabilities: SBOMVulnerability[]
}

interface SBOMVulnerability {
  cve_id: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  score: number
  description: string
  published: string
}

interface SBOMSummary {
  total_components: number
  open_source_count: number
  proprietary_count: number
  vulnerabilities: { critical: number; high: number; medium: number; low: number }
  last_updated: string
  spdx_version: string
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_VULNS: Record<string, SBOMVulnerability[]> = {
  'comp-02': [
    { cve_id: 'CVE-2024-0727', severity: 'HIGH', score: 7.5, description: 'Buffer overread in X.509 certificate verification', published: '2024-01-25' },
    { cve_id: 'CVE-2023-5363', severity: 'HIGH', score: 7.5, description: 'Incorrect cipher key/IV length processing', published: '2023-10-24' },
    { cve_id: 'CVE-2023-3817', severity: 'MEDIUM', score: 5.3, description: 'Uncontrolled resource consumption in cipher operation', published: '2023-09-21' },
  ],
  'comp-04': [
    { cve_id: 'CVE-2024-1086', severity: 'CRITICAL', score: 9.8, description: 'Use-after-free in netfilter nf_tables component', published: '2024-02-28' },
    { cve_id: 'CVE-2023-5178', severity: 'MEDIUM', score: 5.5, description: 'Use-after-free in nvmet_tcp_execute_request', published: '2023-11-21' },
  ],
  'comp-06': [
    { cve_id: 'CVE-2024-2961', severity: 'CRITICAL', score: 9.8, description: 'Buffer overflow in iconv encoding conversion', published: '2024-04-17' },
  ],
  'comp-08': [
    { cve_id: 'CVE-2023-44487', severity: 'HIGH', score: 7.5, description: 'HTTP/2 Rapid Reset Attack (DoS)', published: '2023-10-10' },
  ],
  'comp-10': [
    { cve_id: 'CVE-2024-23771', severity: 'MEDIUM', score: 5.3, description: 'SQLite buffer underflow in session extension', published: '2024-01-30' },
    { cve_id: 'CVE-2023-7104', severity: 'MEDIUM', score: 5.5, description: 'Integer overflow in sqlite3VdbeMemGrow', published: '2023-12-28' },
  ],
}

const MOCK_COMPONENTS: SBOMComponent[] = [
  {
    id: 'comp-01', name: 'ECU Firmware MPC5777C', version: '3.2.1', purl: 'pkg:generic/derhan/ecu-fw-mpc5777c@3.2.1',
    supplier: 'DERHAN Automotive', license: null, hash_sha256: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    location: 'Engine ECU', is_open_source: false, vulnerabilities: [],
  },
  {
    id: 'comp-02', name: 'OpenSSL', version: '3.1.4', purl: 'pkg:github/openssl/openssl@3.1.4',
    supplier: 'OpenSSL Software Foundation', license: 'Apache-2.0', hash_sha256: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    location: 'Telematics Unit', is_open_source: true, vulnerabilities: MOCK_VULNS['comp-02'] ?? [],
  },
  {
    id: 'comp-03', name: 'AUTOSAR Adaptive Platform', version: 'R21-11', purl: 'pkg:generic/autosar/adaptive-platform@R21-11',
    supplier: 'AUTOSAR', license: 'AUTOSAR License', hash_sha256: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    location: 'Central Gateway', is_open_source: false, vulnerabilities: [],
  },
  {
    id: 'comp-04', name: 'Linux Kernel', version: '6.1.72', purl: 'pkg:generic/linux/kernel@6.1.72',
    supplier: 'Linux Foundation', license: 'GPL-2.0-only', hash_sha256: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    location: 'Infotainment SoC', is_open_source: true, vulnerabilities: MOCK_VULNS['comp-04'] ?? [],
  },
  {
    id: 'comp-05', name: 'CAN Stack ISO 15765', version: '2.4.0', purl: 'pkg:generic/derhan/can-stack@2.4.0',
    supplier: 'DERHAN Automotive', license: null, hash_sha256: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    location: 'Engine ECU', is_open_source: false, vulnerabilities: [],
  },
  {
    id: 'comp-06', name: 'glibc', version: '2.38', purl: 'pkg:gnu/glibc@2.38',
    supplier: 'GNU Project', license: 'LGPL-2.1+', hash_sha256: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    location: 'Infotainment SoC', is_open_source: true, vulnerabilities: MOCK_VULNS['comp-06'] ?? [],
  },
  {
    id: 'comp-07', name: 'Diagnostic Stack UDS ISO 14229', version: '1.8.3', purl: 'pkg:generic/derhan/uds-stack@1.8.3',
    supplier: 'DERHAN Automotive', license: null, hash_sha256: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    location: 'Gateway ECU', is_open_source: false, vulnerabilities: [],
  },
  {
    id: 'comp-08', name: 'nghttp2', version: '1.58.0', purl: 'pkg:github/nghttp2/nghttp2@1.58.0',
    supplier: 'nghttp2.org', license: 'MIT', hash_sha256: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
    location: 'Telematics Unit', is_open_source: true, vulnerabilities: MOCK_VULNS['comp-08'] ?? [],
  },
  {
    id: 'comp-09', name: 'Security Module HSE', version: '4.1.0', purl: 'pkg:generic/derhan/security-hse@4.1.0',
    supplier: 'DERHAN Automotive', license: null, hash_sha256: 'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
    location: 'Security ECU', is_open_source: false, vulnerabilities: [],
  },
  {
    id: 'comp-10', name: 'SQLite', version: '3.44.2', purl: 'pkg:github/sqlite/sqlite@3.44.2',
    supplier: 'SQLite Consortium', license: 'blessing', hash_sha256: 'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
    location: 'Infotainment SoC', is_open_source: true, vulnerabilities: MOCK_VULNS['comp-10'] ?? [],
  },
  {
    id: 'comp-11', name: 'SomeIP Stack vSomeIP', version: '3.3.2', purl: 'pkg:generic/bmw/vsomeip@3.3.2',
    supplier: 'BMW Group', license: 'MPL-2.0', hash_sha256: 'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
    location: 'Central Gateway', is_open_source: true, vulnerabilities: [],
  },
  {
    id: 'comp-12', name: 'OTA Update Manager', version: '2.6.1', purl: 'pkg:generic/derhan/ota-manager@2.6.1',
    supplier: 'DERHAN Automotive', license: null, hash_sha256: 'f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
    location: 'Telematics Unit', is_open_source: false, vulnerabilities: [],
  },
]

const MOCK_SUMMARY: SBOMSummary = {
  total_components: 12,
  open_source_count: 6,
  proprietary_count: 6,
  vulnerabilities: { critical: 2, high: 3, medium: 3, low: 0 },
  last_updated: '2026-03-15T08:30:00Z',
  spdx_version: 'SPDX-2.3',
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<SBOMVulnerability['severity'], string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#00d4ff',
  LOW: '#10b981',
}

function getSeverityBg(severity: SBOMVulnerability['severity']): string {
  const color = SEVERITY_COLORS[severity]
  return `${color}20`
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

// ── Component ──────────────────────────────────────────────────────────────

export function SBOMView() {
  const [components] = useState<SBOMComponent[]>(MOCK_COMPONENTS)
  const [summary] = useState<SBOMSummary>(MOCK_SUMMARY)
  const [selectedComponent, setSelectedComponent] = useState<SBOMComponent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('ALL')
  const [showVulnPanel, setShowVulnPanel] = useState(false)
  const [licenseFilter, setLicenseFilter] = useState<'ALL' | 'OSS' | 'PROPRIETARY'>('ALL')

  const allLocations = ['ALL', ...Array.from(new Set(components.map(c => c.location)))]

  const filteredComponents = components.filter((comp) => {
    const matchesSearch = !searchQuery ||
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.version.includes(searchQuery) ||
      comp.purl.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = locationFilter === 'ALL' || comp.location === locationFilter
    const matchesLicense =
      licenseFilter === 'ALL' ||
      (licenseFilter === 'OSS' && comp.is_open_source) ||
      (licenseFilter === 'PROPRIETARY' && !comp.is_open_source)
    return matchesSearch && matchesLocation && matchesLicense
  })

  const totalVulns = summary.vulnerabilities.critical + summary.vulnerabilities.high + summary.vulnerabilities.medium + summary.vulnerabilities.low

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#e2e8f0]">Software Bill of Materials</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#8b5cf6]/15 text-[#8b5cf6]">
                  SPDX 2.3
                </Badge>
                <span className="text-[10px] text-[#64748b]">
                  Updated {new Date(summary.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
            >
              <Download className="h-3 w-3" />
              SPDX JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
            >
              <FileCheck className="h-3 w-3" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* ── Summary Bar ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Microchip className="h-3 w-3 text-[#00d4ff]" />
              <span className="text-[10px] text-[#64748b] font-medium">Total</span>
            </div>
            <span className="text-lg font-bold text-[#e2e8f0] font-mono">{summary.total_components}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Cpu className="h-3 w-3 text-[#10b981]" />
              <span className="text-[10px] text-[#64748b] font-medium">Open Source</span>
            </div>
            <span className="text-lg font-bold text-[#10b981] font-mono">{summary.open_source_count}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="h-3 w-3 text-[#f59e0b]" />
              <span className="text-[10px] text-[#64748b] font-medium">Proprietary</span>
            </div>
            <span className="text-lg font-bold text-[#f59e0b] font-mono">{summary.proprietary_count}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-3 w-3 text-[#ef4444]" />
              <span className="text-[10px] text-[#64748b] font-medium">Critical</span>
            </div>
            <span className="text-lg font-bold text-[#ef4444] font-mono">{summary.vulnerabilities.critical}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-[#f59e0b]" />
              <span className="text-[10px] text-[#64748b] font-medium">High</span>
            </div>
            <span className="text-lg font-bold text-[#f59e0b] font-mono">{summary.vulnerabilities.high}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Bug className="h-3 w-3 text-[#00d4ff]" />
              <span className="text-[10px] text-[#64748b] font-medium">Medium</span>
            </div>
            <span className="text-lg font-bold text-[#00d4ff] font-mono">{summary.vulnerabilities.medium}</span>
          </HudCard>
          <HudCard className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="h-3 w-3 text-[#10b981]" />
              <span className="text-[10px] text-[#64748b] font-medium">Low</span>
            </div>
            <span className="text-lg font-bold text-[#10b981] font-mono">{summary.vulnerabilities.low}</span>
          </HudCard>
        </div>

        {/* ── Vulnerability Score Bar ─────────────────────────────────── */}
        <HudCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#e2e8f0]">Vulnerability Distribution</span>
            <span className="text-xs text-[#94a3b8]">{totalVulns} total vulnerabilities</span>
          </div>
          <div className="h-3 w-full bg-[#0c1219] rounded-full overflow-hidden flex">
            {summary.vulnerabilities.critical > 0 && (
              <div className="h-full bg-[#ef4444]" style={{ width: `${(summary.vulnerabilities.critical / totalVulns) * 100}%` }} />
            )}
            {summary.vulnerabilities.high > 0 && (
              <div className="h-full bg-[#f59e0b]" style={{ width: `${(summary.vulnerabilities.high / totalVulns) * 100}%` }} />
            )}
            {summary.vulnerabilities.medium > 0 && (
              <div className="h-full bg-[#00d4ff]" style={{ width: `${(summary.vulnerabilities.medium / totalVulns) * 100}%` }} />
            )}
            {summary.vulnerabilities.low > 0 && (
              <div className="h-full bg-[#10b981]" style={{ width: `${(summary.vulnerabilities.low / totalVulns) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-[#ef4444]" /> <span className="text-[#94a3b8]">Critical {summary.vulnerabilities.critical}</span></span>
            <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> <span className="text-[#94a3b8]">High {summary.vulnerabilities.high}</span></span>
            <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-[#00d4ff]" /> <span className="text-[#94a3b8]">Medium {summary.vulnerabilities.medium}</span></span>
            <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-[#10b981]" /> <span className="text-[#94a3b8]">Low {summary.vulnerabilities.low}</span></span>
          </div>
        </HudCard>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
            <Input
              placeholder="Search component name or PURL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:border-[#8b5cf6] focus-visible:ring-[#8b5cf6]/20"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'OSS', 'PROPRIETARY'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLicenseFilter(filter)}
                className={cn(
                  'h-7 px-2.5 rounded text-[10px] font-semibold transition-colors',
                  licenseFilter === filter
                    ? 'bg-[#8b5cf6] text-[#0f1923]'
                    : 'bg-[#151d2b] border border-[#1e2a3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55]'
                )}
              >
                {filter === 'ALL' ? 'All' : filter === 'OSS' ? 'Open Source' : 'Proprietary'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {allLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocationFilter(loc)}
                className={cn(
                  'h-7 px-2 rounded text-[10px] font-semibold transition-colors whitespace-nowrap',
                  locationFilter === loc
                    ? 'bg-[#00d4ff] text-[#0f1923]'
                    : 'bg-[#151d2b] border border-[#1e2a3a] text-[#64748b] hover:text-[#94a3b8] hover:border-[#2d3f55]'
                )}
              >
                {loc === 'ALL' ? 'All ECUs' : loc}
              </button>
            ))}
          </div>
        </div>

        {/* ── Component Table + Vuln Panel ────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Component Table */}
          <div className={cn(selectedComponent ? 'xl:col-span-2' : 'xl:col-span-3')}>
            <HudCard className="p-0 overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a]">
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-[#8b5cf6]" />
                  <span className="text-xs font-semibold text-[#e2e8f0]">Components</span>
                  <Badge className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold bg-[#8b5cf6]/15 text-[#8b5cf6]">
                    {filteredComponents.length}
                  </Badge>
                </div>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-[1fr_80px_100px_90px_70px_40px] gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#475569] border-b border-[#1e2a3a]">
                <span>Component</span>
                <span>Version</span>
                <span>License</span>
                <span>ECU</span>
                <span>Vulns</span>
                <span></span>
              </div>

              {/* Rows */}
              <div
                className="max-h-[440px] overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}
              >
                {filteredComponents.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setSelectedComponent(selectedComponent?.id === comp.id ? null : comp)
                      setShowVulnPanel(true)
                    }}
                    className={cn(
                      'w-full grid grid-cols-[1fr_80px_100px_90px_70px_40px] gap-2 px-4 py-2.5 text-[11px] border-b border-[#1e2a3a]/50 transition-colors text-left',
                      selectedComponent?.id === comp.id
                        ? 'bg-[#8b5cf6]/5 border-l-2 border-l-[#8b5cf6]'
                        : 'hover:bg-[#1e2a3a]/30 border-l-2 border-l-transparent'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {comp.is_open_source ? (
                        <Cpu className="h-3 w-3 text-[#10b981] shrink-0" />
                      ) : (
                        <Lock className="h-3 w-3 text-[#f59e0b] shrink-0" />
                      )}
                      <span className="text-[#e2e8f0] truncate text-[11px] font-medium">{comp.name}</span>
                      {comp.is_open_source && (
                        <Badge className="text-[8px] border-0 px-1 py-0 h-3 font-bold bg-[#10b981]/15 text-[#10b981] shrink-0">
                          OSS
                        </Badge>
                      )}
                    </div>
                    <span className="text-[#94a3b8] font-mono tabular-nums text-[10px]">{comp.version}</span>
                    <span className="text-[#64748b] text-[10px] truncate">{comp.license ?? 'Proprietary'}</span>
                    <span className="text-[#64748b] text-[10px]">{comp.location}</span>
                    <span>
                      {comp.vulnerabilities.length > 0 ? (
                        <Badge
                          className="text-[9px] border-0 px-1.5 py-0 h-4 font-bold"
                          style={{
                            backgroundColor: getSeverityBg(
                              comp.vulnerabilities.reduce((worst, v) => {
                                const order: Record<SBOMVulnerability['severity'], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
                                return order[v.severity] < order[worst] ? v.severity : worst
                              }, 'LOW' as SBOMVulnerability['severity'])
                            ),
                            color: SEVERITY_COLORS[comp.vulnerabilities.reduce((worst, v) => {
                              const order: Record<SBOMVulnerability['severity'], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
                              return order[v.severity] < order[worst] ? v.severity : worst
                            }, 'LOW' as SBOMVulnerability['severity'])],
                          }}
                        >
                          {comp.vulnerabilities.length}
                        </Badge>
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981]" />
                      )}
                    </span>
                    <span className="flex items-center justify-center">
                      <Eye className="h-3 w-3 text-[#475569]" />
                    </span>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[#1e2a3a] bg-[#0f1923]/50">
                <span className="text-[10px] text-[#475569]">
                  Showing {filteredComponents.length} of {components.length} components
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px]">
                    <Cpu className="h-3 w-3 text-[#10b981]" />
                    <span className="text-[#10b981] font-semibold">{components.filter(c => c.is_open_source).length}</span>
                    <span className="text-[#475569]">OSS</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px]">
                    <Lock className="h-3 w-3 text-[#f59e0b]" />
                    <span className="text-[#f59e0b] font-semibold">{components.filter(c => !c.is_open_source).length}</span>
                    <span className="text-[#475569]">Prop</span>
                  </span>
                </div>
              </div>
            </HudCard>
          </div>

          {/* Vulnerability Panel */}
          {selectedComponent && showVulnPanel && (
            <div className="xl:col-span-1">
              <HudCard className="p-0 overflow-hidden">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a]">
                  <div className="flex items-center gap-2">
                    <Bug className="h-3.5 w-3.5 text-[#8b5cf6]" />
                    <span className="text-xs font-semibold text-[#e2e8f0]">Vulnerabilities</span>
                  </div>
                  <button
                    onClick={() => setShowVulnPanel(false)}
                    className="p-1 rounded hover:bg-[#1e2a3a] transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-[#64748b]" />
                  </button>
                </div>

                <div className="p-4 space-y-3 max-h-[440px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
                  {/* Component Info */}
                  <div className="space-y-1.5">
                    <span className="text-sm font-bold text-[#e2e8f0]">{selectedComponent.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#64748b]">v{selectedComponent.version}</span>
                      <Badge
                        className={cn(
                          'text-[9px] border-0 px-1.5 py-0 h-4 font-bold',
                          selectedComponent.is_open_source
                            ? 'bg-[#10b981]/15 text-[#10b981]'
                            : 'bg-[#f59e0b]/15 text-[#f59e0b]'
                        )}
                      >
                        {selectedComponent.is_open_source ? 'Open Source' : 'Proprietary'}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      <span className="text-[#475569]">PURL:</span>{' '}
                      <span className="text-[#94a3b8] font-mono">{selectedComponent.purl}</span>
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      <span className="text-[#475569]">SHA256:</span>{' '}
                      <span className="text-[#94a3b8] font-mono text-[9px]">{selectedComponent.hash_sha256.slice(0, 16)}...</span>
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      <span className="text-[#475569]">ECU:</span>{' '}
                      <span className="text-[#94a3b8]">{selectedComponent.location}</span>
                    </div>
                    {selectedComponent.license && (
                      <div className="text-[10px] text-[#64748b]">
                        <span className="text-[#475569]">License:</span>{' '}
                        <span className="text-[#94a3b8]">{selectedComponent.license}</span>
                      </div>
                    )}
                  </div>

                  {/* Vulnerability List */}
                  {selectedComponent.vulnerabilities.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-[#1e2a3a]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                        CVE Records ({selectedComponent.vulnerabilities.length})
                      </span>
                      {selectedComponent.vulnerabilities.map((vuln) => (
                        <div
                          key={vuln.cve_id}
                          className="bg-[#0c1219] border border-[#1e2a3a] rounded-md p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ExternalLink className="h-3 w-3 text-[#00d4ff]" />
                              <span className="text-[11px] font-bold text-[#e2e8f0] font-mono">{vuln.cve_id}</span>
                            </div>
                            <Badge
                              className="text-[9px] border-0 px-1.5 py-0 h-4 font-bold"
                              style={{
                                backgroundColor: getSeverityBg(vuln.severity),
                                color: SEVERITY_COLORS[vuln.severity],
                              }}
                            >
                              {vuln.severity}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-[#94a3b8] leading-relaxed">{vuln.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#64748b]">
                              Published: {new Date(vuln.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#64748b]">CVSS</span>
                              <span
                                className="text-[11px] font-bold font-mono"
                                style={{ color: SEVERITY_COLORS[vuln.severity] }}
                              >
                                {vuln.score.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          {/* CVSS Bar */}
                          <div className="h-1 w-full bg-[#151d2b] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(vuln.score / 10) * 100}%`,
                                backgroundColor: SEVERITY_COLORS[vuln.severity],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#1e2a3a]">
                      <div className="flex flex-col items-center justify-center py-6">
                        <CheckCircle2 className="h-8 w-8 text-[#10b981] mb-2 opacity-50" />
                        <span className="text-xs text-[#10b981] font-semibold">No Known Vulnerabilities</span>
                        <span className="text-[10px] text-[#64748b] mt-1">This component has a clean security record</span>
                      </div>
                    </div>
                  )}
                </div>
              </HudCard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
