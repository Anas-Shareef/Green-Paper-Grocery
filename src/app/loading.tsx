export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-muted border-t-emerald-600 animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-wide text-foreground">
            Baqqala Grocery
          </p>
          <p className="text-xs text-muted-foreground">
            Loading platform resources...
          </p>
        </div>
      </div>
    </div>
  )
}
