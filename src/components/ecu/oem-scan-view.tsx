'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Server,
  Shield,
  Lock,
  Unlock,
  Car,
  Cpu,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---

interface Brand {
  id: string
  name: string
  accent: string
  subBrands: string[]
  vehicleCount: number
  firstLetter: string
  protocols: string[]
  supportedECUs: string[]
}

interface ECUModule {
  id: string
  name: string
  supplier: string
  status: 'ok' | 'denied' | 'pending'
  codingBytes: number
  softwareVersion: string
  hardwareVersion: string
  partNumber: string
  codingHex: string
  adaptiveValues: string[]
}

interface SecurityLevel {
  level: number
  name: string
  description: string
  unlocked: boolean
  requirement: string
}

// --- Data ---

const brands: Brand[] = [
  {
    id: 'vw',
    name: 'Volkswagen Group',
    accent: '#00d4ff',
    subBrands: ['VW', 'Audi', 'Skoda', 'Seat', 'Cupra', 'Porsche'],
    vehicleCount: 1247,
    firstLetter: 'V',
    protocols: ['DoIP', 'UDS', 'KWP2000', 'CAN TP 2.0'],
    supportedECUs: ['Engine', 'Transmission', 'ABS', 'Airbag', 'Body', 'Infotainment', 'ADAS'],
  },
  {
    id: 'bmw',
    name: 'BMW Group',
    accent: '#3b82f6',
    subBrands: ['BMW', 'Mini'],
    vehicleCount: 834,
    firstLetter: 'B',
    protocols: ['DoIP', 'UDS', 'BMW-FAST', 'CAN TP 2.0'],
    supportedECUs: ['Engine', 'Transmission', 'ABS', 'Airbag', 'Body', 'Infotainment', 'ADAS'],
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    accent: '#94a3b8',
    subBrands: ['Mercedes', 'AMG', 'Smart'],
    vehicleCount: 623,
    firstLetter: 'M',
    protocols: ['DoIP', 'UDS', 'KWP2000', 'Mercedes XENTRY'],
    supportedECUs: ['Engine', 'Transmission', 'ABS', 'Airbag', 'Body', 'Infotainment', 'ADAS'],
  },
  {
    id: 'stellantis',
    name: 'Stellantis',
    accent: '#f59e0b',
    subBrands: ['Fiat', 'Alfa Romeo', 'Peugeot', 'Citroën', 'Opel'],
    vehicleCount: 456,
    firstLetter: 'S',
    protocols: ['DoIP', 'UDS', 'KWP2000', 'CAN TP 2.0'],
    supportedECUs: ['Engine', 'Transmission', 'ABS', 'Airbag', 'Body', 'Infotainment'],
  },
  {
    id: 'ford',
    name: 'Ford Group',
    accent: '#2563eb',
    subBrands: ['Ford', 'Lincoln'],
    vehicleCount: 389,
    firstLetter: 'F',
    protocols: ['DoIP', 'UDS', 'Ford IDS', 'CAN TP 2.0'],
    supportedECUs: ['Engine', 'Transmission', 'ABS', 'Airbag', 'Body', 'Infotainment', 'ADAS'],
  },
  {
    id: 'toyota',
    name: 'Toyota Group',
    accent: '#ef4444',
    subBrands: ['Toyota', 'Lexus', 'Daihatsu'],
    vehicleCount: 567,
    firstLetter: 'T',
    protocols: ['DoIP', 'UDS', 'KWP2000', 'Toyota Techstream'],
    supportedECUs: ['Engine', 'Transmission', 'ABS', 'Airbag', 'Body', 'Infotainment', 'ADAS'],
  },
]

