'use client'

import { useAppStore, type ViewType } from '@/stores/app-store'
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Settings,
  Car,
  Radio,
  Usb,
  Globe,
  Link2,
  Download,
  Wrench,
  Cpu,
  Zap,
  Gauge,
  BusFront,
  Plug,
  Calendar,
  ChevronDown,
  ChevronRight,
  Server,
  Shield,
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
  const { setActiveView, activeView } = useAppStore()
  const isActive = active ?? (view ? activeView === view : false)

  return (
    <button
      onClick={() => {
        if (view) setActiveView(view)
        onClick?.()
      }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group ${
        isActive
          ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
          : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]/50'
      }`}
    >
      <span className={`flex-shrink-0 ${isActive ? 'text-[#00d4ff]' : 'text-[#64748b] group-hover:text-[#e2e8f0]'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && (
        <Badge
          className={`text-[10px] px-1.5 py-0 h-4 font-semibold ${
            badgeColor === 'teal'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30'
              : badgeColor === 'purple'
              ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30'
              : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
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

function NavSection({ title, children, defaultOpen = true }: NavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#475569] hover:text-[#94a3b8] transition-colors"
      >
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {isOpen && <div className="space-y-0.5 px-1">{children}</div>}
    </div>
  )
}

export function ECUSidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, isConnected } = useAppStore()

  return (
    <aside
      className={`flex flex-col h-screen bg-[#0c1219] border-r border-[#1e2a3a] transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-[#1e2a3a]">
        <div className="flex-shrink-0 w-8 h-8 relative">
          <Image src="/ecu-logo.png" alt="ECU Master" fill className="object-contain" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#00d4ff] tracking-wide">ECU Master</span>
            <span className="text-[9px] text-[#475569]">Pro 2026</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <NavSection title="Overview" defaultOpen={true}>
          <NavItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" view="dashboard" />
          <NavItem icon={<Car className="h-4 w-4" />} label="Fleet" view="fleet" badge="NEW" badgeColor="teal" />
          <NavItem icon={<Server className="h-4 w-4" />} label="OEM Scan" view="oem-scan" />
          <NavItem icon={<Zap className="h-4 w-4" />} label="AI Predict" view="ai-predict" badge="NEW" badgeColor="purple" />
          <NavItem icon={<Activity className="h-4 w-4" />} label="Live Data" view="live-data" />
        </NavSection>

        <Separator className="bg-[#1e2a3a] my-1" />

        <NavSection title="Connection" defaultOpen={true}>
          <NavItem icon={<Radio className="h-4 w-4" />} label="Auto Connect" view="connect" />
          <NavItem icon={<Wrench className="h-4 w-4" />} label="Remote Diag" view="remote-diag" badge="NEW" badgeColor="teal" />
          <NavItem icon={<Download className="h-4 w-4" />} label="Remote Client" view="connect" badge="NEW" badgeColor="teal" />
          <NavItem icon={<Usb className="h-4 w-4" />} label="USB OBD" view="connect" badge="NEW" badgeColor="teal" />
          <NavItem icon={<Globe className="h-4 w-4" />} label="Web Diag" view="connect" badge="NEW" badgeColor="teal" />
          <NavItem icon={<Link2 className="h-4 w-4" />} label="SmartLink" view="connect" badge="NEW" badgeColor="teal" />
        </NavSection>

        <Separator className="bg-[#1e2a3a] my-1" />

        <NavSection title="Diagnostics" defaultOpen={true}>
          <NavItem icon={<AlertTriangle className="h-4 w-4" />} label="DTC Scanner" view="dtc-scan" />
          <NavItem icon={<Activity className="h-4 w-4" />} label="Diagnostics" view="diagnostics" />
          <NavItem icon={<Cpu className="h-4 w-4" />} label="AI Diagnostics" view="ai-diagnostics" badge="AI" badgeColor="purple" />
          <NavItem icon={<Gauge className="h-4 w-4" />} label="Performance" view="performance" />
          <NavItem icon={<BusFront className="h-4 w-4" />} label="CAN Bus" view="canbus" />
          <NavItem icon={<Shield className="h-4 w-4" />} label="Network Analysis" view="network-analysis" />
          <NavItem icon={<Plug className="h-4 w-4" />} label="EV/Hybrid" view="ev-hybrid" badge="NEW" badgeColor="teal" />
          <NavItem icon={<Calendar className="h-4 w-4" />} label="Service" view="service" />
          <NavItem icon={<Settings className="h-4 w-4" />} label="Settings" view="settings" />
        </NavSection>
      </ScrollArea>

      {/* Connection Status */}
      <div className="border-t border-[#1e2a3a] px-3 py-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center gap-2 text-xs"
        >
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-[#10b981] pulse-teal' : 'bg-[#ef4444] pulse-danger'}`} />
          {!sidebarCollapsed && (
            <span className={isConnected ? 'text-[#10b981]' : 'text-[#ef4444]'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
