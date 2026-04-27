import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (vehicleId) where.vehicleId = vehicleId
    if (severity) where.severity = severity
    if (status) where.status = status

    const codes = await db.dtcCode.findMany({
      where,
      include: { vehicle: { select: { name: true, brand: true, vin: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const critical = codes.filter(c => c.severity === 'critical').length
    const warnings = codes.filter(c => c.severity === 'warning').length
    const active = codes.filter(c => c.status === 'active').length

    return NextResponse.json({
      success: true,
      codes,
      total: codes.length,
      critical,
      warnings,
      active,
    })
  } catch (error) {
    console.error('DTC codes API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch DTC codes' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'vehicleId is required' },
        { status: 400 }
      )
    }

    const result = await db.dtcCode.updateMany({
      where: { vehicleId, status: { in: ['active', 'pending'] } },
      data: { status: 'cleared', clearedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      clearedCount: result.count,
    })
  } catch (error) {
    console.error('Clear DTC codes error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear DTC codes' },
      { status: 500 }
    )
  }
}
