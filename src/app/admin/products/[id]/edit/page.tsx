import { notFound } from 'next/navigation'
import { getProductById, getCategories } from '@/lib/services/products'
import { getProductPriceHistory } from '@/lib/services/pricing'
import { updateProductAction } from '@/app/admin/products/actions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ProductForm } from '@/components/admin/ProductForm'
import { ProductArchiveButton } from '@/components/admin/ProductArchiveButton'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { requirePermission } from '@/lib/auth/permissions'
import { History, Layers } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  await requirePermission('products.view')
  const { id } = await params

  const [product, categories, priceHistory] = await Promise.all([
    getProductById(id),
    getCategories(),
    getProductPriceHistory(id),
  ])

  if (!product) {
    notFound()
  }

  const isArchived = Boolean(product.archived_at)

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <AdminPageHeader
        title={`Edit Product: ${product.name}`}
        description={`SKU: ${product.sku || 'N/A'} • Manage pricing guardrails, categories, image, and inventory settings.`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Products', href: '/admin/products' },
          { label: product.name },
          { label: 'Edit' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={isArchived ? 'archived' : product.is_active ? 'active' : 'inactive'} />
            <ProductArchiveButton
              productId={product.id}
              productName={product.name}
              isArchived={isArchived}
            />
          </div>
        }
      />

      {/* Main Edit Form */}
      <ProductForm
        initialData={product}
        isEdit={true}
        categories={categories}
        onSubmit={async (data) => {
          'use server'
          return updateProductAction(id, data)
        }}
      />

      {/* Price History Timeline */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Price History & Financial Audit</h2>
              <p className="text-xs text-muted-foreground">Immutable historical record of all price adjustments</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {priceHistory.length} Record{priceHistory.length === 1 ? '' : 's'}
          </span>
        </div>

        {priceHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No price history changes recorded yet for this product.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Effective Date</th>
                  <th className="py-2.5 px-3 font-semibold">Normal Price</th>
                  <th className="py-2.5 px-3 font-semibold">Promo Price</th>
                  <th className="py-2.5 px-3 font-semibold">Min Price</th>
                  <th className="py-2.5 px-3 font-semibold">Purchase Cost</th>
                  <th className="py-2.5 px-3 font-semibold">Reason</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {priceHistory.map((h) => {
                  const isCurrent = h.effective_until === null
                  return (
                    <tr key={h.id} className={isCurrent ? 'bg-emerald-500/5' : 'hover:bg-muted/20'}>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {new Date(h.effective_from).toLocaleDateString()} {new Date(h.effective_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        <CurrencyDisplay amount={h.normal_selling_price} />
                      </td>
                      <td className="py-2.5 px-3 text-foreground">
                        {h.promo_price !== null ? <CurrencyDisplay amount={h.promo_price} /> : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        <CurrencyDisplay amount={h.minimum_selling_price} />
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        <CurrencyDisplay amount={h.purchase_cost} />
                      </td>
                      <td className="py-2.5 px-3 font-sans text-xs text-foreground max-w-xs truncate">
                        {h.reason || 'General price update'}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        {isCurrent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Current Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch / Expiry Foundation */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Product Batch & Expiry Foundation</h2>
              <p className="text-xs text-muted-foreground">Batch tracking data linked to this grocery catalog item</p>
            </div>
          </div>
        </div>

        {product.batches && product.batches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Batch Number</th>
                  <th className="py-2.5 px-3 font-semibold">Expiry Date</th>
                  <th className="py-2.5 px-3 font-semibold">Quantity</th>
                  <th className="py-2.5 px-3 font-semibold">Purchase Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {product.batches.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-semibold text-foreground">{b.batch_number}</td>
                    <td className="py-2.5 px-3 text-foreground">{b.expiry_date}</td>
                    <td className="py-2.5 px-3 font-semibold">{b.quantity} {product.unit}</td>
                    <td className="py-2.5 px-3 text-muted-foreground"><CurrencyDisplay amount={b.purchase_cost} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            No specific batch or expiry lots are currently assigned. Standard inventory tracking applies.
          </p>
        )}
      </div>
    </div>
  )
}
