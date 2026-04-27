'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Upload,
  Download,
  SkipForward,
  HardDrive,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
  Link2,
  Unlink,
  Eye,
  Merge,
  ChevronDown,
  Database,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

type SyncState = 'synced' | 'syncing' | 'conflict'
type SyncAction = 'upload' | 'download' | 'conflict'
type SyncStatus = 'completed' | 'failed' | 'pending' | 'conflict'
type CloudProvider = 'Google Drive' | 'Dropbox' | 'AWS S3' | 'OneDrive'

interface CloudAccount {
  id: string
  provider: CloudProvider
  email: string
  connected: boolean
  lastSync: string
}

interface SyncLogEntry {
  id: string
  timestamp: string
  action: SyncAction
  fileName: string
  status: SyncStatus
  size: string
}

interface ConflictFile {
  id: string
  fileName: string
  localModified: string
  cloudModified: string
  localSize: string
  cloudSize: string
}

interface DataCategory {
  id: string
  name: string
  icon: React.ReactNode
  enabled: boolean
  size: string
}

interface BackupEntry {
  id: string
  date: string
  size: string
  type: 'auto' | 'manual'
  vehicle: string
}

// ── Mock Data ───────────────────────────────────────────────────────────────

const initialAccounts: CloudAccount[] = [
  { id: '1', provider: 'Google Drive', email: 'tech@autoshop.com', connected: true, lastSync: '5 min ago' },
  { id: '2', provider: 'Dropbox', email: 'diagnostics@shop.com', connected: true, lastSync: '1 hr ago' },
  { id: '3', provider: 'AWS S3', email: 's3://ecu-backups', connected: false, lastSync: 'Never' },
  { id: '4', provider: 'OneDrive', email: 'shop@outlook.com', connected: true, lastSync: '30 min ago' },
]

const syncHistory: SyncLogEntry[] = [
  { id: '1', timestamp: '2026-02-28 14:32', action: 'upload', fileName: 'Golf_GTI_diagnostics_2026-02-28.json', status: 'completed', size: '2.4 MB' },
  { id: '2', timestamp: '2026-02-28 14:30', action: 'download', fileName: 'tuning_profile_stage2_A4B10.json', status: 'completed', size: '856 KB' },
  { id: '3', timestamp: '2026-02-28 13:15', action: 'conflict', fileName: 'service_history_911_992.json', status: 'conflict', size: '1.1 MB' },
  { id: '4', timestamp: '2026-02-28 12:00', action: 'upload', fileName: 'DTC_scan_X3_G01.csv', status: 'completed', size: '340 KB' },
  { id: '5', timestamp: '2026-02-28 10:45', action: 'download', fileName: 'fleet_report_feb2026.pdf', status: 'completed', size: '5.2 MB' },
  { id: '6', timestamp: '2026-02-27 18:20', action: 'upload', fileName: 'ADAS_calibration_C300.json', status: 'failed', size: '1.8 MB' },
  { id: '7', timestamp: '2026-02-27 16:00', action: 'upload', fileName: 'canbus_log_Macan_95B.log', status: 'completed', size: '12.4 MB' },
  { id: '8', timestamp: '2026-02-27 09:30', action: 'download', fileName: 'TSB_database_update.db', status: 'completed', size: '48 MB' },
]

const conflictFiles: ConflictFile[] = [
  {
    id: '1',
    fileName: 'service_history_911_992.json',
    localModified: '2026-02-28 13:10',
    cloudModified: '2026-02-28 12:45',
    localSize: '1.1 MB',
    cloudSize: '1.0 MB',
  },
  {
    id: '2',
    fileName: 'tuning_map_GTI_stage1.bin',
    localModified: '2026-02-28 11:30',
    cloudModified: '2026-02-28 11:35',
    localSize: '256 KB',
    cloudSize: '258 KB',
  },
]

const initialCategories: DataCategory[] = [
  { id: '1', name: 'Vehicle Data', icon: <Database className="h-4 w-4" />, enabled: true, size: '142 MB' },
  { id: '2', name: 'Diagnostic Sessions', icon: <FileText className="h-4 w-4" />, enabled: true, size: '89 MB' },
  { id: '3', name: 'Tuning Profiles', icon: <Settings className="h-4 w-4" />, enabled: true, size: '34 MB' },
  { id: '4', name: 'Reports', icon: <BarChart3 className="h-4 w-4" />, enabled: false, size: '67 MB' },
  { id: '5', name: 'Settings', icon: <Settings className="h-4 w-4" />, enabled: true, size: '2 MB' },
]

