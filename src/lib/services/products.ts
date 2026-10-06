import { createClient } from '@/lib/supabase/server'
import type { Product, Category, ProductBatch } from '@/types/database.types'
import { logAuditEvent } from './audit'
import { requirePermission } from '@/lib/auth/permissions'
import { validatePriceRules, recordProductPriceHistory } from './pricing'
import { mutateStockAtomic } from './inventory'
import { getSettingByKey, type BusinessRulesSettings } from './settings'

export interface ProductListParams {
  search?: string
  categoryId?: string
  status?: 'all' | 'active' | 'archived'
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
  sortBy?: 'name' | 'selling_price' | 'stock_quantity' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

export interface ProductWithCategory extends Product {
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null
}

export interface ProductListResult {
  products: ProductWithCategory[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateProductInput {
  name: string
  sku: string
  barcode?: string | null
  description?: string | null
  category_id?: string | null
  brand?: string | null
  unit?: string
  purchase_cost: number
  selling_price: number
  promo_price?: number | null
  minimum_selling_price: number
  opening_stock?: number
  reorder_level?: number
  image_url?: string | null
  is_active?: boolean
  is_featured?: boolean
}

export interface UpdateProductInput {
  name?: string
  sku?: string
  barcode?: string | null
  description?: string | null
  category_id?: string | null
  brand?: string | null
  unit?: string
  purchase_cost?: number
  selling_price?: number
  promo_price?: number | null
  minimum_selling_price?: number
  reorder_level?: number
  image_url?: string | null
  is_active?: boolean
  is_featured?: boolean
  priceChangeReason?: string
}

/**
 * Translates PostgreSQL errors into human-friendly, localized error messages.
 */
export function formatProductDatabaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.'
  const msg = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: unknown }).message)
    : String(error)

  if (msg.includes('idx_products_barcode_unique') || (msg.includes('unique') && msg.includes('barcode'))) {
    return 'A product with this Barcode already exists. Barcodes must be unique.'
  }
  if (msg.includes('products_sku_key') || (msg.includes('unique') && msg.includes('sku'))) {
    return 'A product with this SKU already exists. SKUs must be unique.'
  }
  if (msg.includes('products_slug_key') || (msg.includes('unique') && msg.includes('slug'))) {
    return 'A product with this name already exists.'
  }
  if (msg.includes('selling_price') && msg.includes('minimum_selling_price')) {
    return 'The selling price cannot be lower than the minimum allowed price.'
  }
  if (msg.includes('purchase_cost') && msg.includes('>= 0')) {
    return 'Purchase cost cannot be negative.'
  }
  if (msg.includes('stock_quantity') && msg.includes('>= 0')) {
    return 'Stock quantity cannot be negative.'
  }
  if (msg.includes('Insufficient stock')) {
    return msg
  }
  if (msg.includes('Permission denied') || msg.includes('Unauthorized')) {
    return 'You do not have permission to perform this product operation.'
  }
  return msg
}

/**
 * Helper to generate a URL-safe slug from a product name
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${base || 'product'}-${randomSuffix}`
}

/**
 * Fetches server-paginated, filtered, and sorted products with category relationships.
 */
