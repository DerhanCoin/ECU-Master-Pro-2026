'use client'

import { ECUSidebar } from '@/components/ecu/sidebar'
import { TopNavbar } from '@/components/ecu/top-navbar'
import { ConnectDeviceModal } from '@/components/ecu/connect-device-modal'
import { AIPredictiveView } from '@/components/ecu/ai-predictive-view'
import { DashboardView } from '@/components/ecu/dashboard-view'
import { useAppStore } from '@/stores/app-store'
import { Brain, Activity, Wifi, Car, Server, AlertTriangle, Settings } from 'lucide-react'

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

export default function Home() {
  const { activeView } = useAppStore()

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'ai-predict':
        return <AIPredictiveView />
      case 'connect':
        return (
          <PlaceholderView
            title="Auto Connect"
            icon={<Wifi className="h-12 w-12 text-[#00d4ff]" />}
            description="Automatically detect and connect to available diagnostic devices nearby."
          />
        )
      case 'live-data':
        return (
          <PlaceholderView
            title="Live Data"
            icon={<Activity className="h-12 w-12 text-[#10b981]" />}
            description="Real-time data streaming from connected vehicle modules and sensors."
          />
        )
      case 'dtc-scan':
        return (
          <PlaceholderView
            title="DTC Scanner"
            icon={<AlertTriangle className="h-12 w-12 text-[#f59e0b]" />}
            description="Scan and diagnose trouble codes from all vehicle ECU modules."
          />
        )
      case 'fleet':
        return (
          <PlaceholderView
            title="Fleet Management"
            icon={<Car className="h-12 w-12 text-[#8b5cf6]" />}
            description="Manage and monitor your fleet of vehicles with centralized diagnostics."
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
        return (
          <PlaceholderView
            title="Diagnostics"
            icon={<AlertTriangle className="h-12 w-12 text-[#f59e0b]" />}
            description="Comprehensive vehicle diagnostics with DTC reading and module scanning."
          />
        )
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
