'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Settings,
  Globe,
  Palette,
  Shield,
  Wifi,
  Database,
  Bell,
  Info,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Monitor,
  Moon,
  Sun,
  CheckCircle2,
  Download,
  HardDrive,
  Cpu,
} from 'lucide-react'

interface SettingSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function SettingSection({ title, icon, children, defaultOpen = true }: SettingSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#1e2a3a]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-[#e2e8f0]">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 text-[#64748b]" /> : <ChevronRight className="h-4 w-4 text-[#64748b]" />}
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-4 border-t border-[#1e2a3a]">{children}</div>}
    </div>
  )
}

interface ToggleProps {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}

function Toggle({ label, description, enabled, onToggle }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-[#e2e8f0]">{label}</div>
        <div className="text-[10px] text-[#64748b]">{description}</div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          enabled ? 'bg-[#00d4ff]' : 'bg-[#1e2a3a]'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectSettingProps {
  label: string
  description: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

function SelectSetting({ label, description, value, options, onChange }: SelectSettingProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-[#e2e8f0]">{label}</div>
        <div className="text-[10px] text-[#64748b]">{description}</div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#0f1923] border border-[#1e2a3a] rounded-md px-2 py-1 text-xs text-[#e2e8f0] outline-none focus:border-[#00d4ff] transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export function SettingsView() {
  const [settings, setSettings] = useState({
    language: 'English',
    theme: 'dark',
    autoConnect: true,
    notifications: true,
    soundAlerts: false,
    dataLogging: true,
    logLevel: 'info',
    refreshRate: '500',
    connectionTimeout: '30',
    retryAttempts: '3',
    autoScan: false,
    debugMode: false,
    telemetry: true,
    encryption: true,
  })

  const [saveSuccess, setSaveSuccess] = useState(false)

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const handleReset = () => {
    setSettings({
      language: 'English',
      theme: 'dark',
      autoConnect: true,
      notifications: true,
      soundAlerts: false,
      dataLogging: true,
      logLevel: 'info',
      refreshRate: '500',
      connectionTimeout: '30',
      retryAttempts: '3',
      autoScan: false,
      debugMode: false,
      telemetry: true,
      encryption: true,
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-5 w-5 text-[#00d4ff]" />
              <h1 className="text-xl font-bold text-[#e2e8f0]">Settings</h1>
            </div>
            <p className="text-xs text-[#64748b]">
              Application preferences and configuration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs border-[#1e2a3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55] gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        {/* General Settings */}
        <SettingSection title="General" icon={<Settings className="h-4 w-4 text-[#00d4ff]" />}>
          <SelectSetting
            label="Language"
            description="Application display language"
            value={settings.language}
            options={[
              { value: 'English', label: 'English' },
              { value: 'Deutsch', label: 'Deutsch' },
              { value: 'Srpski', label: 'Srpski' },
              { value: 'Français', label: 'Français' },
            ]}
            onChange={(v) => updateSetting('language', v)}
          />
          <SelectSetting
            label="Theme"
            description="Application color theme"
            value={settings.theme}
            options={[
              { value: 'dark', label: '🌙 Dark (Default)' },
              { value: 'light', label: '☀️ Light' },
              { value: 'system', label: '💻 System' },
            ]}
            onChange={(v) => updateSetting('theme', v)}
          />
          <Toggle
            label="Auto Connect on Startup"
            description="Automatically connect to last used device"
            enabled={settings.autoConnect}
            onToggle={() => updateSetting('autoConnect', !settings.autoConnect)}
          />
          <Toggle
            label="Auto Scan on Connect"
            description="Run full vehicle scan when device connects"
            enabled={settings.autoScan}
            onToggle={() => updateSetting('autoScan', !settings.autoScan)}
          />
        </SettingSection>

        {/* Connection Settings */}
        <SettingSection title="Connection" icon={<Wifi className="h-4 w-4 text-[#10b981]" />}>
          <SelectSetting
            label="Refresh Rate"
            description="Data stream update interval"
            value={settings.refreshRate}
            options={[
              { value: '100', label: '100ms (Fast)' },
              { value: '250', label: '250ms (Normal)' },
              { value: '500', label: '500ms (Default)' },
              { value: '1000', label: '1000ms (Slow)' },
            ]}
            onChange={(v) => updateSetting('refreshRate', v)}
          />
          <SelectSetting
            label="Connection Timeout"
            description="Seconds before connection attempt fails"
            value={settings.connectionTimeout}
            options={[
              { value: '10', label: '10 seconds' },
              { value: '30', label: '30 seconds (Default)' },
              { value: '60', label: '60 seconds' },
            ]}
            onChange={(v) => updateSetting('connectionTimeout', v)}
          />
          <SelectSetting
            label="Retry Attempts"
            description="Number of connection retry attempts"
            value={settings.retryAttempts}
            options={[
              { value: '1', label: '1 attempt' },
              { value: '3', label: '3 attempts (Default)' },
              { value: '5', label: '5 attempts' },
            ]}
            onChange={(v) => updateSetting('retryAttempts', v)}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications" icon={<Bell className="h-4 w-4 text-[#f59e0b]" />}>
          <Toggle
            label="Push Notifications"
            description="Receive alerts for DTCs and warnings"
            enabled={settings.notifications}
            onToggle={() => updateSetting('notifications', !settings.notifications)}
          />
          <Toggle
            label="Sound Alerts"
            description="Play sound on critical alerts"
            enabled={settings.soundAlerts}
            onToggle={() => updateSetting('soundAlerts', !settings.soundAlerts)}
          />
          <Toggle
            label="Telemetry Sharing"
            description="Share anonymous usage data for improvements"
            enabled={settings.telemetry}
            onToggle={() => updateSetting('telemetry', !settings.telemetry)}
          />
        </SettingSection>

        {/* Data & Logging */}
        <SettingSection title="Data & Logging" icon={<Database className="h-4 w-4 text-[#8b5cf6]" />}>
          <Toggle
            label="Data Logging"
            description="Record all diagnostic sessions to local database"
            enabled={settings.dataLogging}
            onToggle={() => updateSetting('dataLogging', !settings.dataLogging)}
          />
          <SelectSetting
            label="Log Level"
            description="Minimum severity level for logging"
            value={settings.logLevel}
            options={[
              { value: 'debug', label: 'Debug (Verbose)' },
              { value: 'info', label: 'Info (Default)' },
              { value: 'warn', label: 'Warning' },
              { value: 'error', label: 'Error Only' },
            ]}
            onChange={(v) => updateSetting('logLevel', v)}
          />
          <Toggle
            label="Debug Mode"
            description="Enable detailed diagnostic output (may affect performance)"
            enabled={settings.debugMode}
            onToggle={() => updateSetting('debugMode', !settings.debugMode)}
          />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-[#e2e8f0]">Storage Used</div>
              <div className="text-[10px] text-[#64748b]">Local database size</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-[#00d4ff]">247 MB</div>
              <button className="text-[9px] text-[#ef4444] hover:underline">Clear Data</button>
            </div>
          </div>
        </SettingSection>

        {/* Security */}
        <SettingSection title="Security" icon={<Shield className="h-4 w-4 text-[#10b981]" />} defaultOpen={false}>
          <Toggle
            label="End-to-End Encryption"
            description="Encrypt all communication with connected devices"
            enabled={settings.encryption}
            onToggle={() => updateSetting('encryption', !settings.encryption)}
          />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-[#e2e8f0]">Security Level</div>
              <div className="text-[10px] text-[#64748b]">Current authentication level</div>
            </div>
            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">
              Level 1 (Basic)
            </Badge>
          </div>
          <div className="p-3 bg-[#0f1923] rounded-lg border border-[#1e2a3a]">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span className="text-[11px] font-medium text-[#f59e0b]">OEM Access Required</span>
            </div>
            <p className="text-[10px] text-[#64748b]">
              Advanced security levels (2-3) require OEM credentials. Contact your distributor for access.
            </p>
          </div>
        </SettingSection>

        {/* About */}
        <SettingSection title="About" icon={<Info className="h-4 w-4 text-[#64748b]" />} defaultOpen={false}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#0f1923] rounded-lg border border-[#1e2a3a]">
              <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-[#00d4ff]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#00d4ff]">ECU Master Pro</div>
                <div className="text-[10px] text-[#64748b]">Version 2026.1.0 (Build 847)</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 bg-[#0f1923] rounded-lg">
                <div className="text-[#64748b]">License</div>
                <div className="text-[#e2e8f0] font-medium">Professional</div>
              </div>
              <div className="p-2 bg-[#0f1923] rounded-lg">
                <div className="text-[#64748b]">Expires</div>
                <div className="text-[#10b981] font-medium">Dec 2026</div>
              </div>
              <div className="p-2 bg-[#0f1923] rounded-lg">
                <div className="text-[#64748b]">AI Engine</div>
                <div className="text-[#8b5cf6] font-medium">Transformer-XL v3.2</div>
              </div>
              <div className="p-2 bg-[#0f1923] rounded-lg">
                <div className="text-[#64748b]">Vehicles</div>
                <div className="text-[#e2e8f0] font-medium">4 Connected</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55] transition-all">
                <Download className="h-3 w-3" />
                Check Updates
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0f1923] border border-[#1e2a3a] text-[11px] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d3f55] transition-all">
                <HardDrive className="h-3 w-3" />
                Export Data
              </button>
            </div>

            <div className="text-center text-[9px] text-[#475569]">
              © 2026 ECU Master Pro. All rights reserved.
            </div>
          </div>
        </SettingSection>
      </div>
    </div>
  )
}
