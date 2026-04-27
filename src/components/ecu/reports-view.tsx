'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  Printer,
  Mail,
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  BarChart3,
  Zap,
  Settings,
  Eye,
  ChevronRight,
  Car,
  Filter,
  RefreshCw,
  Star,
  Activity,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Report Templates
const REPORT_TEMPLATES = [
  { id: 'full', name: 'Full Vehicle Report', desc: 'Complete diagnostic overview with all systems', icon: Car, color: '#00d4ff', sections: ['DTC Scan', 'Live Data', 'Module Status', 'Service History'] },
  { id: 'dtc', name: 'DTC Report', desc: 'All diagnostic trouble codes with descriptions', icon: AlertTriangle, color: '#ef4444', sections: ['Active DTCs', 'Pending DTCs', 'Permanent DTCs', 'Freeze Frame'] },
  { id: 'service', name: 'Service History', desc: 'Complete service and maintenance records', icon: Clock, color: '#10b981', sections: ['Service Records', 'Maintenance Due', 'Parts Replaced', 'Labor Hours'] },
  { id: 'ai', name: 'AI Prediction Report', desc: 'AI-powered failure prediction analysis', icon: Sparkles, color: '#8b5cf6', sections: ['Risk Assessment', 'Predicted Failures', 'Recommended Actions', 'Cost Estimates'] },
  { id: 'custom', name: 'Custom Report', desc: 'Build your own report with selected sections', icon: Settings, color: '#f59e0b', sections: ['User Selected'] },
]

// Recent Reports
const RECENT_REPORTS = [
  { id: 'r1', name: 'Full Vehicle Report — Golf GTI', vehicle: '2023 VW Golf GTI', type: 'Full Vehicle', date: '2024-03-15', status: 'completed' as const, size: '2.4 MB' },
  { id: 'r2', name: 'DTC Report — BMW 3 Series', vehicle: '2023 BMW 3 Series', type: 'DTC', date: '2024-03-14', status: 'completed' as const, size: '856 KB' },
  { id: 'r3', name: 'Service History — Camry', vehicle: '2024 Toyota Camry', type: 'Service', date: '2024-03-14', status: 'completed' as const, size: '1.1 MB' },
  { id: 'r4', name: 'AI Prediction — Mustang GT', vehicle: '2024 Ford Mustang GT', type: 'AI Prediction', date: '2024-03-13', status: 'completed' as const, size: '3.2 MB' },
  { id: 'r5', name: 'Custom Report — A4 B9', vehicle: '2023 Audi A4', type: 'Custom', date: '2024-03-13', status: 'failed' as const, size: '0 KB' },
  { id: 'r6', name: 'Full Vehicle Report — Model 3', vehicle: '2024 Tesla Model 3', type: 'Full Vehicle', date: '2024-03-12', status: 'completed' as const, size: '2.8 MB' },
  { id: 'r7', name: 'DTC Report — C-Class', vehicle: '2022 Mercedes C-Class', type: 'DTC', date: '2024-03-12', status: 'generating' as const, size: '—' },
]

// Report Preview Data
const REPORT_PREVIEW_SECTIONS = [
  {
    title: 'Vehicle Information',
    content: [
      { label: 'VIN', value: 'WVWZZZ1KZAM000001' },
      { label: 'Make/Model', value: 'Volkswagen Golf GTI (MK8)' },
      { label: 'Year', value: '2023' },
      { label: 'Engine', value: '2.0L TSI EA888.4 (241 HP)' },
      { label: 'Transmission', value: '7-DSG DQ381' },
      { label: 'Mileage', value: '14,230 mi' },
    ]
  },
  {
    title: 'DTC Summary',
    content: [
      { label: 'Active Codes', value: '2' },
      { label: 'Pending Codes', value: '1' },
      { label: 'Permanent Codes', value: '0' },
      { label: 'Cleared This Session', value: '3' },
    ]
  },
  {
    title: 'Active DTCs',
    content: [
      { label: 'P0300', value: 'Random/Multiple Cylinder Misfire Detected' },
      { label: 'P0420', value: 'Catalyst System Efficiency Below Threshold (Bank 1)' },
    ]
  },
]

