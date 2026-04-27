'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Key,
  Fingerprint,
  CreditCard,
  ArrowRight,
  Cpu,
  RefreshCw,
  Activity,
  Clock,
  Download,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SGWStatus = 'Locked' | 'Unlocked' | 'Partial'
type AccessLevel = 1 | 2 | 3 | 4 | 5
type ECUAccess = 'Accessible' | 'Locked' | 'Restricted'

// Protected ECUs
const PROTECTED_ECUS = [
  { name: 'Engine ECU (ECM)', address: '0x01', access: 'Accessible' as ECUAccess, level: 2 },
  { name: 'Transmission (TCM)', address: '0x02', access: 'Accessible' as ECUAccess, level: 2 },
  { name: 'ABS/ESP', address: '0x03', access: 'Accessible' as ECUAccess, level: 1 },
  { name: 'Airbag Module (SRS)', address: '0x15', access: 'Locked' as ECUAccess, level: 4 },
  { name: 'Immobilizer', address: '0x25', access: 'Locked' as ECUAccess, level: 5 },
  { name: 'Keyless Entry', address: '0x27', access: 'Locked' as ECUAccess, level: 4 },
  { name: 'Instrument Cluster', address: '0x17', access: 'Restricted' as ECUAccess, level: 3 },
  { name: 'Body Control (BCM)', address: '0x09', access: 'Restricted' as ECUAccess, level: 3 },
  { name: 'Gateway Module', address: '0x19', access: 'Locked' as ECUAccess, level: 5 },
  { name: 'Infotainment MIB3', address: '0x5F', access: 'Restricted' as ECUAccess, level: 3 },
  { name: 'Steering Assist (EPS)', address: '0x44', access: 'Accessible' as ECUAccess, level: 2 },
  { name: 'Climate Control (HVAC)', address: '0x08', access: 'Accessible' as ECUAccess, level: 1 },
]

// Routing table
const ROUTING_TABLE = [
  { source: 'OBD Port', destination: 'Engine ECU', protocol: 'CAN HS', status: 'Active' },
  { source: 'OBD Port', destination: 'Transmission', protocol: 'CAN HS', status: 'Active' },
  { source: 'OBD Port', destination: 'ABS/ESP', protocol: 'CAN HS', status: 'Active' },
  { source: 'OBD Port', destination: 'Airbag SRS', protocol: 'CAN HS', status: 'Blocked' },
  { source: 'OBD Port', destination: 'Immobilizer', protocol: 'CAN MS', status: 'Blocked' },
  { source: 'OBD Port', destination: 'Keyless Entry', protocol: 'CAN MS', status: 'Blocked' },
  { source: 'Infotainment', destination: 'Gateway', protocol: 'MOST', status: 'Active' },
  { source: 'Instrument Cluster', destination: 'Gateway', protocol: 'CAN MS', status: 'Restricted' },
  { source: 'BCM', destination: 'Door Modules', protocol: 'LIN', status: 'Active' },
]

// Security event log
const SECURITY_EVENTS = [
  { time: '12:45:23', event: 'SGW unlock request via Seed/Key', result: 'Success', severity: 'info' },
  { time: '12:45:24', event: 'Level 2 access granted to OBD Port', result: 'Granted', severity: 'success' },
  { time: '12:44:18', event: 'Unauthorized access attempt to Immobilizer', result: 'Denied', severity: 'danger' },
  { time: '12:43:55', event: 'SGW authentication token refreshed', result: 'Success', severity: 'info' },
  { time: '12:42:10', event: 'Level 3 access denied - insufficient credentials', result: 'Denied', severity: 'warning' },
  { time: '12:40:30', event: 'Gateway routing table updated', result: 'Success', severity: 'info' },
  { time: '12:38:15', event: 'Security session timeout - auto-lock', result: 'Timeout', severity: 'warning' },
  { time: '12:35:00', event: 'DoIP connection established from 192.168.1.100', result: 'Success', severity: 'info' },
]

const UNLOCK_METHODS = [
  { name: 'Seed/Key Algorithm', desc: 'OEM proprietary challenge-response authentication', icon: Key, available: true, level: 3 },
  { name: 'OEM Credentials', desc: 'Manufacturer service portal login credentials', icon: Fingerprint, available: true, level: 4 },
  { name: 'Token-Based', desc: 'Time-limited access token from OEM server', icon: CreditCard, available: true, level: 5 },
]

const ACCESS_COLORS: Record<ECUAccess, string> = {
  Accessible: '#10b981',
  Locked: '#ef4444',
  Restricted: '#f59e0b',
}

const STATUS_STYLES: Record<SGWStatus, { color: string; bg: string; icon: React.ElementType }> = {
  Unlocked: { color: '#10b981', bg: 'bg-[#10b981]/20', icon: Unlock },
  Partial: { color: '#f59e0b', bg: 'bg-[#f59e0b]/20', icon: Shield },
  Locked: { color: '#ef4444', bg: 'bg-[#ef4444]/20', icon: Lock },
}

