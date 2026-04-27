'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Users,
  Car,
  Activity,
  Server,
  Database,
  Key,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  ChevronRight,
  BarChart3,
  Zap,
  Lock,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'

type UserRole = 'Admin' | 'Technician' | 'Viewer'
type UserStatus = 'Active' | 'Inactive' | 'Suspended'

interface User {
  id: string
  username: string
  email: string
  role: UserRole
  lastLogin: string
  status: UserStatus
  sessions: number
}

const users: User[] = [
  { id: 'U1', username: 'admin', email: 'admin@ecumaster.de', role: 'Admin', lastLogin: '5 min ago', status: 'Active', sessions: 3 },
  { id: 'U2', username: 'lukas.braun', email: 'lukas@ecumaster.de', role: 'Technician', lastLogin: '1h ago', status: 'Active', sessions: 1 },
  { id: 'U3', username: 'peter.fischer', email: 'peter@ecumaster.de', role: 'Technician', lastLogin: '2h ago', status: 'Active', sessions: 1 },
  { id: 'U4', username: 'maria.hoffmann', email: 'maria@ecumaster.de', role: 'Technician', lastLogin: '3h ago', status: 'Active', sessions: 1 },
  { id: 'U5', username: 'viewer.demo', email: 'demo@ecumaster.de', role: 'Viewer', lastLogin: '1 day ago', status: 'Active', sessions: 0 },
  { id: 'U6', username: 'old.tech', email: 'oldtech@ecumaster.de', role: 'Technician', lastLogin: '30 days ago', status: 'Inactive', sessions: 0 },
  { id: 'U7', username: 'suspended.user', email: 'suspended@ecumaster.de', role: 'Viewer', lastLogin: '7 days ago', status: 'Suspended', sessions: 0 },
]

const permissions: { feature: string; admin: boolean; technician: boolean; viewer: boolean }[] = [
  { feature: 'View Dashboard', admin: true, technician: true, viewer: true },
  { feature: 'Run Diagnostics', admin: true, technician: true, viewer: false },
  { feature: 'ECU Flash/Programming', admin: true, technician: true, viewer: false },
  { feature: 'AI Predictions', admin: true, technician: true, viewer: true },
  { feature: 'Manage Vehicles', admin: true, technician: true, viewer: false },
  { feature: 'Manage Users', admin: true, technician: false, viewer: false },
  { feature: 'System Configuration', admin: true, technician: false, viewer: false },
  { feature: 'View Reports', admin: true, technician: true, viewer: true },
  { feature: 'Export Data', admin: true, technician: false, viewer: false },
  { feature: 'API Access', admin: true, technician: false, viewer: false },
  { feature: 'Workshop Management', admin: true, technician: true, viewer: false },
  { feature: 'License Management', admin: true, technician: false, viewer: false },
]

type LogSeverity = 'info' | 'warning' | 'error' | 'critical'

interface LogEntry {
  id: string
  timestamp: string
  severity: LogSeverity
  description: string
  source: string
}

const systemLogs: LogEntry[] = [
  { id: 'L1', timestamp: '2026-03-04 14:23:01', severity: 'info', description: 'User lukas.braun logged in from 192.168.1.45', source: 'Auth' },
  { id: 'L2', timestamp: '2026-03-04 14:18:33', severity: 'warning', description: 'Database query performance degraded (>500ms)', source: 'Database' },
  { id: 'L3', timestamp: '2026-03-04 13:55:12', severity: 'error', description: 'VAS 6154+ device connection timeout for unit #2', source: 'Hardware' },
  { id: 'L4', timestamp: '2026-03-04 13:42:08', severity: 'info', description: 'Diagnostic session completed for VW Golf GTI (J-1001)', source: 'Diagnostics' },
  { id: 'L5', timestamp: '2026-03-04 12:30:45', severity: 'critical', description: 'API rate limit exceeded for endpoint /api/vehicles', source: 'API Gateway' },
  { id: 'L6', timestamp: '2026-03-04 11:15:22', severity: 'info', description: 'System backup completed successfully', source: 'System' },
  { id: 'L7', timestamp: '2026-03-04 10:02:11', severity: 'warning', description: 'Disk usage at 78% - consider cleanup', source: 'System' },
  { id: 'L8', timestamp: '2026-03-04 09:30:00', severity: 'info', description: 'Scheduled maintenance mode deactivated', source: 'System' },
]

const apiEndpoints = [
  { endpoint: '/api/vehicles', calls: 12450, avgTime: '45ms', status: 'healthy' },
  { endpoint: '/api/dtc-codes', calls: 8932, avgTime: '32ms', status: 'healthy' },
  { endpoint: '/api/diagnostics', calls: 6721, avgTime: '128ms', status: 'degraded' },
  { endpoint: '/api/service-records', calls: 3456, avgTime: '67ms', status: 'healthy' },
  { endpoint: '/api/flash', calls: 892, avgTime: '2400ms', status: 'healthy' },
  { endpoint: '/api/auth', calls: 15678, avgTime: '15ms', status: 'healthy' },
]

