/**
 * app/api/vci/devices/route.ts
 * ECU Master Pro - VCI Device API
 * DERHAN AutoMatrix Pro
 *
 * GET  /api/vci/devices        - List all VAS 6154 devices
 * GET  /api/vci/devices/status - Full system status
 */

import { NextResponse } from 'next/server'
import { VAS6154Detector } from '@/lib/vas6154-detect'

const detector = new VAS6154Detector()

export async function GET(request: Request) {
  const url    = new URL(request.url)
  const full   = url.searchParams.get('full') === '1'

  try {
    if (full) {
      const status = await detector.getStatus()
      return NextResponse.json(status)
    }

    const devices = await detector.findDevices()
    return NextResponse.json({
      ok:      true,
      count:   devices.length,
      devices,
      ts:      new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
