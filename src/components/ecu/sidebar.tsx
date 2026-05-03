'use client'

import { useAppStore, type ViewType } from '@/stores/app-store'
import {
  LayoutDashboard,
  Car,
  ScanLine,
  Brain,
  Zap,
  Activity,
  Radio,
  Globe,
  Cable,
  Usb,
  MonitorSmartphone,
  Stethoscope,
  Search,
  Eye,
  Hash,
  Wind,
  Gauge,
  Flame,
  FileJson,
  BarChart3,
  RadioTower,
  Cpu,
  Microchip,
  ShieldAlert,
  CheckCircle2,
  ArrowLeftRight,
  CarFront,
  Sliders,
  Lock,
  Plug,
  Network,
  Workflow,
  Battery,
  Wrench,
  Waves,
  Database,
  FileText,
  BookOpen,
  Cloud,
  Box,
  TrendingUp,
  CalendarClock,
  GraduationCap,
  ShoppingCart,
  Package,
  Building2,
  Globe2,
  UserCog,
  KeyRound,
  ChevronDown,
  ChevronRight,
  X,
  Timer,
  MapPin,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  view?: ViewType
  badge?: string
  badgeColor?: string
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, view, badge, badgeColor, active, onClick }: NavItemProps) {
  const { setActiveView, activeView, setSidebarMobileOpen } = useAppStore()
  const isActive = active ?? (view ? activeView === view : false)

  return (
    <button
      onClick={() => {
        if (view) setActiveView(view)
        onClick?.()
        setSidebarMobileOpen(false)
      }}
      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all duration-150 group ${
        isActive
          ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
          : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]/50'
      }`}
    >
      <span className={`flex-shrink-0 ${isActive ? 'text-[#00d4ff]' : 'text-[#64748b] group-hover:text-[#e2e8f0]'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left truncate text-[13px]">{label}</span>
      {badge && (
        <Badge
          className={`text-[9px] px-1.5 py-0 h-4 font-semibold ${
            badgeColor === 'teal'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
              : badgeColor === 'purple'
              ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30'
              : badgeColor === 'green'
              ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
              : badgeColor === 'orange'
              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
              : badgeColor === 'red'
              ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
              : 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
          }`}
        >
          {badge}
        </Badge>
      )}
    </button>
  )
}

interface NavSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function NavSection({ title, children, defaultOpen = false }: NavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#475569] hover:text-[#94a3b8] transition-colors"
      >
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {isOpen && <div className="space-y-0.5 px-1 pb-1">{children}</div>}
    </div>
  )
}

