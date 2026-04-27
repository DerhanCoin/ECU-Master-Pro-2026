'use client'

import { useState } from 'react'
import { useAppStore, type Notification, type NotificationCategory } from '@/stores/app-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Wrench,
  Brain,
  Download,
  Wifi,
  CheckCheck,
  Bell,
  ExternalLink,
} from 'lucide-react'

const categoryConfig: Record<NotificationCategory, { icon: React.ElementType; color: string; bgColor: string; borderColor: string; label: string }> = {
  'dtc-alert': { icon: AlertTriangle, color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444', label: 'Alerts' },
  'maintenance': { icon: Wrench, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', borderColor: '#f59e0b', label: 'Maintenance' },
  'ai-prediction': { icon: Brain, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', borderColor: '#8b5cf6', label: 'AI' },
  'system-update': { icon: Download, color: '#00d4ff', bgColor: 'rgba(0,212,255,0.1)', borderColor: '#00d4ff', label: 'System' },
  'connection': { icon: Wifi, color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981', label: 'Connection' },
}

type FilterTab = 'all' | NotificationCategory

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'dtc-alert', label: 'Alerts' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'ai-prediction', label: 'AI' },
  { value: 'system-update', label: 'System' },
]

export function NotificationPanel() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const unreadCount = notifications.filter((n) => !n.read).length
  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.category === activeFilter)

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id)
    }
  }

  return (
    <div className="w-[380px] bg-[#151d2b] border border-[#1e2a3a] rounded-lg shadow-2xl shadow-black/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a3a] bg-[#0f1923]">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#00d4ff]" />
          <span className="text-sm font-semibold text-[#e2e8f0]">Notifications</span>
          {unreadCount > 0 && (
            <Badge className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold bg-[#ef4444] text-white border-0 rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-[#00d4ff] hover:text-[#00d4ff] hover:bg-[#1e2a3a] gap-1 px-2"
            onClick={markAllNotificationsRead}
          >
            <CheckCheck className="h-3 w-3" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1e2a3a] bg-[#0f1923]/50">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeFilter === tab.value
                ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1e2a3a] border border-transparent'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1 text-[10px] opacity-70">
                ({notifications.filter((n) => n.category === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <ScrollArea className="h-[380px]">
        <div className="py-1">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#475569]">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <span className="text-xs">No notifications in this category</span>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const config = categoryConfig[notification.category]
              const Icon = config.icon
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-[#1e2a3a]/60 group ${
                    !notification.read ? 'bg-[#1e2a3a]/30' : ''
                  }`}
                  style={{
                    borderLeft: !notification.read ? `3px solid ${config.borderColor}` : '3px solid transparent',
                  }}
                >
                  {/* Category Icon */}
                  <div
                    className="flex-shrink-0 mt-0.5 h-7 w-7 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-medium leading-tight ${!notification.read ? 'text-[#e2e8f0]' : 'text-[#94a3b8]'}`}>
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span
                          className="flex-shrink-0 h-2 w-2 rounded-full mt-1.5"
                          style={{ backgroundColor: config.color }}
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-0.5 leading-snug line-clamp-2">
                      {notification.description}
                    </p>
                    <span className="text-[10px] text-[#475569] mt-1 block">
                      {notification.timestamp}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-[#1e2a3a] bg-[#0f1923]/50 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-[11px] text-[#00d4ff] hover:text-[#00d4ff] hover:bg-[#1e2a3a] gap-1.5"
        >
          <ExternalLink className="h-3 w-3" />
          View All Notifications
        </Button>
      </div>
    </div>
  )
}
