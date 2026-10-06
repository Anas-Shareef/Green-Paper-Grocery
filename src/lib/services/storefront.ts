import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/database.types'

export interface StorefrontProduct {
  id: string
  name: string
  slug: string
  sku: string | null
  barcode: string | null
  description: string | null
  brand: string | null
  unit: string
  selling_price: number
  promo_price: number | null
  stock_quantity: number
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  category_id: string | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

export interface StorefrontCategoryWithCount extends Category {
  product_count?: number
}

export interface CatalogFilterParams {
  categorySlug?: string
  query?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'newest'
  inStockOnly?: boolean
  page?: number
  limit?: number
}

/**
 * Fetches all active categories for customer storefront navigation and home.
 */
export async function getStorefrontCategories(): Promise<StorefrontCategoryWithCount[]> {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching storefront categories:', error)
    return []
  }

  // Get active product count per category
  const { data: products } = await supabase
    .from('products')
    .select('category_id')
    .eq('is_active', true)
    .is('archived_at', null)

  const countMap: Record<string, number> = {}
  products?.forEach((p) => {
    if (p.category_id) {
      countMap[p.category_id] = (countMap[p.category_id] || 0) + 1
    }
  })

  return (categories || []).map((cat) => ({
    ...cat,
    product_count: countMap[cat.id] || 0,
  }))
}

/**
 * Fetches popular/featured products for the homepage.
 */
export async function getStorefrontFeaturedProducts(limit = 8): Promise<StorefrontProduct[]> {
  const supabase = await createClient()

  // First try featured products
  const query = supabase
    .from('products')
    .select(`
      id, name, slug, sku, barcode, description, brand, unit,
      selling_price, promo_price, stock_quantity, image_url,
      is_active, is_featured, category_id,
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .is('archived_at', null)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return (data as unknown as StorefrontProduct[]) || []
}

/**
 * Fetches products for the catalog page with filters, search, sorting, and pagination.
 */
export async function getStorefrontCatalog(params: CatalogFilterParams): Promise<{
  products: StorefrontProduct[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const supabase = await createClient()

  const page = Math.max(1, params.page || 1)
  const limit = Math.min(48, Math.max(1, params.limit || 16))
  const offset = (page - 1) * limit

  let query = supabase
    .from('products')
    .select(
      `
      id, name, slug, sku, barcode, description, brand, unit,
      selling_price, promo_price, stock_quantity, image_url,
      is_active, is_featured, category_id,
      category:categories(id, name, slug)
    `,
      { count: 'exact' }
    )
    .eq('is_active', true)
    .is('archived_at', null)

  // 1. Category Filter by slug
  if (params.categorySlug && params.categorySlug !== 'all') {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.categorySlug)
      .single()

    if (category?.id) {
      query = query.eq('category_id', category.id)
    }
  }

  // 2. Search Query (Name, SKU, Barcode, Brand)
  if (params.query?.trim()) {
    const term = `%${params.query.trim()}%`
    query = query.or(`name.ilike.${term},brand.ilike.${term},sku.ilike.${term}`)
  }

  // 3. Price Filters
  if (params.minPrice !== undefined && params.minPrice > 0) {
    query = query.gte('selling_price', params.minPrice)
  }
  if (params.maxPrice !== undefined && params.maxPrice > 0) {
    query = query.lte('selling_price', params.maxPrice)
  }

  // 4. In Stock Filter
  if (params.inStockOnly) {
    query = query.gt('stock_quantity', 0)
  }

  // 5. Sorting
  switch (params.sortBy) {
    case 'price_asc':
      query = query.order('selling_price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('selling_price', { ascending: false })
      break
    case 'name_asc':
      query = query.order('name', { ascending: true })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'featured':
    default:
      query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
      break
  }

  // Range pagination
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching catalog products:', error)
    return {
      products: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    products: (data as unknown as StorefrontProduct[]) || [],
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Fetches a single product by slug with category details.
 */
export async function getStorefrontProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, slug, sku, barcode, description, brand, unit,
      selling_price, promo_price, stock_quantity, image_url,
      is_active, is_featured, category_id,
      category:categories(id, name, slug)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .is('archived_at', null)
    .single()

  if (error || !data) {
    return null
  }

  return data as unknown as StorefrontProduct
}

/**
 * Fetches related products within the same category.
 */
export async function getStorefrontRelatedProducts(
  categoryId: string | null,
  currentProductId: string,
  limit = 4
): Promise<StorefrontProduct[]> {
  if (!categoryId) return []
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(`
      id, name, slug, sku, barcode, description, brand, unit,
      selling_price, promo_price, stock_quantity, image_url,
      is_active, is_featured, category_id,
      category:categories(id, name, slug)
    `)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .is('archived_at', null)
    .neq('id', currentProductId)
    .limit(limit)

  return (data as unknown as StorefrontProduct[]) || []
}
