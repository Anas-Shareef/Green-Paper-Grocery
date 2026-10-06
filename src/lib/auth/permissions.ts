import type { UserRole } from '@/types/database.types'
import { getCurrentProfile } from './roles'

export type AppPermission =
  // Products
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.archive'
  // Inventory
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.count'
  | 'inventory.manage'
  // Orders & Fulfillment
  | 'orders.view'
  | 'orders.create'
  | 'orders.update'
  | 'orders.confirm'
  | 'orders.prepare'
  | 'orders.fulfill'
  | 'orders.assign_delivery'
  | 'orders.deliver'
  | 'orders.cancel'
  | 'orders.payment'
  | 'orders.refund'
  // Customers
  | 'customers.view'
  | 'customers.edit'
  // Purchases & Suppliers
  | 'purchases.view'
  | 'purchases.create'
  | 'purchases.edit'
  | 'purchases.order'
  | 'purchases.cancel'
  | 'purchases.receive'
  | 'purchases.return'
  | 'suppliers.view'
  | 'suppliers.create'
  | 'suppliers.edit'
  | 'suppliers.archive'
  | 'supplier_invoices.view'
  | 'supplier_invoices.create'
  | 'supplier_invoices.edit'
  | 'supplier_payments.view'
  | 'supplier_payments.create'
  | 'purchase_reports.view'
  // Expenses & Finance
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  // Analytics & Reports
  | 'reports.view'
  // Settings & Configuration
  | 'settings.view'
  | 'settings.edit'
  // User Management
  | 'users.manage'
  | 'audit.view'
  // Phase 8: Promotions, Coupons & Loyalty
  | 'promotions.view'
  | 'promotions.create'
  | 'promotions.update'
  | 'promotions.delete'
  | 'coupons.view'
  | 'coupons.create'
  | 'coupons.update'
  | 'coupons.disable'
  | 'loyalty.view'
  | 'loyalty.adjust'
  | 'pricing.view'
  | 'pricing.manage'

/**
 * Static role-to-permission mapping
 * Provides deterministic permission boundaries without hardcoded checks in UI components.
 */
export const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  owner: [
    'products.view',
    'products.create',
    'products.edit',
    'products.archive',
    'inventory.view',
    'inventory.adjust',
    'inventory.count',
    'inventory.manage',
    'orders.view',
    'orders.create',
    'orders.update',
    'orders.confirm',
    'orders.prepare',
    'orders.fulfill',
    'orders.assign_delivery',
    'orders.deliver',
    'orders.cancel',
    'orders.payment',
    'orders.refund',
    'customers.view',
    'customers.edit',
    'purchases.view',
    'purchases.create',
    'purchases.edit',
    'purchases.order',
    'purchases.cancel',
    'purchases.receive',
    'purchases.return',
    'suppliers.view',
    'suppliers.create',
    'suppliers.edit',
    'suppliers.archive',
    'supplier_invoices.view',
    'supplier_invoices.create',
    'supplier_invoices.edit',
    'supplier_payments.view',
    'supplier_payments.create',
    'purchase_reports.view',
    'expenses.view',
    'expenses.create',
    'expenses.edit',
    'reports.view',
    'settings.view',
    'settings.edit',
    'users.manage',
    'audit.view',
    'promotions.view',
    'promotions.create',
    'promotions.update',
    'promotions.delete',
    'coupons.view',
    'coupons.create',
    'coupons.update',
    'coupons.disable',
    'loyalty.view',
    'loyalty.adjust',
    'pricing.view',
    'pricing.manage',
  ],
  admin: [
    'products.view',
    'products.create',
    'products.edit',
    'products.archive',
    'inventory.view',
    'inventory.adjust',
    'inventory.count',
    'inventory.manage',
    'orders.view',
    'orders.create',
    'orders.update',
    'orders.confirm',
    'orders.prepare',
    'orders.fulfill',
    'orders.assign_delivery',
    'orders.deliver',
    'orders.cancel',
    'orders.payment',
    'orders.refund',
    'customers.view',
    'customers.edit',
    'purchases.view',
    'purchases.create',
    'purchases.edit',
    'purchases.order',
    'purchases.cancel',
    'purchases.receive',
    'purchases.return',
    'suppliers.view',
    'suppliers.create',
    'suppliers.edit',
    'suppliers.archive',
    'supplier_invoices.view',
    'supplier_invoices.create',
    'supplier_invoices.edit',
    'supplier_payments.view',
    'supplier_payments.create',
    'purchase_reports.view',
    'expenses.view',
    'expenses.create',
    'expenses.edit',
    'reports.view',
    'settings.view',
    'settings.edit',
    'audit.view',
    'promotions.view',
    'promotions.create',
    'promotions.update',
    'promotions.delete',
    'coupons.view',
    'coupons.create',
    'coupons.update',
    'coupons.disable',
    'loyalty.view',
    'loyalty.adjust',
    'pricing.view',
    'pricing.manage',
  ],
  staff: [
    'products.view',
    'inventory.view',
    'inventory.count',
    'orders.view',
    'orders.create',
    'orders.update',
    'orders.confirm',
    'orders.prepare',
    'orders.fulfill',
    'orders.deliver',
    'customers.view',
    'customers.edit',
    'purchases.view',
    'purchases.receive',
    'suppliers.view',
    'supplier_invoices.view',
    'settings.view',
    'promotions.view',
    'coupons.view',
    'loyalty.view',
    'pricing.view',
  ],
  customer: [],
}

/**
 * Synchronous permission check given a role
 */
export function roleHasPermission(role: UserRole, permission: AppPermission): boolean {
  const allowed = ROLE_PERMISSIONS[role]
  return allowed ? allowed.includes(permission) : false
}

/**
 * Server-side check whether the currently authenticated user has the given permission
 */
export async function currentUserHasPermission(permission: AppPermission): Promise<boolean> {
  const profile = await getCurrentProfile()
  if (!profile || !profile.is_active) return false
  return roleHasPermission(profile.role, permission)
}

/**
 * Server-side guard that throws if the current user lacks the required permission
 */
export async function requirePermission(permission: AppPermission): Promise<void> {
  const has = await currentUserHasPermission(permission)
  if (!has) {
    throw new Error(`Unauthorized: User lacks required permission "${permission}"`)
  }
}
