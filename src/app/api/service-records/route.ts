import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (vehicleId) where.vehicleId = vehicleId
    if (status) where.status = status

    const records = await db.serviceRecord.findMany({
      where,
      include: { vehicle: { select: { name: true, brand: true, vin: true } } },
      orderBy: { date: 'desc' },
    })

    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0)

    return NextResponse.json({
      success: true,
      records,
      total: records.length,
      totalCost,
    })
  } catch (error) {
    console.error('Service records API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, serviceType, date, mileage, cost, status, mechanic, notes } = body

    if (!vehicleId || !serviceType || !date) {
      return NextResponse.json(
        { error: 'vehicleId, serviceType, and date are required' },
        { status: 400 }
      )
    }

    const record = await db.serviceRecord.create({
      data: {
        vehicleId,
        serviceType,
        date: new Date(date),
        mileage: mileage || null,
        cost: cost || null,
        status: status || 'scheduled',
        mechanic: mechanic || null,
        notes: notes || null,
      },
      include: { vehicle: { select: { name: true, brand: true, vin: true } } },
    })

    return NextResponse.json({ success: true, record }, { status: 201 })
  } catch (error) {
    console.error('Create service record error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create service record' },
      { status: 500 }
    )
  }
}
