import { create } from 'zustand'

export type ViewType =
  // Overview
  | 'dashboard'
  | 'fleet'
  | 'oem-scan'
  | 'ai-predictive'
  | 'autoconnect'
  | 'realtime'
  // Connection
  | 'remote'
  | 'usb'
  | 'webserial'
  | 'vas6154'
  | 'dongles'
  // Diagnostics
  | 'diagnostics'
  | 'pro-diagnostics'
  | 'ai'
  | 'adas'
  | 'vin-detect'
  | 'live-sensors'
  | 'dtc-tool'
  // Performance & Tuning
  | 'performance'
  | 'can'
  | 'tuning'
  | 'map-editor'
  | 'data-logger'
  // ECU & Flash
  | 'flash'
  | 'ecu'
  | 'advanced-ecu'
  | 'advanced'
  | 'flash-verify'
  // Transmission & Protocols
  | 'transmission'
  | 'transmission-control'
  | 'sgw'
  | 'j2534'
  | 'doip'
  | 'passthru'
  // Network & EV
  | 'network-analysis'
  | 'ev'
  // Tools & Data
  | 'tools'
  | 'sensor-stream'
  | 'vehicle-database'
  | 'reports'
  | 'tsb'
  | 'cloud-sync'
  // Insights
  | 'topology-3d'
  | 'trends'
  | 'service'
  | 'service-history'
  // Business
  | 'training'
  | 'shop'
  | 'parts'
  | 'workshop'
  | 'workshop-portal'
  | 'admin'
  | 'license'

export type NotificationCategory = 'dtc-alert' | 'maintenance' | 'ai-prediction' | 'system-update' | 'connection'

export interface Notification {
  id: string
  category: NotificationCategory
  title: string
  description: string
  timestamp: string
  read: boolean
}

interface AppState {
  activeView: ViewType
  activeTab: string
  isConnectModalOpen: boolean
  isCommandPaletteOpen: boolean
  isConnected: boolean
  isConnecting: boolean
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  selectedDevice: string | null
  selectedVehicleId: string
  searchQuery: string
  language: string
  notifications: Notification[]

  setActiveView: (view: ViewType) => void
  setActiveTab: (tab: string) => void
  setConnectModalOpen: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setIsConnected: (connected: boolean) => void
  setIsConnecting: (connecting: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobileOpen: (open: boolean) => void
  setSelectedDevice: (device: string | null) => void
  setSelectedVehicleId: (id: string) => void
  setSearchQuery: (query: string) => void
  setLanguage: (lang: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  handleConnect: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activeView: 'dashboard',
  activeTab: 'predictions',
  isConnectModalOpen: false,
  isCommandPaletteOpen: false,
  isConnected: false,
  isConnecting: false,
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  selectedDevice: null,
  selectedVehicleId: 'vehicle-1',
  searchQuery: '',
  language: 'English',
  notifications: [
    { id: 'n1', category: 'dtc-alert', title: 'P0300 Misfire Detected', description: 'Random/Multiple Cylinder Misfire - VW Golf GTI', timestamp: '2 min ago', read: false },
    { id: 'n2', category: 'dtc-alert', title: 'P0171 System Too Lean', description: 'Bank 1 lean condition - Audi A4', timestamp: '15 min ago', read: false },
    { id: 'n3', category: 'maintenance', title: 'Oil Change Due in 5 Days', description: 'Scheduled maintenance approaching - BMW 330e', timestamp: '1h ago', read: false },
    { id: 'n4', category: 'maintenance', title: 'Brake Service Overdue', description: 'Front brake pads below minimum - Mercedes C-Class', timestamp: '2h ago', read: true },
    { id: 'n5', category: 'ai-prediction', title: 'Catalytic Converter Degradation Predicted', description: 'AI model predicts 78% probability within 30 days', timestamp: '30 min ago', read: false },
    { id: 'n6', category: 'ai-prediction', title: 'Battery Decline Trend', description: 'Battery health trending downward 0.1V/month', timestamp: '4h ago', read: true },
    { id: 'n7', category: 'system-update', title: 'Firmware Update Available', description: 'VAS 6154 firmware v2.4.1 ready to install', timestamp: '1h ago', read: false },
    { id: 'n8', category: 'system-update', title: 'AI Model Updated to v3.2', description: 'Transformer-XL Ensemble updated with 1.2M new records', timestamp: 'Yesterday', read: true },
    { id: 'n9', category: 'connection', title: 'BMW 330e Connected', description: 'Vehicle connected via VAS 6154 on DoIP protocol', timestamp: '5 min ago', read: false },
    { id: 'n10', category: 'connection', title: 'Remote Session Started', description: 'Remote diagnostic session initiated for Porsche Cayenne', timestamp: '20 min ago', read: true },
    { id: 'n11', category: 'dtc-alert', title: 'P0420 Catalyst Efficiency', description: 'Below threshold Bank 1 - VW Golf GTI', timestamp: '3h ago', read: true },
    { id: 'n12', category: 'maintenance', title: 'Tire Rotation Reminder', description: 'Recommended at 50,000 km - Audi A4', timestamp: 'Yesterday', read: true },
  ],

  setActiveView: (view) => set({ activeView: view }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setConnectModalOpen: (open) => set({ isConnectModalOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLanguage: (lang) => set({ language: lang }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),

  handleConnect: () => {
    const state = get()
    if (!state.selectedDevice) return
    set({ isConnecting: true })
    setTimeout(() => {
      set({ isConnecting: false, isConnected: true, isConnectModalOpen: false })
    }, 2500)
  },
}))
