'use client'

import { ECUSidebar } from '@/components/ecu/sidebar'
import { TopNavbar } from '@/components/ecu/top-navbar'
import { ConnectDeviceModal } from '@/components/ecu/connect-device-modal'
import { AiAssistantPanel } from '@/components/ecu/ai-assistant-panel'
import { CommandPalette } from '@/components/ecu/command-palette'
import { useAppStore } from '@/stores/app-store'

// Overview
import { DashboardView } from '@/components/ecu/dashboard-view'
import { FleetView } from '@/components/ecu/fleet-view'
import { OEMScanView } from '@/components/ecu/oem-scan-view'
import { AIPredictiveView } from '@/components/ecu/ai-predictive-view'
import { AutoConnectView } from '@/components/ecu/auto-connect-view'
import { RealtimeView } from '@/components/ecu/realtime-view'

// Connection
import { RemoteDiagView } from '@/components/ecu/remote-diag-view'
import { UsbObdView } from '@/components/ecu/usb-obd-view'
import { WebDiagView } from '@/components/ecu/web-diag-view'
import { VAS6154View } from '@/components/ecu/vas6154-view'
import { DonglesView } from '@/components/ecu/dongles-view'

// Diagnostics
import { DiagnosticsView } from '@/components/ecu/diagnostics-view'
import { ProDiagnosticsView } from '@/components/ecu/pro-diagnostics-view'
import { AIDiagnosticsView } from '@/components/ecu/ai-diagnostics-view'
import { DTCToolView } from '@/components/ecu/dtc-tool-view'
import { ADASView } from '@/components/ecu/adas-view'
import { VINDetectView } from '@/components/ecu/vin-detect-view'
import { LiveSensorsView } from '@/components/ecu/live-sensors-view'

// Performance & Tuning
import { PerformanceView } from '@/components/ecu/performance-view'
import { CANBusView } from '@/components/ecu/canbus-view'
import { TuningView } from '@/components/ecu/tuning-view'
import { MapEditorView } from '@/components/ecu/map-editor-view'
import { DataLoggerView } from '@/components/ecu/data-logger-view'

// ECU & Flash
import { FlashView } from '@/components/ecu/flash-view'
import { ECUInfoView } from '@/components/ecu/ecu-view'
import { AdvancedECUView } from '@/components/ecu/advanced-ecu-view'
import { AdvancedView } from '@/components/ecu/advanced-view'
import { FlashVerifyView } from '@/components/ecu/flash-verify-view'

// Transmission & Protocols
import { TransmissionView } from '@/components/ecu/transmission-view'
import { TransmissionControlView } from '@/components/ecu/transmission-control-view'
import { SGWView } from '@/components/ecu/sgw-view'
import { J2534View } from '@/components/ecu/j2534-view'
import { DoIPView } from '@/components/ecu/doip-view'
import { PassthruView } from '@/components/ecu/passthru-view'

// Network & EV
import { NetworkAnalysisView } from '@/components/ecu/network-analysis-view'
import { EVHybridView } from '@/components/ecu/ev-hybrid-view'

// Tools & Data
import { ToolsView } from '@/components/ecu/tools-view'
import { SensorStreamView } from '@/components/ecu/sensor-stream-view'
import { VehicleDatabaseView } from '@/components/ecu/vehicle-database-view'
import { ReportsView } from '@/components/ecu/reports-view'
import { TSBView } from '@/components/ecu/tsb-view'
import { CloudSyncView } from '@/components/ecu/cloud-sync-view'

// Insights
import { Topology3DView } from '@/components/ecu/topology-3d-view'
import { TrendsView } from '@/components/ecu/trends-view'
import { ServiceHistoryView } from '@/components/ecu/service-history-view'

// Business
import { TrainingView } from '@/components/ecu/training-view'
import { ShopView } from '@/components/ecu/shop-view'
import { PartsView } from '@/components/ecu/parts-view'
import { WorkshopView } from '@/components/ecu/workshop-view'
import { WorkshopPortalView } from '@/components/ecu/workshop-portal-view'
import { AdminView } from '@/components/ecu/admin-view'
import { LicenseView } from '@/components/ecu/license-view'

export default function Home() {
  const { activeView } = useAppStore()

  const renderView = () => {
    switch (activeView) {
      // Overview
      case 'dashboard': return <DashboardView />
      case 'fleet': return <FleetView />
      case 'oem-scan': return <OEMScanView />
      case 'ai-predictive': return <AIPredictiveView />
      case 'autoconnect': return <AutoConnectView />
      case 'realtime': return <RealtimeView />

      // Connection
      case 'remote': return <RemoteDiagView />
      case 'usb': return <UsbObdView />
      case 'webserial': return <WebDiagView />
      case 'vas6154': return <VAS6154View />
      case 'dongles': return <DonglesView />

      // Diagnostics
      case 'diagnostics': return <DiagnosticsView />
      case 'pro-diagnostics': return <ProDiagnosticsView />
      case 'ai': return <AIDiagnosticsView />
      case 'dtc-tool': return <DTCToolView />
      case 'adas': return <ADASView />
      case 'vin-detect': return <VINDetectView />
      case 'live-sensors': return <LiveSensorsView />

      // Performance & Tuning
      case 'performance': return <PerformanceView />
      case 'can': return <CANBusView />
      case 'tuning': return <TuningView />
      case 'map-editor': return <MapEditorView />
      case 'data-logger': return <DataLoggerView />

      // ECU & Flash
      case 'flash': return <FlashView />
      case 'ecu': return <ECUInfoView />
      case 'advanced-ecu': return <AdvancedECUView />
      case 'advanced': return <AdvancedView />
      case 'flash-verify': return <FlashVerifyView />

      // Transmission & Protocols
      case 'transmission': return <TransmissionView />
      case 'transmission-control': return <TransmissionControlView />
      case 'sgw': return <SGWView />
      case 'j2534': return <J2534View />
      case 'doip': return <DoIPView />
      case 'passthru': return <PassthruView />

      // Network & EV
      case 'network-analysis': return <NetworkAnalysisView />
      case 'ev': return <EVHybridView />

      // Tools & Data
      case 'tools': return <ToolsView />
      case 'sensor-stream': return <SensorStreamView />
      case 'vehicle-database': return <VehicleDatabaseView />
      case 'reports': return <ReportsView />
      case 'tsb': return <TSBView />
      case 'cloud-sync': return <CloudSyncView />

      // Insights
      case 'topology-3d': return <Topology3DView />
      case 'trends': return <TrendsView />
      case 'service': return <ServiceHistoryView />
      case 'service-history': return <ServiceHistoryView />

      // Business
      case 'training': return <TrainingView />
      case 'shop': return <ShopView />
      case 'parts': return <PartsView />
      case 'workshop': return <WorkshopView />
      case 'workshop-portal': return <WorkshopPortalView />
      case 'admin': return <AdminView />
      case 'license': return <LicenseView />

      default: return <DashboardView />
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
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0f1923]" key={activeView}>
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Connect device modal */}
      <ConnectDeviceModal />

      {/* AI Assistant floating chat */}
      <AiAssistantPanel />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />
    </div>
  )
}
