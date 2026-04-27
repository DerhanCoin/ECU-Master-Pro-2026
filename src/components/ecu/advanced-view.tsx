'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  Wifi,
  Database,
  Brain,
  Palette,
  Globe,
  Lock,
  Code,
  Monitor,
  Clock,
  Activity,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
  ChevronRight,
  Download,
  Upload,
  Save,
  Bell,
  Eye,
  Shield,
  Server,
  Radio,
  Layers,
  Gauge,
} from 'lucide-react'
import { useState } from 'react'

interface SettingItem {
  label: string
  value: string | number
  unit?: string
  type: 'display' | 'select' | 'toggle'
  options?: string[]
}

const connectionSettings: SettingItem[] = [
  { label: 'Connection Timeout', value: 5000, unit: 'ms', type: 'select', options: ['3000', '5000', '10000', '30000'] },
  { label: 'Retry Count', value: 3, type: 'select', options: ['1', '3', '5', '10'] },
  { label: 'Baud Rate', value: '500000', unit: 'bps', type: 'select', options: ['125000', '250000', '500000', '1000000'] },
  { label: 'Protocol Preference', value: 'UDS', type: 'select', options: ['UDS', 'KWP2000', 'Auto'] },
  { label: 'Keep Alive Interval', value: 2000, unit: 'ms', type: 'display' },
  { label: 'Auto-Reconnect', value: 'Enabled', type: 'toggle' },
]

const dataLogSettings: SettingItem[] = [
  { label: 'Sample Rate', value: 100, unit: 'Hz', type: 'select', options: ['10', '25', '50', '100', '200'] },
  { label: 'Buffer Size', value: 8192, unit: 'bytes', type: 'select', options: ['4096', '8192', '16384', '32768'] },
  { label: 'Auto-Export', value: 'Enabled', type: 'toggle' },
  { label: 'Export Format', value: 'CSV', type: 'select', options: ['CSV', 'JSON', 'Binary', 'MDF4'] },
  { label: 'Export Interval', value: 60, unit: 's', type: 'select', options: ['10', '30', '60', '300'] },
  { label: 'Max Log Size', value: 500, unit: 'MB', type: 'select', options: ['100', '250', '500', '1000'] },
]

