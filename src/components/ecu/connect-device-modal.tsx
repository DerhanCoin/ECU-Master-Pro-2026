'use client'

import { useAppStore } from '@/stores/app-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Usb, Cpu, Car, Radio, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const devices = [
  {
    id: 'vas6154',
    name: 'VAS 6154',
    description: 'VW/Audi/Seat/Skoda (WebUSB)',
    icon: Car,
    color: '#00d4ff',
  },
  {
    id: 'bosch-kts',
    name: 'Bosch KTS 50',
    description: 'Universal Multi-Brand (WebUSB)',
    icon: Cpu,
    color: '#10b981',
  },
  {
    id: 'daimler-xentry',
    name: 'Daimler Xentry',
    description: 'Mercedes-Benz (WebUSB)',
    icon: Car,
    color: '#8b5cf6',
  },
  {
    id: 'elm327',
    name: 'ELM327 / CH340',
    description: 'Generic OBD2 (Serial/USB)',
    icon: Usb,
    color: '#f59e0b',
  },
]

export function ConnectDeviceModal() {
  const {
    isConnectModalOpen,
    setConnectModalOpen,
    selectedDevice,
    setSelectedDevice,
    isConnecting,
    setIsConnecting,
    setIsConnected,
    handleConnect,
  } = useAppStore()

  const handleRealConnect = async () => {
    setIsConnecting(true)
    try {
      // Try to connect via diagnostic backend
      const res = await fetch('/api/connect?XTransformPort=8000', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          // Backend connected (real or simulation)
          handleConnect() // This sets the store state
          return
        }
      }
    } catch {
      // Backend unreachable — fall back to simulation
    }
    // Fallback: just use the store's simulation connect
    handleConnect()
  }

  return (
    <Dialog open={isConnectModalOpen} onOpenChange={setConnectModalOpen}>
      <DialogContent className="bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#00d4ff]" />
            Connect Device
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device grid */}
          <div className="grid grid-cols-2 gap-3">
            {devices.map((device) => {
              const Icon = device.icon
              const isSelected = selectedDevice === device.id
              return (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    isSelected
                      ? 'border-[#00d4ff] bg-[#00d4ff]/10 glow-teal'
                      : 'border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${device.color}15` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: device.color }} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-[#e2e8f0]">{device.name}</div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">{device.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] text-xs h-9"
            >
              <Search className="h-3.5 w-3.5 mr-1.5" />
              Auto Detect
            </Button>
            <Button
              onClick={handleRealConnect}
              disabled={!selectedDevice || isConnecting}
              className={cn(
                'flex-1 text-xs h-9 font-medium transition-all',
                selectedDevice && !isConnecting
                  ? 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                  : 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
              )}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>

          {/* Background watermark */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-[#1e2a3a]">
              ECU Master Pro 2026 — Diagnostics and ECU programming
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
