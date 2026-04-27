'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useAppStore, type ViewType } from '@/stores/app-store'
import {
  Search,
  Zap,
  Wifi,
  Brain,
  Activity,
  Calendar,
  Settings,
  LayoutDashboard,
  Car,
  Server,
  Radio,
  Download,
  Usb,
  Globe,
  Link2,
  AlertTriangle,
  Cpu,
  Gauge,
  BusFront,
  Plug,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Code,
} from 'lucide-react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandShortcut,
} from '@/components/ui/command'

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  view: ViewType
}

interface RecentVehicle {
  id: string
  name: string
  status: 'Healthy' | 'Warning' | 'Critical'
  statusColor: string
}

interface DTCCode {
  code: string
  description: string
}

const quickActions: QuickAction[] = [
  {
    id: 'quick-scan',
    label: 'Quick Scan Vehicle',
    icon: <Zap className="h-4 w-4" />,
    shortcut: '⌘⇧S',
  },
  {
    id: 'connect-device',
    label: 'Connect Device',
    icon: <Wifi className="h-4 w-4" />,
    shortcut: '⌘⇧C',
  },
  {
    id: 'ai-analysis',
    label: 'Run AI Analysis',
    icon: <Brain className="h-4 w-4" />,
    shortcut: '⌘⇧A',
  },
  {
    id: 'live-data',
    label: 'View Live Data',
    icon: <Activity className="h-4 w-4" />,
    shortcut: '⌘⇧L',
  },
  {
    id: 'service-history',
    label: 'Check Service History',
    icon: <Calendar className="h-4 w-4" />,
    shortcut: '⌘⇧H',
  },
  {
    id: 'open-settings',
    label: 'Open Settings',
    icon: <Settings className="h-4 w-4" />,
    shortcut: '⌘,',
  },
]