export async function getProductsList(params: ProductListParams = {}): Promise<ProductListResult> {
  await requirePermission('products.view')
  const supabase = await createClient()

  const {
    search,
    categoryId,
    status = 'active',
    stockStatus = 'all',
    minPrice,
    maxPrice,
    page = 1,
    limit = 15,
    sortBy = 'name',
    sortOrder = 'asc',
  } = params

  const offset = (Math.max(1, page) - 1) * limit

  let query = supabase
    .from('products')
    .select('*, category:categories(id, name, slug)', { count: 'exact' })

  // Status Filter
  if (status === 'active') {
    query = query.eq('is_active', true).is('archived_at', null)
  } else if (status === 'archived') {
    query = query.not('archived_at', 'is', null)
  }

  // Category Filter
  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId)
  }

  // Search Filter (name, SKU, barcode)
  if (search && search.trim()) {
    const s = search.trim()
    query = query.or(`name.ilike.%${s}%,sku.ilike.%${s}%,barcode.ilike.%${s}%`)
  }

  // Price Range Filters
  if (typeof minPrice === 'number' && minPrice >= 0) {
    query = query.gte('selling_price', minPrice)
  }
  if (typeof maxPrice === 'number' && maxPrice > 0) {
    query = query.lte('selling_price', maxPrice)
  }

  // Stock Status Filter
  if (stockStatus === 'out_of_stock') {
    query = query.eq('stock_quantity', 0)
  } else if (stockStatus === 'in_stock') {
    // stock_quantity > reorder_level
    // Note: Supabase postgrest doesn't compare columns directly in basic filters,
    // so we filter stock_quantity > 0 for now and refine in application layer if needed
    query = query.gt('stock_quantity', 0)
  } else if (stockStatus === 'low_stock') {
    query = query.gt('stock_quantity', 0)
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching products list:', error)
    throw new Error(formatProductDatabaseError(error))
  }

  let products = (data as unknown as ProductWithCategory[]) ?? []

  // Refine low_stock in memory if requested since reorder_level is row-dependent
  if (stockStatus === 'low_stock') {
    products = products.filter((p) => Number(p.stock_quantity) <= Number(p.reorder_level))
  } else if (stockStatus === 'in_stock') {
    products = products.filter((p) => Number(p.stock_quantity) > Number(p.reorder_level))
  }

  const total = count ?? products.length
  const totalPages = Math.ceil(total / limit) || 1

  return {
    products,
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Retrieves a single product by ID, including its category and batch records
 */
export async function getProductById(id: string): Promise<(ProductWithCategory & { batches?: ProductBatch[] }) | null> {
  await requirePermission('products.view')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  // Optionally fetch product batches
  const { data: batches } = await supabase
    .from('product_batches')
    .select('*')
    .eq('product_id', id)
    .order('expiry_date', { ascending: true })

  return {
    ...(data as unknown as ProductWithCategory),
    batches: batches ?? [],
  }
}

/**
 * Creates a new product with pricing guardrails, initial price history, and opening stock
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  await requirePermission('products.create')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Validation
  if (!input.name || !input.name.trim()) {
    throw new Error('Product name is required.')
  }
  if (!input.sku || !input.sku.trim()) {
    throw new Error('SKU is required.')
  }

  const businessRules = await getSettingByKey<BusinessRulesSettings>('business_rules', {
    enforce_minimum_price: true,
    require_discount_approval: false,
    inactive_customer_days: 45,
    default_reorder_level: 5,
  })

  if (businessRules.enforce_minimum_price) {
    validatePriceRules({
      purchaseCost: input.purchase_cost,
      normalSellingPrice: input.selling_price,
      promoPrice: input.promo_price,
      minimumSellingPrice: input.minimum_selling_price,
    })
  }

  const slug = generateSlug(input.name)
  const openingStock = Math.max(0, Number(input.opening_stock || 0))
  const reorderLevel = input.reorder_level !== undefined ? Number(input.reorder_level) : businessRules.default_reorder_level

  // 2. Try atomic PostgreSQL RPC function for complete transactional integrity
  const { data: atomicProductId, error: rpcError } = await supabase.rpc('create_product_atomic', {
    p_product_data: {
      name: input.name.trim(),
      slug,
      sku: input.sku.trim().toUpperCase(),
      barcode: input.barcode && input.barcode.trim() ? input.barcode.trim() : null,
      description: input.description?.trim() || null,
      category_id: input.category_id || null,
      brand: input.brand?.trim() || null,
      unit: input.unit || 'piece',
      purchase_cost: Number(input.purchase_cost || 0),
      selling_price: Number(input.selling_price || 0),
      promo_price: input.promo_price !== undefined && input.promo_price !== null ? Number(input.promo_price) : null,
      minimum_selling_price: Number(input.minimum_selling_price || 0),
      opening_stock: openingStock,
      reorder_level: reorderLevel,
      image_url: input.image_url || null,
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
    },
    p_user_id: user?.id,
  })

  if (!rpcError && atomicProductId) {
    const { data: atomicCreated, error: fetchCreatedErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', atomicProductId)
      .single()

    if (!fetchCreatedErr && atomicCreated) {
      return atomicCreated as Product
    }
  }

  // 2b. Direct fallback if atomic RPC is unavailable
  const { data: product, error: insertError } = await supabase
    .from('products')
    .insert({
      name: input.name.trim(),
      slug,
      sku: input.sku.trim().toUpperCase(),
      barcode: input.barcode && input.barcode.trim() ? input.barcode.trim() : null,
      description: input.description?.trim() || null,
      category_id: input.category_id || null,
      brand: input.brand?.trim() || null,
      unit: input.unit || 'piece',
      purchase_cost: Number(input.purchase_cost || 0),
      selling_price: Number(input.selling_price || 0),
      promo_price: input.promo_price !== undefined && input.promo_price !== null ? Number(input.promo_price) : null,
      minimum_selling_price: Number(input.minimum_selling_price || 0),
      stock_quantity: 0,
      reorder_level: reorderLevel,
      image_url: input.image_url || null,
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
    })
    .select()
    .single()

  if (insertError || !product) {
    console.error('Failed to create product:', insertError)
    throw new Error(formatProductDatabaseError(insertError))
  }

  // 3. Record Initial Price History
  try {
    await recordProductPriceHistory({
      productId: product.id,
      purchaseCost: product.purchase_cost,
      normalSellingPrice: product.selling_price,
      promoPrice: product.promo_price,
      minimumSellingPrice: product.minimum_selling_price,
      reason: 'Initial product price upon catalog entry',
      userId: user?.id,
    })
  } catch (err) {
    console.error('Error logging initial price history:', err)
  }

  // 4. Record Opening Stock through Atomic Mutation (if > 0)
  if (openingStock > 0) {
    try {
      await mutateStockAtomic({
        productId: product.id,
        quantityChange: openingStock,
        movementType: 'opening_stock',
        referenceType: 'initial_catalog_setup',
        unitCost: product.purchase_cost,
        notes: 'Opening stock balance at creation',
        userId: user?.id,
      })
      product.stock_quantity = openingStock
    } catch (err) {
      console.error('Failed to apply initial opening stock:', err)
      throw new Error(`Product created, but failed to initialize opening stock: ${formatProductDatabaseError(err)}`)
    }
  }

  // 5. System Audit Log
  await logAuditEvent({
    action: 'product.created',
    entityType: 'product',
    entityId: product.id,
    newValues: {
      name: product.name,
      sku: product.sku,
      selling_price: product.selling_price,
      purchase_cost: product.purchase_cost,
      stock_quantity: openingStock,
    },
  })

  return product
}

/**
 * Updates an existing product, verifying price rules, recording price history, and logging audit
 */
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  await requirePermission('products.edit')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Fetch current product state
  const { data: current, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    throw new Error(`Product not found: ${id}`)
  }

  // 2. Validate price updates if any price field changed
  const newPurchaseCost = input.purchase_cost !== undefined ? Number(input.purchase_cost) : current.purchase_cost
  const newSellingPrice = input.selling_price !== undefined ? Number(input.selling_price) : current.selling_price
  const newMinPrice = input.minimum_selling_price !== undefined ? Number(input.minimum_selling_price) : current.minimum_selling_price
  const newPromoPrice = input.promo_price !== undefined ? (input.promo_price !== null ? Number(input.promo_price) : null) : current.promo_price

  const priceChanged =
    newPurchaseCost !== current.purchase_cost ||
    newSellingPrice !== current.selling_price ||
    newMinPrice !== current.minimum_selling_price ||
    newPromoPrice !== current.promo_price

  if (priceChanged) {
    const businessRules = await getSettingByKey<BusinessRulesSettings>('business_rules', {
      enforce_minimum_price: true,
      require_discount_approval: false,
      inactive_customer_days: 45,
      default_reorder_level: 5,
    })

    if (businessRules.enforce_minimum_price) {
      validatePriceRules({
        purchaseCost: newPurchaseCost,
        normalSellingPrice: newSellingPrice,
        promoPrice: newPromoPrice,
        minimumSellingPrice: newMinPrice,
      })
    }

    // Record price history
    await recordProductPriceHistory({
      productId: id,
      purchaseCost: newPurchaseCost,
      normalSellingPrice: newSellingPrice,
      promoPrice: newPromoPrice,
      minimumSellingPrice: newMinPrice,
      reason: input.priceChangeReason || 'Price updated in product editor',
      userId: user?.id,
    })
  }

  // 3. Build update payload
  const updatePayload: Partial<Product> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updatePayload.name = input.name.trim()
  if (input.sku !== undefined) updatePayload.sku = input.sku.trim().toUpperCase()
  if (input.barcode !== undefined) updatePayload.barcode = input.barcode && input.barcode.trim() ? input.barcode.trim() : null
  if (input.description !== undefined) updatePayload.description = input.description?.trim() || null
  if (input.category_id !== undefined) updatePayload.category_id = input.category_id || null
  if (input.brand !== undefined) updatePayload.brand = input.brand?.trim() || null
  if (input.unit !== undefined) updatePayload.unit = input.unit
  if (input.purchase_cost !== undefined) updatePayload.purchase_cost = newPurchaseCost
  if (input.selling_price !== undefined) updatePayload.selling_price = newSellingPrice
  if (input.promo_price !== undefined) updatePayload.promo_price = newPromoPrice
  if (input.minimum_selling_price !== undefined) updatePayload.minimum_selling_price = newMinPrice
  if (input.reorder_level !== undefined) updatePayload.reorder_level = Number(input.reorder_level)
  if (input.image_url !== undefined) updatePayload.image_url = input.image_url
  if (input.is_active !== undefined) updatePayload.is_active = input.is_active
  if (input.is_featured !== undefined) updatePayload.is_featured = input.is_featured

  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (updateError || !updated) {
    console.error('Failed to update product:', updateError)
    throw new Error(formatProductDatabaseError(updateError))
  }

  // 4. Audit Log
  await logAuditEvent({
    action: 'product.edited',
    entityType: 'product',
    entityId: id,
    oldValues: {
      name: current.name,
      selling_price: current.selling_price,
      purchase_cost: current.purchase_cost,
      promo_price: current.promo_price,
    },
    newValues: {
      name: updated.name,
      selling_price: updated.selling_price,
      purchase_cost: updated.purchase_cost,
      promo_price: updated.promo_price,
    },
  })

  return updated
}

