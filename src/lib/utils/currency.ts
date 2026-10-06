export interface CurrencyConfig {
  code: string
  symbol: string
  locale: string
  precision: number
}

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  code: 'AED',
  symbol: 'AED',
  locale: 'en-AE',
  precision: 2,
}

/**
 * Centralized currency formatting utility.
 * Never hardcodes AED; respects store configuration while providing safe defaults.
 */
export function formatCurrency(
  amount: number | null | undefined,
  config?: Partial<CurrencyConfig>
): string {
  const numericAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
  const activeConfig: CurrencyConfig = {
    ...DEFAULT_CURRENCY_CONFIG,
    ...config,
  }

  try {
    return new Intl.NumberFormat(activeConfig.locale, {
      minimumFractionDigits: activeConfig.precision,
      maximumFractionDigits: activeConfig.precision,
    }).format(numericAmount)
  } catch (err) {
    console.error('Error formatting currency with locale:', activeConfig.locale, err)
    return numericAmount.toFixed(activeConfig.precision)
  }
}
