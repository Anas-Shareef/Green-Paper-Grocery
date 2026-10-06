'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { ProductWithCategory } from '@/lib/services/products'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { StockAdjustmentDialog, type StockAdjustmentProduct } from '@/components/admin/StockAdjustmentDialog'
import {
  Edit,
  ArrowDownUp,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductTableProps {
  products: ProductWithCategory[]
  total: number
  page: number
  limit?: number
  totalPages: number
}

export function ProductTable({
  products,
  total,
  page,
  totalPages,
}: ProductTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [adjustmentProduct, setAdjustmentProduct] = useState<StockAdjustmentProduct | null>(null)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)

  const handleOpenAdjustment = (p: ProductWithCategory) => {
    setAdjustmentProduct({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock_quantity: Number(p.stock_quantity || 0),
      unit: p.unit,
    })
    setIsAdjustOpen(true)
  }

  const navigatePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Package className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">No products found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            No products match the selected search or filter criteria. Try adjusting filters or create a new product.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm" className="mt-2 text-xs">
            Create First Product
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1. Desktop Data Table */}
      <div className="hidden lg:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border font-medium">
              <tr>
                <th className="py-3 px-3.5 w-12">Image</th>
                <th className="py-3 px-3.5">Product & SKU</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Unit</th>
                <th className="py-3 px-3.5 text-right">Cost</th>
                <th className="py-3 px-3.5 text-right">Selling Price</th>
                <th className="py-3 px-3.5 text-right">Promo</th>
                <th className="py-3 px-3.5 text-right">Floor Min</th>
                <th className="py-3 px-3.5 text-center">Stock</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5">Updated</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const stock = Number(p.stock_quantity || 0)
                const reorder = Number(p.reorder_level || 0)
                const isArchived = Boolean(p.archived_at)
                const stockStatus =
                  stock <= 0 ? 'out_of_stock' : stock <= reorder ? 'low_stock' : 'in_stock'

                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    {/* Image */}
                    <td className="py-2.5 px-3.5">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center shrink-0">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                        )}
                      </div>
                    </td>

                    {/* Name & SKU & Barcode */}
                    <td className="py-2.5 px-3.5 max-w-[200px]">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
                      >
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-muted-foreground">
                        <span>SKU: {p.sku || '—'}</span>
                        {p.barcode && <span>• Barcode: {p.barcode}</span>}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3.5 text-muted-foreground whitespace-nowrap">
                      {p.category?.name || 'Unassigned'}
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-3.5 text-muted-foreground capitalize">
                      {p.unit}
                    </td>

                    {/* Cost */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-muted-foreground">
                      <CurrencyDisplay amount={p.purchase_cost} />
                    </td>

                    {/* Normal Selling Price */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-foreground">
                      <CurrencyDisplay amount={p.selling_price} />
                    </td>

                    {/* Promo Price */}
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      {p.promo_price !== null && p.promo_price !== undefined ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CurrencyDisplay amount={p.promo_price} />
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Minimum Selling Price */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-muted-foreground">
                      <CurrencyDisplay amount={p.minimum_selling_price} />
                    </td>

                    {/* Stock Quantity & Badge */}
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono font-bold text-foreground">
                          {stock} <span className="text-[10px] font-normal text-muted-foreground">{p.unit}</span>
                        </span>
                        <StatusBadge status={stockStatus} className="text-[10px] py-0 px-2" />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3.5 text-center">
                      <StatusBadge
                        status={isArchived ? 'archived' : p.is_active ? 'active' : 'inactive'}
                        className="text-[10px] py-0 px-2"
                      />
                    </td>

                    {/* Last Updated */}
                    <td className="py-2.5 px-3.5 text-muted-foreground whitespace-nowrap text-[11px]">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenAdjustment(p)}
                          title="Stock Adjustment Shortcut"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <ArrowDownUp className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/admin/products/${p.id}/edit`}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Edit Product"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Responsive Mobile Card Presentation */}
      <div className="block lg:hidden space-y-3">
        {products.map((p) => {
          const stock = Number(p.stock_quantity || 0)
          const reorder = Number(p.reorder_level || 0)
          const isArchived = Boolean(p.archived_at)
          const stockStatus =
            stock <= 0 ? 'out_of_stock' : stock <= reorder ? 'low_stock' : 'in_stock'

          return (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center shrink-0">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-semibold text-sm text-foreground hover:text-primary hover:underline truncate"
                    >
                      {p.name}
                    </Link>
                    <StatusBadge
                      status={isArchived ? 'archived' : p.is_active ? 'active' : 'inactive'}
                      className="text-[10px] py-0 px-2 shrink-0"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.category?.name || 'Unassigned'} • Unit: {p.unit}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-muted-foreground">
                    <span>SKU: {p.sku || '—'}</span>
                    {p.barcode && <span>• {p.barcode}</span>}
                  </div>
                </div>
              </div>

              {/* Pricing & Stock Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                <div>
                  <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                    Selling Price
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-foreground">
                      <CurrencyDisplay amount={p.selling_price} />
                    </span>
                    {p.promo_price !== null && (
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        Promo: <CurrencyDisplay amount={p.promo_price} />
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                    Available Stock
                  </span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-foreground">
                      {stock} {p.unit}
                    </span>
                    <StatusBadge status={stockStatus} className="text-[9px] py-0 px-1.5" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenAdjustment(p)}
                  className="h-8 text-xs gap-1.5 flex-1"
                >
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  Adjust Stock
                </Button>
                <Link href={`/admin/products/${p.id}/edit`} className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 w-full"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Details
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card text-xs text-muted-foreground">
        <div>
          Showing page <span className="font-semibold text-foreground">{page}</span> of{' '}
          <span className="font-semibold text-foreground">{totalPages}</span> ({total} total products)
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigatePage(page - 1)}
            className="h-8 text-xs gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => navigatePage(page + 1)}
            className="h-8 text-xs gap-1"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        isOpen={isAdjustOpen}
        onClose={() => {
          setIsAdjustOpen(false)
          setAdjustmentProduct(null)
        }}
        product={adjustmentProduct}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