/**
 * Safely archives a product instead of physically deleting it.
 * Preserves historical references in order_items, purchase_items, and inventory_movements.
 */
export async function archiveProduct(productId: string, userId?: string): Promise<boolean> {
  await requirePermission('products.archive')
  const supabase = await createClient()

  let actorId = userId
  if (!actorId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    actorId = user?.id
  }

  const { data: previous, error: fetchError } = await supabase
    .from('products')
    .select('is_active, archived_at')
    .eq('id', productId)
    .single()

  if (fetchError || !previous) {
    throw new Error(`Product not found: ${productId}`)
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('products')
    .update({
      is_active: false,
      archived_at: now,
      archived_by: actorId ?? null,
    })
    .eq('id', productId)

  if (error) {
    console.error('Failed to archive product:', error)
    throw new Error(formatProductDatabaseError(error))
  }

  await logAuditEvent({
    action: 'product.archived',
    entityType: 'product',
    entityId: productId,
    oldValues: { is_active: previous.is_active, archived_at: previous.archived_at },
    newValues: { is_active: false, archived_at: now },
  })

  return true
}

/**
 * Restores an archived product back to active circulation
 */
export async function restoreProduct(productId: string, userId?: string): Promise<boolean> {
  await requirePermission('products.archive')
  const supabase = await createClient()

  let actorId = userId
  if (!actorId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    actorId = user?.id
  }

  const { error } = await supabase
    .from('products')
    .update({
      is_active: true,
      archived_at: null,
      archived_by: null,
    })
    .eq('id', productId)

  if (error) {
    console.error('Failed to restore product:', error)
    throw new Error(formatProductDatabaseError(error))
  }

  await logAuditEvent({
    action: 'product.restored',
    entityType: 'product',
    entityId: productId,
    newValues: { is_active: true, archived_at: null },
  })

  return true
}

/**
 * Retrieves active categories for dropdowns and filtering
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data as Category[]) ?? []
}

/**
 * Quick inline category creation
 */
export async function createCategory(name: string, description?: string): Promise<Category> {
  await requirePermission('products.create')
  const supabase = await createClient()

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      is_active: true,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Error creating category:', error)
    throw new Error(formatProductDatabaseError(error))
  }

  await logAuditEvent({
    action: 'category.created',
    entityType: 'category',
    entityId: data.id,
    newValues: { name: data.name, slug: data.slug },
  })

  return data as Category
}

/**
 * Retrieves active, unarchived products for storefront and standard inventory views
 */
export async function getActiveProducts(options?: {
  categoryId?: string
  limit?: number
}): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .is('archived_at', null)
    .order('name', { ascending: true })

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching active products:', error)
    return []
  }

  return (data as Product[]) ?? []
}
