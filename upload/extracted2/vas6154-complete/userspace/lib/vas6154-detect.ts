/**
 * vas6154-detect.js
 * VAS 6154 Device Detection for ECU Master Pro (Node.js / Next.js)
 * DERHAN AutoMatrix Pro
 *
 * Pronalazi VAS 6154 dongle na Linuxu isti način kao
 * ODIS pronalazi VCI na Windowsu.
 *
 * Import u Next.js API rutama:
 *   import { VAS6154Detector } from '@/lib/vas6154-detect'
 *   const detector = new VAS6154Detector()
 *   const devices = await detector.findDevices()
 */

import net from 'net'
import fs from 'fs'
import path from 'path'
import { execSync, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const VAS6154_USB_VID   = '19b2'
const VAS6154_USB_PIDS  = new Set(['0003', '0008', '000c', '0009', '000a'])
const DAEMON_SOCK       = '/run/vas6154/status.sock'
const DEVICES_JSON      = '/run/vas6154/devices.json'
const SYSFS_CLASS       = '/sys/class/vas6154'
const DPDU_REGISTRY     = '/etc/dpdu/modules.xml'
const DPDU_LIB_PATHS    = [
  '/usr/local/lib/libdpdu_vas6154.so',
  '/usr/lib/libdpdu_vas6154.so',
  '/usr/lib/x86_64-linux-gnu/libdpdu_vas6154.so',
]

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export interface VAS6154Device {
  name:        string
  deviceNode:  string | null    // /dev/vas6154_0
  serial:      string
  fwVersion:   string
  hwVersion:   string
  canFd:       boolean
  usbVid:      string
  usbPid:      string
  usbBus?:     string
  usbAddress?: string
  mode:        'operational' | 'dfu' | 'bootloader' | 'unknown'
  source:      'sysfs' | 'usbfs' | 'daemon' | 'lsusb'
  available:   boolean
  warning?:    string
}

export interface VAS6154Status {
  deviceCount:   number
  devices:       VAS6154Device[]
  kernelModule:  boolean    // /sys/class/vas6154 exists
  dpduLibrary:   boolean    // libdpdu_vas6154.so installed
  dpduRegistry:  boolean    // /etc/dpdu/modules.xml exists
  daemonRunning: boolean
  timestamp:     string
}

// ─────────────────────────────────────────────────────────
// Helper: read sysfs attribute
// ─────────────────────────────────────────────────────────
function readSysfs(attrPath: string, fallback = ''): string {
  try {
    return fs.readFileSync(attrPath, 'utf8').trim()
  } catch {
    return fallback
  }
}

// ─────────────────────────────────────────────────────────
// Method 1: Daemon socket (fastest - if vas6154d running)
// ─────────────────────────────────────────────────────────
async function discoverViaDaemon(): Promise<VAS6154Device[] | null> {
  if (!fs.existsSync(DAEMON_SOCK)) return null

  return new Promise((resolve) => {
    const sock = net.createConnection(DAEMON_SOCK)
    const timeout = setTimeout(() => {
      sock.destroy()
      resolve(null)
    }, 2000)

    let buffer = Buffer.alloc(0)
    let msgLen: number | null = null

    sock.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk])

      // Read length-prefixed message (uint32 LE)
      if (msgLen === null && buffer.length >= 4) {
        msgLen = buffer.readUInt32LE(0)
        buffer = buffer.slice(4)
      }

      if (msgLen !== null && buffer.length >= msgLen) {
        clearTimeout(timeout)
        try {
          const msg = JSON.parse(buffer.slice(0, msgLen).toString('utf8'))
          const devices = (msg.devices || []).map(normalizeDevice)
          resolve(devices)
        } catch {
          resolve(null)
        }
        sock.destroy()
      }
    })

    sock.on('error', () => {
      clearTimeout(timeout)
      resolve(null)
    })
  })
}