const backupList: BackupEntry[] = [
  { id: '1', date: '2026-02-28 02:00', size: '334 MB', type: 'auto', vehicle: 'All Fleet' },
  { id: '2', date: '2026-02-27 14:22', size: '128 MB', type: 'manual', vehicle: 'VW Golf GTI' },
  { id: '3', date: '2026-02-27 02:00', size: '334 MB', type: 'auto', vehicle: 'All Fleet' },
  { id: '4', date: '2026-02-26 16:45', size: '96 MB', type: 'manual', vehicle: 'Porsche 911 992' },
  { id: '5', date: '2026-02-26 02:00', size: '330 MB', type: 'auto', vehicle: 'All Fleet' },
]

const providerIcons: Record<CloudProvider, string> = {
  'Google Drive': '#10b981',
  'Dropbox': '#00d4ff',
  'AWS S3': '#f59e0b',
  'OneDrive': '#8b5cf6',
}

// ── Main Component ──────────────────────────────────────────────────────────

export function CloudSyncView() {
  const [syncState, setSyncState] = useState<SyncState>('synced')
  const [lastSync, setLastSync] = useState('5 min ago')
  const [accounts, setAccounts] = useState<CloudAccount[]>(initialAccounts)
  const [categories, setCategories] = useState<DataCategory[]>(initialCategories)
  const [conflicts, setConflicts] = useState<ConflictFile[]>(conflictFiles)
  const [schedule, setSchedule] = useState<'realtime' | 'hourly' | 'daily' | 'manual'>('hourly')
  const [storageUsed] = useState(2.4)
  const storageTotal = 10
  const [isSyncing, setIsSyncing] = useState(false)

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    )
  }

  const resolveConflict = (id: string, action: 'merge' | 'overwrite' | 'skip') => {
    setConflicts((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSync = () => {
    setIsSyncing(true)
    setSyncState('syncing')
    setTimeout(() => {
      setIsSyncing(false)
      setSyncState('synced')
      setLastSync('Just now')
    }, 2000)
  }

  const toggleConnection = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, connected: !a.connected } : a))
    )
  }

  const actionIcons: Record<SyncAction, React.ReactNode> = {
    upload: <Upload className="h-3 w-3 text-[#10b981]" />,
    download: <Download className="h-3 w-3 text-[#00d4ff]" />,
    conflict: <AlertTriangle className="h-3 w-3 text-[#f59e0b]" />,
  }

  const statusBadge: Record<SyncStatus, string> = {
    completed: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
    failed: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30',
    pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
    conflict: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30',
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cloud className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Cloud Sync</h1>
            {syncState === 'synced' && (
              <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px] gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Synced
              </Badge>
            )}
            {syncState === 'syncing' && (
              <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[10px] gap-1 animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing
              </Badge>
            )}
            {syncState === 'conflict' && (
              <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />
                Conflicts
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#64748b]">Last synced: {lastSync}</p>
        </div>
        <Button
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Cloud Storage</div>
            <div className="text-2xl font-bold text-[#e2e8f0]">{storageUsed} <span className="text-sm text-[#64748b]">/ {storageTotal} GB</span></div>
            <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#00d4ff] rounded-full transition-all"
                style={{ width: `${(storageUsed / storageTotal) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Connected</div>
            <div className="text-2xl font-bold text-[#10b981]">
              {accounts.filter((a) => a.connected).length}
            </div>
            <div className="text-[10px] text-[#475569] mt-1">of {accounts.length} accounts</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Conflicts</div>
            <div className="text-2xl font-bold text-[#f59e0b]">{conflicts.length}</div>
            <div className="text-[10px] text-[#475569] mt-1">Awaiting resolution</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Schedule</div>
            <div className="text-lg font-bold text-[#8b5cf6] capitalize">{schedule}</div>
            <div className="text-[10px] text-[#475569] mt-1">Sync frequency</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connected Accounts */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[#00d4ff]" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between bg-[#0f1923] rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${providerIcons[account.provider]}15` }}
                    >
                      <Cloud className="h-4 w-4" style={{ color: providerIcons[account.provider] }} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#e2e8f0]">{account.provider}</div>
                      <div className="text-[10px] text-[#64748b]">{account.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {account.connected ? (
                        <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px]">
                          Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-[#475569]/20 text-[#475569] border-[#475569]/30 text-[9px]">
                          Disconnected
                        </Badge>
                      )}
                      {account.connected && (
                        <div className="text-[9px] text-[#475569] mt-0.5">Last: {account.lastSync}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleConnection(account.id)}
                    >
                      {account.connected ? (
                        <Unlink className="h-3.5 w-3.5 text-[#ef4444]" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5 text-[#10b981]" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sync History */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#10b981]" />
                Sync History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-72 overflow-y-auto">
              {syncHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-[#0f1923] rounded-lg p-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex-shrink-0">{actionIcons[entry.action]}</div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#94a3b8] truncate">{entry.fileName}</div>
                      <div className="text-[9px] text-[#475569]">{entry.timestamp}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] text-[#475569]">{entry.size}</span>
                    <Badge className={`${statusBadge[entry.status]} text-[9px] border`}>
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Conflict Resolution */}
          {conflicts.length > 0 && (
            <Card className="bg-[#151d2b] border-[#f59e0b]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[#f59e0b] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Conflict Resolution ({conflicts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="bg-[#0f1923] rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#e2e8f0]">{conflict.fileName}</div>
                      <ArrowUpDown className="h-3.5 w-3.5 text-[#f59e0b]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="bg-[#151d2b] rounded p-2 border border-[#1e2a3a]">
                        <div className="text-[#64748b] uppercase mb-1">Local</div>
                        <div className="text-[#94a3b8]">Modified: {conflict.localModified}</div>
                        <div className="text-[#94a3b8]">Size: {conflict.localSize}</div>
                      </div>
                      <div className="bg-[#151d2b] rounded p-2 border border-[#1e2a3a]">
                        <div className="text-[#64748b] uppercase mb-1">Cloud</div>
                        <div className="text-[#94a3b8]">Modified: {conflict.cloudModified}</div>
                        <div className="text-[#94a3b8]">Size: {conflict.cloudSize}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-[10px] bg-[#8b5cf6] text-white hover:bg-[#7c3aed] gap-1"
                        onClick={() => resolveConflict(conflict.id, 'merge')}
                      >
                        <Merge className="h-3 w-3" />
                        Merge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:bg-[#1e2a3a] gap-1"
                        onClick={() => resolveConflict(conflict.id, 'overwrite')}
                      >
                        <Upload className="h-3 w-3" />
                        Overwrite Cloud
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] text-[#94a3b8] hover:bg-[#1e2a3a] gap-1"
                        onClick={() => resolveConflict(conflict.id, 'skip')}
                      >
                        <SkipForward className="h-3 w-3" />
                        Skip
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Data Categories */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-[#8b5cf6]" />
                Sync Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between bg-[#0f1923] rounded-lg p-2.5 cursor-pointer hover:bg-[#1e2a3a]/50 transition-colors"
                  onClick={() => toggleCategory(cat.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cat.enabled ? 'text-[#00d4ff]' : 'text-[#475569]'}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className={`text-xs font-medium ${cat.enabled ? 'text-[#e2e8f0]' : 'text-[#64748b]'}`}>
                        {cat.name}
                      </div>
                      <div className="text-[9px] text-[#475569]">{cat.size}</div>
                    </div>
                  </div>
                  <div
                    className={`h-5 w-9 rounded-full transition-all flex items-center ${
                      cat.enabled ? 'bg-[#00d4ff]/30 justify-end' : 'bg-[#1e2a3a] justify-start'
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-full mx-0.5 transition-all ${
                        cat.enabled ? 'bg-[#00d4ff]' : 'bg-[#475569]'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sync Schedule */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#f59e0b]" />
                Sync Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {(['realtime', 'hourly', 'daily', 'manual'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSchedule(s)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-medium transition-all capitalize ${
                      schedule === s
                        ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                        : 'bg-[#0f1923] text-[#64748b] border border-[#1e2a3a] hover:text-[#94a3b8]'
                    }`}
                  >
                    {s === 'realtime' ? 'Real-time' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Storage Quota */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-[#10b981]" />
                Storage Quota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative h-4 bg-[#1e2a3a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#10b981]"
                  style={{ width: `${(storageUsed / storageTotal) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#e2e8f0]">
                  {storageUsed} GB / {storageTotal} GB ({Math.round((storageUsed / storageTotal) * 100)}%)
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Diagnostics', size: '1.2 GB', color: '#00d4ff' },
                  { label: 'Tuning Profiles', size: '0.6 GB', color: '#8b5cf6' },
                  { label: 'Reports', size: '0.4 GB', color: '#f59e0b' },
                  { label: 'Backups', size: '0.2 GB', color: '#10b981' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[#94a3b8]">{item.label}</span>
                    </div>
                    <span className="text-[#64748b]">{item.size}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Backup Management */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#00d4ff]" />
                  Backups
                </CardTitle>
                <Button
                  size="sm"
                  className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Create
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-56 overflow-y-auto">
              {backupList.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between bg-[#0f1923] rounded-lg p-2.5">
                  <div>
                    <div className="text-[11px] text-[#e2e8f0] font-medium">{backup.vehicle}</div>
                    <div className="flex items-center gap-2 text-[9px] text-[#475569]">
                      <span>{backup.date}</span>
                      <span>•</span>
                      <span>{backup.size}</span>
                      <Badge
                        className={`text-[8px] border ${
                          backup.type === 'auto'
                            ? 'bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30'
                            : 'bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30'
                        }`}
                      >
                        {backup.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-[#64748b] hover:text-[#10b981]"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-[#64748b] hover:text-[#ef4444]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
