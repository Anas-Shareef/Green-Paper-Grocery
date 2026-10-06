import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
}

export function ErrorState({
  title = 'Failed to load data',
  message,
  retry,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center sm:p-8">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        {message}
      </p>
      {retry && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={retry}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
