'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Star,
  Zap,
  Monitor,
  RefreshCw,
  Copy,
  Download,
  ChevronRight,
  Award,
  Package,
  Globe,
  Headphones,
  Cpu,
  Car,
  BarChart3,
  Cloud,
  Code,
  Lock,
} from 'lucide-react'
import { useState } from 'react'

type LicenseType = 'Professional' | 'Enterprise' | 'Free'

interface FeatureUsage {
  feature: string
  used: number
  limit: number | null
  icon: typeof CheckCircle2
}

interface Activation {
  id: string
  date: string
  machine: string
  type: 'activation' | 'deactivation' | 'renewal'
  key: string
}

interface AddOn {
  id: string
  name: string
  description: string
  price: number
  purchased: boolean
  icon: typeof CheckCircle2
}

const featureComparison = [
  { name: 'Basic Diagnostics', free: true, pro: true, enterprise: true },
  { name: 'Advanced ECU', free: false, pro: true, enterprise: true },
  { name: 'AI Predictions', free: false, pro: true, enterprise: true },
  { name: 'Flash Programming', free: false, pro: true, enterprise: true },
  { name: 'Fleet Management', free: false, pro: false, enterprise: true },
  { name: 'Cloud Sync', free: false, pro: false, enterprise: true },
  { name: 'API Access', free: false, pro: false, enterprise: true },
  { name: 'Priority Support', free: false, pro: false, enterprise: true },
]

const featureUsage: FeatureUsage[] = [
  { feature: 'Diagnostic Sessions', used: 147, limit: 500, icon: Monitor },
  { feature: 'ECU Flash Operations', used: 23, limit: 50, icon: Cpu },
  { feature: 'AI Predictions', used: 89, limit: 200, icon: Zap },
  { feature: 'Vehicles Registered', used: 24, limit: 100, icon: Car },
  { feature: 'Cloud Storage', used: 2, limit: 10, icon: Cloud },
  { feature: 'API Calls Today', used: 3450, limit: 10000, icon: Code },
]

const activationHistory: Activation[] = [
  { id: 'A1', date: '2026-01-15', machine: 'WORKSTATION-01 (192.168.1.10)', type: 'activation', key: 'ECUP-XXXX-XXXX-ABCD' },
  { id: 'A2', date: '2026-02-01', machine: 'LAPTOP-DIAG-02 (192.168.1.22)', type: 'activation', key: 'ECUP-XXXX-XXXX-EFGH' },
  { id: 'A3', date: '2026-02-15', machine: 'WORKSTATION-01 (192.168.1.10)', type: 'deactivation', key: 'ECUP-XXXX-XXXX-ABCD' },
  { id: 'A4', date: '2026-03-01', machine: 'WORKSTATION-01 (192.168.1.10)', type: 'renewal', key: 'ECUP-XXXX-XXXX-IJKL' },
]

const addOns: AddOn[] = [
  { id: 'ADD1', name: 'EV/Hybrid Module', description: 'Electric vehicle and hybrid battery diagnostics', price: 299, purchased: true, icon: Zap },
  { id: 'ADD2', name: 'ADAS Calibration Pack', description: 'Advanced driver assistance system calibration tools', price: 399, purchased: true, icon: Shield },
  { id: 'ADD3', name: 'Performance Tuning Suite', description: 'ECU remapping and performance optimization tools', price: 499, purchased: false, icon: BarChart3 },
  { id: 'ADD4', name: 'Fleet Analytics Pro', description: 'Advanced fleet management and reporting dashboard', price: 599, purchased: false, icon: Car },
  { id: 'ADD5', name: 'Remote Diagnostics Hub', description: 'Remote diagnostic sessions and customer portal', price: 349, purchased: false, icon: Globe },
  { id: 'ADD6', name: 'Data Export & API Pro', description: 'Unlimited data export, REST API, and webhooks', price: 249, purchased: false, icon: Code },
]

const currentLicense: {
  type: LicenseType
  key: string
  expiry: string
  daysLeft: number
  features: string[]
  maxActivations: number
  currentActivations: number
} = {
  type: 'Professional',
  key: 'ECUP-2026-PROF-A7B3-C9D2',
  expiry: '2027-03-04',
  daysLeft: 365,
  features: ['Basic Diagnostics', 'Advanced ECU', 'AI Predictions', 'Flash Programming'],
  maxActivations: 3,
  currentActivations: 2,
}

