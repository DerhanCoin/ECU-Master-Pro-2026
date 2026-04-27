'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Circle,
  Pause,
  Square,
  Download,
  Clock,
  HardDrive,
  Activity,
  FileText,
  Play,
  ChevronRight,
  Filter,
  Zap,
  Gauge,
  Thermometer,
  Battery,
  Wind,
  Flame,
  Settings,
  Trash2,
  AlertTriangle,
  Timer,
  Disc,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface Channel {
  id: string
  label: string
  pid: string
  unit: string
  icon: React.ReactNode
  enabled: boolean
}

const defaultChannels: Channel[] = [
  { id: 'rpm', label: 'RPM', pid: '0C', unit: 'rpm', icon: <Gauge className="h-3 w-3" />, enabled: true },
  { id: 'speed', label: 'Speed', pid: '0D', unit: 'km/h', icon: <Activity className="h-3 w-3" />, enabled: true },
  { id: 'throttle', label: 'Throttle', pid: '11', unit: '%', icon: <Zap className="h-3 w-3" />, enabled: true },
  { id: 'boost', label: 'Boost', pid: '0B', unit: 'bar', icon: <Wind className="h-3 w-3" />, enabled: true },
  { id: 'afr', label: 'AFR', pid: '44', unit: ':1', icon: <Flame className="h-3 w-3" />, enabled: true },
  { id: 'ignition', label: 'Ignition', pid: '0E', unit: '°', icon: <Flame className="h-3 w-3" />, enabled: false },
  { id: 'coolant', label: 'Coolant', pid: '05', unit: '°C', icon: <Thermometer className="h-3 w-3" />, enabled: false },
  { id: 'intake', label: 'Intake Temp', pid: '0F', unit: '°C', icon: <Thermometer className="h-3 w-3" />, enabled: false },
]

interface LoggedSession {
  id: string
  date: string
  duration: string
  fileSize: string
  vehicle: string
  channels: number
  samples: number
}

const loggedSessions: LoggedSession[] = [
  { id: 'LOG-2026-0427-001', date: '2026-04-27 14:22', duration: '00:12:34', fileSize: '4.2 MB', vehicle: 'VW Golf GTI MK8', channels: 6, samples: 45216 },
  { id: 'LOG-2026-0426-003', date: '2026-04-26 18:45', duration: '00:08:21', fileSize: '2.8 MB', vehicle: 'Audi A4 B10', channels: 5, samples: 30060 },
  { id: 'LOG-2026-0426-002', date: '2026-04-26 15:12', duration: '00:25:47', fileSize: '8.7 MB', vehicle: 'BMW 330e G20', channels: 8, samples: 92832 },
  { id: 'LOG-2026-0425-001', date: '2026-04-25 09:30', duration: '00:05:12', fileSize: '1.7 MB', vehicle: 'Skoda Octavia RS', channels: 4, samples: 18744 },
  { id: 'LOG-2026-0424-002', date: '2026-04-24 16:18', duration: '00:45:03', fileSize: '15.2 MB', vehicle: 'Mercedes C300', channels: 7, samples: 162108 },
  { id: 'LOG-2026-0424-001', date: '2026-04-24 10:05', duration: '00:02:45', fileSize: '0.9 MB', vehicle: 'VW Golf GTI MK8', channels: 3, samples: 9900 },
]

type RecordingState = 'idle' | 'recording' | 'paused'

