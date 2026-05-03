'use client'

import React, { lazy, Suspense } from 'react'
import { ECUSidebar } from '@/components/ecu/sidebar'
import { TopNavbar } from '@/components/ecu/top-navbar'
import { ConnectDeviceModal } from '@/components/ecu/connect-device-modal'
import { AiAssistantPanel } from '@/components/ecu/ai-assistant-panel'
import { CommandPalette } from '@/components/ecu/command-palette'
import { ErrorBoundary } from '@/components/ecu/error-boundary'
import { useAppStore } from '@/stores/app-store'

// Loading skeleton for views
function ViewSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-[#1e2a3a] rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          <div className="h-24 bg-[#1e2a3a] rounded" />
          <div className="h-24 bg-[#1e2a3a] rounded" />
          <div className="h-24 bg-[#1e2a3a] rounded" />
          <div className="h-24 bg-[#1e2a3a] rounded" />
        </div>
        <div className="h-64 bg-[#1e2a3a] rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-[#1e2a3a] rounded" />
          <div className="h-48 bg-[#1e2a3a] rounded" />
        </div>
      </div>
    </div>
  )
}

// Lazy-load all views to reduce initial bundle size and memory usage
const DashboardView = lazy(() => import('@/components/ecu/dashboard-view').then(m => ({ default: m.DashboardView })))
const FleetView = lazy(() => import('@/components/ecu/fleet-view').then(m => ({ default: m.FleetView })))
const OEMScanView = lazy(() => import('@/components/ecu/oem-scan-view').then(m => ({ default: m.OEMScanView })))
const AIPredictiveView = lazy(() => import('@/components/ecu/ai-predictive-view').then(m => ({ default: m.AIPredictiveView })))
const AutoConnectView = lazy(() => import('@/components/ecu/auto-connect-view').then(m => ({ default: m.AutoConnectView })))
const RealtimeView = lazy(() => import('@/components/ecu/realtime-view').then(m => ({ default: m.RealtimeView })))

const RemoteDiagView = lazy(() => import('@/components/ecu/remote-diag-view').then(m => ({ default: m.RemoteDiagView })))
const UsbObdView = lazy(() => import('@/components/ecu/usb-obd-view').then(m => ({ default: m.UsbObdView })))
const WebDiagView = lazy(() => import('@/components/ecu/web-diag-view').then(m => ({ default: m.WebDiagView })))
const VAS6154View = lazy(() => import('@/components/ecu/vas6154-view').then(m => ({ default: m.VAS6154View })))
const DonglesView = lazy(() => import('@/components/ecu/dongles-view').then(m => ({ default: m.DonglesView })))

const DiagnosticsView = lazy(() => import('@/components/ecu/diagnostics-view').then(m => ({ default: m.DiagnosticsView })))
const ProDiagnosticsView = lazy(() => import('@/components/ecu/pro-diagnostics-view').then(m => ({ default: m.ProDiagnosticsView })))
const AIDiagnosticsView = lazy(() => import('@/components/ecu/ai-diagnostics-view').then(m => ({ default: m.AIDiagnosticsView })))
const DTCToolView = lazy(() => import('@/components/ecu/dtc-tool-view').then(m => ({ default: m.DTCToolView })))
const ADASView = lazy(() => import('@/components/ecu/adas-view').then(m => ({ default: m.ADASView })))
const VINDetectView = lazy(() => import('@/components/ecu/vin-detect-view').then(m => ({ default: m.VINDetectView })))
const LiveSensorsView = lazy(() => import('@/components/ecu/live-sensors-view').then(m => ({ default: m.LiveSensorsView })))

const PerformanceView = lazy(() => import('@/components/ecu/performance-view').then(m => ({ default: m.PerformanceView })))
const CANBusView = lazy(() => import('@/components/ecu/canbus-view').then(m => ({ default: m.CANBusView })))
const TuningView = lazy(() => import('@/components/ecu/tuning-view').then(m => ({ default: m.TuningView })))
const MapEditorView = lazy(() => import('@/components/ecu/map-editor-view').then(m => ({ default: m.MapEditorView })))
const DataLoggerView = lazy(() => import('@/components/ecu/data-logger-view').then(m => ({ default: m.DataLoggerView })))

const FlashView = lazy(() => import('@/components/ecu/flash-view').then(m => ({ default: m.FlashView })))
const ECUInfoView = lazy(() => import('@/components/ecu/ecu-view').then(m => ({ default: m.ECUInfoView })))
const AdvancedECUView = lazy(() => import('@/components/ecu/advanced-ecu-view').then(m => ({ default: m.AdvancedECUView })))
const AdvancedView = lazy(() => import('@/components/ecu/advanced-view').then(m => ({ default: m.AdvancedView })))
const FlashVerifyView = lazy(() => import('@/components/ecu/flash-verify-view').then(m => ({ default: m.FlashVerifyView })))

