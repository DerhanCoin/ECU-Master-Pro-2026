'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Monitor,
  Smartphone,
  Terminal,
  Car,
  Clock,
  Activity,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Trash2,
  Eye,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Server,
  ArrowDownToLine,
  Cpu,
  Zap,
  HardDrive,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type ClientStatus = 'Online' | 'Offline' | 'Updating'
type EventType = 'connect' | 'disconnect' | 'update' | 'error'

interface PlatformDownload {
  id: string
  name: string
  icon: React.ReactNode
  version: string
  fileSize: string
  downloadCount: string
  systemReqs: string[]
  downloadUrl: string
  color: string
}

interface DeployedClient {
  id: string
  vehicle: string
  vin: string
  clientVersion: string
  status: ClientStatus
  lastSeen: string
  dataRate: string
}

interface ActivityEntry {
  id: string
  timestamp: string
  clientName: string
  eventType: EventType
  message: string
}

// Mock data
const PLATFORM_DOWNLOADS: PlatformDownload[] = [
  {
    id: 'windows',
    name: 'Windows (x64)',
    icon: <Monitor className="h-5 w-5" />,
    version: 'v3.2.1',
    fileSize: '48.2 MB',
    downloadCount: '12,847',
    systemReqs: ['Windows 10/11 (64-bit)', '4 GB RAM minimum', '100 MB free disk space', '.NET 6.0 Runtime'],
    downloadUrl: '#',
    color: '#00d4ff',
  },
  {
    id: 'linux',
    name: 'Linux (ARM/ARM64)',
    icon: <Terminal className="h-5 w-5" />,
    version: 'v3.2.1',
    fileSize: '32.7 MB',
    downloadCount: '5,234',
    systemReqs: ['Ubuntu 20.04+ / Debian 11+', '2 GB RAM minimum', '50 MB free disk space', 'libssl-dev, libusb-1.0'],
    downloadUrl: '#',
    color: '#10b981',
  },
  {
    id: 'android',
    name: 'Android (APK)',
    icon: <Smartphone className="h-5 w-5" />,
    version: 'v3.2.1',
    fileSize: '24.5 MB',
    downloadCount: '8,912',
    systemReqs: ['Android 8.0+ (Oreo)', '2 GB RAM minimum', 'OTG USB host support', 'Bluetooth 4.0+ for OBD'],
    downloadUrl: '#',
    color: '#8b5cf6',
  },
]

const DEPLOYED_CLIENTS: DeployedClient[] = [
  {
    id: 'client-1',
    vehicle: 'VW Golf GTI',
    vin: 'WVWZZZ1KZAM000001',
    clientVersion: 'v3.2.1',
    status: 'Online',
    lastSeen: 'Just now',
    dataRate: '124 B/s',
  },
  {
    id: 'client-2',
    vehicle: 'BMW 330e',
    vin: 'WBA5R1C50KA000002',
    clientVersion: 'v3.2.0',
    status: 'Updating',
    lastSeen: '1 min ago',
    dataRate: '89 B/s',
  },
  {
    id: 'client-3',
    vehicle: 'Mercedes C-Class',
    vin: 'WDD205020J000003',
    clientVersion: 'v3.2.1',
    status: 'Online',
    lastSeen: 'Just now',
    dataRate: '156 B/s',
  },
  {
    id: 'client-4',
    vehicle: 'Audi A4 Avant',
    vin: 'WAUAD38H66A000004',
    clientVersion: 'v3.1.8',
    status: 'Offline',
    lastSeen: '2 hours ago',
    dataRate: '0 B/s',
  },
  {
    id: 'client-5',
    vehicle: 'Skoda Octavia RS',
    vin: 'TMBAG9NE6L0000005',
    clientVersion: 'v3.2.1',
    status: 'Online',
    lastSeen: 'Just now',
    dataRate: '98 B/s',
  },
]

