'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ECU Master App Error]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f1923] p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#e2e8f0] mb-2">Application Error</h2>
        <p className="text-sm text-[#64748b] mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[#00d4ff] text-[#0f1923] rounded-lg text-sm font-semibold hover:bg-[#00bcd4] transition-colors"
        >
          Reload Application
        </button>
      </div>
    </div>
  )
}