const vwModules: ECUModule[] = [
  {
    id: 'engine',
    name: 'Engine ECU 1.8T',
    supplier: 'Bosch MED17.5',
    status: 'ok',
    codingBytes: 32,
    softwareVersion: '9971.14.02.00',
    hardwareVersion: 'HW-03',
    partNumber: '06K 906 026 CP',
    codingHex: '0x01A3F7002BC4D8901E4F72A05D3B1C08',
    adaptiveValues: ['Idle adaptation: -2.4%', 'Lambda adaptation: +3.1%', 'Throttle adaptation: OK'],
  },
  {
    id: 'transmission',
    name: 'Transmission DSG7',
    supplier: 'Bosch DSG',
    status: 'ok',
    codingBytes: 24,
    softwareVersion: '8653.21.07.01',
    hardwareVersion: 'HW-02',
    partNumber: '0AM 300 042 L',
    codingHex: '0x00F1A2004B88C1D72E0F53',
    adaptiveValues: ['Clutch 1 adaptation: 0.82mm', 'Clutch 2 adaptation: 0.79mm', 'Pressure adaptation: OK'],
  },
  {
    id: 'abs',
    name: 'ABS/ESP',
    supplier: 'Continental MK100',
    status: 'ok',
    codingBytes: 16,
    softwareVersion: '4420.08.15.00',
    hardwareVersion: 'HW-05',
    partNumber: '5Q0 907 379 F',
    codingHex: '0xC401B7A0E83F06D2',
    adaptiveValues: ['Steering angle: 0.0°', 'Yaw rate: Calibrated', 'Lateral accel: OK'],
  },
  {
    id: 'airbag',
    name: 'Airbag',
    supplier: 'Autoliv',
    status: 'ok',
    codingBytes: 8,
    softwareVersion: '1130.02.00.00',
    hardwareVersion: 'HW-01',
    partNumber: '5Q0 959 655 A',
    codingHex: '0xA1B3C5D70E1F2A4B',
    adaptiveValues: ['Crash data: None', 'Deployment counters: 0'],
  },
  {
    id: 'bcm',
    name: 'BCM',
    supplier: 'Hella',
    status: 'ok',
    codingBytes: 48,
    softwareVersion: '7742.03.11.05',
    hardwareVersion: 'HW-04',
    partNumber: '5Q0 937 084 M',
    codingHex: '0xF2A4B6C8021E3A5C7D8F0B2D4E607182',
    adaptiveValues: ['Battery management: Active', 'Light adaptation: OK', 'Wiper adaptation: OK'],
  },
  {
    id: 'cluster',
    name: 'Instrument Cluster',
    supplier: 'VDO',
    status: 'ok',
    codingBytes: 20,
    softwareVersion: '3318.06.09.02',
    hardwareVersion: 'HW-02',
    partNumber: '5Q0 920 870 Q',
    codingHex: '0x7B3D5F91A2C4E6081A2C4E6082B4D6F0',
    adaptiveValues: ['Mileage adaptation: Synced', 'Fuel gauge: Calibrated'],
  },
  {
    id: 'infotainment',
    name: 'Infotainment MIB3',
    supplier: 'Panasonic',
    status: 'ok',
    codingBytes: 64,
    softwareVersion: '2297.15.03.08',
    hardwareVersion: 'HW-06',
    partNumber: '5Q0 035 880 B',
    codingHex: '0x1A3C5E708294A6B8C0D2E4F6081A3C5E708294A6B8C0D2E4F6081A3C5E708294A6',
    adaptiveValues: ['Display adaptation: OK', 'Audio calibration: Active', 'Navigation: Initialized'],
  },
  {
    id: 'adas',
    name: 'ADAS Front Radar',
    supplier: 'Continental',
    status: 'denied',
    codingBytes: 40,
    softwareVersion: '5580.12.04.01',
    hardwareVersion: 'HW-03',
    partNumber: '5Q0 907 541 D',
    codingHex: '0xD5E7F9102A3C4E5F608294A6B8C0D2E4F6081A3C5E7',
    adaptiveValues: ['Radar calibration: Required', 'Camera alignment: Pending'],
  },
  {
    id: 'park',
    name: 'Park Assist',
    supplier: 'Hella',
    status: 'ok',
    codingBytes: 12,
    softwareVersion: '6643.02.01.00',
    hardwareVersion: 'HW-01',
    partNumber: '5Q0 919 298 C',
    codingHex: '0xB2C4D6E80F1A2B3C4D5E',
    adaptiveValues: ['Sensor adaptation: OK', 'Warning thresholds: Default'],
  },
  {
    id: 'keyless',
    name: 'Keyless Entry',
    supplier: 'Marquardt',
    status: 'ok',
    codingBytes: 8,
    softwareVersion: '8821.01.00.00',
    hardwareVersion: 'HW-01',
    partNumber: '5Q0 962 258 A',
    codingHex: '0x4E7A8C02B6D8F01A',
    adaptiveValues: ['Key adaptation: 2 keys learned', 'Antenna calibration: OK'],
  },
]

