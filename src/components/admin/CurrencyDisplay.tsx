import { cn } from '@/lib/utils'
import { formatCurrency, type CurrencyConfig } from '@/lib/utils/currency'

interface CurrencyDisplayProps {
  amount: number | null | undefined
  currency?: string
  locale?: string
  precision?: number
  className?: string
  prefix?: string
}

/**
 * Standardized configuration-driven grocery currency display component.
 * Uses centralized formatCurrency with customizable currency symbol, locale, and precision.
 */
export function CurrencyDisplay({
  amount = 0,
  currency = 'AED',
  locale = 'en-AE',
  precision = 2,
  className,
  prefix = '',
}: CurrencyDisplayProps) {
  const config: Partial<CurrencyConfig> = {
    symbol: currency,
    code: currency,
    locale,
    precision,
  }

  const formattedValue = formatCurrency(amount, config)

  return (
    <span className={cn('font-mono font-medium tracking-tight', className)}>
      {prefix}
      <span className="text-[0.8em] font-sans font-normal text-muted-foreground mr-1">
        {currency}
      </span>
      {formattedValue}
    </span>
  )
}