const INITIAL_ACTIVITY_LOG: ActivityEntry[] = [
  {
    id: 'log-1',
    timestamp: '14:32:18',
    clientName: 'VW Golf GTI',
    eventType: 'connect',
    message: 'Client connected via TLS 1.3 (session resumed)',
  },
  {
    id: 'log-2',
    timestamp: '14:30:05',
    clientName: 'BMW 330e',
    eventType: 'update',
    message: 'Client update started: v3.2.0 → v3.2.1',
  },
  {
    id: 'log-3',
    timestamp: '14:28:42',
    clientName: 'Audi A4 Avant',
    eventType: 'disconnect',
    message: 'Client disconnected: connection timeout (30s)',
  },
  {
    id: 'log-4',
    timestamp: '14:25:11',
    clientName: 'Mercedes C-Class',
    eventType: 'connect',
    message: 'Client connected via TLS 1.3 (new session)',
  },
  {
    id: 'log-5',
    timestamp: '14:22:33',
    clientName: 'Skoda Octavia RS',
    eventType: 'connect',
    message: 'Client connected via TLS 1.3 (session resumed)',
  },
  {
    id: 'log-6',
    timestamp: '14:18:09',
    clientName: 'VW Golf GTI',
    eventType: 'update',
    message: 'Auto-update completed: v3.2.0 → v3.2.1',
  },
  {
    id: 'log-7',
    timestamp: '14:15:44',
    clientName: 'BMW 330e',
    eventType: 'error',
    message: 'Data rate exceeded threshold: 245 B/s (limit 200 B/s)',
  },
  {
    id: 'log-8',
    timestamp: '14:10:22',
    clientName: 'Audi A4 Avant',
    eventType: 'disconnect',
    message: 'Client disconnected: vehicle shutdown detected',
  },
  {
    id: 'log-9',
    timestamp: '14:05:17',
    clientName: 'Mercedes C-Class',
    eventType: 'connect',
    message: 'Client connected via TLS 1.2 (fallback)',
  },
  {
    id: 'log-10',
    timestamp: '13:58:03',
    clientName: 'Skoda Octavia RS',
    eventType: 'error',
    message: 'Remote command timeout: Read DTC (30s exceeded)',
  },
]

const INSTALLATION_STEPS = [
  {
    platform: 'Windows',
    steps: [
      'Download the ECU Master Remote Client installer (.msi)',
      'Run the installer and follow the setup wizard',
      'Accept the license agreement and choose installation directory',
      'Connect the OBD-II diagnostic adapter to the vehicle',
      'Launch the client and enter your server credentials',
      'Verify connection status shows "Connected" in the system tray',
    ],
  },
  {
    platform: 'Linux',
    steps: [
      'Download the .deb (Debian/Ubuntu) or .rpm (Fedora) package',
      'Install: sudo dpkg -i ecu-remote-client_3.2.1_arm64.deb',
      'Or use: sudo apt install ./ecu-remote-client_3.2.1_arm64.deb',
      'Connect the OBD-II adapter and ensure USB permissions: sudo usermod -aG dialout $USER',
      'Start the service: sudo systemctl start ecu-remote-client',
      'Enable auto-start: sudo systemctl enable ecu-remote-client',
    ],
  },
  {
    platform: 'Android',
    steps: [
      'Download the APK file to your Android device',
      'Enable "Install from Unknown Sources" in Settings > Security',
      'Open the downloaded APK and tap "Install"',
      'Connect the ELM327 or compatible OBD-II adapter via Bluetooth',
      'Pair the adapter in Android Bluetooth settings first',
      'Open the app and configure your server connection details',
    ],
  },
]

