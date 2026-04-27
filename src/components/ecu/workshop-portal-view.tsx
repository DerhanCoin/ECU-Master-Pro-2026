'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Globe,
  Calendar,
  Clock,
  Star,
  Bell,
  Settings,
  TrendingUp,
  Users,
  Car,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Phone,
  Mail,
  ChevronRight,
  Plus,
  BarChart3,
  Wifi,
  WifiOff,
  DollarSign,
} from 'lucide-react'
import { useState } from 'react'

const appointments = [
  { id: 1, time: '09:00', customer: 'Marcus Weber', vehicle: 'VW Golf GTI 2024', service: 'Full Diagnostic Scan', status: 'confirmed', duration: '1.5h' },
  { id: 2, time: '10:30', customer: 'Anna Schmidt', vehicle: 'BMW 330e 2023', service: 'Hybrid Health Check', status: 'confirmed', duration: '2h' },
  { id: 3, time: '11:00', customer: 'Thomas Mueller', vehicle: 'Audi A4 2025', service: 'Oil Change & Inspection', status: 'pending', duration: '45m' },
  { id: 4, time: '13:00', customer: 'Sophie Klein', vehicle: 'Mercedes C300 2024', service: 'ADAS Calibration', status: 'confirmed', duration: '2h' },
  { id: 5, time: '14:30', customer: 'Jan Novak', vehicle: 'Skoda Octavia 2023', service: 'Brake Service', status: 'pending', duration: '1.5h' },
  { id: 6, time: '16:00', customer: 'Elena Petrova', vehicle: 'VW Tiguan 2024', service: 'Full Inspection', status: 'cancelled', duration: '2h' },
]

const serviceCatalog = [
  { name: 'Full Diagnostic Scan', description: 'Complete OBD-II scan with DTC analysis and health report', price: 89, duration: '1.5h', popular: true },
  { name: 'ECU Diagnostics', description: 'Advanced ECU reading, fault codes, and module status', price: 129, duration: '2h', popular: true },
  { name: 'Oil Change & Inspection', description: 'Synthetic oil change with multi-point inspection', price: 120, duration: '45m', popular: false },
  { name: 'Brake Service', description: 'Brake pad/rotor inspection, replacement, and fluid flush', price: 199, duration: '1.5h', popular: false },
  { name: 'ADAS Calibration', description: 'Camera and sensor calibration for advanced driver assist', price: 249, duration: '2h', popular: true },
  { name: 'Hybrid/EV Health Check', description: 'Battery analysis, inverter check, and HV system diagnostic', price: 179, duration: '2h', popular: false },
  { name: 'Transmission Service', description: 'DSG/auto transmission fluid and filter replacement', price: 299, duration: '3h', popular: false },
  { name: 'Pre-Purchase Inspection', description: 'Comprehensive vehicle inspection before purchase', price: 159, duration: '2h', popular: true },
]

const reviews = [
  { customer: 'Marcus W.', rating: 5, text: 'Excellent diagnostic work. Found an issue that two other shops missed. Very professional!', date: '2 days ago', vehicle: 'VW Golf GTI' },
  { customer: 'Anna S.', rating: 4, text: 'Great service for my hybrid. Clear explanation of battery health. Would recommend.', date: '5 days ago', vehicle: 'BMW 330e' },
  { customer: 'Thomas M.', rating: 5, text: 'Quick and efficient oil change. The digital report was a nice touch.', date: '1 week ago', vehicle: 'Audi A4' },
  { customer: 'Sophie K.', rating: 5, text: 'ADAS calibration done perfectly. Lane assist works flawlessly now.', date: '2 weeks ago', vehicle: 'Mercedes C300' },
]

const notifications = [
  { type: 'appointment', message: 'Appointment confirmed for Marcus Weber - tomorrow 09:00', time: '5m ago', color: '#10b981' },
  { type: 'ready', message: 'Vehicle ready: BMW 330e - Anna Schmidt', time: '1h ago', color: '#00d4ff' },
  { type: 'review', message: 'New 5-star review from Marcus W.', time: '2h ago', color: '#f59e0b' },
  { type: 'reminder', message: 'Parts arrived for Brake Service - Jan Novak', time: '3h ago', color: '#8b5cf6' },
  { type: 'cancel', message: 'Appointment cancelled: Elena Petrova - Full Inspection', time: '4h ago', color: '#ef4444' },
]