// Scheduled Reports
const SCHEDULED_REPORTS = [
  { id: 's1', name: 'Weekly Fleet Summary', frequency: 'Weekly (Monday)', vehicles: 3, lastRun: '2024-03-11', nextRun: '2024-03-18', active: true },
  { id: 's2', name: 'Monthly DTC Scan', frequency: 'Monthly (1st)', vehicles: 5, lastRun: '2024-03-01', nextRun: '2024-04-01', active: true },
  { id: 's3', name: 'Quarterly AI Analysis', frequency: 'Quarterly', vehicles: 2, lastRun: '2024-01-01', nextRun: '2024-04-01', active: false },
]

// Report Stats
const REPORT_STATS = {
  totalThisMonth: 24,
  byType: {
    'Full Vehicle': 8,
    'DTC': 6,
    'Service': 4,
    'AI Prediction': 3,
    'Custom': 3,
  }
}

type ReportSection = 'dtc' | 'liveData' | 'modules' | 'serviceHistory' | 'predictions' | 'maintenance' | 'performance'

export function ReportsView() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>('full')
  const [showGenerator, setShowGenerator] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState('vw-gti')
  const [selectedSections, setSelectedSections] = useState<ReportSection[]>(['dtc', 'liveData', 'modules'])
  const [previewReport, setPreviewReport] = useState<string | null>('r1')
  const [isGenerating, setIsGenerating] = useState(false)

  const allSections: { id: ReportSection; label: string }[] = [
    { id: 'dtc', label: 'DTC Scan Results' },
    { id: 'liveData', label: 'Live Data Snapshot' },
    { id: 'modules', label: 'Module Status' },
    { id: 'serviceHistory', label: 'Service History' },
    { id: 'predictions', label: 'AI Predictions' },
    { id: 'maintenance', label: 'Maintenance Schedule' },
    { id: 'performance', label: 'Performance Data' },
  ]

  const toggleSection = (sectionId: ReportSection) => {
    setSelectedSections(prev =>
      prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]
    )
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 3000)
  }

  const templateData = REPORT_TEMPLATES.find(t => t.id === selectedTemplate)
  const previewData = RECENT_REPORTS.find(r => r.id === previewReport)

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Reports &amp; Analytics</h1>
            <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px]">{REPORT_STATS.totalThisMonth} This Month</Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            Generate, view, and manage diagnostic reports with scheduled auto-generation
          </p>
        </div>
        <Button size="sm" onClick={() => setShowGenerator(!showGenerator)} className="h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
          <Plus className="h-3 w-3" />New Report
        </Button>
      </div>

      {/* Quick Generate Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {REPORT_TEMPLATES.map((template) => {
          const TemplateIcon = template.icon
          return (
            <button
              key={template.id}
              onClick={() => { setSelectedTemplate(template.id); setShowGenerator(true) }}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                selectedTemplate === template.id
                  ? 'border-2 shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                  : 'border-[#1e2a3a] bg-[#151d2b] hover:border-[#2d3f55]'
              )}
              style={{
                borderColor: selectedTemplate === template.id ? template.color : undefined,
                backgroundColor: selectedTemplate === template.id ? `${template.color}10` : undefined,
              }}
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${template.color}20` }}>
                <TemplateIcon className="h-4 w-4" style={{ color: template.color }} />
              </div>
              <div className={cn('text-[10px] font-semibold text-center', selectedTemplate === template.id ? 'text-[#e2e8f0]' : 'text-[#94a3b8]')}>
                {template.name}
              </div>
            </button>
          )
        })}
      </div>

      {/* Report Generator Form */}
      {showGenerator && (
        <Card className="bg-[#151d2b] border-[#00d4ff]/30 shadow-[0_0_12px_#00d4ff10]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#00d4ff]" />
              Generate Report — {templateData?.name || 'Custom'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Vehicle</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full h-8 mt-1 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none"
                >
                  <option value="vw-gti">2023 VW Golf GTI</option>
                  <option value="bmw-3">2023 BMW 3 Series</option>
                  <option value="mb-c">2022 Mercedes C-Class</option>
                  <option value="toyota-camry">2024 Toyota Camry</option>
                  <option value="ford-mustang">2024 Ford Mustang GT</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Date Range Start</label>
                <input
                  type="date"
                  defaultValue="2024-03-01"
                  className="w-full h-8 mt-1 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Date Range End</label>
                <input
                  type="date"
                  defaultValue="2024-03-15"
                  className="w-full h-8 mt-1 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none"
                />
              </div>
            </div>

            {/* Section Checkboxes */}
            <div>
              <label className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Include Sections</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                {allSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md border text-[10px] transition-all',
                      selectedSections.includes(section.id)
                        ? 'border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]'
                        : 'border-[#1e2a3a] bg-[#0f1923] text-[#64748b] hover:border-[#2d3f55]'
                    )}
                  >
                    <div className={cn(
                      'h-4 w-4 rounded border flex items-center justify-center flex-shrink-0',
                      selectedSections.includes(section.id) ? 'bg-[#00d4ff] border-[#00d4ff]' : 'border-[#1e2a3a]'
                    )}>
                      {selectedSections.includes(section.id) && <CheckCircle2 className="h-3 w-3 text-[#0f1923]" />}
                    </div>
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            {isGenerating && (
              <div className="bg-[#0f1923] border border-[#00d4ff]/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-[#00d4ff] animate-pulse shadow-[0_0_6px_#00d4ff]" />
                  <span className="text-[10px] text-[#00d4ff] font-semibold">Generating report...</span>
                </div>
                <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00d4ff] rounded-full animate-pulse" style={{ width: '65%', boxShadow: '0 0 8px #00d4ff40' }} />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={handleGenerate} disabled={isGenerating} className="h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
                <Zap className="h-3 w-3" />Generate Report
              </Button>
              <Button size="sm" onClick={() => setShowGenerator(false)} variant="outline" className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#64748b]">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reports + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Reports List */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#00d4ff]" />
                Recent Reports
              </CardTitle>
              <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 border-[#1e2a3a] bg-[#0f1923] text-[#64748b]">
                <Filter className="h-2.5 w-2.5" />Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {RECENT_REPORTS.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setPreviewReport(report.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-2.5 rounded-md border transition-all text-left',
                    previewReport === report.id
                      ? 'border-[#00d4ff]/30 bg-[#00d4ff]/10'
                      : 'border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                  )}
                >
                  <div className={cn(
                    'h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0',
                    report.status === 'completed' ? 'bg-[#10b981]/15' :
                    report.status === 'generating' ? 'bg-[#00d4ff]/15' :
                    'bg-[#ef4444]/15'
                  )}>
                    {report.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981]" /> :
                     report.status === 'generating' ? <RefreshCw className="h-3.5 w-3.5 text-[#00d4ff] animate-spin" /> :
                     <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[10px] font-semibold truncate', previewReport === report.id ? 'text-[#00d4ff]' : 'text-[#e2e8f0]')}>
                      {report.name}
                    </div>
                    <div className="text-[9px] text-[#475569]">{report.date} · {report.size}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge className={cn(
                        'text-[8px] border px-1 py-0 h-3.5',
                        report.type === 'Full Vehicle' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' :
                        report.type === 'DTC' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' :
                        report.type === 'Service' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' :
                        report.type === 'AI Prediction' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30' :
                        'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                      )}>
                        {report.type}
                      </Badge>
                      <Badge className={cn(
                        'text-[8px] border px-1 py-0 h-3.5',
                        report.status === 'completed' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' :
                        report.status === 'generating' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30' :
                        'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                      )}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#475569] flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#00d4ff]" />
                Report Preview
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 border-[#1e2a3a] bg-[#0f1923] text-[#64748b] hover:text-[#ef4444]">
                  <Download className="h-2.5 w-2.5" />PDF
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 border-[#1e2a3a] bg-[#0f1923] text-[#64748b] hover:text-[#10b981]">
                  <Download className="h-2.5 w-2.5" />CSV
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 border-[#1e2a3a] bg-[#0f1923] text-[#64748b]">
                  <Printer className="h-2.5 w-2.5" />Print
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 border-[#1e2a3a] bg-[#0f1923] text-[#64748b]">
                  <Mail className="h-2.5 w-2.5" />Email
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {/* Report Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2a3a]">
                <div>
                  <div className="text-sm font-bold text-[#00d4ff]">ECU Master Pro 2026</div>
                  <div className="text-[10px] text-[#64748b]">Full Vehicle Diagnostic Report</div>
                  <div className="text-[10px] text-[#475569] mt-1">Generated: 2024-03-15 14:32:17 · Report ID: RPT-2024-0315-001</div>
                </div>
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">Complete</Badge>
              </div>

              {/* Report Sections */}
              {REPORT_PREVIEW_SECTIONS.map((section, sIdx) => (
                <div key={sIdx} className="mb-4">
                  <div className="text-[11px] font-semibold text-[#e2e8f0] mb-2 flex items-center gap-2">
                    <div className="h-1 w-4 rounded-full bg-[#00d4ff]" />
                    {section.title}
                  </div>
                  <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md overflow-hidden">
                    {section.content.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between py-2 px-3 border-b border-[#1e2a3a]/50 last:border-0">
                        <span className="text-[10px] text-[#64748b]">{item.label}</span>
                        <span className={cn(
                          'text-[10px] font-mono',
                          section.title === 'Active DTCs' ? 'text-[#ef4444] font-semibold' : 'text-[#e2e8f0]'
                        )}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Report Footer */}
              <div className="pt-3 border-t border-[#1e2a3a] text-center">
                <div className="text-[9px] text-[#475569]">— End of Report —</div>
                <div className="text-[8px] text-[#475569] mt-1">ECU Master Pro 2026 · Confidential · Generated automatically</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports + Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scheduled Reports */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#00d4ff]" />
                Scheduled Reports
              </CardTitle>
              <Button size="sm" className="h-6 text-[9px] gap-1 bg-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/30 border border-[#00d4ff]/30">
                <Plus className="h-2.5 w-2.5" />Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SCHEDULED_REPORTS.map((schedule) => (
                <div key={schedule.id} className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  schedule.active ? 'bg-[#0f1923] border-[#1e2a3a]' : 'bg-[#0f1923] border-[#1e2a3a] opacity-60'
                )}>
                  <div className={cn(
                    'h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0',
                    schedule.active ? 'bg-[#00d4ff]/15' : 'bg-[#1e2a3a]'
                  )}>
                    <Calendar className="h-4 w-4" style={{ color: schedule.active ? '#00d4ff' : '#475569' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold text-[#e2e8f0]">{schedule.name}</span>
                      <Badge className={cn(
                        'text-[8px] border px-1 py-0 h-3.5',
                        schedule.active ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : 'bg-[#1e2a3a] text-[#475569]'
                      )}>
                        {schedule.active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <div className="text-[9px] text-[#475569]">{schedule.frequency} · {schedule.vehicles} vehicles</div>
                    <div className="text-[9px] text-[#64748b] mt-0.5">
                      Last: {schedule.lastRun} · Next: {schedule.nextRun}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-6 text-[9px] border-[#1e2a3a] bg-[#0f1923] text-[#64748b]">
                    {schedule.active ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Statistics */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00d4ff]" />
              Report Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#00d4ff] tabular-nums">{REPORT_STATS.totalThisMonth}</div>
              <div className="text-[10px] text-[#475569] mt-1">Reports Generated This Month</div>
            </div>

            <div className="space-y-2.5">
              {Object.entries(REPORT_STATS.byType).map(([type, count]) => {
                const colorMap: Record<string, string> = {
                  'Full Vehicle': '#00d4ff',
                  'DTC': '#ef4444',
                  'Service': '#10b981',
                  'AI Prediction': '#8b5cf6',
                  'Custom': '#f59e0b',
                }
                const color = colorMap[type] || '#64748b'
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#64748b]">{type}</span>
                      <span className="text-[10px] font-mono" style={{ color }}>{count}</span>
                    </div>
                    <div className="h-2 w-full bg-[#0f1923] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / REPORT_STATS.totalThisMonth) * 100}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2a3a]">
              <div className="text-center">
                <div className="text-lg font-bold text-[#10b981] tabular-nums">
                  {RECENT_REPORTS.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-[9px] text-[#475569]">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#ef4444] tabular-nums">
                  {RECENT_REPORTS.filter(r => r.status === 'failed').length}
                </div>
                <div className="text-[9px] text-[#475569]">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