// Status badge component
function StatusBadge({ status }: { status: ClientStatus }) {
  switch (status) {
    case 'Online':
      return (
        <Badge
          className="text-[9px] border-0 px-2 py-0.5 h-5 font-semibold gap-1.5"
          style={{ backgroundColor: '#10b98120', color: '#10b981' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]" />
          </span>
          Online
        </Badge>
      )
    case 'Offline':
      return (
        <Badge
          className="text-[9px] border-0 px-2 py-0.5 h-5 font-semibold gap-1"
          style={{ backgroundColor: '#64748b20', color: '#64748b' }}
        >
          <WifiOff className="h-2.5 w-2.5" />
          Offline
        </Badge>
      )
    case 'Updating':
      return (
        <Badge
          className="text-[9px] border-0 px-2 py-0.5 h-5 font-semibold gap-1"
          style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
        >
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          Updating
        </Badge>
      )
  }
}

// Event type badge
function EventTypeBadge({ type }: { type: EventType }) {
  const config = {
    connect: { bg: '#10b98120', color: '#10b981', icon: <Wifi className="h-2.5 w-2.5" />, label: 'Connect' },
    disconnect: { bg: '#64748b20', color: '#64748b', icon: <WifiOff className="h-2.5 w-2.5" />, label: 'Disconnect' },
    update: { bg: '#00d4ff20', color: '#00d4ff', icon: <RefreshCw className="h-2.5 w-2.5" />, label: 'Update' },
    error: { bg: '#ef444420', color: '#ef4444', icon: <AlertTriangle className="h-2.5 w-2.5" />, label: 'Error' },
  }
  const c = config[type]
  return (
    <Badge
      className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold gap-1"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.icon}
      {c.label}
    </Badge>
  )
}

export function RemoteClientView() {
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Windows')
  const [configInterval, setConfigInterval] = useState('5s')
  const [configAutoUpdate, setConfigAutoUpdate] = useState(true)
  const [configEncryption, setConfigEncryption] = useState('TLS 1.3')
  const [configTimeout, setConfigTimeout] = useState('30s')
  const [configRetention, setConfigRetention] = useState('30 days')
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(INITIAL_ACTIVITY_LOG)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSaveConfig = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const handleClearLog = () => {
    setActivityLog([])
  }

  const selectedInstallSteps = INSTALLATION_STEPS.find((s) => s.platform === selectedPlatform)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Download className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Remote Client</h1>
              <Badge
                className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                style={{ backgroundColor: '#00d4ff20', color: '#00d4ff' }}
              >
                NEW
              </Badge>
            </div>
            <p className="text-xs text-[#64748b]">
              Deploy and manage remote diagnostic clients on target vehicles
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
          >
            <ArrowDownToLine className="h-3 w-3" />
            Download Client
          </Button>
        </div>

        {/* Client Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                <Server className="h-3.5 w-3.5 text-[#00d4ff]" />
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">Deployed Clients</span>
            </div>
            <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">12</span>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-[#10b981]/10 flex items-center justify-center">
                <Wifi className="h-3.5 w-3.5 text-[#10b981]" />
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">Active Now</span>
            </div>
            <span className="text-xl font-bold text-[#10b981] tabular-nums">8</span>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-[#8b5cf6]/10 flex items-center justify-center">
                <Database className="h-3.5 w-3.5 text-[#8b5cf6]" />
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">Total Data</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">4.2</span>
              <span className="text-xs text-[#64748b]">GB</span>
            </div>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-[#f59e0b]/10 flex items-center justify-center">
                <Gauge className="h-3.5 w-3.5 text-[#f59e0b]" />
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">Avg Latency</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">45</span>
              <span className="text-xs text-[#64748b]">ms</span>
            </div>
          </div>
        </div>

        {/* Client Download Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Client Downloads</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLATFORM_DOWNLOADS.map((platform) => (
              <div
                key={platform.id}
                className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-colors"
              >
                {/* Platform Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}10` }}
                  >
                    <span style={{ color: platform.color }}>{platform.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e2e8f0]">{platform.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                        style={{ backgroundColor: `${platform.color}15`, color: platform.color }}
                      >
                        {platform.version}
                      </Badge>
                      <span className="text-[10px] text-[#64748b]">{platform.fileSize}</span>
                    </div>
                  </div>
                </div>

                {/* System Requirements */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Cpu className="h-3 w-3 text-[#64748b]" />
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      System Requirements
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {platform.systemReqs.map((req, idx) => (
                      <li key={idx} className="text-[10px] text-[#64748b] flex items-start gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-[#1e2a3a] mt-1.5 shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Download stats and button */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1e2a3a]">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#64748b]">
                    <ArrowDownToLine className="h-3 w-3" />
                    <span>{platform.downloadCount} downloads</span>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-[10px] font-semibold gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Installation Guide */}
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
            <button
              onClick={() => setShowInstallGuide(!showInstallGuide)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1e2a3a]/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00d4ff]" />
                <span className="text-sm font-semibold text-[#e2e8f0]">Installation Guide</span>
              </div>
              {showInstallGuide ? (
                <ChevronUp className="h-4 w-4 text-[#64748b]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
              )}
            </button>

            {showInstallGuide && (
              <div className="px-4 pb-4 border-t border-[#1e2a3a]">
                {/* Platform selector tabs */}
                <div className="flex items-center gap-2 py-3">
                  {INSTALLATION_STEPS.map((plat) => (
                    <button
                      key={plat.platform}
                      onClick={() => setSelectedPlatform(plat.platform)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all',
                        selectedPlatform === plat.platform
                          ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30'
                          : 'text-[#64748b] hover:text-[#94a3b8] border border-transparent hover:border-[#1e2a3a]'
                      )}
                    >
                      {plat.platform}
                    </button>
                  ))}
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {selectedInstallSteps?.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold',
                          selectedPlatform === 'Windows'
                            ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                            : selectedPlatform === 'Linux'
                            ? 'bg-[#10b981]/10 text-[#10b981]'
                            : 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#94a3b8] leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deployed Clients Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Deployed Clients</h2>
            <Badge
              className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
              style={{ backgroundColor: '#00d4ff20', color: '#00d4ff' }}
            >
              {DEPLOYED_CLIENTS.length}
            </Badge>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#1e2a3a] bg-[#0f1923]/50">
              <div className="col-span-3 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                Vehicle
              </div>
              <div className="col-span-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                Version
              </div>
              <div className="col-span-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                Status
              </div>
              <div className="col-span-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                Last Seen
              </div>
              <div className="col-span-1 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                Data Rate
              </div>
              <div className="col-span-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider text-right">
                Actions
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#1e2a3a]">
              {DEPLOYED_CLIENTS.map((client) => (
                <div
                  key={client.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#1e2a3a]/20 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-[#00d4ff]/10 flex items-center justify-center shrink-0">
                      <Car className="h-3.5 w-3.5 text-[#00d4ff]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#e2e8f0] truncate">{client.vehicle}</div>
                      <div className="text-[9px] font-mono text-[#475569] truncate">{client.vin}</div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                      style={{ backgroundColor: '#00d4ff15', color: '#00d4ff' }}
                    >
                      {client.clientVersion}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={client.status} />
                  </div>
                  <div className="col-span-2 flex items-center gap-1 text-[11px] text-[#94a3b8]">
                    <Clock className="h-3 w-3 text-[#64748b]" />
                    {client.lastSeen}
                  </div>
                  <div className="col-span-1 text-[11px] text-[#94a3b8] tabular-nums">{client.dataRate}</div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-[9px] font-semibold gap-0.5 bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 border-0 px-2"
                    >
                      <Eye className="h-2.5 w-2.5" />
                      Logs
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-[9px] font-semibold gap-0.5 bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 border-0 px-2"
                      disabled={client.status === 'Updating'}
                    >
                      <RefreshCw className={cn('h-2.5 w-2.5', client.status === 'Updating' && 'animate-spin')} />
                      Update
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-[9px] font-semibold gap-0.5 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border-0 px-2"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Panel and Activity Log - Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Client Configuration Panel */}
          <div className="xl:col-span-3 space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#00d4ff]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">Client Configuration</h2>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 space-y-4">
              {/* Data Collection Interval */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-[#64748b]" />
                  <span className="text-xs text-[#e2e8f0] font-medium">Data Collection Interval</span>
                </div>
                <select
                  value={configInterval}
                  onChange={(e) => setConfigInterval(e.target.value)}
                  className="h-7 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] px-2.5 focus:outline-none focus:border-[#00d4ff]/50"
                >
                  <option value="1s">1 second</option>
                  <option value="5s">5 seconds</option>
                  <option value="10s">10 seconds</option>
                  <option value="30s">30 seconds</option>
                  <option value="60s">60 seconds</option>
                </select>
              </div>

              {/* Auto-Update Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-[#64748b]" />
                  <span className="text-xs text-[#e2e8f0] font-medium">Auto-Update</span>
                </div>
                <button
                  onClick={() => setConfigAutoUpdate(!configAutoUpdate)}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    configAutoUpdate ? 'bg-[#00d4ff]' : 'bg-[#1e2a3a]'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 rounded-full transition-transform',
                      configAutoUpdate ? 'translate-x-[18px] bg-white' : 'translate-x-[3px] bg-[#475569]'
                    )}
                  />
                </button>
              </div>

              {/* Encryption Level */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-[#64748b]" />
                  <span className="text-xs text-[#e2e8f0] font-medium">Encryption Level</span>
                </div>
                <select
                  value={configEncryption}
                  onChange={(e) => setConfigEncryption(e.target.value)}
                  className="h-7 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] px-2.5 focus:outline-none focus:border-[#00d4ff]/50"
                >
                  <option value="None">None</option>
                  <option value="TLS 1.2">TLS 1.2</option>
                  <option value="TLS 1.3">TLS 1.3</option>
                </select>
              </div>

              {/* Remote Command Timeout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#64748b]" />
                  <span className="text-xs text-[#e2e8f0] font-medium">Remote Command Timeout</span>
                </div>
                <select
                  value={configTimeout}
                  onChange={(e) => setConfigTimeout(e.target.value)}
                  className="h-7 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] px-2.5 focus:outline-none focus:border-[#00d4ff]/50"
                >
                  <option value="5s">5 seconds</option>
                  <option value="10s">10 seconds</option>
                  <option value="30s">30 seconds</option>
                  <option value="60s">60 seconds</option>
                </select>
              </div>

              {/* Data Retention Period */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-[#64748b]" />
                  <span className="text-xs text-[#e2e8f0] font-medium">Data Retention Period</span>
                </div>
                <select
                  value={configRetention}
                  onChange={(e) => setConfigRetention(e.target.value)}
                  className="h-7 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] px-2.5 focus:outline-none focus:border-[#00d4ff]/50"
                >
                  <option value="7 days">7 days</option>
                  <option value="30 days">30 days</option>
                  <option value="90 days">90 days</option>
                  <option value="1 year">1 year</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2a3a]">
                {saveSuccess && (
                  <div className="flex items-center gap-1 text-[10px] text-[#10b981]">
                    <CheckCircle2 className="h-3 w-3" />
                    Configuration saved
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveConfig}
                  className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                >
                  <Zap className="h-3 w-3" />
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="xl:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00d4ff]" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">Activity Log</h2>
                <Badge
                  className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
                  style={{ backgroundColor: '#00d4ff20', color: '#00d4ff' }}
                >
                  {activityLog.length}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[9px] font-semibold border-[#1e2a3a] text-[#64748b] hover:bg-[#1e2a3a] hover:text-[#94a3b8]"
                onClick={handleClearLog}
                disabled={activityLog.length === 0}
              >
                <Trash2 className="h-2.5 w-2.5 mr-1" />
                Clear Log
              </Button>
            </div>

            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
              {activityLog.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8 text-[#475569] mb-2" />
                  <p className="text-xs text-[#64748b]">No activity recorded</p>
                  <p className="text-[10px] text-[#475569] mt-1">Client events will appear here</p>
                </div>
              ) : (
                <div
                  className="max-h-[380px] overflow-y-auto divide-y divide-[#1e2a3a]"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#1e2a3a #0f1923',
                  }}
                >
                  {activityLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-4 py-2.5 hover:bg-[#1e2a3a]/20 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-center shrink-0 mt-0.5">
                          <span className="text-[9px] font-mono text-[#475569] tabular-nums">
                            {entry.timestamp}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-semibold text-[#e2e8f0] truncate">
                              {entry.clientName}
                            </span>
                            <EventTypeBadge type={entry.eventType} />
                          </div>
                          <p className="text-[10px] text-[#94a3b8] leading-relaxed">
                            {entry.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