const auditTrail = [
  { action: 'User maria.hoffmann role changed to Technician', by: 'admin', time: '2h ago' },
  { action: 'Maintenance mode activated', by: 'admin', time: '8h ago' },
  { action: 'New user old.tech created', by: 'admin', time: '1 day ago' },
  { action: 'API rate limit updated to 1000/min', by: 'admin', time: '2 days ago' },
  { action: '2FA requirement enabled', by: 'admin', time: '3 days ago' },
  { action: 'System backup initiated', by: 'system', time: '1 week ago' },
]

const severityConfig: Record<LogSeverity, { color: string; icon: typeof CheckCircle2 }> = {
  info: { color: '#00d4ff', icon: CheckCircle2 },
  warning: { color: '#f59e0b', icon: AlertTriangle },
  error: { color: '#ef4444', icon: XCircle },
  critical: { color: '#ef4444', icon: XCircle },
}

const statusConfig: Record<UserStatus, { color: string }> = {
  Active: { color: '#10b981' },
  Inactive: { color: '#475569' },
  Suspended: { color: '#ef4444' },
}

const roleConfig: Record<UserRole, { color: string }> = {
  Admin: { color: '#8b5cf6' },
  Technician: { color: '#00d4ff' },
  Viewer: { color: '#64748b' },
}

