'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log unexpected runtime errors to an error reporting service
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while processing this request. Our system has logged the event.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Error Digest: {error.digest}
        </p>
      )}
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button
          onClick={() => reset()}
          variant="default"
          className="bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </main>
  )
}
