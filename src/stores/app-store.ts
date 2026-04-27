import { create } from 'zustand'

export type ViewType = 'dashboard' | 'ai-predict' | 'live-data' | 'dtc-scan' | 'fleet' | 'oem-scan' | 'connect' | 'performance' | 'canbus' | 'ai-diagnostics' | 'ev-hybrid' | 'network-analysis' | 'service' | 'remote-diag' | 'remote-client' | 'usb-obd' | 'web-diag' | 'smartlink' | 'settings'

interface AppState {
  activeView: ViewType
  activeTab: string
  isConnectModalOpen: boolean
  isConnected: boolean
  isConnecting: boolean
  sidebarCollapsed: boolean
  selectedDevice: string | null
  searchQuery: string
  language: string

  setActiveView: (view: ViewType) => void
  setActiveTab: (tab: string) => void
  setConnectModalOpen: (open: boolean) => void
  setIsConnected: (connected: boolean) => void
  setIsConnecting: (connecting: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedDevice: (device: string | null) => void
  setSearchQuery: (query: string) => void
  setLanguage: (lang: string) => void
  handleConnect: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activeView: 'ai-predict',
  activeTab: 'predictions',
  isConnectModalOpen: false,
  isConnected: false,
  isConnecting: false,
  sidebarCollapsed: false,
  selectedDevice: null,
  searchQuery: '',
  language: 'English',

  setActiveView: (view) => set({ activeView: view }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setConnectModalOpen: (open) => set({ isConnectModalOpen: open }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLanguage: (lang) => set({ language: lang }),

  handleConnect: () => {
    const state = get()
    if (!state.selectedDevice) return
    set({ isConnecting: true })
    setTimeout(() => {
      set({ isConnecting: false, isConnected: true, isConnectModalOpen: false })
    }, 2500)
  },
}))
