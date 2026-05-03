import ZAI from 'z-ai-web-dev-sdk'
import { NextRequest, NextResponse } from 'next/server'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export async function POST(request: NextRequest) {
  try {
    const { dtcCodes, vehicleInfo } = await request.json()

    const zai = await getZAI()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You are an expert automotive diagnostic AI. Analyze the provided DTC codes and vehicle information to give detailed diagnostic insights. Respond in JSON format with: overallHealth (0-100), criticalIssues (array of {title, description, severity}), warnings (array of {title, description}), recommendations (array of strings), estimatedRepairCost (string).'
        },
        {
          role: 'user',
          content: `Analyze these DTC codes for a ${vehicleInfo || 'unknown vehicle'}: ${JSON.stringify(dtcCodes || ['P0300', 'P0171'])}`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const aiResponse = completion.choices[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      analysis: aiResponse,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI Diagnostics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'AI analysis failed. Using fallback analysis.'
      },
      { status: 500 }
    )
  }
}