export function ECUSidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen, isConnected } = useAppStore()

  return (
    <>
      {/* Mobile backdrop overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setSidebarMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col h-screen bg-[#0c1219] border-r border-[#1e2a3a] transition-all duration-300
          fixed inset-y-0 left-0 z-40 md:relative md:z-auto
          ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${sidebarCollapsed ? 'w-56 md:w-14' : 'w-56'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-[#1e2a3a]">
          <div className="flex-shrink-0 w-8 h-8 relative">
            <Image src="/ecu-logo.png" alt="ECU Master" fill sizes="32px" className="object-contain" />
          </div>
          {(!sidebarCollapsed || sidebarMobileOpen) && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-[#00d4ff] tracking-wide truncate">ECU Master</span>
              <span className="text-[9px] text-[#475569]">Pro 2026</span>
            </div>
          )}
          <button
            onClick={() => setSidebarMobileOpen(false)}
            className="md:hidden ml-auto p-1 rounded-md text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-1">
          {/* Overview */}
          <NavSection title="Overview" defaultOpen={true}>
            <NavItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" view="dashboard" />
            <NavItem icon={<Car className="h-4 w-4" />} label="Fleet" view="fleet" badge="8" badgeColor="teal" />
            <NavItem icon={<ScanLine className="h-4 w-4" />} label="OEM Scan" view="oem-scan" />
            <NavItem icon={<Brain className="h-4 w-4" />} label="AI Predictive" view="ai-predictive" badge="AI" badgeColor="purple" />
            <NavItem icon={<Zap className="h-4 w-4" />} label="AutoConnect" view="autoconnect" />
            <NavItem icon={<Timer className="h-4 w-4" />} label="Realtime" view="realtime" badge="LIVE" badgeColor="red" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* Connection */}
          <NavSection title="Connection" defaultOpen={true}>
            <NavItem icon={<Radio className="h-4 w-4" />} label="Remote" view="remote" />
            <NavItem icon={<Usb className="h-4 w-4" />} label="USB" view="usb" />
            <NavItem icon={<Globe className="h-4 w-4" />} label="WebSerial" view="webserial" />
            <NavItem icon={<Cable className="h-4 w-4" />} label="VAS 6154" view="vas6154" badge="VAG" badgeColor="blue" />
            <NavItem icon={<MonitorSmartphone className="h-4 w-4" />} label="Dongles" view="dongles" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* Diagnostics */}
          <NavSection title="Diagnostics" defaultOpen={true}>
            <NavItem icon={<Stethoscope className="h-4 w-4" />} label="Diagnostics" view="diagnostics" />
            <NavItem icon={<Search className="h-4 w-4" />} label="Pro Diagnostics" view="pro-diagnostics" badge="PRO" badgeColor="orange" />
            <NavItem icon={<Brain className="h-4 w-4" />} label="AI Diagnostics" view="ai" badge="AI" badgeColor="purple" />
            <NavItem icon={<Hash className="h-4 w-4" />} label="DTC Tool" view="dtc-tool" />
            <NavItem icon={<Eye className="h-4 w-4" />} label="ADAS" view="adas" badge="NEW" badgeColor="green" />
            <NavItem icon={<Wind className="h-4 w-4" />} label="VIN Detect" view="vin-detect" />
            <NavItem icon={<Activity className="h-4 w-4" />} label="Live Sensors" view="live-sensors" badge="LIVE" badgeColor="red" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* Performance & Tuning */}
          <NavSection title="Performance" defaultOpen={false}>
            <NavItem icon={<Gauge className="h-4 w-4" />} label="Performance" view="performance" />
            <NavItem icon={<Flame className="h-4 w-4" />} label="Tuning" view="tuning" badge="PRO" badgeColor="orange" />
            <NavItem icon={<MapPin className="h-4 w-4" />} label="Map Editor" view="map-editor" />
            <NavItem icon={<FileJson className="h-4 w-4" />} label="Data Logger" view="data-logger" />
            <NavItem icon={<RadioTower className="h-4 w-4" />} label="CAN Bus" view="can" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* ECU & Flash */}
          <NavSection title="ECU & Flash" defaultOpen={false}>
            <NavItem icon={<Cpu className="h-4 w-4" />} label="ECU Info" view="ecu" />
            <NavItem icon={<Microchip className="h-4 w-4" />} label="Advanced ECU" view="advanced-ecu" badge="EXPERT" badgeColor="red" />
            <NavItem icon={<Zap className="h-4 w-4" />} label="Flash" view="flash" />
            <NavItem icon={<CheckCircle2 className="h-4 w-4" />} label="Flash Verify" view="flash-verify" />
            <NavItem icon={<ArrowLeftRight className="h-4 w-4" />} label="Advanced" view="advanced" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* Transmission & Protocols */}
          <NavSection title="Transmission" defaultOpen={false}>
            <NavItem icon={<CarFront className="h-4 w-4" />} label="Transmission" view="transmission" />
            <NavItem icon={<Sliders className="h-4 w-4" />} label="TCU Control" view="transmission-control" />
            <NavItem icon={<Lock className="h-4 w-4" />} label="SGW" view="sgw" badge="SEC" badgeColor="red" />
            <NavItem icon={<Plug className="h-4 w-4" />} label="J2534" view="j2534" />
            <NavItem icon={<Network className="h-4 w-4" />} label="DoIP" view="doip" />
            <NavItem icon={<Workflow className="h-4 w-4" />} label="Passthru" view="passthru" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* Network & EV */}
          <NavSection title="Network & EV" defaultOpen={false}>
            <NavItem icon={<ShieldAlert className="h-4 w-4" />} label="Network Analysis" view="network-analysis" />
            <NavItem icon={<Battery className="h-4 w-4" />} label="EV / Hybrid" view="ev" badge="EV" badgeColor="green" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* Tools & Data */}
          <NavSection title="Tools & Data" defaultOpen={false}>
            <NavItem icon={<Wrench className="h-4 w-4" />} label="Tools" view="tools" />
            <NavItem icon={<Waves className="h-4 w-4" />} label="Sensor Stream" view="sensor-stream" />
            <NavItem icon={<Database className="h-4 w-4" />} label="Vehicle Database" view="vehicle-database" />
            <NavItem icon={<FileText className="h-4 w-4" />} label="Reports" view="reports" />
            <NavItem icon={<BookOpen className="h-4 w-4" />} label="TSB" view="tsb" />
            <NavItem icon={<Cloud className="h-4 w-4" />} label="Cloud Sync" view="cloud-sync" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* Insights */}
          <NavSection title="Insights" defaultOpen={false}>
            <NavItem icon={<Box className="h-4 w-4" />} label="3D Topology" view="topology-3d" badge="3D" badgeColor="purple" />
            <NavItem icon={<TrendingUp className="h-4 w-4" />} label="Trends" view="trends" />
            <NavItem icon={<CalendarClock className="h-4 w-4" />} label="Service" view="service" />
            <NavItem icon={<BarChart3 className="h-4 w-4" />} label="Service History" view="service-history" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* SDV & Next-Gen */}
          <NavSection title="SDV & Next-Gen" defaultOpen={true}>
            <NavItem icon={<Globe className="h-4 w-4" />} label="SOVD Console" view="sovd" badge="SOVD" badgeColor="purple" />
            <NavItem icon={<Upload className="h-4 w-4" />} label="OTA Manager" view="ota" badge="UPTANE" badgeColor="orange" />
            <NavItem icon={<Cpu className="h-4 w-4" />} label="Digital Twin" view="digital-twin" badge="NEW" badgeColor="green" />
            <NavItem icon={<ShieldAlert className="h-4 w-4" />} label="IDPS Monitor" view="idps" badge="SEC" badgeColor="red" />
            <NavItem icon={<Radio className="h-4 w-4" />} label="V2X Monitor" view="v2x" badge="V2X" badgeColor="teal" />
            <NavItem icon={<FileText className="h-4 w-4" />} label="SBOM" view="sbom" badge="SPDX" badgeColor="purple" />
            <NavItem icon={<ShieldAlert className="h-4 w-4" />} label="Compliance" view="compliance" badge="ISO" badgeColor="teal" />
          </NavSection>

          <Separator className="bg-[#1e2a3a] my-0.5" />

          {/* Business */}
          <NavSection title="Business" defaultOpen={false}>
            <NavItem icon={<GraduationCap className="h-4 w-4" />} label="Training" view="training" />
            <NavItem icon={<ShoppingCart className="h-4 w-4" />} label="Shop" view="shop" />
            <NavItem icon={<Package className="h-4 w-4" />} label="Parts" view="parts" />
            <NavItem icon={<Building2 className="h-4 w-4" />} label="Workshop" view="workshop" />
            <NavItem icon={<Globe2 className="h-4 w-4" />} label="Workshop Portal" view="workshop-portal" />
            <NavItem icon={<UserCog className="h-4 w-4" />} label="Admin" view="admin" />
            <NavItem icon={<KeyRound className="h-4 w-4" />} label="License" view="license" />
          </NavSection>
        </ScrollArea>

        {/* Connection Status */}
        <div className="border-t border-[#1e2a3a] px-3 py-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-2 text-xs md:flex"
          >
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-[#10b981] pulse-teal' : 'bg-[#ef4444] pulse-danger'}`} />
            {(!sidebarCollapsed || sidebarMobileOpen) && (
              <span className={isConnected ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