export function SGWView() {
  const [sgwStatus, setSgwStatus] = useState<SGWStatus>('Partial')
  const [securityLevel, setSecurityLevel] = useState<AccessLevel>(2)
  const [autoUnlock, setAutoUnlock] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const statusStyle = STATUS_STYLES[sgwStatus]
  const StatusIcon = statusStyle.icon

  const handleUnlock = (method: string) => {
    setIsUnlocking(true)
    setTimeout(() => {
      setSgwStatus('Unlocked')
      setSecurityLevel(3)
      setIsUnlocking(false)
    }, 2000)
  }

  const handleLock = () => {
    setSgwStatus('Locked')
    setSecurityLevel(1)
  }

  const accessibleCount = PROTECTED_ECUS.filter(e => e.access === 'Accessible').length
  const lockedCount = PROTECTED_ECUS.filter(e => e.access === 'Locked').length
  const restrictedCount = PROTECTED_ECUS.filter(e => e.access === 'Restricted').length

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Security Gateway</h1>
            <Badge className={cn('text-[10px] border-0', statusStyle.bg)} style={{ color: statusStyle.color }}>
              {sgwStatus}
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">
            SGW bypass management, security levels, and protected ECU access control
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sgwStatus === 'Unlocked' ? (
            <Button size="sm" onClick={handleLock} className="h-8 text-xs gap-1.5 bg-[#ef4444] text-white hover:bg-[#dc2626]">
              <Lock className="h-3 w-3" />Lock Gateway
            </Button>
          ) : (
            <Button size="sm" onClick={() => handleUnlock('seedkey')} disabled={isUnlocking} className="h-8 text-xs gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
              {isUnlocking ? <><RefreshCw className="h-3 w-3 animate-spin" />Authenticating...</> : <><Unlock className="h-3 w-3" />Unlock SGW</>}
            </Button>
          )}
        </div>
      </div>

      {/* SGW Status + Security Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SGW Status */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <StatusIcon className="h-4 w-4" style={{ color: statusStyle.color }} />
              SGW Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center p-6">
              <div className="relative">
                <div className={cn(
                  'h-24 w-24 rounded-full flex items-center justify-center border-4',
                  sgwStatus === 'Unlocked' ? 'border-[#10b981] shadow-[0_0_20px_#10b98140]' :
                  sgwStatus === 'Partial' ? 'border-[#f59e0b] shadow-[0_0_20px_#f59e0b40]' :
                  'border-[#ef4444] shadow-[0_0_20px_#ef444440]'
                )}>
                  <StatusIcon className="h-10 w-10" style={{ color: statusStyle.color }} />
                </div>
                {sgwStatus === 'Unlocked' && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#10b981] flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2">
                <div className="text-lg font-bold text-[#10b981] tabular-nums">{accessibleCount}</div>
                <div className="text-[9px] text-[#475569]">Accessible</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2">
                <div className="text-lg font-bold text-[#f59e0b] tabular-nums">{restrictedCount}</div>
                <div className="text-[9px] text-[#475569]">Restricted</div>
              </div>
              <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-2">
                <div className="text-lg font-bold text-[#ef4444] tabular-nums">{lockedCount}</div>
                <div className="text-[9px] text-[#475569]">Locked</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Level + Unlock Methods */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#00d4ff]" />
              Security Level &amp; Unlock Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Security Level Display */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Current Security Level</div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'h-8 flex-1 rounded-md flex items-center justify-center text-xs font-bold transition-all',
                      level <= securityLevel
                        ? level <= 2 ? 'bg-[#10b981]/20 text-[#10b981]' : level <= 3 ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-[#ef4444]/20 text-[#ef4444]'
                        : 'bg-[#1e2a3a] text-[#475569]'
                    )}
                  >
                    L{level}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-[#64748b] mt-2">
                {securityLevel === 1 ? 'Read-only access to basic parameters' :
                 securityLevel === 2 ? 'Standard diagnostic access enabled' :
                 securityLevel === 3 ? 'Extended diagnostics & coding access' :
                 securityLevel === 4 ? 'Advanced adaptation & programming' :
                 'Full system access including security modules'}
              </div>
            </div>

            {/* Unlock Methods */}
            <div className="space-y-1.5">
              {UNLOCK_METHODS.map((method) => {
                const MethodIcon = method.icon
                const canUse = sgwStatus !== 'Unlocked'
                return (
                  <button
                    key={method.name}
                    onClick={() => canUse && handleUnlock(method.name)}
                    disabled={!canUse || isUnlocking}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55] hover:bg-[#1e2a3a]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="h-8 w-8 rounded-md bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0">
                      <MethodIcon className="h-4 w-4 text-[#00d4ff]" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[11px] font-semibold text-[#e2e8f0]">{method.name}</div>
                      <div className="text-[9px] text-[#475569]">{method.desc}</div>
                    </div>
                    <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[9px]">L{method.level}</Badge>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protected ECU List + Routing Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Protected ECU List */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#00d4ff]" />
              Protected ECU List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {PROTECTED_ECUS.map((ecu, i) => {
                const accessColor = ACCESS_COLORS[ecu.access]
                const AccessIcon = ecu.access === 'Accessible' ? CheckCircle2 : ecu.access === 'Locked' ? XCircle : AlertTriangle
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-[#0f1923] border border-[#1e2a3a] rounded-lg hover:border-[#2d3f55] transition-colors">
                    <AccessIcon className="h-4 w-4 flex-shrink-0" style={{ color: accessColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-[#e2e8f0] truncate">{ecu.name}</div>
                      <div className="text-[9px] text-[#475569] font-mono">{ecu.address} · Security Level {ecu.level}</div>
                    </div>
                    <Badge className="text-[8px] border-0 px-1.5 py-0 h-4 flex-shrink-0" style={{ backgroundColor: `${accessColor}20`, color: accessColor }}>
                      {ecu.access}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gateway Routing Table */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-[#00d4ff]" />
              Gateway Routing Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              <div className="grid grid-cols-[1fr_1fr_60px_70px] gap-2 px-2 text-[9px] font-bold uppercase tracking-wider text-[#475569]">
                <span>Source</span>
                <span>Destination</span>
                <span>Protocol</span>
                <span>Status</span>
              </div>
              {ROUTING_TABLE.map((route, i) => {
                const statusColor = route.status === 'Active' ? '#10b981' : route.status === 'Blocked' ? '#ef4444' : '#f59e0b'
                return (
                  <div key={i} className="grid grid-cols-[1fr_1fr_60px_70px] gap-2 items-center bg-[#0f1923] border border-[#1e2a3a] rounded-md px-2 py-2 hover:border-[#2d3f55] transition-colors">
                    <span className="text-[10px] font-medium text-[#94a3b8] truncate">{route.source}</span>
                    <span className="text-[10px] font-medium text-[#94a3b8] truncate">{route.destination}</span>
                    <span className="text-[9px] font-mono text-[#64748b]">{route.protocol}</span>
                    <Badge className="text-[8px] border-0 px-1 py-0 h-4" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                      {route.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Event Log + Firmware + Risk Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Security Event Log */}
        <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              Security Event Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a3a #0f1923' }}>
              {SECURITY_EVENTS.map((evt, i) => {
                const sevColor = evt.severity === 'success' ? '#10b981' : evt.severity === 'danger' ? '#ef4444' : evt.severity === 'warning' ? '#f59e0b' : '#00d4ff'
                return (
                  <div key={i} className="flex items-start gap-3 p-2 bg-[#0f1923] border border-[#1e2a3a] rounded-md hover:border-[#2d3f55] transition-colors">
                    <span className="text-[9px] font-mono text-[#475569] tabular-nums flex-shrink-0 mt-0.5">{evt.time}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-[#94a3b8]">{evt.event}</div>
                    </div>
                    <Badge className="text-[8px] border-0 px-1.5 py-0 h-4 flex-shrink-0" style={{ backgroundColor: `${sevColor}20`, color: sevColor }}>
                      {evt.result}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Firmware + Risk Assessment + Auto-Unlock */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#00d4ff]" />
              Additional Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Firmware */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">SGW Firmware</div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#64748b]">Version</span>
                <span className="text-[10px] font-mono text-[#e2e8f0]">v3.2.1 (build 847)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748b]">Update Status</span>
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px]">Up to Date</Badge>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Risk Assessment</div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#64748b]">Overall Risk</span>
                    <span className="text-xs font-bold text-[#f59e0b]">Medium</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: '55%' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">Active Sessions</span>
                  <span className="text-xs font-bold text-[#e2e8f0]">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b]">Failed Auth Attempts</span>
                  <span className="text-xs font-bold text-[#ef4444]">3</span>
                </div>
              </div>
            </div>

            {/* Auto-Unlock */}
            <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Auto-Unlock</div>
                  <div className="text-[9px] text-[#475569] mt-0.5">Automatically bypass SGW on connect</div>
                </div>
                <button
                  onClick={() => setAutoUnlock(!autoUnlock)}
                  className={cn(
                    'h-6 w-11 rounded-full flex items-center transition-all relative',
                    autoUnlock ? 'bg-[#00d4ff]/30' : 'bg-[#1e2a3a]'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded-full absolute top-0.5 transition-all',
                    autoUnlock ? 'bg-[#00d4ff] left-[22px] shadow-[0_0_6px_#00d4ff60]' : 'bg-[#475569] left-0.5'
                  )} />
                </button>
              </div>
              {autoUnlock && (
                <div className="mt-2 flex items-center gap-1.5 text-[9px] text-[#f59e0b]">
                  <AlertTriangle className="h-3 w-3" />
                  Auto-unlock may reduce vehicle security
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
