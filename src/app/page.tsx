'use client'

import { ECUSidebar } from '@/components/ecu/sidebar'
import { TopNavbar } from '@/components/ecu/top-navbar'
import { ConnectDeviceModal } from '@/components/ecu/connect-device-modal'
import { AIPredictiveView } from '@/components/ecu/ai-predictive-view'
import { DashboardView } from '@/components/ecu/dashboard-view'
import { LiveDataView } from '@/components/ecu/live-data-view'
import { DTCScanView } from '@/components/ecu/dtc-scan-view'
import { FleetView } from '@/components/ecu/fleet-view'
import { AIDiagnosticsView } from '@/components/ecu/ai-diagnostics-view'
import { CANBusView } from '@/components/ecu/canbus-view'
import { PerformanceView } from '@/components/ecu/performance-view'
import { EVHybridView } from '@/components/ecu/ev-hybrid-view'
import { NetworkAnalysisView } from '@/components/ecu/network-analysis-view'
import { ServiceHistoryView } from '@/components/ecu/service-history-view'
import { useAppStore } from '@/stores/app-store'
import { Wifi, Server, Radio, Wrench, Download, Usb, Globe, Link2 } from 'lucide-react'

export default function Home() {
  const { activeView } = useAppStore()

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'ai-predict':
        return <AIPredictiveView />
      case 'live-data':
        return <LiveDataView />
      case 'dtc-scan':
        return <DTCScanView />
      case 'fleet':
        return <FleetView />
      case 'connect':
        return (
          <PlaceholderView
            title="Auto Connect"
            icon={<Wifi className="h-12 w-12 text-[#00d4ff]" />}
            description="Automatically detect and connect to available diagnostic devices nearby."
          />
        )
      case 'oem-scan':
        return (
          <PlaceholderView
            title="OEM Scan"
            icon={<Server className="h-12 w-12 text-[#00d4ff]" />}
            description="Manufacturer-specific diagnostic protocols and deep ECU access."
          />
        )
      case 'diagnostics':
        return <DTCScanView />
      case 'ai-diagnostics':
        return <AIDiagnosticsView />
      case 'canbus':
        return <CANBusView />
      case 'performance':
        return <PerformanceView />
      case 'ev-hybrid':
        return <EVHybridView />
      case 'network-analysis':
        return <NetworkAnalysisView />
      case 'service':
        return <ServiceHistoryView />
      default:
        return <AIPredictiveView />
    }
  }

  return (
    <div className="flex h-screen bg-[#0f1923] overflow-hidden">
      {/* Sidebar */}
      <ECUSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <TopNavbar />

        {/* View content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0f1923]">
          {renderView()}
        </main>
      </div>

      {/* Connect device modal */}
      <ConnectDeviceModal />
    </div>
  )
}

function PlaceholderView({ title, icon, description }: { title: string; icon: React.ReactNode; description: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">{icon}</div>
        <h2 className="text-lg font-semibold text-[#e2e8f0] mb-2">{title}</h2>
        <p className="text-xs text-[#64748b] max-w-sm">{description}</p>
      </div>
    </div>
  )
}
