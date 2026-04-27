'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Globe,
  Link2,
  Copy,
  QrCode,
  Shield,
  Clock,
  Monitor,
  Eye,
  XCircle,
  Activity,
  Car,
  Hash,
  Database,
  Signal,
  Lock,
  Unlock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Timer,
  BarChart3,
  Chrome,
  Wifi,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface WebSession {
  id: string
  vehicleName: string
  browserInfo: string
  connectedSince: number // seconds
  dataTransfer: string
  rpm: number
  speed: number
  coolant: number
}

interface IPEntry {
  id: string
  address: string
}

// Expiration option type
type ExpirationOption = '1h' | '6h' | '24h' | '7d'
type PermissionLevel = 'read-only' | 'read-dtc' | 'full'
type AutoDisconnectOption = '5min' | '15min' | '30min' | '1hour'

const expirationLabels: Record<ExpirationOption, string> = {
  '1h': '1 Hour',
  '6h': '6 Hours',
  '24h': '24 Hours',
  '7d': '7 Days',
}

const permissionLabels: Record<PermissionLevel, string> = {
  'read-only': 'Read Only',
  'read-dtc': 'Read + DTC',
  'full': 'Full Access',
}

const autoDisconnectLabels: Record<AutoDisconnectOption, string> = {
  '5min': '5 Minutes',
  '15min': '15 Minutes',
  '30min': '30 Minutes',
  '1hour': '1 Hour',
}

// Initial mock sessions
const initialSessions: WebSession[] = [
  {
    id: 'WS-7842',
    vehicleName: 'VW Golf GTI',
    browserInfo: 'Chrome 121 / macOS',
    connectedSince: 720,
    dataTransfer: '24.3 MB',
    rpm: 2840,
    speed: 72,
    coolant: 84,
  },
  {
    id: 'WS-9156',
    vehicleName: 'Audi A4 B9',
    browserInfo: 'Firefox 122 / Windows',
    connectedSince: 180,
    dataTransfer: '8.7 MB',
    rpm: 1200,
    speed: 0,
    coolant: 72,
  },
]

// Format seconds to readable duration
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  }
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

// Generate random access link
function generateAccessLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `https://ecu-master.app/remote/${code}`
}

