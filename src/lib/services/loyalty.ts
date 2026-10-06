import { createClient } from '@/lib/supabase/server'
import type {
  CustomerLoyaltyAccount,
  LoyaltyTransaction,
} from '@/types/database.types'
import { getOrCreateCurrentCustomer } from './customerStore'
import { logAuditEvent } from './audit'

export const LOYALTY_CONFIG = {
  POINTS_PER_AED: 1, // 1 point earned per 1 AED eligible spend
  POINTS_REDEMPTION_RATE: 0.05, // 100 points = 5 AED (1 point = 0.05 AED)
  MIN_REDEMPTION_POINTS: 100, // minimum points required to redeem
}

export interface LoyaltyOverviewStats {
  totalMembers: number
  pointsOutstanding: number
  pointsLifetimeEarned: number
  pointsLifetimeRedeemed: number
  estimatedOutstandingValueAed: number
  recentTransactions: Array<
    LoyaltyTransaction & {
      customer?: { id: string; name: string; mobile: string } | null
    }
  >
}

/**
 * Retrieves the loyalty account for a specific customer ID.
 * If account does not exist, automatically initialises a clean 0-point record.
 */
export async function getCustomerLoyaltyAccount(
  customerId: string
): Promise<CustomerLoyaltyAccount | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_loyalty_accounts')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching loyalty account:', error)
    return null
  }

  if (data) {
    return data as CustomerLoyaltyAccount
  }

  // Auto-provision if missing
  const { data: created, error: createError } = await supabase
    .from('customer_loyalty_accounts')
    .insert({
      customer_id: customerId,
      points_balance: 0,
      lifetime_points_earned: 0,
      lifetime_points_redeemed: 0,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating loyalty account:', createError)
    return null
  }

  return created as CustomerLoyaltyAccount
}

/**
 * Retrieves loyalty account for the currently authenticated customer.
 */
export async function getCurrentCustomerLoyaltyAccount(): Promise<{
  account: CustomerLoyaltyAccount | null
  availableValueAed: number
  canRedeem: boolean
}> {
  const customer = await getOrCreateCurrentCustomer()
  if (!customer) {
    return { account: null, availableValueAed: 0, canRedeem: false }
  }

  const account = await getCustomerLoyaltyAccount(customer.id)
  const balance = account?.points_balance || 0
  const availableValueAed = Number((balance * LOYALTY_CONFIG.POINTS_REDEMPTION_RATE).toFixed(2))
  const canRedeem = balance >= LOYALTY_CONFIG.MIN_REDEMPTION_POINTS

  return {
    account,
    availableValueAed,
    canRedeem,
  }
}

/**
 * Retrieves paginated loyalty transactions ledger for a customer.
 */
export async function getLoyaltyTransactions(
  customerId: string,
  params: { page?: number; limit?: number } = {}
): Promise<{
  transactions: LoyaltyTransaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const supabase = await createClient()
  const page = Math.max(1, params.page || 1)
  const limit = Math.max(1, Math.min(params.limit || 20, 100))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await supabase
    .from('loyalty_transactions')
    .select('*', { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching loyalty transactions:', error)
    return { transactions: [], total: 0, page, limit, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    transactions: (data as LoyaltyTransaction[]) || [],
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Administrative manual points adjustment via atomic PostgreSQL RPC.
 * Strictly requires permission, valid non-zero points, and audit reason.
 */
export async function adjustLoyaltyPoints(params: {
  customerId: string
  points: number
  reason: string
}): Promise<{
  success: boolean
  balanceBefore: number
  balanceAfter: number
  adjustedPoints: number
}> {
  const supabase = await createClient()

  if (params.points === 0) {
    throw new Error('Points adjustment cannot be zero')
  }

  if (!params.reason.trim()) {
    throw new Error('Reason is required for manual loyalty points adjustment')
  }

  const { data, error } = await supabase.rpc('adjust_loyalty_points_atomic', {
    p_customer_id: params.customerId,
    p_points: params.points,
    p_reason: params.reason.trim(),
  })

  if (error) {
    console.error('Error in adjust_loyalty_points_atomic RPC:', error)
    throw new Error(error.message)
  }

  const res = data as unknown as {
    success: boolean
    balance_before: number
    balance_after: number
    adjusted_points: number
  }

  await logAuditEvent({
    action: 'loyalty.points_adjusted',
    entityType: 'customer',
    entityId: params.customerId,
    newValues: {
      points: params.points,
      balanceAfter: res.balance_after,
      reason: params.reason,
    },
  })

  return {
    success: true,
    balanceBefore: res.balance_before,
    balanceAfter: res.balance_after,
    adjustedPoints: res.adjusted_points,
  }
}

/**
 * Aggregated analytics overview for Staff / Admin Loyalty dashboard.
 */
export async function getLoyaltyOverview(): Promise<LoyaltyOverviewStats> {
  const supabase = await createClient()

  // 1. Total members and sums
  const { data: accounts } = await supabase
    .from('customer_loyalty_accounts')
    .select('points_balance, lifetime_points_earned, lifetime_points_redeemed')

  let pointsOutstanding = 0
  let pointsLifetimeEarned = 0
  let pointsLifetimeRedeemed = 0
  const totalMembers = accounts?.length || 0

  accounts?.forEach((a) => {
    pointsOutstanding += a.points_balance || 0
    pointsLifetimeEarned += a.lifetime_points_earned || 0
    pointsLifetimeRedeemed += a.lifetime_points_redeemed || 0
  })

  // 2. Recent transactions with customer details
  const { data: recent } = await supabase
    .from('loyalty_transactions')
    .select(`
      *,
      customer:customers(id, name, mobile)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    totalMembers,
    pointsOutstanding,
    pointsLifetimeEarned,
    pointsLifetimeRedeemed,
    estimatedOutstandingValueAed: Number(
      (pointsOutstanding * LOYALTY_CONFIG.POINTS_REDEMPTION_RATE).toFixed(2)
    ),
    recentTransactions:
      (recent as unknown as Array<
        LoyaltyTransaction & {
          customer?: { id: string; name: string; mobile: string } | null
        }
      >) || [],
  }
}
