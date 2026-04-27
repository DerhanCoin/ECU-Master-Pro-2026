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
import { AutoConnectView } from '@/components/ecu/auto-connect-view'
import { OEMScanView } from '@/components/ecu/oem-scan-view'
import { RemoteDiagView } from '@/components/ecu/remote-diag-view'
import { SettingsView } from '@/components/ecu/settings-view'
import { useAppStore } from '@/stores/app-store'

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
        return <AutoConnectView />
      case 'oem-scan':
        return <OEMScanView />
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
      case 'remote-diag':
        return <RemoteDiagView />
      case 'settings':
        return <SettingsView />
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
