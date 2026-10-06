import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import type { InventoryMetrics } from '@/lib/services/inventory'
import {
  Boxes,
  Package,
  TrendingDown,
  AlertTriangle,
  Coins,
} from 'lucide-react'

interface InventorySummaryCardsProps {
  metrics: InventoryMetrics
}

export function InventorySummaryCards({ metrics }: InventorySummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Total Active Products */}
      <StatCard
        title="Active Products"
        value={metrics.totalProducts.toLocaleString()}
        subtitle="Cataloged grocery lines"
        icon={Package}
      />

      {/* 2. Total Stock Units */}
      <StatCard
        title="Total Stock Units"
        value={Number(metrics.totalStockQuantity.toFixed(2)).toLocaleString()}
        subtitle="Units currently on shelf/store"
        icon={Boxes}
      />

      {/* 3. Total Inventory Valuation */}
      <StatCard
        title="Inventory Valuation"
        value={<CurrencyDisplay amount={metrics.totalInventoryValue} />}
        subtitle="At supplier purchase cost"
        icon={Coins}
      />

      {/* 4. Low Stock Alerts */}
      <StatCard
        title="Low Stock Items"
        value={metrics.lowStockCount.toLocaleString()}
        subtitle="At or below reorder level"
        icon={TrendingDown}
        iconColor={
          metrics.lowStockCount > 0
            ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
            : undefined
        }
      />

      {/* 5. Out of Stock Alerts */}
      <StatCard
        title="Out of Stock"
        value={metrics.outOfStockCount.toLocaleString()}
        subtitle="Requires immediate restocking"
        icon={AlertTriangle}
        iconColor={
          metrics.outOfStockCount > 0
            ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
            : undefined
        }
      />
    </div>
  )
}
