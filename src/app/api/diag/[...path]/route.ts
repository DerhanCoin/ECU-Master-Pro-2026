import { NextRequest, NextResponse } from 'next/server'

const DIAG_SERVICE_PORT = 8000
const DIAG_SERVICE_BASE = `http://localhost:${DIAG_SERVICE_PORT}`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${DIAG_SERVICE_BASE}/api/${pathStr}${searchParams ? `?${searchParams}` : ''}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Diagnostic service error: ${(err as Error).message}` },
      { status: 502 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${DIAG_SERVICE_BASE}/api/${pathStr}${searchParams ? `?${searchParams}` : ''}`

  try {
    let body: string | undefined
    try {
      body = JSON.stringify(await request.json())
    } catch {
      body = undefined
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(10000),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Diagnostic service error: ${(err as Error).message}` },
      { status: 502 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${DIAG_SERVICE_BASE}/api/${pathStr}${searchParams ? `?${searchParams}` : ''}`

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Diagnostic service error: ${(err as Error).message}` },
      { status: 502 }
    )
  }
}