// CSS-generated QR code pattern
function QRCodePlaceholder() {
  // Create a deterministic pattern of 7x7 "modules"
  const pattern = [
    [1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1],
  ]

  return (
    <div className="bg-white rounded-lg p-2 inline-block">
      <div className="grid grid-cols-7 gap-[2px]">
        {pattern.flat().map((cell, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-[1px]"
            style={{
              backgroundColor: cell ? '#0f1923' : '#ffffff',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function WebDiagView() {
  // Sessions state
  const [sessions, setSessions] = useState<WebSession[]>(initialSessions)

  // Link generator state
  const [expiration, setExpiration] = useState<ExpirationOption>('24h')
  const [permission, setPermission] = useState<PermissionLevel>('read-only')
  const [generatedLink, setGeneratedLink] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Security settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionRecordingEnabled, setSessionRecordingEnabled] = useState(true)
  const [watermarkEnabled, setWatermarkEnabled] = useState(true)
  const [autoDisconnect, setAutoDisconnect] = useState<AutoDisconnectOption>('15min')
  const [ipWhitelist, setIpWhitelist] = useState<IPEntry[]>([
    { id: 'ip-1', address: '192.168.1.0/24' },
    { id: 'ip-2', address: '10.0.0.0/8' },
    { id: 'ip-3', address: '172.16.0.0/12' },
  ])
  const [newIp, setNewIp] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Dashboard preview simulated data
  const [previewRpm, setPreviewRpm] = useState(2840)
  const [previewSpeed, setPreviewSpeed] = useState(72)
  const [previewTemp, setPreviewTemp] = useState(84)

  // Session timer - count up every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) =>
        prev.map((session) => ({
          ...session,
          connectedSince: session.connectedSince + 1,
        }))
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulate fluctuating values for sessions
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) =>
        prev.map((session) => ({
          ...session,
          rpm: Math.max(800, Math.round(session.rpm + (Math.random() - 0.5) * 40)),
          speed: Math.max(0, Math.round(session.speed + (Math.random() - 0.5) * 3)),
          coolant: Math.max(60, Math.round(session.coolant + (Math.random() - 0.5) * 1)),
        }))
      )
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // Dashboard preview fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviewRpm((v) => Math.max(800, Math.round(v + (Math.random() - 0.5) * 60)))
      setPreviewSpeed((v) => Math.max(0, Math.round(v + (Math.random() - 0.5) * 4)))
      setPreviewTemp((v) => Math.max(60, Math.round(v + (Math.random() - 0.5) * 1.5)))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Generate access link
  const handleGenerateLink = useCallback(() => {
    const link = generateAccessLink()
    setGeneratedLink(link)
    setCopied(false)
  }, [])

  // Copy link to clipboard
  const handleCopyLink = useCallback(() => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback for non-secure contexts
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [generatedLink])

  // Revoke all links
  const handleRevokeAll = useCallback(() => {
    setGeneratedLink('')
    setCopied(false)
  }, [])

  // Terminate session
  const handleTerminateSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }, [])

  // Add IP to whitelist
  const handleAddIp = useCallback(() => {
    if (!newIp.trim()) return
    setIpWhitelist((prev) => [
      ...prev,
      { id: `ip-${Date.now()}`, address: newIp.trim() },
    ])
    setNewIp('')
  }, [newIp])

  // Remove IP from whitelist
  const handleRemoveIp = useCallback((ipId: string) => {
    setIpWhitelist((prev) => prev.filter((ip) => ip.id !== ipId))
  }, [])

  // Save security settings
  const handleSaveSecurity = useCallback(() => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }, [])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Web Diagnostics</h1>
            </div>
            <p className="text-xs text-[#64748b]">
              Browser-based remote vehicle diagnostics and monitoring
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
            onClick={handleGenerateLink}
          >
            <Link2 className="h-3 w-3" />
            Generate Access Link
          </Button>
        </div>

        {/* 2. Active Web Sessions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Active Web Sessions</h2>
            <Badge
              className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
              style={{ backgroundColor: '#10b98120', color: '#10b981' }}
            >
              {sessions.length}
            </Badge>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-8 flex flex-col items-center justify-center">
              <Globe className="h-8 w-8 text-[#475569] mb-2" />
              <p className="text-xs text-[#64748b]">No active web sessions</p>
              <p className="text-[10px] text-[#475569] mt-1">Generate an access link to share diagnostics</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 hover:border-[#2d3f55] transition-colors"
                >
                  {/* Session Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                        <Monitor className="h-4 w-4 text-[#00d4ff]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#e2e8f0]">
                            {session.id}
                          </span>
                          {/* Green pulsing LIVE badge */}
                          <Badge
                            className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold flex items-center gap-1"
                            style={{ backgroundColor: '#10b98120', color: '#10b981' }}
                          >
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]" />
                            </span>
                            LIVE
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Car className="h-3 w-3 text-[#64748b]" />
                          <span className="text-[10px] text-[#94a3b8] font-medium">{session.vehicleName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Meta Info */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-[10px]">
                    <div className="flex items-center gap-1.5 text-[#64748b]">
                      <Chrome className="h-3 w-3" />
                      <span>{session.browserInfo}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#64748b]">
                      <Clock className="h-3 w-3" />
                      <span className="text-[#94a3b8] font-medium tabular-nums">
                        {formatDuration(session.connectedSince)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#64748b]">
                      <Wifi className="h-3 w-3" />
                      <span>{session.dataTransfer} transferred</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#64748b]">
                      <Signal className="h-3 w-3 text-[#10b981]" />
                      <span>Connected</span>
                    </div>
                  </div>

                  {/* Live Preview Values */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md px-2.5 py-2">
                      <div className="text-[9px] text-[#64748b] mb-0.5">RPM</div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-bold text-[#00d4ff] tabular-nums">
                          {session.rpm.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md px-2.5 py-2">
                      <div className="text-[9px] text-[#64748b] mb-0.5">Speed</div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-bold text-[#10b981] tabular-nums">
                          {session.speed}
                        </span>
                        <span className="text-[9px] text-[#64748b]">km/h</span>
                      </div>
                    </div>
                    <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-md px-2.5 py-2">
                      <div className="text-[9px] text-[#64748b] mb-0.5">Coolant</div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-bold text-[#f59e0b] tabular-nums">
                          {session.coolant}
                        </span>
                        <span className="text-[9px] text-[#64748b]">°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-[10px] font-semibold gap-1 bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 border-0"
                    >
                      <Eye className="h-3 w-3" />
                      View Session
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] font-semibold gap-1 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border-0"
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      <XCircle className="h-3 w-3" />
                      Terminate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Share Access Link Generator */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Share Access Link</h2>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Left: Generator Options */}
              <div className="space-y-4">
                {/* Expiration Options */}
                <div>
                  <label className="text-[11px] font-semibold text-[#94a3b8] mb-2 block">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Link Expiration
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(expirationLabels) as ExpirationOption[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setExpiration(opt)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-150',
                          expiration === opt
                            ? 'bg-[#00d4ff] text-[#0f1923]'
                            : 'bg-[#1e2a3a] text-[#94a3b8] hover:bg-[#2d3f55] hover:text-[#e2e8f0]'
                        )}
                      >
                        {expirationLabels[opt]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permission Level */}
                <div>
                  <label className="text-[11px] font-semibold text-[#94a3b8] mb-2 block">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Permission Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(permissionLabels) as PermissionLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setPermission(level)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-150 flex items-center gap-1.5',
                          permission === level
                            ? level === 'full'
                              ? 'bg-[#ef4444] text-white'
                              : level === 'read-dtc'
                              ? 'bg-[#f59e0b] text-[#0f1923]'
                              : 'bg-[#00d4ff] text-[#0f1923]'
                            : 'bg-[#1e2a3a] text-[#94a3b8] hover:bg-[#2d3f55] hover:text-[#e2e8f0]'
                        )}
                      >
                        {level === 'full' ? (
                          <Unlock className="h-3 w-3" />
                        ) : level === 'read-dtc' ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                        {permissionLabels[level]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generated Link Display */}
                {generatedLink && (
                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] mb-2 block">
                      Generated Link
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#0f1923] border border-[#1e2a3a] rounded-md px-3 py-2 flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#00d4ff] truncate">
                          {generatedLink}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className={cn(
                          'h-8 text-[10px] font-semibold gap-1 border-0',
                          copied
                            ? 'bg-[#10b981] text-white'
                            : 'bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20'
                        )}
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-8 text-[10px] font-semibold gap-1.5 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]"
                    onClick={handleGenerateLink}
                  >
                    <Link2 className="h-3 w-3" />
                    Generate Link
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-[10px] font-semibold gap-1.5 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border-0"
                    onClick={handleRevokeAll}
                    disabled={!generatedLink}
                  >
                    <XCircle className="h-3 w-3" />
                    Revoke All Links
                  </Button>
                </div>
              </div>

              {/* Right: QR Code Placeholder */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-5 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-3">
                    <QrCode className="h-4 w-4 text-[#64748b]" />
                    <span className="text-[11px] font-semibold text-[#94a3b8]">QR Code</span>
                  </div>
                  <QRCodePlaceholder />
                  <p className="text-[9px] text-[#475569] mt-3 text-center">
                    Scan to access web diagnostics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Web Diagnostics Dashboard Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Web Diagnostics Dashboard Preview</h2>
            <Badge
              className="text-[9px] border-0 px-1.5 py-0 h-4 font-semibold"
              style={{ backgroundColor: '#64748b20', color: '#94a3b8' }}
            >
              What users see
            </Badge>
          </div>

          {/* Simulated browser window */}
          <div className="bg-[#0a0f18] border border-[#1e2a3a] rounded-lg overflow-hidden">
            {/* Browser title bar */}
            <div className="bg-[#1a2332] border-b border-[#1e2a3a] px-3 py-2 flex items-center gap-3">
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              </div>
              {/* URL bar */}
              <div className="flex-1 bg-[#0f1923] border border-[#1e2a3a] rounded-md px-3 py-1 flex items-center gap-2">
                <Lock className="h-3 w-3 text-[#10b981]" />
                <span className="text-[10px] font-mono text-[#64748b] truncate">
                  {generatedLink || 'https://ecu-master.app/remote/a7b3c9d2'}
                </span>
              </div>
            </div>

            {/* Mini dashboard content */}
            <div className="p-4 bg-[#0f1923]">
              {/* Vehicle name */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-[#00d4ff]" />
                  <span className="text-sm font-semibold text-[#e2e8f0]">VW Golf GTI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
                  </span>
                  <span className="text-[10px] text-[#10b981] font-semibold">Connected</span>
                </div>
              </div>

              {/* 3 Gauges */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* RPM Gauge */}
                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[9px] text-[#64748b] mb-2 uppercase tracking-wider">RPM</div>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="#1e2a3a"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="4"
                        strokeDasharray={`${(previewRpm / 7000) * 176} 176`}
                        strokeLinecap="round"
                        style={{ filter: 'drop-shadow(0 0 3px #00d4ff40)' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#e2e8f0] tabular-nums">
                        {(previewRpm / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </div>

                {/* Speed Gauge */}
                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[9px] text-[#64748b] mb-2 uppercase tracking-wider">Speed</div>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="#1e2a3a"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="4"
                        strokeDasharray={`${(previewSpeed / 200) * 176} 176`}
                        strokeLinecap="round"
                        style={{ filter: 'drop-shadow(0 0 3px #10b98140)' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#e2e8f0] tabular-nums">
                        {previewSpeed}
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] text-[#475569]">km/h</div>
                </div>

                {/* Temperature Gauge */}
                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[9px] text-[#64748b] mb-2 uppercase tracking-wider">Temp</div>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="#1e2a3a"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke={previewTemp > 100 ? '#ef4444' : previewTemp > 90 ? '#f59e0b' : '#00d4ff'}
                        strokeWidth="4"
                        strokeDasharray={`${(previewTemp / 130) * 176} 176`}
                        strokeLinecap="round"
                        style={{
                          filter: previewTemp > 100
                            ? 'drop-shadow(0 0 3px #ef444440)'
                            : previewTemp > 90
                            ? 'drop-shadow(0 0 3px #f59e0b40)'
                            : 'drop-shadow(0 0 3px #00d4ff40)',
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#e2e8f0] tabular-nums">
                        {previewTemp}°
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DTC Count & Connection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-md px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b]" />
                  <div>
                    <div className="text-[9px] text-[#64748b]">DTC Codes</div>
                    <div className="text-xs font-semibold text-[#e2e8f0]">2 Active</div>
                  </div>
                </div>
                <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-md px-3 py-2 flex items-center gap-2">
                  <Wifi className="h-3.5 w-3.5 text-[#10b981]" />
                  <div>
                    <div className="text-[9px] text-[#64748b]">Connection</div>
                    <div className="text-xs font-semibold text-[#10b981]">Stable</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Session Statistics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Session Statistics</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Total Sessions */}
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                  <Hash className="h-3.5 w-3.5 text-[#00d4ff]" />
                </div>
                <span className="text-[11px] text-[#64748b] font-medium">Total Sessions</span>
              </div>
              <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">89</span>
              <div className="text-[9px] text-[#475569] mt-0.5">All time</div>
            </div>

            {/* Active Now */}
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-[#10b981]/10 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-[#10b981]" />
                </div>
                <span className="text-[11px] text-[#64748b] font-medium">Active Now</span>
              </div>
              <span className="text-xl font-bold text-[#10b981] tabular-nums">{sessions.length}</span>
              <div className="text-[9px] text-[#475569] mt-0.5">Currently live</div>
            </div>

            {/* Avg Duration */}
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-[#8b5cf6]/10 flex items-center justify-center">
                  <Timer className="h-3.5 w-3.5 text-[#8b5cf6]" />
                </div>
                <span className="text-[11px] text-[#64748b] font-medium">Avg Duration</span>
              </div>
              <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">18</span>
              <span className="text-xs text-[#64748b] ml-1">min</span>
              <div className="text-[9px] text-[#475569] mt-0.5">Per session</div>
            </div>

            {/* Total Data */}
            <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-[#f59e0b]/10 flex items-center justify-center">
                  <Database className="h-3.5 w-3.5 text-[#f59e0b]" />
                </div>
                <span className="text-[11px] text-[#64748b] font-medium">Total Data</span>
              </div>
              <span className="text-xl font-bold text-[#e2e8f0] tabular-nums">1.8</span>
              <span className="text-xs text-[#64748b] ml-1">GB</span>
              <div className="text-[9px] text-[#475569] mt-0.5">Transferred</div>
            </div>
          </div>
        </div>

        {/* 6. Security & Access Control */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Security & Access Control</h2>
          </div>

          <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg p-4 space-y-5">
            {/* 2-Factor Authentication */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-[#8b5cf6]/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-[#8b5cf6]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#e2e8f0]">2-Factor Authentication</div>
                  <div className="text-[10px] text-[#64748b]">Require 2FA for web access sessions</div>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>

            <div className="border-t border-[#1e2a3a]" />

            {/* IP Whitelist */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-[#00d4ff]/10 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-[#00d4ff]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#e2e8f0]">IP Whitelist</div>
                  <div className="text-[10px] text-[#64748b]">Only allow access from approved IP addresses</div>
                </div>
              </div>

              <div className="space-y-2 ml-9">
                {ipWhitelist.map((ip) => (
                  <div
                    key={ip.id}
                    className="flex items-center gap-2 bg-[#0f1923] border border-[#1e2a3a] rounded-md px-3 py-2"
                  >
                    <span className="text-[11px] font-mono text-[#94a3b8] flex-1">{ip.address}</span>
                    <button
                      onClick={() => handleRemoveIp(ip.id)}
                      className="text-[#475569] hover:text-[#ef4444] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add IP input */}
                <div className="flex items-center gap-2">
                  <Input
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="Enter IP address (e.g. 192.168.0.1)"
                    className="h-8 text-[11px] font-mono bg-[#0f1923] border-[#1e2a3a] text-[#94a3b8] placeholder-[#475569] focus:border-[#00d4ff] focus:ring-[#00d4ff]/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddIp()
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 text-[10px] font-semibold gap-1 bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 border-0 shrink-0"
                    onClick={handleAddIp}
                    disabled={!newIp.trim()}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1e2a3a]" />

            {/* Session Recording */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-[#f59e0b]/10 flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-[#f59e0b]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#e2e8f0]">Session Recording</div>
                  <div className="text-[10px] text-[#64748b]">Record all web diagnostic sessions for audit</div>
                </div>
              </div>
              <Switch
                checked={sessionRecordingEnabled}
                onCheckedChange={setSessionRecordingEnabled}
              />
            </div>

            <div className="border-t border-[#1e2a3a]" />

            {/* Watermark */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-[#10b981]/10 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-[#10b981]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#e2e8f0]">Watermark</div>
                  <div className="text-[10px] text-[#64748b]">Overlay user email on screen to prevent screenshots</div>
                </div>
              </div>
              <Switch
                checked={watermarkEnabled}
                onCheckedChange={setWatermarkEnabled}
              />
            </div>

            <div className="border-t border-[#1e2a3a]" />

            {/* Auto-disconnect after idle */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-[#ef4444]/10 flex items-center justify-center">
                  <Timer className="h-3.5 w-3.5 text-[#ef4444]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#e2e8f0]">Auto-Disconnect After Idle</div>
                  <div className="text-[10px] text-[#64748b]">Automatically end session after inactivity</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 ml-9">
                {(Object.keys(autoDisconnectLabels) as AutoDisconnectOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAutoDisconnect(opt)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-150',
                      autoDisconnect === opt
                        ? 'bg-[#00d4ff] text-[#0f1923]'
                        : 'bg-[#1e2a3a] text-[#94a3b8] hover:bg-[#2d3f55] hover:text-[#e2e8f0]'
                    )}
                  >
                    {autoDisconnectLabels[opt]}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#1e2a3a]" />

            {/* Save Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
                <Zap className="h-3 w-3" />
                <span>Changes are applied to new sessions only</span>
              </div>
              <Button
                size="sm"
                className={cn(
                  'h-8 text-[10px] font-semibold gap-1.5 border-0',
                  saveSuccess
                    ? 'bg-[#10b981] text-white'
                    : 'bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]'
                )}
                onClick={handleSaveSecurity}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Settings Saved
                  </>
                ) : (
                  <>
                    <Shield className="h-3 w-3" />
                    Save Security Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
