'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Brain, X, Send, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_QUESTIONS = [
  'What does P0300 mean?',
  'How to diagnose misfire?',
  'EV battery health check',
  'CAN bus troubleshooting',
]

// Use a stable timestamp for SSR - will be replaced on client mount
const STABLE_WELCOME_TS = new Date('2026-01-01T00:00:00Z')
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your AI Diagnostic Assistant. I can help with DTC codes, vehicle diagnostics, tuning recommendations, and more. How can I help you today?",
  timestamp: STABLE_WELCOME_TS,
}

export function AiAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])

  // Replace welcome timestamp with real client time after mount
  useEffect(() => {
    setMessages(prev => prev.map(m =>
      m.id === 'welcome' ? { ...m, timestamp: new Date() } : m
    ))
  }, [])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(
      `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    )
  }, [])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response')
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch {
      toast({
        title: 'AI Assistant Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      })

      // Add error message in chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'I apologize, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleClearChat = async () => {
    try {
      await fetch(`/api/ai-assistant?sessionId=${sessionId}`, {
        method: 'DELETE',
      })
    } catch {
      // Silently fail - conversation will be cleared locally regardless
    }

    // Generate new session ID
    setSessionId(
      `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    )
    setMessages([WELCOME_MESSAGE])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputText)
    }
  }

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Bold text
        const boldFormatted = line.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="text-white font-semibold">$1</strong>'
        )
        // Bullet points
        if (boldFormatted.startsWith('- ') || boldFormatted.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="text-ecu-purple shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: boldFormatted.slice(2) }} />
            </div>
          )
        }
        // Numbered list
        const numMatch = boldFormatted.match(/^(\d+)\.\s/)
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="text-ecu-teal shrink-0">{numMatch[1]}.</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: boldFormatted.slice(numMatch[0].length),
                }}
              />
            </div>
          )
        }
        // Empty line
        if (boldFormatted.trim() === '') {
          return <div key={i} className="h-2" />
        }
        return (
          <div key={i} dangerouslySetInnerHTML={{ __html: boldFormatted }} />
        )
      })
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
            boxShadow:
              '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)',
          }}
          aria-label="Open AI Assistant"
        >
          <Brain className="w-6 h-6 text-white" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-ecu-purple" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
          style={{
            width: '400px',
            height: '500px',
            background: '#151d2b',
            border: '1px solid #1e2a3a',
            boxShadow:
              '0 0 30px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 92, 246, 0.1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1a2332, #1e2a3a)',
              borderBottom: '1px solid #1e2a3a',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ecu-purple/20">
                <Brain className="w-4 h-4 text-ecu-purple" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  AI Diagnostic Assistant
                </span>
                <Badge
                  className="text-[10px] px-1.5 py-0 h-4"
                  style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  AI
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                onClick={handleClearChat}
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#1e2a3a transparent',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-1 bg-ecu-purple/20">
                    <Brain className="w-3 h-3 text-ecu-purple" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-sm'
                      : 'rounded-bl-sm'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'rgba(0, 212, 255, 0.1)',
                          borderLeft: '2px solid #00d4ff',
                          color: '#e2e8f0',
                        }
                      : {
                          background: 'rgba(139, 92, 246, 0.1)',
                          borderLeft: '2px solid #8b5cf6',
                          color: '#cbd5e1',
                        }
                  }
                >
                  <div className="space-y-1">
                    {msg.role === 'assistant'
                      ? formatMessageContent(msg.content)
                      : msg.content}
                  </div>
                  <div
                    className="text-[10px] mt-1 opacity-40"
                    style={{
                      textAlign:
                        msg.role === 'user' ? 'right' : 'left',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-1 bg-ecu-teal/20">
                    <MessageSquare className="w-3 h-3 text-ecu-teal" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-1 bg-ecu-purple/20">
                  <Brain className="w-3 h-3 text-ecu-purple" />
                </div>
                <div
                  className="rounded-lg rounded-bl-sm px-4 py-3"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderLeft: '2px solid #8b5cf6',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-ecu-purple animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-ecu-purple animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-ecu-purple animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions - shown when few messages */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 pb-2 shrink-0">
              <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
                Quick questions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105"
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#a78bfa',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(139, 92, 246, 0.2)'
                      e.currentTarget.style.borderColor =
                        'rgba(139, 92, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'rgba(139, 92, 246, 0.1)'
                      e.currentTarget.style.borderColor =
                        'rgba(139, 92, 246, 0.2)'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div
            className="px-3 py-3 shrink-0"
            style={{ borderTop: '1px solid #1e2a3a' }}
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about diagnostics..."
                disabled={isLoading}
                className="flex-1 text-xs px-3 py-2 rounded-lg outline-none transition-all duration-200 disabled:opacity-50"
                style={{
                  background: '#0f1923',
                  border: '1px solid #1e2a3a',
                  color: '#e2e8f0',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8b5cf6'
                  e.target.style.boxShadow =
                    '0 0 0 2px rgba(139, 92, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#1e2a3a'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <Button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg transition-all duration-200"
                style={{
                  background: inputText.trim()
                    ? 'linear-gradient(135deg, #00d4ff, #0099cc)'
                    : '#1e2a3a',
                  boxShadow: inputText.trim()
                    ? '0 0 10px rgba(0, 212, 255, 0.3)'
                    : 'none',
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