export function AdminView() {
  const [activeSection, setActiveSection] = useState<'users' | 'permissions' | 'logs' | 'system'>('users')
  const [searchUsers, setSearchUsers] = useState('')
  const [configToggles, setConfigToggles] = useState({
    maintenanceMode: false,
    registrationOpen: true,
    twoFactorRequired: true,
    autoBackup: true,
    debugMode: false,
    rateLimitEnabled: true,
  })

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const toggleConfig = (key: keyof typeof configToggles) => {
    setConfigToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Admin Panel</h1>
          </div>
          <p className="text-xs text-[#64748b]">System administration and user management</p>
        </div>
        <Button size="sm" className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> Add User
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Users', value: users.filter(u => u.status === 'Active').length, icon: Users, color: '#00d4ff' },
          { label: 'Total Vehicles', value: 24, icon: Car, color: '#10b981' },
          { label: 'Sessions Today', value: 18, icon: Activity, color: '#8b5cf6' },
          { label: 'System Health', value: '98.5%', icon: Server, color: '#10b981' },
        ].map((metric, i) => {
          const Icon = metric.icon
          return (
            <Card key={i} className="bg-[#151d2b] border-[#1e2a3a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#475569]">{metric.label}</span>
                  <Icon className="h-4 w-4" style={{ color: metric.color }} />
                </div>
                <div className="text-xl font-bold text-[#e2e8f0]">{metric.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-[#1e2a3a]">
        {([
          { id: 'users' as const, label: 'Users', icon: Users },
          { id: 'permissions' as const, label: 'Permissions', icon: Lock },
          { id: 'logs' as const, label: 'Logs', icon: Activity },
          { id: 'system' as const, label: 'System', icon: Settings },
        ]).map(tab => {
          const Icon = tab.icon
          return (
            <Button key={tab.id} size="sm" variant="ghost"
              onClick={() => setActiveSection(tab.id)}
              className={`shrink-0 gap-1.5 text-xs h-8 ${activeSection === tab.id ? 'text-[#00d4ff] bg-[#00d4ff]/10 rounded-b-none border-b-2 border-[#00d4ff]' : 'text-[#64748b] hover:text-[#e2e8f0]'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#00d4ff]/50"
              />
            </div>
          </div>
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2a3a]">
                      <th className="text-left text-[10px] text-[#475569] font-medium p-3">Username</th>
                      <th className="text-left text-[10px] text-[#475569] font-medium p-3">Email</th>
                      <th className="text-left text-[10px] text-[#475569] font-medium p-3">Role</th>
                      <th className="text-left text-[10px] text-[#475569] font-medium p-3">Last Login</th>
                      <th className="text-left text-[10px] text-[#475569] font-medium p-3">Status</th>
                      <th className="text-left text-[10px] text-[#475569] font-medium p-3">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-[#1e2a3a] hover:bg-[#1e2a3a]/30 transition-colors">
                        <td className="p-3 text-xs text-[#e2e8f0] font-medium">{user.username}</td>
                        <td className="p-3 text-xs text-[#94a3b8]">{user.email}</td>
                        <td className="p-3">
                          <Badge className="text-[10px] border-0" style={{ color: roleConfig[user.role].color, backgroundColor: `${roleConfig[user.role].color}20` }}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-3 text-[10px] text-[#475569]">{user.lastLogin}</td>
                        <td className="p-3">
                          <Badge className="text-[10px] border-0" style={{ color: statusConfig[user.status].color, backgroundColor: `${statusConfig[user.status].color}20` }}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-[#94a3b8]">{user.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permissions Section */}
      {activeSection === 'permissions' && (
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#8b5cf6]" />
              Role Permissions Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    <th className="text-left text-[10px] text-[#475569] font-medium p-3">Feature</th>
                    <th className="text-center text-[10px] text-[#475569] font-medium p-3">Admin</th>
                    <th className="text-center text-[10px] text-[#475569] font-medium p-3">Technician</th>
                    <th className="text-center text-[10px] text-[#475569] font-medium p-3">Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm, i) => (
                    <tr key={i} className="border-b border-[#1e2a3a] hover:bg-[#1e2a3a]/30 transition-colors">
                      <td className="p-3 text-xs text-[#e2e8f0]">{perm.feature}</td>
                      <td className="p-3 text-center">
                        {perm.admin ? <CheckCircle2 className="h-4 w-4 text-[#10b981] mx-auto" /> : <XCircle className="h-4 w-4 text-[#475569] mx-auto" />}
                      </td>
                      <td className="p-3 text-center">
                        {perm.technician ? <CheckCircle2 className="h-4 w-4 text-[#10b981] mx-auto" /> : <XCircle className="h-4 w-4 text-[#475569] mx-auto" />}
                      </td>
                      <td className="p-3 text-center">
                        {perm.viewer ? <CheckCircle2 className="h-4 w-4 text-[#10b981] mx-auto" /> : <XCircle className="h-4 w-4 text-[#475569] mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Section */}
      {activeSection === 'logs' && (
        <div className="space-y-4">
          {/* System Logs */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00d4ff]" />
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {systemLogs.map(log => {
                  const config = severityConfig[log.severity]
                  const Icon = config.icon
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                      <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: config.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className="text-[8px] border-0 h-4" style={{ color: config.color, backgroundColor: `${config.color}20` }}>
                            {log.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-[8px] h-4 bg-[#151d2b] border-[#1e2a3a] text-[#475569]">{log.source}</Badge>
                        </div>
                        <p className="text-[11px] text-[#94a3b8]">{log.description}</p>
                      </div>
                      <span className="text-[9px] text-[#475569] shrink-0 font-mono">{log.timestamp}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#8b5cf6]" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditTrail.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                      <span className="text-[11px] text-[#94a3b8]">{entry.action}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] h-4 bg-[#151d2b] border-[#1e2a3a] text-[#64748b]">{entry.by}</Badge>
                      <span className="text-[9px] text-[#475569]">{entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Section */}
      {activeSection === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Database Status */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Database className="h-4 w-4 text-[#10b981]" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Database Size', value: '2.4 GB', progress: 48 },
                  { label: 'Active Connections', value: '12 / 50', progress: 24 },
                  { label: 'Query Performance', value: '45ms avg', progress: 15 },
                  { label: 'Cache Hit Rate', value: '94.2%', progress: 94 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[#94a3b8]">{item.label}</span>
                      <span className="text-[11px] text-[#e2e8f0] font-medium">{item.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0f1923] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.progress}%`,
                          backgroundColor: item.progress > 80 ? '#10b981' : item.progress > 50 ? '#f59e0b' : '#00d4ff',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API Usage */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#f59e0b]" />
                API Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {apiEndpoints.map((ep, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                    <div>
                      <div className="text-[11px] text-[#00d4ff] font-mono">{ep.endpoint}</div>
                      <div className="text-[9px] text-[#475569]">{ep.calls.toLocaleString()} calls • {ep.avgTime} avg</div>
                    </div>
                    <Badge className={`text-[9px] border-0 ${ep.status === 'healthy' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
                      {ep.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="bg-[#151d2b] border-[#1e2a3a] lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#64748b]" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.entries(configToggles) as [keyof typeof configToggles, boolean][]).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                    <div>
                      <div className="text-xs text-[#e2e8f0] font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      </div>
                      <div className="text-[9px] text-[#475569]">
                        {key === 'maintenanceMode' ? 'Block user access during updates' :
                         key === 'registrationOpen' ? 'Allow new user registration' :
                         key === 'twoFactorRequired' ? 'Require 2FA for all users' :
                         key === 'autoBackup' ? 'Automatic daily database backup' :
                         key === 'debugMode' ? 'Enable verbose logging' :
                         'Rate limit API requests'}
                      </div>
                    </div>
                    <button onClick={() => toggleConfig(key)} className="shrink-0 ml-3">
                      {value ? (
                        <ToggleRight className="h-7 w-7 text-[#10b981]" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-[#475569]" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