export function DataLoggerView() {
  const [recState, setRecState] = useState<RecordingState>('idle')
  const [channels, setChannels] = useState(defaultChannels)
  const [elapsed, setElapsed] = useState(0)
  const [sampleCount, setSampleCount] = useState(0)
  const [playbackPos, setPlaybackPos] = useState(0)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [liveValues, setLiveValues] = useState<Record<string, number>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sampleRate = 60 // samples per second (per channel)
  const enabledCount = channels.filter(c => c.enabled).length
  const fileSize = ((sampleCount * enabledCount * 4) / (1024 * 1024)).toFixed(2)

  // Timer and sample counter
  useEffect(() => {
    if (recState === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
        setSampleCount(prev => prev + sampleRate * enabledCount)
        setLiveValues({
          rpm: 2800 + Math.random() * 800,
          speed: 85 + Math.random() * 20,
          throttle: 30 + Math.random() * 20,
          boost: 1.1 + Math.random() * 0.3,
          afr: 13.5 + Math.random() * 1.0,
          ignition: 22 + Math.random() * 4,
          coolant: 88 + Math.random() * 5,
          intake: 25 + Math.random() * 8,
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [recState, enabledCount])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const toggleChannel = (id: string) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, enabled: !ch.enabled } : ch))
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Disc className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Data Logger</h1>
            {recState === 'recording' && (
              <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                REC
              </Badge>
            )}
            {recState === 'paused' && (
              <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">
                PAUSED
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#64748b]">Record and playback vehicle data</p>
        </div>
      </div>

      {/* Recording Controls */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              {recState === 'idle' && (
                <Button
                  onClick={() => setRecState('recording')}
                  className="h-10 px-6 bg-[#ef4444] text-white hover:bg-[#dc2626] font-semibold gap-2"
                >
                  <Circle className="h-4 w-4 fill-current" />
                  Start Recording
                </Button>
              )}
              {recState === 'recording' && (
                <>
                  <Button
                    onClick={() => setRecState('paused')}
                    className="h-10 px-4 bg-[#f59e0b] text-[#0f1923] hover:bg-[#d97706] font-semibold gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    onClick={() => { setRecState('idle'); setElapsed(0); setSampleCount(0) }}
                    className="h-10 px-4 bg-[#151d2b] text-[#e2e8f0] border border-[#1e2a3a] hover:bg-[#1e2a3a] gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
              {recState === 'paused' && (
                <>
                  <Button
                    onClick={() => setRecState('recording')}
                    className="h-10 px-4 bg-[#10b981] text-white hover:bg-[#059669] font-semibold gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                  <Button
                    onClick={() => { setRecState('idle'); setElapsed(0); setSampleCount(0) }}
                    className="h-10 px-4 bg-[#151d2b] text-[#e2e8f0] border border-[#1e2a3a] hover:bg-[#1e2a3a] gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop & Save
                  </Button>
                </>
              )}
            </div>

            {/* Timer Display */}
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
              <Timer className="h-4 w-4 text-[#00d4ff]" />
              <span className="text-xl font-mono font-bold text-[#e2e8f0] tracking-wider">{formatTime(elapsed)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Session Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Duration', value: formatTime(elapsed), icon: <Clock className="h-4 w-4 text-[#00d4ff]" /> },
          { label: 'File Size', value: `${fileSize} MB`, icon: <HardDrive className="h-4 w-4 text-[#8b5cf6]" /> },
          { label: 'Samples', value: sampleCount.toLocaleString(), icon: <Activity className="h-4 w-4 text-[#10b981]" /> },
          { label: 'Sample Rate', value: `${sampleRate} Hz/ch`, icon: <Gauge className="h-4 w-4 text-[#f59e0b]" /> },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#151d2b] border-[#1e2a3a]">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0f1923] flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <div className="text-[10px] text-[#475569]">{stat.label}</div>
                <div className="text-sm font-mono font-bold text-[#e2e8f0]">{stat.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel Selection */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#00d4ff]" />
              Channel Selection
            </CardTitle>
            <Badge className="bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55] text-[10px]">
              {enabledCount} of {channels.length} enabled
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-all ${
                  ch.enabled
                    ? 'border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff]'
                    : 'border-[#1e2a3a] bg-[#0f1923] text-[#64748b] hover:border-[#2d3f55]'
                }`}
              >
                {ch.icon}
                <div className="text-left flex-1">
                  <div className="font-medium">{ch.label}</div>
                  <div className="text-[9px] opacity-70">PID 0x{ch.pid}</div>
                </div>
                <div className={`w-3 h-3 rounded-full border ${ch.enabled ? 'bg-[#00d4ff] border-[#00d4ff]' : 'border-[#475569]'}`} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Data Preview */}
      {recState === 'recording' && (
        <Card className="bg-[#151d2b] border-[#00d4ff]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#10b981]" />
              Live Data Preview
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {channels.filter(c => c.enabled).map(ch => (
                <div key={ch.id} className="bg-[#0f1923] border border-[#1e2a3a] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[#475569] mb-1">{ch.label}</div>
                  <div className="text-lg font-bold font-mono text-[#00d4ff]">
                    {liveValues[ch.id] !== undefined ? (ch.id === 'boost' || ch.id === 'afr' ? liveValues[ch.id].toFixed(2) : Math.round(liveValues[ch.id])) : '—'}
                  </div>
                  <div className="text-[10px] text-[#475569]">{ch.unit}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logged Sessions */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#f59e0b]" />
              Logged Sessions
            </CardTitle>
            <Badge className="bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55] text-[10px]">
              {loggedSessions.length} sessions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {loggedSessions.map(session => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedSession === session.id
                    ? 'border-[#00d4ff]/40 bg-[#00d4ff]/5'
                    : 'border-[#1e2a3a] bg-[#0f1923] hover:border-[#2d3f55]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[#64748b]" />
                    <span className="text-xs font-mono font-medium text-[#e2e8f0]">{session.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#1e2a3a] text-[#94a3b8] border-[#2d3f55] text-[9px]">
                      {session.channels}ch
                    </Badge>
                    <ChevronRight className={`h-3 w-3 text-[#475569] transition-transform ${selectedSession === session.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] text-[#475569]">
                  <div><span className="text-[#64748b]">Date:</span> {session.date}</div>
                  <div><span className="text-[#64748b]">Duration:</span> {session.duration}</div>
                  <div><span className="text-[#64748b]">Size:</span> {session.fileSize}</div>
                  <div><span className="text-[#64748b]">Vehicle:</span> {session.vehicle}</div>
                  <div><span className="text-[#64748b]">Samples:</span> {session.samples.toLocaleString()}</div>
                </div>

                {/* Playback controls for selected session */}
                {selectedSession === session.id && (
                  <div className="mt-3 pt-3 border-t border-[#1e2a3a]">
                    <div className="flex items-center gap-3 mb-2">
                      <Button size="sm" className="h-7 w-7 p-0 bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4]">
                        <Play className="h-3 w-3" />
                      </Button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={playbackPos}
                          onChange={e => setPlaybackPos(Number(e.target.value))}
                          className="w-full h-1 bg-[#1e2a3a] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00d4ff]"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#64748b]">{playbackPos}%</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['CSV', 'JSON', 'MEGALOG', 'Binary'].map(fmt => (
                        <Button key={fmt} size="sm" variant="ghost" className="h-6 text-[9px] text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] gap-1">
                          <Download className="h-2.5 w-2.5" />
                          {fmt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Log Triggers & Storage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auto-Log Triggers */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#f59e0b]" />
              Auto-Log Triggers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'DTC Trigger', desc: 'Auto-log when a new DTC is detected', enabled: true, color: '#ef4444' },
              { label: 'RPM Threshold', desc: 'Start logging when RPM exceeds 5,000', enabled: true, color: '#00d4ff' },
              { label: 'Parameter Change', desc: 'Log on sudden AFR or boost deviation', enabled: false, color: '#8b5cf6' },
              { label: 'Knock Detection', desc: 'Auto-log on knock sensor events', enabled: true, color: '#f59e0b' },
            ].map((trigger, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${trigger.enabled ? 'animate-pulse' : ''}`} style={{ backgroundColor: trigger.enabled ? trigger.color : '#475569' }} />
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">{trigger.label}</div>
                    <div className="text-[10px] text-[#475569]">{trigger.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => {}}
                  className={`w-8 h-4 rounded-full transition-all ${trigger.enabled ? 'bg-[#10b981]' : 'bg-[#1e2a3a]'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${trigger.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Storage Management */}
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-[#8b5cf6]" />
              Storage Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Disk Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#64748b]">Disk Usage</span>
                <span className="text-xs font-mono text-[#e2e8f0]">2.4 GB / 10 GB</span>
              </div>
              <div className="w-full h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] rounded-full" style={{ width: '24%' }} />
              </div>
            </div>

            {/* Auto-Cleanup */}
            <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-medium text-[#e2e8f0]">Auto-Cleanup</div>
                  <div className="text-[10px] text-[#475569]">Delete sessions older than 90 days</div>
                </div>
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px]">Enabled</Badge>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] gap-1">
                <Settings className="h-3 w-3" />
                Configure
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs text-[#ef4444] hover:bg-[#ef4444]/10 gap-1">
                <Trash2 className="h-3 w-3" />
                Clear Old
              </Button>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-[#f59e0b]/10 border border-[#f59e0b]/30">
              <AlertTriangle className="h-3 w-3 text-[#f59e0b] shrink-0" />
              <span className="text-[10px] text-[#f59e0b]">Storage reaching 25% — consider archiving old sessions</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
