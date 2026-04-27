'use client'

import { useAppStore } from '@/stores/app-store'
import { Search, Bell, Globe, Moon, User, Wifi, WifiOff, Menu, Command } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { VehicleSelector } from '@/components/ecu/vehicle-selector'
import { NotificationPanel } from '@/components/ecu/notification-panel'

export function TopNavbar() {
  const {
    isConnected,
    searchQuery,
    setSearchQuery,
    language,
    setLanguage,
    isConnectModalOpen,
    setConnectModalOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarMobileOpen,
    setSidebarMobileOpen,
    notifications,
    setCommandPaletteOpen,
  } = useAppStore()

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#0c1219] border-b border-[#1e2a3a] flex-shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a] md:hidden"
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-8 w-8 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-6 h-6 relative">
            <Image src="/ecu-logo.png" alt="ECU" fill className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#e2e8f0] leading-none">ECU Master Pro</span>
            <span className="text-[9px] text-[#475569] leading-none mt-0.5">Professional Multi-Brand OBD-II Diagnostic & Tuning Platform (2026)</span>
          </div>
        </div>

        {/* Vehicle Selector - only when connected */}
        {isConnected && (
          <div className="hidden md:flex items-center">
            <VehicleSelector />
          </div>
        )}
      </div>

      {/* Center - Search + Command Palette */}
      <div className="flex-1 max-w-lg mx-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#475569]" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 bg-[#151d2b] border-[#1e2a3a] text-[#e2e8f0] placeholder:text-[#475569] text-xs focus:border-[#00d4ff] focus:ring-[#00d4ff]/20"
          />
        </div>
        {/* Command Palette Trigger */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-[10px] text-[#475569] hover:text-[#94a3b8] hover:bg-[#1e2a3a] border border-[#1e2a3a] px-2 flex-shrink-0"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Command className="h-3 w-3" />
          <span className="hidden lg:inline">K</span>
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 gap-1.5 text-xs ${isConnected ? 'text-[#10b981]' : 'text-[#ef4444]'}`}
          onClick={() => {
            if (!isConnected) setConnectModalOpen(true)
          }}
        >
          {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          <span className="hidden md:inline">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </Button>

        {/* Notifications - Enhanced with NotificationPanel */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] p-0 flex items-center justify-center text-[9px] bg-[#ef4444] text-white border-0 rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-0 bg-transparent border-0 shadow-none">
            <NotificationPanel />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]">
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{language}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#151d2b] border-[#1e2a3a]">
            {['English', 'Deutsch', 'Srpski'].map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`text-xs focus:bg-[#1e2a3a] ${language === lang ? 'text-[#00d4ff]' : 'text-[#e2e8f0]'}`}
              >
                {lang}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]">
          <Moon className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]">
              <User className="h-3.5 w-3.5" />
              <span className="hidden md:inline">admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#151d2b] border-[#1e2a3a]">
            <DropdownMenuItem className="text-xs text-[#e2e8f0] focus:bg-[#1e2a3a]">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-[#e2e8f0] focus:bg-[#1e2a3a]">Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#1e2a3a]" />
            <DropdownMenuItem className="text-xs text-[#ef4444] focus:bg-[#1e2a3a]">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
