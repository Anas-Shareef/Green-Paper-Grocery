'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { archiveProductAction, restoreProductAction } from '@/app/admin/products/actions'
import { Archive, RotateCcw, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductArchiveButtonProps {
  productId: string
  productName: string
  isArchived: boolean
}

export function ProductArchiveButton({
  productId,
  productName,
  isArchived,
}: ProductArchiveButtonProps) {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleAction = async () => {
    try {
      setIsProcessing(true)
      setErrorMsg(null)

      const res = isArchived
        ? await restoreProductAction(productId)
        : await archiveProductAction(productId)

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update product archive status.')
        return
      }

      setIsConfirmOpen(false)
      router.refresh()
    } catch (err: unknown) {
      console.error('Error toggling product archive status:', err)
      setErrorMsg('An unexpected error occurred.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {isArchived ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsConfirmOpen(true)}
          className="text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5"
        >
          <RotateCcw className="h-4 w-4" />
          Restore Product
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsConfirmOpen(true)}
          className="text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
        >
          <Archive className="h-4 w-4" />
          Archive Product
        </Button>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  isArchived
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                }`}
              >
                {isArchived ? (
                  <RotateCcw className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {isArchived ? 'Restore Product to Active Catalog?' : 'Archive Product?'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isArchived ? (
                    <>
                      Product <strong>{productName}</strong> will be restored to active inventory
                      and become available again for sales and checkout.
                    </>
                  ) : (
                    <>
                      Product <strong>{productName}</strong> will be archived. It will be hidden from
                      active ordering and POS, but all historical orders, invoices, and audit logs
                      will remain intact.
                    </>
                  )}
                </p>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isArchived ? 'default' : 'destructive'}
                onClick={handleAction}
                disabled={isProcessing}
                className="gap-1.5"
              >
                {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isArchived ? 'Yes, Restore' : 'Yes, Archive'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