// ─────────────────────────────────────────────────────────
// Method 2: JSON status file
// ─────────────────────────────────────────────────────────
function discoverViaJson(): VAS6154Device[] | null {
  try {
    const data = JSON.parse(fs.readFileSync(DEVICES_JSON, 'utf8'))
    // Check freshness (max 10 seconds old)
    const ts = new Date(data.timestamp).getTime()
    if (Date.now() - ts > 10000) return null
    return (data.devices || []).map(normalizeDevice)
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────
// Method 3: sysfs scan (kernel module loaded)
// ─────────────────────────────────────────────────────────
function discoverViaSysfs(): VAS6154Device[] {
  const devices: VAS6154Device[] = []

  if (!fs.existsSync(SYSFS_CLASS)) return devices

  try {
    const entries = fs.readdirSync(SYSFS_CLASS)
    for (const name of entries.sort()) {
      const sysPath  = path.join(SYSFS_CLASS, name)
      const devNode  = `/dev/${name}`
      const stat     = fs.statSync(sysPath)
      if (!stat.isDirectory()) continue

      devices.push({
        name,
        deviceNode: fs.existsSync(devNode) ? devNode : null,
        serial:     readSysfs(path.join(sysPath, 'serial'),     'UNKNOWN'),
        fwVersion:  readSysfs(path.join(sysPath, 'fw_version'), '?.?.?'),
        hwVersion:  readSysfs(path.join(sysPath, 'hw_version'), '?.?'),
        canFd:      readSysfs(path.join(sysPath, 'can_fd'), '0') === '1',
        usbVid:     VAS6154_USB_VID,
        usbPid:     '0008',
        mode:       'operational',
        source:     'sysfs',
        available:  fs.existsSync(devNode),
      })
    }
  } catch {
    // sysfs not available
  }

  return devices
}

// ─────────────────────────────────────────────────────────
// Method 4: /sys/bus/usb scan (fallback)
// ─────────────────────────────────────────────────────────
function discoverViaUsbfs(): VAS6154Device[] {
  const devices: VAS6154Device[] = []
  const usbRoot = '/sys/bus/usb/devices'

  if (!fs.existsSync(usbRoot)) return devices

  const modeMap: Record<string, VAS6154Device['mode']> = {
    '0003': 'operational',
    '0008': 'operational',
    '000c': 'operational',
    '0009': 'dfu',
    '000a': 'bootloader',
  }

  try {
    const entries = fs.readdirSync(usbRoot)
    for (const entry of entries) {
      const p       = path.join(usbRoot, entry)
      const vid     = readSysfs(path.join(p, 'idVendor'))
      const pid     = readSysfs(path.join(p, 'idProduct'))

      if (vid !== VAS6154_USB_VID) continue
      if (!VAS6154_USB_PIDS.has(pid)) continue

      const busNum = readSysfs(path.join(p, 'busnum'))
      const devNum = readSysfs(path.join(p, 'devnum'))

      devices.push({
        name:       `vas6154_usb_${busNum}_${devNum}`,
        deviceNode: null,
        serial:     readSysfs(path.join(p, 'serial'), 'UNKNOWN'),
        fwVersion:  '?.?.?',
        hwVersion:  '?.?',
        canFd:      pid === '000c',
        usbVid:     vid,
        usbPid:     pid,
        usbBus:     busNum,
        usbAddress: devNum,
        mode:       modeMap[pid] ?? 'unknown',
        source:     'usbfs',
        available:  true,
        warning:    'Kernel module not loaded - run: sudo modprobe vas6154',
      })
    }
  } catch {
    // Not Linux or no permission
  }

  return devices
}

// ─────────────────────────────────────────────────────────
// Method 5: lsusb (last resort)
// ─────────────────────────────────────────────────────────
async function discoverViaLsusb(): Promise<VAS6154Device[]> {
  const devices: VAS6154Device[] = []

  try {
    const { stdout } = await execAsync('lsusb', { timeout: 3000 })
    const lines = stdout.split('\n')

    for (const line of lines) {
      if (!line.toLowerCase().includes(VAS6154_USB_VID)) continue

      // Bus 001 Device 003: ID 19b2:0008 Softing AG
      const match = line.match(/Bus (\d+) Device (\d+): ID (\w+):(\w+) (.+)/)
      if (!match) continue

      const [, busNum, devNum, vid, pid, product] = match
      if (vid !== VAS6154_USB_VID) continue

      devices.push({
        name:       `vas6154_lsusb_${busNum}_${devNum}`,
        deviceNode: null,
        serial:     'UNKNOWN',
        fwVersion:  '?.?.?',
        hwVersion:  '?.?',
        canFd:      pid === '000c',
        usbVid:     vid,
        usbPid:     pid,
        usbBus:     busNum,
        usbAddress: devNum,
        mode:       'operational',
        source:     'lsusb',
        available:  true,
        warning:    `Detected via lsusb: "${product.trim()}" - Install driver for full access`,
      })
    }
  } catch {
    // lsusb not available
  }

  return devices
}

// ─────────────────────────────────────────────────────────
// Normalize raw daemon data to VAS6154Device shape
// ─────────────────────────────────────────────────────────
function normalizeDevice(d: any): VAS6154Device {
  return {
    name:       d.name        ?? 'vas6154_unknown',
    deviceNode: d.device_node ?? d.deviceNode ?? null,
    serial:     d.serial      ?? 'UNKNOWN',
    fwVersion:  d.fw_version  ?? d.fwVersion ?? '?.?.?',
    hwVersion:  d.hw_version  ?? d.hwVersion ?? '?.?',
    canFd:      Boolean(d.can_fd ?? d.canFd ?? false),
    usbVid:     d.usb_vid     ?? d.usbVid ?? VAS6154_USB_VID,
    usbPid:     d.usb_pid     ?? d.usbPid ?? '0008',
    mode:       d.mode        ?? 'operational',
    source:     d.source      ?? 'daemon',
    available:  Boolean(d.available ?? true),
    warning:    d.warning,
  }
}

// ─────────────────────────────────────────────────────────
// Main detector class
// ─────────────────────────────────────────────────────────
export class VAS6154Detector {
  private _cache: VAS6154Device[] | null = null
  private _cacheTs = 0
  private _cacheTtl = 2000  // ms

  /**
   * Find all connected VAS 6154 devices.
   * Tries all detection methods in order of speed/reliability.
   */
  async findDevices(): Promise<VAS6154Device[]> {
    // Return cache if fresh
    if (this._cache && Date.now() - this._cacheTs < this._cacheTtl) {
      return this._cache
    }

    let devices: VAS6154Device[] = []

    // 1. Daemon socket (fastest)
    const daemonDevs = await discoverViaDaemon()
    if (daemonDevs && daemonDevs.length >= 0) {
      devices = daemonDevs
    }

    // 2. JSON file
    if (!devices.length) {
      const jsonDevs = discoverViaJson()
      if (jsonDevs) devices = jsonDevs
    }

    // 3. sysfs (kernel module)
    if (!devices.length) {
      devices = discoverViaSysfs()
    }

    // 4. usbfs scan
    if (!devices.length) {
      devices = discoverViaUsbfs()
    }

    // 5. lsusb fallback
    if (!devices.length) {
      devices = await discoverViaLsusb()
    }

    this._cache   = devices
    this._cacheTs = Date.now()
    return devices
  }

  /**
   * Get first available device (for single-dongle setups).
   */
  async firstDevice(): Promise<VAS6154Device | null> {
    const devs = await this.findDevices()
    return devs.find(d => d.available && d.deviceNode !== null)
      ?? devs[0]
      ?? null
  }

  /**
   * Get full system status (for diagnostic page in ECU Master Pro).
   */
  async getStatus(): Promise<VAS6154Status> {
    const devices = await this.findDevices()

    // Check if daemon socket is alive
    let daemonRunning = false
    try {
      const s = net.createConnection(DAEMON_SOCK)
      await new Promise<void>((res, rej) => {
        s.on('connect', () => { s.destroy(); res() })
        s.on('error', rej)
        setTimeout(() => { s.destroy(); rej(new Error('timeout')) }, 500)
      })
      daemonRunning = true
    } catch { }

    return {
      deviceCount:   devices.length,
      devices,
      kernelModule:  fs.existsSync(SYSFS_CLASS),
      dpduLibrary:   DPDU_LIB_PATHS.some(p => fs.existsSync(p)),
      dpduRegistry:  fs.existsSync(DPDU_REGISTRY),
      daemonRunning,
      timestamp:     new Date().toISOString(),
    }
  }

  /**
   * Watch for device changes.
   * callback(devices) is called whenever a device connects/disconnects.
   */
  watch(callback: (devices: VAS6154Device[]) => void, interval = 2000): () => void {
    let prev = JSON.stringify([])

    const id = setInterval(async () => {
      try {
        const devs = await this.findDevices()
        const cur  = JSON.stringify(devs)
        if (cur !== prev) {
          prev = cur
          callback(devs)
        }
      } catch { }
    }, interval)

    return () => clearInterval(id)  // Returns unsubscribe function
  }
}

// ─────────────────────────────────────────────────────────
// Next.js API route helper
// ─────────────────────────────────────────────────────────

/** Singleton detector instance for API routes */
export const detector = new VAS6154Detector()

/**
 * Usage in Next.js App Router:
 *
 * // app/api/vci/devices/route.ts
 * import { detector } from '@/lib/vas6154-detect'
 * import { NextResponse } from 'next/server'
 *
 * export async function GET() {
 *   const status = await detector.getStatus()
 *   return NextResponse.json(status)
 * }
 */

// ─────────────────────────────────────────────────────────
// CLI usage (node vas6154-detect.js)
// ─────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith('vas6154-detect.js') ||
    process.argv[1]?.endsWith('vas6154-detect.ts')) {

  const det = new VAS6154Detector()
  det.getStatus().then(status => {
    console.log('\n  VAS 6154 Detection Report')
    console.log('  DERHAN AutoMatrix Pro')
    console.log('  ' + '─'.repeat(40))
    console.log(`  Devices found:  ${status.deviceCount}`)
    console.log(`  Kernel module:  ${status.kernelModule ? 'YES ✓' : 'NO ✗ (run: sudo modprobe vas6154)'}`)
    console.log(`  D-PDU Library:  ${status.dpduLibrary ? 'YES ✓' : 'NO ✗ (run: sudo ./install.sh)'}`)
    console.log(`  D-PDU Registry: ${status.dpduRegistry ? 'YES ✓' : 'NO ✗'}`)
    console.log(`  Daemon:         ${status.daemonRunning ? 'RUNNING ✓' : 'NOT RUNNING (run: sudo systemctl start vas6154d)'}`)

    if (status.devices.length === 0) {
      console.log('\n  ⚠ No VAS 6154 devices detected!')
      console.log('    → Check USB cable connection')
      console.log('    → Run: lsusb | grep 19b2')
      console.log('    → Run: sudo modprobe vas6154')
    } else {
      console.log('\n  Connected devices:')
      for (const d of status.devices) {
        console.log(`\n  [${d.name}]`)
        console.log(`    Device node: ${d.deviceNode ?? 'N/A'}`)
        console.log(`    Serial:      ${d.serial}`)
        console.log(`    Firmware:    ${d.fwVersion}`)
        console.log(`    CAN-FD:      ${d.canFd ? 'Yes' : 'No'}`)
        console.log(`    Source:      ${d.source}`)
        if (d.warning) console.log(`    ⚠ ${d.warning}`)
      }
    }
    console.log()
  })
}
