// src/app/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/shared/ui'
import { ShieldAlert } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Something Went Wrong!
          </h2>
          <p className="text-secondary mb-6 max-w-md">
            An unexpected error occurred. We've been notified and are looking into it. Please try again.
          </p>
          <Button onClick={() => reset()} variant="primary" size="lg">
            Try Again
          </Button>
        </div>
      </body>
    </html>
  )
}