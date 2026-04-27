'use client'

import { useAppStore } from '@/stores/app-store'
import { MetricCard } from './metric-card'
import { PredictionCard } from './prediction-card'
import { ModelInfoTable } from './model-info-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Heart,
  AlertTriangle,
  Calendar,
  DollarSign,
  Zap,
  Brain,
  Filter,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const predictions = [
  {
    component: 'Brake Pads (Front)',
    probability: 78,
    severity: 'WARNING' as const,
    timeline: '8,500 km',
    estCost: 450,
    confidence: 92,
    symptoms: ['Thickness < 3mm', 'High-frequency vibration', 'Stopping distance +15%'],
    recommendation: 'Schedule replacement within 2 weeks.',
  },
  {
    component: 'Battery Health',
    probability: 65,
    severity: 'MONITOR' as const,
    timeline: '15,000 km',
    estCost: 280,
    confidence: 88,
    symptoms: ['Cold crank amps dropping', 'Voltage sag under load', 'Age > 4 years'],
    recommendation: 'Monitor voltage; consider replacement before winter.',
  },
  {
    component: 'Transmission Fluid',
    probability: 52,
    severity: 'MONITOR' as const,
    timeline: '22,000 km',
    estCost: 180,
    confidence: 76,
    symptoms: ['Slight shift delay', 'Fluid color darkening', 'Temperature running higher'],
    recommendation: 'Fluid analysis recommended at next service.',
  },
  {
    component: 'Spark Plugs',
    probability: 35,
    severity: 'MONITOR' as const,
    timeline: '35,000 km',
    estCost: 120,
    confidence: 71,
    symptoms: ['Occasional misfire', 'Fuel efficiency -3%', 'Idle roughness'],
    recommendation: 'Replace at next scheduled maintenance.',
  },
  {
    component: 'Water Pump',
    probability: 12,
    severity: 'OK' as const,
    timeline: '60,000 km',
    estCost: 350,
    confidence: 65,
    symptoms: ['Minor temp fluctuation', 'Coolant level slow decrease'],
    recommendation: 'No action needed. Continue monitoring.',
  },
]

const tabs = [
  { id: 'predictions', label: 'Predictions', count: 5 },
  { id: 'schedule', label: 'Schedule' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'alerts', label: 'Alerts', count: 3 },
  { id: 'digital-twin', label: 'Digital Twin' },
  { id: 'federated', label: 'Federated' },
  { id: 'prognostics', label: 'Prognostics' },
  { id: 'telemetry', label: 'Telemetry' },
  { id: 'cloud', label: 'Cloud AI' },
]

export function AIPredictiveView() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-5 w-5 text-[#8b5cf6]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Maintenance</h1>
              <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[10px]">2026</Badge>
            </div>
            <p className="text-xs text-[#64748b]">
              Machine learning-based failure prediction and preventive maintenance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
            >
              Transformer-XL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1"
            >
              <Filter className="h-3 w-3" />
              Edge
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
            >
              All Vehicles
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
            >
              <Play className="h-3 w-3" />
              Run Analysis
            </Button>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Health Score"
            value="87%"
            subtitle="Real-time"
            icon={<Heart className="h-4 w-4" />}
            color="#10b981"
            glowColor="green"
          />
          <MetricCard
            title="Active Predictions"
            value={2}
            subtitle="Requiring attention"
            icon={<AlertTriangle className="h-4 w-4" />}
            color="#f59e0b"
            glowColor="yellow"
          />
          <MetricCard
            title="Scheduled Services"
            value={5}
            subtitle="1 critical"
            icon={<Calendar className="h-4 w-4" />}
            color="#8b5cf6"
            glowColor="purple"
          />
          <MetricCard
            title="Est. 30-day Cost"
            value="$1,680"
            subtitle="Based on predictions"
            icon={<DollarSign className="h-4 w-4" />}
            color="#00d4ff"
            glowColor="teal"
          />
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#1e2a3a]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-[#00d4ff] border-[#00d4ff]'
                  : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge className="h-4 min-w-[16px] px-1 text-[9px] bg-[#1e2a3a] text-[#94a3b8] border-0">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {/* Prediction cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {predictions.map((prediction, i) => (
                <PredictionCard key={i} {...prediction} />
              ))}
            </div>

            {/* AI Model Info */}
            <ModelInfoTable />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-8 text-center">
            <Zap className="h-10 w-10 text-[#00d4ff] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">Analytics Dashboard</h3>
            <p className="text-xs text-[#64748b]">Connect a vehicle to view real-time analytics and trend data.</p>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {[
              { severity: 'WARNING', component: 'Brake Pads (Front)', message: 'Replacement due within 2 weeks', color: '#f59e0b' },
              { severity: 'WARNING', component: 'Battery Health', message: 'Voltage dropping below threshold', color: '#f59e0b' },
              { severity: 'INFO', component: 'Transmission Fluid', message: 'Scheduled analysis due at next service', color: '#00d4ff' },
            ].map((alert, i) => (
              <div
                key={i}
                className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3 flex items-center gap-3"
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: alert.color }} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#e2e8f0]">{alert.component}</div>
                  <div className="text-[10px] text-[#64748b]">{alert.message}</div>
                </div>
                <Badge
                  className="text-[10px]"
                  style={{
                    color: alert.color,
                    backgroundColor: `${alert.color}20`,
                  }}
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {activeTab !== 'predictions' && activeTab !== 'analytics' && activeTab !== 'alerts' && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-8 text-center">
            <Brain className="h-10 w-10 text-[#8b5cf6] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1 capitalize">{activeTab.replace('-', ' ')}</h3>
            <p className="text-xs text-[#64748b]">This module requires an active vehicle connection.</p>
          </div>
        )}
      </div>
    </div>
  )
}