const securityLevels: SecurityLevel[] = [
  {
    level: 1,
    name: 'Basic',
    description: 'Read-only access to standard diagnostic data and fault codes. No coding or adaptation changes permitted.',
    unlocked: true,
    requirement: 'None required',
  },
  {
    level: 2,
    name: 'Extended',
    description: 'Read/write access to coding data, adaptation values, and basic parameter changes. Seed-key authentication required.',
    unlocked: false,
    requirement: 'Seed-key authentication',
  },
  {
    level: 3,
    name: 'Full',
    description: 'Complete ECU access including security-critical modules, flash programming, and calibration data. OEM credentials required.',
    unlocked: false,
    requirement: 'OEM credentials',
  },
]

// --- Brand Card ---

interface BrandCardProps {
  brand: Brand
  isSelected: boolean
  onClick: () => void
}

function BrandCard({ brand, isSelected, onClick }: BrandCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-[#151d2b] border rounded-lg p-4 text-left transition-all hover:bg-[#1a2435] w-full',
        isSelected
          ? 'border-2 shadow-lg'
          : 'border-[#1e2a3a] hover:border-[#2d3f55]'
      )}
      style={{
        borderColor: isSelected ? brand.accent : undefined,
        boxShadow: isSelected ? `0 0 20px ${brand.accent}20` : undefined,
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Logo placeholder */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#0f1923]"
          style={{ backgroundColor: brand.accent }}
        >
          {brand.firstLetter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#e2e8f0] mb-1 truncate">
            {brand.name}
          </div>
          <div className="flex flex-wrap gap-1">
            {brand.subBrands.map((sub) => (
              <span
                key={sub}
                className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: `${brand.accent}15`,
                  color: brand.accent,
                }}
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Badge
          className="text-[9px] border-0 px-1.5 py-0 h-4"
          style={{
            backgroundColor: `${brand.accent}20`,
            color: brand.accent,
          }}
        >
          {brand.vehicleCount.toLocaleString()} vehicles
        </Badge>
        <span
          className={cn(
            'text-[10px] font-bold tracking-wider px-2.5 py-1 rounded transition-all',
            isSelected
              ? 'text-[#0f1923]'
              : 'border border-[#1e2a3a] text-[#64748b] hover:text-[#94a3b8]'
          )}
          style={{
            backgroundColor: isSelected ? brand.accent : 'transparent',
          }}
        >
          {isSelected ? 'SELECTED' : 'SELECT'}
        </span>
      </div>
    </button>
  )
}

// --- Module Card ---

interface ModuleCardProps {
  module: ECUModule
  isDiscovered: boolean
  isSelected: boolean
  onClick: () => void
}

function ModuleCard({ module, isDiscovered, isSelected, onClick }: ModuleCardProps) {
  const statusColor =
    module.status === 'ok'
      ? '#10b981'
      : module.status === 'denied'
        ? '#ef4444'
        : '#f59e0b'

  const statusText =
    module.status === 'ok'
      ? 'Read OK'
      : module.status === 'denied'
        ? 'Access Denied'
        : 'Pending'

  const StatusIcon =
    module.status === 'ok'
      ? CheckCircle2
      : module.status === 'denied'
        ? Lock
        : AlertTriangle

  if (!isDiscovered) return null

  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-[#151d2b] border rounded-lg p-3 text-left transition-all w-full',
        isSelected
          ? 'border-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.15)]'
          : 'border-[#1e2a3a] hover:border-[#2d3f55]',
        module.status === 'denied' && 'border-[#ef4444]30 hover:border-[#ef4444]50'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Cpu className="h-3.5 w-3.5 flex-shrink-0" style={{ color: statusColor }} />
          <span className="text-xs font-semibold text-[#e2e8f0] truncate">
            {module.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusIcon className="h-3 w-3" style={{ color: statusColor }} />
          <span className="text-[10px] font-medium" style={{ color: statusColor }}>
            {statusText}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#64748b]">{module.supplier}</span>
        <span className="text-[10px] text-[#64748b]">
          {module.codingBytes} bytes
        </span>
      </div>
    </button>
  )
}

// --- Main Component ---

export function OEMScanView() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'complete'>('idle')
  const [scanProgress, setScanProgress] = useState(0)
  const [discoveredModules, setDiscoveredModules] = useState<Set<string>>(new Set())
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [showWriteConfirm, setShowWriteConfirm] = useState(false)
  const [writeSuccess, setWriteSuccess] = useState(false)
  const [readLoading, setReadLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [accessRequesting, setAccessRequesting] = useState<number | null>(null)

  const activeBrand = brands.find((b) => b.id === selectedBrand) ?? null
  const modules = selectedBrand === 'vw' ? vwModules : vwModules
  const activeModule = modules.find((m) => m.id === selectedModule) ?? null

  // Simulated scan
  const startScan = useCallback(() => {
    setScanState('scanning')
    setScanProgress(0)
    setDiscoveredModules(new Set())
    setSelectedModule(null)
    setExpandedModule(null)
    setShowWriteConfirm(false)
    setWriteSuccess(false)
    setResetSuccess(false)

    const totalModules = modules.length
    let step = 0
    const interval = setInterval(() => {
      step++
      setScanProgress(Math.round((step / totalModules) * 100))
      setDiscoveredModules((prev) => {
        const next = new Set(prev)
        if (step <= totalModules) {
          next.add(modules[step - 1].id)
        }
        return next
      })
      if (step >= totalModules) {
        clearInterval(interval)
        setTimeout(() => setScanState('complete'), 300)
      }
    }, 500)
  }, [modules])

  // Reset when brand changes
  useEffect(() => {
    setScanState('idle')
    setScanProgress(0)
    setDiscoveredModules(new Set())
    setSelectedModule(null)
    setExpandedModule(null)
    setShowWriteConfirm(false)
    setWriteSuccess(false)
    setResetSuccess(false)
  }, [selectedBrand])

  const handleReadCoding = () => {
    setReadLoading(true)
    setTimeout(() => setReadLoading(false), 1500)
  }

  const handleWriteCoding = () => {
    setShowWriteConfirm(true)
  }

  const confirmWrite = () => {
    setShowWriteConfirm(false)
    setWriteSuccess(true)
    setTimeout(() => setWriteSuccess(false), 3000)
  }

  const handleResetAdaptations = () => {
    setResetLoading(true)
    setTimeout(() => {
      setResetLoading(false)
      setResetSuccess(true)
      setTimeout(() => setResetSuccess(false), 3000)
    }, 2000)
  }

  const handleRequestAccess = (level: number) => {
    setAccessRequesting(level)
    setTimeout(() => {
      setAccessRequesting(null)
    }, 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* ===== 1. Page Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">OEM Scan</h1>
              {activeBrand && (
                <Badge
                  className="text-[9px] border-0 px-1.5 py-0 h-4"
                  style={{
                    backgroundColor: `${activeBrand.accent}20`,
                    color: activeBrand.accent,
                  }}
                >
                  {activeBrand.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              Manufacturer-specific diagnostic protocols and deep ECU access
            </p>
          </div>
          <Button
            size="sm"
            onClick={startScan}
            disabled={!activeBrand || scanState === 'scanning'}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              scanState === 'scanning'
                ? 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
                : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
            )}
          >
            <Search className="h-3 w-3" />
            {scanState === 'scanning' ? 'Scanning...' : 'Start OEM Scan'}
          </Button>
        </div>

        {/* ===== 2. Brand Selection Grid ===== */}
        <div>
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
            <Car className="h-4 w-4 text-[#00d4ff]" />
            Select Manufacturer
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                isSelected={selectedBrand === brand.id}
                onClick={() => setSelectedBrand(brand.id)}
              />
            ))}
          </div>
        </div>

        {/* ===== 3. Protocol Info Panel ===== */}
        {activeBrand && (
          <div
            className="bg-[#151d2b] border rounded-lg p-4"
            style={{ borderColor: `${activeBrand.accent}40` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Brand info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#0f1923]"
                    style={{ backgroundColor: activeBrand.accent }}
                  >
                    {activeBrand.firstLetter}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#e2e8f0]">
                      {activeBrand.name}
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      OEM diagnostic protocols
                    </div>
                  </div>
                </div>

                {/* Available protocols */}
                <div className="mb-3">
                  <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-1.5">
                    Available Protocols
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeBrand.protocols.map((protocol) => (
                      <Badge
                        key={protocol}
                        className="text-[9px] border-0 px-1.5 py-0 h-5 font-medium"
                        style={{
                          backgroundColor: `${activeBrand.accent}15`,
                          color: activeBrand.accent,
                        }}
                      >
                        {protocol}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Supported ECUs */}
                <div className="mb-3">
                  <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-1.5">
                    Supported ECUs
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeBrand.supportedECUs.map((ecu) => (
                      <Badge
                        key={ecu}
                        className="text-[9px] border-0 px-1.5 py-0 h-5"
                        style={{
                          backgroundColor: '#1e2a3a',
                          color: '#94a3b8',
                        }}
                      >
                        {ecu}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security access info */}
              <div className="sm:w-52 flex-shrink-0">
                <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-1.5">
                  Security Access
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Unlock className="h-3 w-3 text-[#10b981]" />
                    <span className="text-[10px] text-[#94a3b8]">Level 1-3 available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-[#f59e0b]" />
                    <span className="text-[10px] text-[#94a3b8]">
                      Seed-key required for Level 2+
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={startScan}
                  disabled={scanState === 'scanning'}
                  className="w-full mt-3 h-7 text-[10px] font-semibold gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                >
                  <Cpu className="h-3 w-3" />
                  Scan ECU Modules
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 4. ECU Module Scan ===== */}
        {scanState === 'scanning' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#94a3b8]">
                Scanning ECU modules via {activeBrand?.protocols[0] ?? 'OEM protocol'}...
              </span>
              <span className="text-[11px] text-[#00d4ff] font-medium">
                {scanProgress}%
              </span>
            </div>
            <Progress
              value={scanProgress}
              className="h-1.5 bg-[#1e2a3a]"
            />
            <div className="flex items-center gap-2 text-[10px] text-[#64748b]">
              <div className="h-2 w-2 rounded-full bg-[#00d4ff] animate-pulse" />
              <span>
                {discoveredModules.size} of {modules.length} modules discovered
              </span>
            </div>
          </div>
        )}

        {/* Module cards */}
        {(scanState === 'scanning' || scanState === 'complete') &&
          discoveredModules.size > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#00d4ff]" />
                Discovered Modules
                <Badge className="text-[9px] border-0 bg-[#1e2a3a] text-[#94a3b8] px-1.5">
                  {discoveredModules.size}
                </Badge>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    isDiscovered={discoveredModules.has(module.id)}
                    isSelected={selectedModule === module.id}
                    onClick={() => {
                      setSelectedModule(module.id)
                      setExpandedModule(module.id)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

        {/* Scan complete message */}
        {scanState === 'complete' && (
          <div className="flex items-center gap-2 bg-[#151d2b] border border-[#10b981]30 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
            <span className="text-xs text-[#94a3b8]">
              Scan complete. {discoveredModules.size} modules discovered.
              {modules.filter((m) => m.status === 'denied').length > 0 && (
                <span className="text-[#ef4444] ml-1">
                  {modules.filter((m) => m.status === 'denied').length} module(s) require
                  higher security level.
                </span>
              )}
            </span>
          </div>
        )}

        {/* ===== 5. OEM Coding Panel ===== */}
        {activeModule && expandedModule === activeModule.id && (
          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedModule(null)}
              className="w-full flex items-center justify-between p-4 bg-[#151d2b] hover:bg-[#1a2435] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
                <Cpu className="h-4 w-4 text-[#00d4ff]" />
                <span className="text-sm font-semibold text-[#e2e8f0]">
                  {activeModule.name}
                </span>
                <span className="text-xs text-[#64748b]">
                  ({activeModule.supplier})
                </span>
                {activeModule.status === 'denied' && (
                  <Badge
                    className="text-[9px] border-0 px-1.5 py-0 h-4"
                    style={{
                      backgroundColor: '#ef444420',
                      color: '#ef4444',
                    }}
                  >
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    Access Denied
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-[#64748b]" />
            </button>

            {/* Content */}
            <div className="border-t border-[#1e2a3a] p-4 space-y-4">
              {/* Module details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Software Version',
                    value: activeModule.softwareVersion,
                  },
                  {
                    label: 'Hardware Version',
                    value: activeModule.hardwareVersion,
                  },
                  { label: 'Part Number', value: activeModule.partNumber },
                  {
                    label: 'Coding Bytes',
                    value: `${activeModule.codingBytes} bytes`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-2.5"
                  >
                    <div className="text-[9px] text-[#64748b] font-medium uppercase tracking-wider mb-1">
                      {item.label}
                    </div>
                    <div className="text-xs font-mono text-[#e2e8f0]">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coding hex value */}
              <div>
                <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-1.5">
                  Coding Hex Value
                </div>
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md p-3">
                  <code className="text-[11px] font-mono text-[#00d4ff] tracking-wider break-all">
                    {activeModule.codingHex}
                  </code>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={handleReadCoding}
                  disabled={readLoading || activeModule.status === 'denied'}
                  className="h-7 text-[10px] font-semibold gap-1 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] disabled:opacity-50"
                >
                  {readLoading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-[#0f1923] border-t-transparent rounded-full animate-spin" />
                      Reading...
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3" />
                      Read Coding
                    </>
                  )}
                </Button>

                {showWriteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#ef4444] font-medium">
                      Confirm write?
                    </span>
                    <Button
                      size="sm"
                      onClick={confirmWrite}
                      className="h-7 text-[10px] font-semibold bg-[#ef4444] text-white hover:bg-[#dc2626]"
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowWriteConfirm(false)}
                      variant="outline"
                      className="h-7 text-[10px] border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0]"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleWriteCoding}
                    disabled={activeModule.status === 'denied'}
                    variant="outline"
                    className="h-7 text-[10px] font-semibold gap-1 border-[#1e2a3a] bg-[#151d2b] text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] disabled:opacity-50"
                  >
                    <Cpu className="h-3 w-3" />
                    {writeSuccess ? 'Write Successful' : 'Write Coding'}
                  </Button>
                )}
              </div>

              {/* Adaptive values */}
              <div>
                <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mb-1.5">
                  Adaptive Values
                </div>
                <div className="space-y-1.5">
                  {activeModule.adaptiveValues.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-[10px] bg-[#0f1923] border border-[#1e2a3a] rounded-md px-3 py-1.5"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-[#00d4ff]" />
                      <span className="text-[#94a3b8] font-mono">{val}</span>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={handleResetAdaptations}
                  disabled={resetLoading || activeModule.status === 'denied'}
                  variant="outline"
                  className="mt-2 h-7 text-[10px] font-semibold gap-1 border-[#f59e0b]40 bg-[#151d2b] text-[#f59e0b] hover:bg-[#f59e0b]10 hover:text-[#f59e0b] disabled:opacity-50"
                >
                  {resetLoading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : resetSuccess ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Adaptations Reset
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Reset Adaptations
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 6. Security Access Section ===== */}
        <div>
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#00d4ff]" />
            Security Access Levels
          </h3>
          <div className="space-y-3">
            {securityLevels.map((level) => {
              const LevelIcon = level.unlocked ? Unlock : Lock
              return (
                <div
                  key={level.level}
                  className={cn(
                    'bg-[#151d2b] border rounded-lg p-4 transition-all',
                    level.unlocked
                      ? 'border-[#10b981]30'
                      : 'border-[#1e2a3a] hover:border-[#2d3f55]'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={cn(
                          'p-2 rounded-md',
                          level.unlocked ? 'bg-[#10b981]15' : 'bg-[#1e2a3a]'
                        )}
                      >
                        <LevelIcon
                          className="h-4 w-4"
                          style={{
                            color: level.unlocked ? '#10b981' : '#64748b',
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-[#e2e8f0]">
                            Level {level.level} ({level.name})
                          </span>
                          {level.unlocked ? (
                            <Badge
                              className="text-[9px] border-0 px-1.5 py-0 h-4"
                              style={{
                                backgroundColor: '#10b98120',
                                color: '#10b981',
                              }}
                            >
                              <Unlock className="h-2.5 w-2.5 mr-0.5" />
                              Unlocked
                            </Badge>
                          ) : (
                            <Badge
                              className="text-[9px] border-0 px-1.5 py-0 h-4"
                              style={{
                                backgroundColor: '#64748b20',
                                color: '#64748b',
                              }}
                            >
                              <Lock className="h-2.5 w-2.5 mr-0.5" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-[#94a3b8] leading-relaxed">
                          {level.description}
                        </p>
                        {!level.unlocked && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <AlertTriangle className="h-2.5 w-2.5 text-[#f59e0b]" />
                            <span className="text-[9px] text-[#f59e0b]">
                              Requires: {level.requirement}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!level.unlocked && (
                      <Button
                        size="sm"
                        onClick={() => handleRequestAccess(level.level)}
                        disabled={accessRequesting === level.level}
                        className={cn(
                          'h-7 text-[10px] font-semibold gap-1 flex-shrink-0',
                          level.level === 2
                            ? 'bg-[#f59e0b] text-[#0f1923] hover:bg-[#d97706]'
                            : 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                        )}
                      >
                        {accessRequesting === level.level ? (
                          <>
                            <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3" />
                            Request Access
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