const navItems: NavItem[] = [
  // Overview
  { id: 'nav-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, view: 'dashboard' },
  { id: 'nav-fleet', label: 'Fleet', icon: <Car className="h-4 w-4" />, view: 'fleet' },
  { id: 'nav-oem-scan', label: 'OEM Scan', icon: <Server className="h-4 w-4" />, view: 'oem-scan' },
  { id: 'nav-ai-predictive', label: 'AI Predictive', icon: <Zap className="h-4 w-4" />, view: 'ai-predictive' },
  { id: 'nav-autoconnect', label: 'AutoConnect', icon: <Radio className="h-4 w-4" />, view: 'autoconnect' },
  { id: 'nav-realtime', label: 'Realtime', icon: <Activity className="h-4 w-4" />, view: 'realtime' },
  // Connection
  { id: 'nav-remote', label: 'Remote', icon: <Download className="h-4 w-4" />, view: 'remote' },
  { id: 'nav-usb', label: 'USB', icon: <Usb className="h-4 w-4" />, view: 'usb' },
  { id: 'nav-webserial', label: 'WebSerial', icon: <Globe className="h-4 w-4" />, view: 'webserial' },
  { id: 'nav-vas6154', label: 'VAS 6154', icon: <Wifi className="h-4 w-4" />, view: 'vas6154' },
  { id: 'nav-dongles', label: 'Dongles', icon: <Link2 className="h-4 w-4" />, view: 'dongles' },
  // Diagnostics
  { id: 'nav-diagnostics', label: 'Diagnostics', icon: <AlertTriangle className="h-4 w-4" />, view: 'diagnostics' },
  { id: 'nav-pro-diagnostics', label: 'Pro Diagnostics', icon: <Search className="h-4 w-4" />, view: 'pro-diagnostics' },
  { id: 'nav-ai', label: 'AI Diagnostics', icon: <Cpu className="h-4 w-4" />, view: 'ai' },
  { id: 'nav-dtc-tool', label: 'DTC Tool', icon: <Code className="h-4 w-4" />, view: 'dtc-tool' },
  { id: 'nav-adas', label: 'ADAS', icon: <Shield className="h-4 w-4" />, view: 'adas' },
  { id: 'nav-vin-detect', label: 'VIN Detect', icon: <Search className="h-4 w-4" />, view: 'vin-detect' },
  { id: 'nav-live-sensors', label: 'Live Sensors', icon: <Activity className="h-4 w-4" />, view: 'live-sensors' },
  // Performance & Tuning
  { id: 'nav-performance', label: 'Performance', icon: <Gauge className="h-4 w-4" />, view: 'performance' },
  { id: 'nav-can', label: 'CAN Bus', icon: <BusFront className="h-4 w-4" />, view: 'can' },
  { id: 'nav-tuning', label: 'Tuning', icon: <Zap className="h-4 w-4" />, view: 'tuning' },
  { id: 'nav-map-editor', label: 'Map Editor', icon: <Gauge className="h-4 w-4" />, view: 'map-editor' },
  { id: 'nav-data-logger', label: 'Data Logger', icon: <Calendar className="h-4 w-4" />, view: 'data-logger' },
  // ECU & Flash
  { id: 'nav-flash', label: 'Flash', icon: <Zap className="h-4 w-4" />, view: 'flash' },
  { id: 'nav-ecu', label: 'ECU Info', icon: <Cpu className="h-4 w-4" />, view: 'ecu' },
  { id: 'nav-advanced-ecu', label: 'Advanced ECU', icon: <Cpu className="h-4 w-4" />, view: 'advanced-ecu' },
  { id: 'nav-advanced', label: 'Advanced', icon: <Settings className="h-4 w-4" />, view: 'advanced' },
  { id: 'nav-flash-verify', label: 'Flash Verify', icon: <CheckCircle2 className="h-4 w-4" />, view: 'flash-verify' },
  // Transmission & Protocols
  { id: 'nav-transmission', label: 'Transmission', icon: <Car className="h-4 w-4" />, view: 'transmission' },
  { id: 'nav-transmission-control', label: 'TCU Control', icon: <Gauge className="h-4 w-4" />, view: 'transmission-control' },
  { id: 'nav-sgw', label: 'SGW', icon: <Shield className="h-4 w-4" />, view: 'sgw' },
  { id: 'nav-j2534', label: 'J2534', icon: <Plug className="h-4 w-4" />, view: 'j2534' },
  { id: 'nav-doip', label: 'DoIP', icon: <Globe className="h-4 w-4" />, view: 'doip' },
  { id: 'nav-passthru', label: 'Passthru', icon: <Link2 className="h-4 w-4" />, view: 'passthru' },
  // Network & EV
  { id: 'nav-network-analysis', label: 'Network Analysis', icon: <Shield className="h-4 w-4" />, view: 'network-analysis' },
  { id: 'nav-ev', label: 'EV / Hybrid', icon: <Plug className="h-4 w-4" />, view: 'ev' },
  // Tools & Data
  { id: 'nav-tools', label: 'Tools', icon: <AlertTriangle className="h-4 w-4" />, view: 'tools' },
  { id: 'nav-sensor-stream', label: 'Sensor Stream', icon: <Activity className="h-4 w-4" />, view: 'sensor-stream' },
  { id: 'nav-vehicle-database', label: 'Vehicle Database', icon: <Server className="h-4 w-4" />, view: 'vehicle-database' },
  { id: 'nav-reports', label: 'Reports', icon: <Calendar className="h-4 w-4" />, view: 'reports' },
  { id: 'nav-tsb', label: 'TSB', icon: <Calendar className="h-4 w-4" />, view: 'tsb' },
  { id: 'nav-cloud-sync', label: 'Cloud Sync', icon: <Globe className="h-4 w-4" />, view: 'cloud-sync' },
  // Insights
  { id: 'nav-topology-3d', label: '3D Topology', icon: <Server className="h-4 w-4" />, view: 'topology-3d' },
  { id: 'nav-trends', label: 'Trends', icon: <Activity className="h-4 w-4" />, view: 'trends' },
  { id: 'nav-service', label: 'Service', icon: <Calendar className="h-4 w-4" />, view: 'service' },
  { id: 'nav-service-history', label: 'Service History', icon: <Calendar className="h-4 w-4" />, view: 'service-history' },
]

const recentVehicles: RecentVehicle[] = [
  { id: 'vw-golf', name: 'VW Golf GTI', status: 'Healthy', statusColor: '#10b981' },
  { id: 'audi-a4', name: 'Audi A4 B9', status: 'Warning', statusColor: '#f59e0b' },
  { id: 'bmw-330e', name: 'BMW 330e', status: 'Healthy', statusColor: '#10b981' },
  { id: 'mercedes-c', name: 'Mercedes C-Class', status: 'Critical', statusColor: '#ef4444' },
]

const dtcCodes: DTCCode[] = [
  { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected' },
  { code: 'P0171', description: 'System Too Lean (Bank 1)' },
  { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold' },
  { code: 'C0035', description: 'Left Front Wheel Speed Sensor' },
  { code: 'B1000', description: 'ECU Internal Circuit Failure' },
  { code: 'U0100', description: 'Lost Communication With ECM/PCM' },
]

function isDTCQuery(query: string): boolean {
  return /^[PBCUpbcu]\d{0,4}$/.test(query)
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'Healthy':
      return <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
    case 'Warning':
      return <AlertCircle className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
    case 'Critical':
      return <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
    default:
      return null
  }
}

function CommandPaletteContent({ onClose }: { onClose: () => void }) {
  const { setActiveView, setConnectModalOpen } = useAppStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchValue, setSearchValue] = useState('')

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleSelect = useCallback((callback: () => void) => {
    handleClose()
    callback()
  }, [handleClose])

  const getQuickActionCallback = useCallback((id: string) => {
    switch (id) {
      case 'quick-scan':
        return () => setActiveView('dtc-tool')
      case 'connect-device':
        return () => setConnectModalOpen(true)
      case 'ai-analysis':
        return () => setActiveView('ai')
      case 'live-data':
        return () => setActiveView('live-sensors')
      case 'service-history':
        return () => setActiveView('service')
      case 'open-settings':
        return () => setActiveView('advanced')
      default:
        return () => {}
    }
  }, [setActiveView, setConnectModalOpen])

  // Determine if we should show DTC lookup section
  const showDTCSection = isDTCQuery(searchValue)
  const filteredDTCCodes = showDTCSection
    ? dtcCodes.filter((d) =>
        d.code.toLowerCase().startsWith(searchValue.toUpperCase()) ||
        d.description.toLowerCase().includes(searchValue.toLowerCase())
      )
    : []

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Command Palette Container */}
      <div
        className="fixed top-[12%] left-1/2 -translate-x-1/2 z-50 w-full max-w-[500px] animate-in slide-in-from-top-4 fade-in duration-200"
      >
        <div className="rounded-xl border border-[#1e2a3a] bg-[#0f1923] shadow-2xl shadow-black/50 overflow-hidden">
          <Command
            className="bg-transparent"
            loop
          >
            {/* Search Input with custom styling */}
            <div className="flex items-center border-b border-[#1e2a3a] px-4">
              <Search className="h-4 w-4 text-[#475569] shrink-0" />
              <CommandInput
                ref={inputRef}
                placeholder="Type a command or search..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="h-12 text-sm text-[#e2e8f0] placeholder:text-[#475569] border-0 bg-transparent focus:ring-0 focus:outline-none"
              />
              <button
                onClick={handleClose}
                className="flex items-center gap-1 text-[10px] text-[#475569] hover:text-[#94a3b8] transition-colors shrink-0 ml-2 px-1.5 py-0.5 rounded border border-[#1e2a3a]"
              >
                <span>ESC</span>
              </button>
            </div>

            <CommandList className="max-h-[400px] overflow-y-auto scrollbar-thin">
              <CommandEmpty className="py-6 text-center text-sm text-[#475569]">
                No results found.
              </CommandEmpty>

              {/* DTC Code Lookup - shown when query matches DTC pattern */}
              {showDTCSection && filteredDTCCodes.length > 0 && (
                <CommandGroup
                  heading="DTC Code Lookup"
                  className="[&_[cmdk-group-heading]]:text-[#00d4ff] [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2"
                >
                  {filteredDTCCodes.map((dtc) => (
                    <CommandItem
                      key={dtc.code}
                      value={`dtc-${dtc.code}`}
                      onSelect={() => handleSelect(() => {
                        setActiveView('dtc-tool')
                      })}
                      className="mx-2 px-3 py-2.5 rounded-lg cursor-pointer text-[#e2e8f0] data-[selected=true]:bg-[#1e2a3a] data-[selected=true]:text-[#00d4ff] hover:bg-[#1e2a3a] flex items-center gap-3"
                    >
                      <Code className="h-4 w-4 text-[#00d4ff] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-sm text-[#00d4ff]">{dtc.code}</span>
                        </div>
                        <span className="text-xs text-[#94a3b8] truncate block">{dtc.description}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#475569] shrink-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Quick Actions */}
              <CommandGroup
                heading="Quick Actions"
                className="[&_[cmdk-group-heading]]:text-[#00d4ff] [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2"
              >
                {quickActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={`action-${action.label}`}
                    onSelect={() => handleSelect(getQuickActionCallback(action.id))}
                    className="mx-2 px-3 py-2.5 rounded-lg cursor-pointer text-[#e2e8f0] data-[selected=true]:bg-[#1e2a3a] data-[selected=true]:text-[#00d4ff] hover:bg-[#1e2a3a] flex items-center gap-3"
                  >
                    <span className="text-[#64748b] group-data-[selected=true]:text-[#00d4ff]">{action.icon}</span>
                    <span className="flex-1 text-sm">{action.label}</span>
                    {action.shortcut && (
                      <CommandShortcut className="text-[10px] text-[#475569] font-mono tracking-wider">
                        {action.shortcut}
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Navigation */}
              <CommandGroup
                heading="Navigate"
                className="[&_[cmdk-group-heading]]:text-[#94a3b8] [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2"
              >
                {navItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`nav-${item.label}`}
                    onSelect={() => handleSelect(() => setActiveView(item.view))}
                    className="mx-2 px-3 py-2 rounded-lg cursor-pointer text-[#e2e8f0] data-[selected=true]:bg-[#1e2a3a] data-[selected=true]:text-[#00d4ff] hover:bg-[#1e2a3a] flex items-center gap-3"
                  >
                    <span className="text-[#64748b]">{item.icon}</span>
                    <span className="flex-1 text-sm">{item.label}</span>
                    <ChevronRight className="h-3 w-3 text-[#2a3a4a] shrink-0" />
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Recent Vehicles */}
              <CommandGroup
                heading="Recent Vehicles"
                className="[&_[cmdk-group-heading]]:text-[#94a3b8] [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2"
              >
                {recentVehicles.map((vehicle) => (
                  <CommandItem
                    key={vehicle.id}
                    value={`vehicle-${vehicle.name}`}
                    onSelect={() => handleSelect(() => setActiveView('fleet'))}
                    className="mx-2 px-3 py-2.5 rounded-lg cursor-pointer text-[#e2e8f0] data-[selected=true]:bg-[#1e2a3a] data-[selected=true]:text-[#00d4ff] hover:bg-[#1e2a3a] flex items-center gap-3"
                  >
                    <Car className="h-4 w-4 text-[#64748b] shrink-0" />
                    <span className="flex-1 text-sm">{vehicle.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getStatusIcon(vehicle.status)}
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: vehicle.statusColor }}
                      >
                        {vehicle.status}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>

            {/* Footer hint */}
            <div className="border-t border-[#1e2a3a] px-4 py-2 flex items-center justify-between text-[10px] text-[#475569]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[#1e2a3a] text-[#94a3b8] font-mono">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[#1e2a3a] text-[#94a3b8] font-mono">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[#1e2a3a] text-[#94a3b8] font-mono">esc</kbd>
                  close
                </span>
              </div>
              <span className="text-[#2a3a4a]">ECU Master Pro</span>
            </div>
          </Command>
        </div>
      </div>
    </>
  )
}

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
  } = useAppStore()

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!isCommandPaletteOpen)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCommandPaletteOpen, setCommandPaletteOpen])

  if (!isCommandPaletteOpen) return null

  return (
    <CommandPaletteContent
      onClose={() => setCommandPaletteOpen(false)}
    />
  )
}