const weeklyBookings = [
  { week: 'W1', count: 24 },
  { week: 'W2', count: 31 },
  { week: 'W3', count: 28 },
  { week: 'W4', count: 35 },
  { week: 'W5', count: 42 },
  { week: 'W6', count: 38 },
]

export function WorkshopPortalView() {
  const [activeSection, setActiveSection] = useState<'appointments' | 'services' | 'reviews' | 'analytics'>('appointments')
  const [portalOnline, setPortalOnline] = useState(true)
  const [bookingForm, setBookingForm] = useState({ name: '', vehicle: '', service: '', date: '', time: '' })
  const [showBookingForm, setShowBookingForm] = useState(false)

  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length
  const pendingAppointments = appointments.filter(a => a.status === 'pending').length
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Workshop Portal</h1>
            <Badge className={`${portalOnline ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'} text-[10px] gap-1`}>
              {portalOnline ? <><span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" /> Online</> : <><WifiOff className="h-3 w-3" /> Offline</>}
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">Customer-facing portal and booking management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPortalOnline(!portalOnline)}
            className={`h-8 text-xs gap-1.5 ${portalOnline ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
            {portalOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {portalOnline ? 'Portal Live' : 'Portal Down'}
          </Button>
          <Button size="sm" className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Configure
          </Button>
        </div>
      </div>

      {/* Portal Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Portal Status', value: portalOnline ? 'Online' : 'Offline', icon: Globe, color: portalOnline ? '#10b981' : '#ef4444' },
          { label: 'Active Customers', value: '12', icon: Users, color: '#00d4ff' },
          { label: 'Pending Appointments', value: pendingAppointments, icon: Calendar, color: '#f59e0b' },
          { label: 'Average Rating', value: `${avgRating}★`, icon: Star, color: '#8b5cf6' },
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
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { id: 'appointments' as const, label: 'Appointments', icon: Calendar },
          { id: 'services' as const, label: 'Services', icon: DollarSign },
          { id: 'reviews' as const, label: 'Reviews', icon: Star },
          { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
        ]).map(tab => {
          const Icon = tab.icon
          return (
            <Button key={tab.id} size="sm" variant="ghost"
              onClick={() => setActiveSection(tab.id)}
              className={`shrink-0 gap-1.5 text-xs h-8 ${activeSection === tab.id ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30' : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Appointments Section */}
      {activeSection === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Today&apos;s Appointments</h2>
            <Button size="sm" onClick={() => setShowBookingForm(!showBookingForm)}
              className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1">
              <Plus className="h-3 w-3" /> New Booking
            </Button>
          </div>

          {/* Booking Form */}
          {showBookingForm && (
            <Card className="bg-[#151d2b] border-[#00d4ff]/30">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-xs font-semibold text-[#e2e8f0]">Online Booking Form</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#475569] mb-1 block">Customer Name</label>
                    <input type="text" value={bookingForm.name} onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })} placeholder="Full name"
                      className="w-full h-8 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#00d4ff]/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#475569] mb-1 block">Vehicle</label>
                    <input type="text" value={bookingForm.vehicle} onChange={e => setBookingForm({ ...bookingForm, vehicle: e.target.value })} placeholder="Year, Make, Model"
                      className="w-full h-8 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#00d4ff]/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#475569] mb-1 block">Service</label>
                    <select value={bookingForm.service} onChange={e => setBookingForm({ ...bookingForm, service: e.target.value })}
                      className="w-full h-8 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] focus:outline-none focus:border-[#00d4ff]/50">
                      <option value="">Select service...</option>
                      {serviceCatalog.map(s => <option key={s.name} value={s.name}>{s.name} - ${s.price}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-[#475569] mb-1 block">Date</label>
                      <input type="date" value={bookingForm.date} onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                        className="w-full h-8 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] focus:outline-none focus:border-[#00d4ff]/50" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-[#475569] mb-1 block">Time</label>
                      <input type="time" value={bookingForm.time} onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })}
                        className="w-full h-8 px-3 rounded-md bg-[#0f1923] border border-[#1e2a3a] text-xs text-[#e2e8f0] focus:outline-none focus:border-[#00d4ff]/50" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowBookingForm(false)} className="h-7 text-[10px] bg-[#0f1923] border-[#1e2a3a] text-[#64748b]">Cancel</Button>
                  <Button size="sm" className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold">Confirm Booking</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment List */}
          <div className="space-y-2">
            {appointments.map(apt => {
              const statusColors: Record<string, string> = {
                confirmed: '#10b981',
                pending: '#f59e0b',
                cancelled: '#ef4444',
              }
              const color = statusColors[apt.status] || '#64748b'
              return (
                <Card key={apt.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/20 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0f1923] border border-[#1e2a3a] flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-[#00d4ff]">{apt.time}</span>
                          <span className="text-[8px] text-[#475569]">{apt.duration}</span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#e2e8f0]">{apt.customer}</div>
                          <div className="text-[10px] text-[#475569]">{apt.vehicle} • {apt.service}</div>
                        </div>
                      </div>
                      <Badge className="text-[10px] border-0" style={{ color, backgroundColor: `${color}20` }}>
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Services Section */}
      {activeSection === 'services' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Service Catalog</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {serviceCatalog.map((service, i) => (
              <Card key={i} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#e2e8f0]">{service.name}</h3>
                        {service.popular && <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[9px]">Popular</Badge>}
                      </div>
                      <p className="text-[11px] text-[#64748b] mt-1">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[#00d4ff]">${service.price}</span>
                      <span className="text-[10px] text-[#475569] flex items-center gap-1"><Clock className="h-3 w-3" />{service.duration}</span>
                    </div>
                    <Button size="sm" className="h-7 text-[10px] bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold">Book Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {activeSection === 'reviews' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Customer Reviews</h2>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-[#f59e0b] fill-[#f59e0b]" />
              <span className="text-sm font-bold text-[#f59e0b]">{avgRating}</span>
              <span className="text-[10px] text-[#475569]">({reviews.length} reviews)</span>
            </div>
          </div>
          <div className="space-y-2">
            {reviews.map((review, i) => (
              <Card key={i} className="bg-[#151d2b] border-[#1e2a3a]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#e2e8f0]">{review.customer}</span>
                        <Badge variant="outline" className="text-[9px] h-4 bg-[#0f1923] border-[#1e2a3a] text-[#64748b]">{review.vehicle}</Badge>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`h-3 w-3 ${j < review.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#1e2a3a]'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#475569]">{review.date}</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">{review.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {activeSection === 'analytics' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Portal Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bookings per week */}
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#10b981]" />
                  Bookings Per Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-28">
                  {weeklyBookings.map((w, i) => {
                    const maxVal = Math.max(...weeklyBookings.map(b => b.count))
                    const height = (w.count / maxVal) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[9px] text-[#475569]">{w.count}</div>
                        <div className="w-full bg-[#0f1923] rounded-sm relative" style={{ height: '70px' }}>
                          <div className="absolute bottom-0 w-full rounded-sm transition-all" style={{ height: `${height}%`, backgroundColor: i === weeklyBookings.length - 1 ? '#00d4ff' : '#1e2a3a' }} />
                        </div>
                        <div className="text-[9px] text-[#475569]">{w.week}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Popular Services */}
            <Card className="bg-[#151d2b] border-[#1e2a3a]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#8b5cf6]" />
                  Popular Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceCatalog.filter(s => s.popular).map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                      <span className="text-xs text-[#e2e8f0]">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#00d4ff]">${s.price}</span>
                        <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[9px]">Popular</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Notification Center */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#f59e0b]" />
            Notification Center
            <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[10px]">{notifications.length} new</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notifications.map((notif, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: notif.color }} />
                <span className="text-[11px] text-[#94a3b8] flex-1">{notif.message}</span>
                <span className="text-[9px] text-[#475569] shrink-0">{notif.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portal Customization */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#64748b]" />
            Portal Customization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
              <div className="text-[10px] text-[#475569] mb-1">Business Hours</div>
              <div className="text-xs text-[#e2e8f0] font-medium">Mon-Fri: 08:00 - 18:00</div>
              <div className="text-xs text-[#94a3b8]">Sat: 09:00 - 14:00</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
              <div className="text-[10px] text-[#475569] mb-1">Contact</div>
              <div className="text-xs text-[#e2e8f0] font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> +49 30 123456</div>
              <div className="text-xs text-[#94a3b8] flex items-center gap-1"><Mail className="h-3 w-3" /> info@ecumaster.de</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
              <div className="text-[10px] text-[#475569] mb-1">Services Offered</div>
              <div className="text-xs text-[#e2e8f0] font-medium">{serviceCatalog.length} services</div>
              <div className="text-xs text-[#94a3b8]">Starting from ${Math.min(...serviceCatalog.map(s => s.price))}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
