import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { InventorySummaryCards } from '@/components/admin/InventorySummaryCards'
import { InventoryMovementTable } from '@/components/admin/InventoryMovementTable'
import { InventoryCountManager } from '@/components/admin/InventoryCountManager'
import { ProductTable } from '@/components/admin/ProductTable'
import {
  getInventoryMetrics,
  getInventoryHistory,
  getInventoryCounts,
} from '@/lib/services/inventory'
import { getProductsList, getActiveProducts } from '@/lib/services/products'
import { requirePermission } from '@/lib/auth/permissions'
import type { InventoryMovementType } from '@/types/database.types'
import { Boxes, History, ClipboardCheck } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    tab?: string
    movementType?: string
    stockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
    page?: string
  }>
}

export default async function AdminInventoryPage({ searchParams }: PageProps) {
  await requirePermission('inventory.view')
  const resolvedParams = await searchParams

  const activeTab = resolvedParams.tab || 'stock'
  const page = parseInt(resolvedParams.page || '1', 10) || 1

  // 1. Fetch live server-side inventory metrics
  const metrics = await getInventoryMetrics()

  // 2. Fetch tab-specific data
  let movementHistoryResult = null
  let countSessions = null
  let productsResult = null
  let activeProductsList = null

  if (activeTab === 'movements') {
    movementHistoryResult = await getInventoryHistory({
      movementType: (resolvedParams.movementType as InventoryMovementType | 'all') || 'all',
      page,
      limit: 20,
    })
  } else if (activeTab === 'counts') {
    const [counts, products] = await Promise.all([
      getInventoryCounts(),
      getActiveProducts(),
    ])
    countSessions = counts
    activeProductsList = products
  } else {
    // Default 'stock' tab
    productsResult = await getProductsList({
      status: 'active',
      stockStatus: resolvedParams.stockFilter || 'all',
      sortBy: 'stock_quantity',
      sortOrder: 'asc', // prioritize low/zero stock at top
      page,
      limit: 15,
    })
  }

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Inventory Movements & Stock Control"
        description="Real-time stock valuation, atomic mutation auditing, low-stock alerts, and physical stocktake reconciliation."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Inventory' },
        ]}
      />

      {/* Real Server Inventory Summary Metrics */}
      <InventorySummaryCards metrics={metrics} />

      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-2">
        <Link
          href="/admin/inventory"
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'stock'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Boxes className="h-4 w-4" />
          Stock Levels & Quick Adjustment
        </Link>
        <Link
          href="/admin/inventory?tab=movements"
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'movements'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" />
          Movement History Audit
        </Link>
        <Link
          href="/admin/inventory?tab=counts"
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'counts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          Physical Stocktake & Reconciliation
        </Link>
      </div>

      {/* Tab 1: Stock Levels */}
      {activeTab === 'stock' && productsResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Current Product Stock Levels
              </h3>
              <p className="text-xs text-muted-foreground">
                Sorted by lowest stock quantity to highlight restocking priorities
              </p>
            </div>

            {/* Quick stock status pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <Link
                href="/admin/inventory"
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                  !resolvedParams.stockFilter || resolvedParams.stockFilter === 'all'
                    ? 'bg-foreground text-background border-foreground font-semibold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                All Products
              </Link>
              <Link
                href="/admin/inventory?stockFilter=low_stock"
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                  resolvedParams.stockFilter === 'low_stock'
                    ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Low Stock ({metrics.lowStockCount})
              </Link>
              <Link
                href="/admin/inventory?stockFilter=out_of_stock"
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                  resolvedParams.stockFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Out of Stock ({metrics.outOfStockCount})
              </Link>
            </div>
          </div>

          <ProductTable
            products={productsResult.products}
            total={productsResult.total}
            page={productsResult.page}
            limit={productsResult.limit}
            totalPages={productsResult.totalPages}
          />
        </div>
      )}

      {/* Tab 2: Movement History */}
      {activeTab === 'movements' && movementHistoryResult && (
        <InventoryMovementTable
          movements={movementHistoryResult.movements}
          total={movementHistoryResult.total}
          page={movementHistoryResult.page}
          limit={movementHistoryResult.limit}
          totalPages={movementHistoryResult.totalPages}
          currentType={resolvedParams.movementType || 'all'}
        />
      )}

      {/* Tab 3: Inventory Counts */}
      {activeTab === 'counts' && countSessions && activeProductsList && (
        <InventoryCountManager
          counts={countSessions}
          activeProducts={activeProductsList}
        />
      )}
    </div>
  )
}