const TransmissionView = lazy(() => import('@/components/ecu/transmission-view').then(m => ({ default: m.TransmissionView })))
const TransmissionControlView = lazy(() => import('@/components/ecu/transmission-control-view').then(m => ({ default: m.TransmissionControlView })))
const SGWView = lazy(() => import('@/components/ecu/sgw-view').then(m => ({ default: m.SGWView })))
const J2534View = lazy(() => import('@/components/ecu/j2534-view').then(m => ({ default: m.J2534View })))
const DoIPView = lazy(() => import('@/components/ecu/doip-view').then(m => ({ default: m.DoIPView })))
const PassthruView = lazy(() => import('@/components/ecu/passthru-view').then(m => ({ default: m.PassthruView })))

const NetworkAnalysisView = lazy(() => import('@/components/ecu/network-analysis-view').then(m => ({ default: m.NetworkAnalysisView })))
const EVHybridView = lazy(() => import('@/components/ecu/ev-hybrid-view').then(m => ({ default: m.EVHybridView })))

const ToolsView = lazy(() => import('@/components/ecu/tools-view').then(m => ({ default: m.ToolsView })))
const SensorStreamView = lazy(() => import('@/components/ecu/sensor-stream-view').then(m => ({ default: m.SensorStreamView })))
const VehicleDatabaseView = lazy(() => import('@/components/ecu/vehicle-database-view').then(m => ({ default: m.VehicleDatabaseView })))
const ReportsView = lazy(() => import('@/components/ecu/reports-view').then(m => ({ default: m.ReportsView })))
const TSBView = lazy(() => import('@/components/ecu/tsb-view').then(m => ({ default: m.TSBView })))
const CloudSyncView = lazy(() => import('@/components/ecu/cloud-sync-view').then(m => ({ default: m.CloudSyncView })))

const Topology3DView = lazy(() => import('@/components/ecu/topology-3d-view').then(m => ({ default: m.Topology3DView })))
const TrendsView = lazy(() => import('@/components/ecu/trends-view').then(m => ({ default: m.TrendsView })))
const ServiceView = lazy(() => import('@/components/ecu/service-view').then(m => ({ default: m.ServiceView })))
const ServiceHistoryView = lazy(() => import('@/components/ecu/service-history-view').then(m => ({ default: m.ServiceHistoryView })))

const SOVDView = lazy(() => import('@/components/ecu/sovd-view').then(m => ({ default: m.SOVDView })))
const OTAView = lazy(() => import('@/components/ecu/ota-view').then(m => ({ default: m.OTAView })))
const DigitalTwinView = lazy(() => import('@/components/ecu/digital-twin-view').then(m => ({ default: m.DigitalTwinView })))
const IdpsView = lazy(() => import('@/components/ecu/idps-view').then(m => ({ default: m.IdpsView })))
const V2XView = lazy(() => import('@/components/ecu/v2x-view').then(m => ({ default: m.V2XView })))
const SBOMView = lazy(() => import('@/components/ecu/sbom-view').then(m => ({ default: m.SBOMView })))
const ComplianceView = lazy(() => import('@/components/ecu/compliance-view').then(m => ({ default: m.ComplianceView })))

const TrainingView = lazy(() => import('@/components/ecu/training-view').then(m => ({ default: m.TrainingView })))
const ShopView = lazy(() => import('@/components/ecu/shop-view').then(m => ({ default: m.ShopView })))
const PartsView = lazy(() => import('@/components/ecu/parts-view').then(m => ({ default: m.PartsView })))
const WorkshopView = lazy(() => import('@/components/ecu/workshop-view').then(m => ({ default: m.WorkshopView })))
const WorkshopPortalView = lazy(() => import('@/components/ecu/workshop-portal-view').then(m => ({ default: m.WorkshopPortalView })))
const AdminView = lazy(() => import('@/components/ecu/admin-view').then(m => ({ default: m.AdminView })))
const LicenseView = lazy(() => import('@/components/ecu/license-view').then(m => ({ default: m.LicenseView })))

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
      case 'service': return <ServiceView />
      case 'service-history': return <ServiceHistoryView />

      // SDV & Next-Gen
      case 'sovd': return <SOVDView />
      case 'ota': return <OTAView />
      case 'digital-twin': return <DigitalTwinView />
      case 'idps': return <IdpsView />
      case 'v2x': return <V2XView />
      case 'sbom': return <SBOMView />
      case 'compliance': return <ComplianceView />

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
    <ErrorBoundary>
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
              <ErrorBoundary>
                <Suspense fallback={<ViewSkeleton />}>
                  {renderView()}
                </Suspense>
              </ErrorBoundary>
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
    </ErrorBoundary>
  )
}
