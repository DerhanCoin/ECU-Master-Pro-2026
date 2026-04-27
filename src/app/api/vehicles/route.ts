import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      orderBy: { lastConnected: 'desc' },
      include: {
        _count: {
          select: { dtcCodes: true, serviceRecords: true }
        }
      }
    })

    const total = vehicles.length
    const active = vehicles.filter(v => v.status === 'healthy' || v.status === 'warning').length
    const needsAttention = vehicles.filter(v => v.status === 'critical').length
    const offline = vehicles.filter(v => v.status === 'offline').length

    return NextResponse.json({
      success: true,
      vehicles,
      total,
      active,
      needsAttention,
      offline
    })
  } catch (error) {
    console.error('Vehicles API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}
