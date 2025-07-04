// src/app/(admin)/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/shared/ui'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin Panel Error:', error)
  }, [error])

  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg border border-red-500/50 m-6">
      <div className="flex items-center gap-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <h2 className="text-xl font-bold">Admin Panel Error</h2>
      </div>
      <p className="text-gray-400 mb-4">
        An error occurred within this part of the admin dashboard. You can try to reset the component or navigate away.
      </p>
      <details className="bg-gray-900 p-3 rounded-md mb-6 border border-gray-700">
        <summary className="cursor-pointer text-red-300 font-medium">
          Click to see error details
        </summary>
        <pre className="mt-2 text-xs text-gray-300 whitespace-pre-wrap overflow-auto">
          {error.stack}
        </pre>
      </details>
      <div className="flex gap-4">
        <Button variant="danger" onClick={() => reset()}>
          Try to Reset Component
        </Button>
      </div>
    </div>
  )
}