export function LicenseView() {
  const [licenseKey, setLicenseKey] = useState('')
  const [activationMessage, setActivationMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'addons'>('overview')
  const [showTransfer, setShowTransfer] = useState(false)

  const handleActivate = () => {
    if (licenseKey.length >= 10) {
      setActivationMessage('License key activated successfully!')
      setLicenseKey('')
    } else {
      setActivationMessage('Invalid license key format. Please check and try again.')
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">License Management</h1>
          </div>
          <p className="text-xs text-[#64748b]">Software licensing and activation</p>
        </div>
      </div>

      {/* Current License Card */}
      <Card className="bg-[#151d2b] border-[#00d4ff]/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00d4ff] via-[#8b5cf6] to-[#10b981]" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center">
                <Award className="h-7 w-7 text-[#00d4ff]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-[#e2e8f0]">{currentLicense.type} License</h2>
                  <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </Badge>
                </div>
                <div className="text-xs text-[#64748b] font-mono">{currentLicense.key}</div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Expires: {currentLicense.expiry} ({currentLicense.daysLeft} days)
                  </span>
                  <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                    <Monitor className="h-3 w-3" /> {currentLicense.currentActivations}/{currentLicense.maxActivations} Activations
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#00d4ff] hover:bg-[#1e2a3a] gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Renew
              </Button>
              <Button size="sm" className="h-8 text-xs bg-[#8b5cf6] text-white hover:bg-[#7c3aed] font-semibold gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" /> Upgrade to Enterprise
              </Button>
            </div>
          </div>

          {/* Included Features */}
          <div className="mt-4 flex flex-wrap gap-2">
            {currentLicense.features.map(feature => (
              <Badge key={feature} variant="outline" className="text-[10px] h-6 bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8] gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* License Key Activation */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <Key className="h-4 w-4 text-[#f59e0b]" />
            Activate License Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter license key (e.g., ECUP-2026-PROF-XXXX-XXXX)"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#00d4ff]/50 font-mono"
              />
            </div>
            <Button onClick={handleActivate} className="bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold h-9">
              Activate
            </Button>
          </div>
          {activationMessage && (
            <div className={`p-2.5 rounded-lg text-xs ${activationMessage.includes('success') ? 'bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]'}`}>
              {activationMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-[#1e2a3a]">
        {([
          { id: 'overview' as const, label: 'Usage & History', icon: BarChart3 },
          { id: 'compare' as const, label: 'Feature Comparison', icon: Package },
          { id: 'addons' as const, label: 'Add-on Modules', icon: Zap },
        ]).map(tab => {
          const Icon = tab.icon
          return (
            <Button key={tab.id} size="sm" variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 gap-1.5 text-xs h-8 ${activeTab === tab.id ? 'text-[#00d4ff] bg-[#00d4ff]/10 rounded-b-none border-b-2 border-[#00d4ff]' : 'text-[#64748b] hover:text-[#e2e8f0]'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Overview Tab - Usage Metrics & Activation History */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Usage Metrics */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00d4ff]" />
                Usage Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {featureUsage.map((usage, i) => {
                  const Icon = usage.icon
                  const percentage = usage.limit ? (usage.used / usage.limit) * 100 : 0
                  const barColor = percentage > 80 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#10b981'
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-[#475569]" />
                          <span className="text-[11px] text-[#94a3b8]">{usage.feature}</span>
                        </div>
                        <span className="text-[11px] text-[#e2e8f0] font-mono">
                          {usage.used.toLocaleString()}{usage.limit ? ` / ${usage.limit.toLocaleString()}` : ''}
                        </span>
                      </div>
                      {usage.limit && (
                        <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Activation History */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#8b5cf6]" />
                Activation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activationHistory.map(entry => {
                  const typeColors: Record<string, { color: string; label: string }> = {
                    activation: { color: '#10b981', label: 'Activated' },
                    deactivation: { color: '#ef4444', label: 'Deactivated' },
                    renewal: { color: '#00d4ff', label: 'Renewed' },
                  }
                  const config = typeColors[entry.type]
                  return (
                    <div key={entry.id} className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="text-[9px] border-0" style={{ color: config.color, backgroundColor: `${config.color}20` }}>
                          {config.label}
                        </Badge>
                        <span className="text-[9px] text-[#475569]">{entry.date}</span>
                      </div>
                      <div className="text-[11px] text-[#94a3b8]">{entry.machine}</div>
                      <div className="text-[10px] text-[#475569] font-mono mt-1">{entry.key}</div>
                    </div>
                  )
                })}
              </div>

              {/* License Transfer */}
              <div className="mt-4 pt-3 border-t border-[#1e2a3a]">
                <Button
                  variant="outline"
                  onClick={() => setShowTransfer(!showTransfer)}
                  className="w-full h-8 text-xs bg-[#0f1923] border-[#1e2a3a] text-[#64748b] hover:text-[#e2e8f0] hover:border-[#2d3f55] gap-1.5"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Transfer License to Another Machine
                </Button>
                {showTransfer && (
                  <div className="mt-3 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a] space-y-2">
                    <p className="text-[10px] text-[#475569]">Enter the target machine ID to transfer this license:</p>
                    <input
                      type="text"
                      placeholder="Machine ID or Hostname"
                      className="w-full h-8 px-3 rounded-md bg-[#151d2b] border border-[#1e2a3a] text-xs text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#00d4ff]/50 font-mono"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold">Transfer</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowTransfer(false)} className="h-7 text-[10px] bg-[#151d2b] border-[#1e2a3a] text-[#64748b]">Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Comparison Tab */}
      {activeTab === 'compare' && (
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
              <Package className="h-4 w-4 text-[#8b5cf6]" />
              Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    <th className="text-left text-[10px] text-[#475569] font-medium p-3">Feature</th>
                    <th className="text-center p-3">
                      <div className="text-xs text-[#64748b] font-semibold">Free</div>
                      <div className="text-[10px] text-[#475569]">$0/mo</div>
                    </th>
                    <th className="text-center p-3">
                      <div className="text-xs text-[#00d4ff] font-semibold">Professional</div>
                      <div className="text-[10px] text-[#475569]">$99/mo</div>
                    </th>
                    <th className="text-center p-3">
                      <div className="text-xs text-[#8b5cf6] font-semibold">Enterprise</div>
                      <div className="text-[10px] text-[#475569]">$249/mo</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((feat, i) => (
                    <tr key={i} className="border-b border-[#1e2a3a] hover:bg-[#1e2a3a]/30 transition-colors">
                      <td className="p-3 text-xs text-[#e2e8f0]">{feat.name}</td>
                      <td className="p-3 text-center">
                        {feat.free ? <CheckCircle2 className="h-4 w-4 text-[#10b981] mx-auto" /> : <XCircle className="h-4 w-4 text-[#475569] mx-auto" />}
                      </td>
                      <td className="p-3 text-center">
                        {feat.pro ? <CheckCircle2 className="h-4 w-4 text-[#10b981] mx-auto" /> : <XCircle className="h-4 w-4 text-[#475569] mx-auto" />}
                      </td>
                      <td className="p-3 text-center">
                        {feat.enterprise ? <CheckCircle2 className="h-4 w-4 text-[#10b981] mx-auto" /> : <XCircle className="h-4 w-4 text-[#475569] mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#1e2a3a]">
                    <td className="p-3" />
                    <td className="p-3 text-center">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] bg-[#0f1923] border-[#1e2a3a] text-[#64748b]">Current</Button>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px] mb-1">Your Plan</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button size="sm" className="h-7 text-[10px] bg-[#8b5cf6] text-white hover:bg-[#7c3aed] font-semibold">Upgrade</Button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add-on Modules Tab */}
      {activeTab === 'addons' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Add-on Modules</h2>
            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">
              {addOns.filter(a => a.purchased).length} of {addOns.length} purchased
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {addOns.map(addon => {
              const Icon = addon.icon
              return (
                <Card key={addon.id} className={`bg-[#151d2b] transition-all ${addon.purchased ? 'border-[#10b981]/30' : 'border-[#1e2a3a] hover:border-[#00d4ff]/30'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: addon.purchased ? '#10b98115' : '#00d4ff15' }}>
                        <Icon className="h-5 w-5" style={{ color: addon.purchased ? '#10b981' : '#00d4ff' }} />
                      </div>
                      {addon.purchased ? (
                        <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px] gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Owned
                        </Badge>
                      ) : (
                        <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[9px]">
                          ${addon.price}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">{addon.name}</h3>
                    <p className="text-[11px] text-[#64748b] mb-3">{addon.description}</p>
                    {addon.purchased ? (
                      <div className="text-[10px] text-[#10b981] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active on this license
                      </div>
                    ) : (
                      <Button size="sm" className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1">
                        <Download className="h-3 w-3" /> Purchase Add-on
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Renewal Options */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[#10b981]" />
            Renewal & Upgrade Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { plan: 'Professional', price: '$99/mo', yearly: '$990/yr', current: true, color: '#00d4ff', features: ['4 Core Features', '3 Activations', 'Email Support'] },
              { plan: 'Enterprise', price: '$249/mo', yearly: '$2,490/yr', current: false, color: '#8b5cf6', features: ['All 8 Features', '10 Activations', 'Priority Support', 'API Access'] },
              { plan: 'Enterprise + Fleet', price: '$399/mo', yearly: '$3,990/yr', current: false, color: '#10b981', features: ['All Features', 'Unlimited Activations', '24/7 Support', 'Custom API', 'Fleet Dashboard'] },
            ].map((option, i) => (
              <div key={i} className={`p-4 rounded-lg border ${option.current ? 'bg-[#00d4ff]/5 border-[#00d4ff]/30' : 'bg-[#0f1923] border-[#1e2a3a] hover:border-[#2d3f55]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-[#e2e8f0]">{option.plan}</h3>
                  {option.current && <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px]">Current</Badge>}
                </div>
                <div className="mb-3">
                  <span className="text-xl font-bold" style={{ color: option.color }}>{option.price}</span>
                  <span className="text-[10px] text-[#475569] ml-2">or {option.yearly}</span>
                </div>
                <ul className="space-y-1 mb-3">
                  {option.features.map((f, j) => (
                    <li key={j} className="text-[10px] text-[#94a3b8] flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-[#10b981]" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  className={`w-full h-7 text-[10px] font-semibold ${option.current ? 'bg-[#1e2a3a] text-[#475569] cursor-default' : ''}`}
                  style={!option.current ? { backgroundColor: option.color, color: '#0f1923' } : undefined}
                >
                  {option.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