const aiModelSettings: SettingItem[] = [
  { label: 'Prediction Confidence Threshold', value: 85, unit: '%', type: 'select', options: ['70', '75', '80', '85', '90', '95'] },
  { label: 'AI Model', value: 'ECU-Predict v3.2', type: 'select', options: ['ECU-Predict v3.2', 'ECU-Predict v3.1', 'Custom Model'] },
  { label: 'Retraining Schedule', value: 'Weekly', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Manual'] },
  { label: 'Anomaly Detection', value: 'Enabled', type: 'toggle' },
  { label: 'Real-Time Inference', value: 'Enabled', type: 'toggle' },
  { label: 'Model Cache Size', value: 256, unit: 'MB', type: 'display' },
]

const displaySettings: SettingItem[] = [
  { label: 'Units System', value: 'Metric', type: 'select', options: ['Metric', 'Imperial'] },
  { label: 'Decimal Precision', value: 2, type: 'select', options: ['1', '2', '3', '4'] },
  { label: 'Temperature Unit', value: '°C', type: 'select', options: ['°C', '°F'] },
  { label: 'Pressure Unit', value: 'bar', type: 'select', options: ['bar', 'psi', 'kPa'] },
  { label: 'Color Theme', value: 'Dark Navy', type: 'select', options: ['Dark Navy', 'Midnight', 'Carbon', 'Custom'] },
  { label: 'Compact Mode', value: 'Disabled', type: 'toggle' },
]

const networkSettings: SettingItem[] = [
  { label: 'Proxy Enabled', value: 'Disabled', type: 'toggle' },
  { label: 'Proxy Address', value: 'proxy.local:8080', type: 'display' },
  { label: 'API Endpoint', value: 'api.ecumasterpro.com', type: 'display' },
  { label: 'Cloud Sync', value: 'Enabled', type: 'toggle' },
  { label: 'Sync Interval', value: 300, unit: 's', type: 'select', options: ['60', '300', '600', '1800'] },
  { label: 'SSL Verification', value: 'Enabled', type: 'toggle' },
]

const securitySettings: SettingItem[] = [
  { label: 'Data Encryption', value: 'AES-256', type: 'display' },
  { label: 'Access Control', value: 'Role-Based', type: 'select', options: ['Role-Based', 'PIN-Based', 'None'] },
  { label: 'Audit Logging', value: 'Enabled', type: 'toggle' },
  { label: 'Session Timeout', value: 30, unit: 'min', type: 'select', options: ['5', '15', '30', '60', 'Never'] },
  { label: 'Two-Factor Auth', value: 'Disabled', type: 'toggle' },
  { label: 'Auto-Lock', value: 'Enabled', type: 'toggle' },
]

const developerSettings: SettingItem[] = [
  { label: 'Debug Mode', value: 'Disabled', type: 'toggle' },
  { label: 'Verbose Logging', value: 'Disabled', type: 'toggle' },
  { label: 'Raw Data Capture', value: 'Disabled', type: 'toggle' },
  { label: 'Log Level', value: 'INFO', type: 'select', options: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'] },
  { label: 'CAN Frame Logging', value: 'Disabled', type: 'toggle' },
  { label: 'Performance Profiling', value: 'Disabled', type: 'toggle' },
]

const systemInfo = {
  version: 'ECU Master Pro 2026 v2.4.1',
  buildDate: '2026-04-28',
  buildHash: 'a7f2c9d1',
  runtime: 'Next.js 16 / Bun',
  memoryUsage: 342,
  memoryTotal: 1024,
  cpuUsage: 12,
  uptime: '3d 14h 22m',
  activeConnections: 2,
  logFileSize: '47.3 MB',
  dbSize: '12.8 MB',
  cacheSize: '8.2 MB',
}

export function AdvancedView() {
  const [settings, setSettings] = useState<Record<string, string | number | boolean>>({
    'Auto-Reconnect': true,
    'Auto-Export': true,
    'Anomaly Detection': true,
    'Real-Time Inference': true,
    'Compact Mode': false,
    'Proxy Enabled': false,
    'Cloud Sync': true,
    'SSL Verification': true,
    'Audit Logging': true,
    'Two-Factor Auth': false,
    'Auto-Lock': true,
    'Debug Mode': false,
    'Verbose Logging': false,
    'Raw Data Capture': false,
    'CAN Frame Logging': false,
    'Performance Profiling': false,
  })

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderSettingRow = (item: SettingItem, sectionKey: string) => {
    const toggleKey = item.label
    const isToggled = settings[toggleKey]

    return (
      <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#1e2a3a] last:border-0">
        <div>
          <div className="text-xs font-medium text-[#e2e8f0]">{item.label}</div>
          {item.unit && <div className="text-[10px] text-[#475569]">Unit: {item.unit}</div>}
        </div>
        <div>
          {item.type === 'display' && (
            <span className="text-xs font-mono text-[#64748b]">{item.value}{item.unit ? ` ${item.unit}` : ''}</span>
          )}
          {item.type === 'select' && (
            <select
              value={String(item.value)}
              className="h-7 px-2 text-xs font-mono bg-[#1e2a3a] border border-[#2d3f55] rounded text-[#e2e8f0] focus:border-[#00d4ff] focus:outline-none appearance-none cursor-pointer pr-6"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
            >
              {item.options?.map(opt => (
                <option key={opt} value={opt}>{opt}{item.unit ? ` ${item.unit}` : ''}</option>
              ))}
            </select>
          )}
          {item.type === 'toggle' && (
            <Switch
              checked={!!isToggled}
              onCheckedChange={() => toggleSetting(toggleKey)}
            />
          )}
        </div>
      </div>
    )
  }

  const memPercent = (systemInfo.memoryUsage / systemInfo.memoryTotal) * 100

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Advanced Settings</h1>
            <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[10px]">
              CONFIG
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">Platform configuration and advanced features</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs bg-[#151d2b] text-[#94a3b8] border border-[#1e2a3a] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1.5">
            <Upload className="h-3 w-3" />
            Import
          </Button>
          <Button size="sm" className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5">
            <Save className="h-3 w-3" />
            Save All
          </Button>
        </div>
      </div>

      {/* Connection Settings */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Wifi className="h-4 w-4 text-[#00d4ff]" />
            Connection Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionSettings.map(item => renderSettingRow(item, 'connection'))}
        </CardContent>
      </Card>

      {/* Data Logging Configuration */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Database className="h-4 w-4 text-[#10b981]" />
            Data Logging Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataLogSettings.map(item => renderSettingRow(item, 'datalog'))}
        </CardContent>
      </Card>

      {/* AI Model Settings */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#8b5cf6]" />
            AI Model Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiModelSettings.map(item => renderSettingRow(item, 'aimodel'))}
          {/* AI model status */}
          <div className="mt-4 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#475569]">Model Status</span>
              <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] mr-1 animate-pulse" />
                ACTIVE
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[9px] text-[#475569]">Last Trained</div>
                <div className="text-[10px] font-mono text-[#e2e8f0]">2026-04-27</div>
              </div>
              <div>
                <div className="text-[9px] text-[#475569]">Accuracy</div>
                <div className="text-[10px] font-mono text-[#10b981]">94.7%</div>
              </div>
              <div>
                <div className="text-[9px] text-[#475569]">Inference</div>
                <div className="text-[10px] font-mono text-[#e2e8f0]">12ms</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#f59e0b]" />
            Display Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displaySettings.map(item => renderSettingRow(item, 'display'))}
        </CardContent>
      </Card>

      {/* Network Configuration */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#00d4ff]" />
            Network Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {networkSettings.map(item => renderSettingRow(item, 'network'))}
          {/* Connection status */}
          <div className="mt-4 p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-3 w-3 text-[#10b981]" />
              <span className="text-[10px] text-[#475569]">API Connection Status</span>
              <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[8px]">ONLINE</Badge>
            </div>
            <div className="text-[10px] font-mono text-[#64748b]">
              Endpoint: {systemInfo.version.includes('v2') ? 'api.ecumasterpro.com/v2' : 'api.ecumasterpro.com/v1'}
              {' · '}Latency: 42ms
              {' · '}Last sync: 2m ago
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#ef4444]" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securitySettings.map(item => renderSettingRow(item, 'security'))}
          {/* Security status */}
          <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30">
            <Shield className="h-4 w-4 text-[#10b981] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-[#10b981] mb-1">Security Posture: Strong</div>
              <p className="text-[10px] text-[#94a3b8]">
                Encryption active (AES-256). Audit logging enabled. Session timeout set to 30 minutes.
                Consider enabling Two-Factor Authentication for additional security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Options */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Code className="h-4 w-4 text-[#f59e0b]" />
            Developer Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          {developerSettings.map(item => renderSettingRow(item, 'developer'))}
          <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
            <Code className="h-4 w-4 text-[#f59e0b] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-[#f59e0b] mb-1">Developer Mode Warning</div>
              <p className="text-[10px] text-[#94a3b8]">
                Enabling debug mode or verbose logging may impact system performance and generate large log files.
                Raw data capture records all CAN frames and may expose sensitive vehicle data. Use with caution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Monitor className="h-4 w-4 text-[#00d4ff]" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Version info */}
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Application Version</div>
                <div className="text-sm font-mono font-bold text-[#00d4ff]">{systemInfo.version}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="text-[10px] text-[#475569] mb-1">Build Date</div>
                  <div className="text-xs font-mono text-[#e2e8f0]">{systemInfo.buildDate}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="text-[10px] text-[#475569] mb-1">Build Hash</div>
                  <div className="text-xs font-mono text-[#e2e8f0]">{systemInfo.buildHash}</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Runtime</div>
                <div className="text-xs font-mono text-[#e2e8f0]">{systemInfo.runtime}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="text-[10px] text-[#475569] mb-1">Uptime</div>
                  <div className="text-xs font-mono text-[#e2e8f0]">{systemInfo.uptime}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                  <div className="text-[10px] text-[#475569] mb-1">Active Connections</div>
                  <div className="text-xs font-mono text-[#10b981]">{systemInfo.activeConnections}</div>
                </div>
              </div>
            </div>

            {/* Resource usage */}
            <div className="space-y-3">
              {/* CPU Usage */}
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3 w-3 text-[#00d4ff]" />
                    <span className="text-[10px] text-[#475569]">CPU Usage</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#10b981]">{systemInfo.cpuUsage}%</span>
                </div>
                <div className="w-full h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${systemInfo.cpuUsage}%` }} />
                </div>
              </div>

              {/* Memory Usage */}
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="h-3 w-3 text-[#8b5cf6]" />
                    <span className="text-[10px] text-[#475569]">Memory Usage</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#f59e0b]">{systemInfo.memoryUsage}/{systemInfo.memoryTotal} MB</span>
                </div>
                <div className="w-full h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#f59e0b] rounded-full" style={{ width: `${memPercent}%` }} />
                </div>
              </div>

              {/* Storage breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-[#0f1923] border border-[#1e2a3a] text-center">
                  <div className="text-[9px] text-[#475569] mb-1">Logs</div>
                  <div className="text-[10px] font-mono font-bold text-[#e2e8f0]">{systemInfo.logFileSize}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0f1923] border border-[#1e2a3a] text-center">
                  <div className="text-[9px] text-[#475569] mb-1">Database</div>
                  <div className="text-[10px] font-mono font-bold text-[#e2e8f0]">{systemInfo.dbSize}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0f1923] border border-[#1e2a3a] text-center">
                  <div className="text-[9px] text-[#475569] mb-1">Cache</div>
                  <div className="text-[10px] font-mono font-bold text-[#e2e8f0]">{systemInfo.cacheSize}</div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-[10px] flex-1 bg-[#151d2b] text-[#94a3b8] border border-[#1e2a3a] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Clear Cache
                </Button>
                <Button size="sm" className="h-8 text-[10px] flex-1 bg-[#151d2b] text-[#94a3b8] border border-[#1e2a3a] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] gap-1">
                  <Download className="h-3 w-3" />
                  Export Logs
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
