import ZAI from 'z-ai-web-dev-sdk'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are the AI Diagnostic Assistant for ECU Master Pro 2026, a professional multi-brand OBD-II diagnostic platform. You are an expert in:
- Vehicle diagnostics (OBD-II, UDS, CAN bus protocols)
- DTC code interpretation and troubleshooting
- Engine performance analysis and tuning
- EV/Hybrid battery management systems
- ECU coding and adaptation
- Predictive maintenance recommendations
- Multi-brand vehicle diagnostics (VW Group, BMW, Mercedes, Stellantis, Ford, Toyota)

Respond concisely and professionally. Use technical terms appropriately. When discussing DTC codes, always provide:
1. Code description
2. Possible causes
3. Recommended diagnostic steps
4. Estimated repair complexity

Format responses with markdown when helpful (bullet points, bold text).`

// In-memory conversation store (per session)
const conversations = new Map<string, Array<{ role: string; content: string }>>()

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'sessionId and message are required' },
        { status: 400 }
      )
    }

    // Get or create conversation history
    let history = conversations.get(sessionId) || [
      { role: 'assistant', content: SYSTEM_PROMPT },
    ]

    // Add user message
    history.push({ role: 'user', content: message })

    // Trim to last 20 messages to prevent token overflow
    if (history.length > 22) {
      history = [history[0], ...history.slice(-21)]
    }

    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: history.map((m) => ({
        role: m.role as 'assistant' | 'user',
        content: m.content,
      })),
      thinking: { type: 'disabled' },
    })

    const aiResponse =
      completion.choices[0]?.message?.content ||
      'I apologize, I was unable to process your request. Please try again.'

    // Add AI response to history
    history.push({ role: 'assistant', content: aiResponse })
    conversations.set(sessionId, history)

    return NextResponse.json({
      success: true,
      response: aiResponse,
      messageCount: history.length - 1,
    })
  } catch (error) {
    console.error('AI Assistant error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get AI response. Please try again.',
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint to clear conversation
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (sessionId) {
    conversations.delete(sessionId)
  }

  return NextResponse.json({ success: true, message: 'Conversation cleared' })
}
