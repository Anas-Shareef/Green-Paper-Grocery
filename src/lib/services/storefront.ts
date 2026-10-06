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
 * Checks whether Supabase is operating with placeholder or unconfigured credentials.
 */
function isPlaceholderConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return (
    !url ||
    !key ||
    url.includes('placeholder-project.supabase.co') ||
    key.includes('placeholder')
  )
}

export const DEMO_STOREFRONT_CATEGORIES: StorefrontCategoryWithCount[] = [
  {
    id: 'demo-cat-1',
    name: 'Fresh Produce',
    slug: 'fresh-produce',
    description: 'Farm-fresh vegetables, herbs, and fruits.',
    image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=400',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 8,
  },
  {
    id: 'demo-cat-2',
    name: 'Dairy & Eggs',
    slug: 'dairy-eggs',
    description: 'Fresh milk, laban, yogurts, cheeses, and eggs.',
    image_url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&q=80&w=400',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 6,
  },
  {
    id: 'demo-cat-3',
    name: 'Bakery & Bread',
    slug: 'bakery-bread',
    description: 'Fresh Arabic khubz, sliced breads, and buns.',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 4,
  },
  {
    id: 'demo-cat-4',
    name: 'Pantry & Rice',
    slug: 'pantry-staples',
    description: 'Basmati rice, cooking oils, flour, sugar, and pulses.',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 7,
  },
  {
    id: 'demo-cat-5',
    name: 'Beverages & Water',
    slug: 'beverages-water',
    description: 'Bottled water, juices, tea, coffee, and soft drinks.',
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&q=80&w=400',
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 5,
  },
  {
    id: 'demo-cat-6',
    name: 'Snacks & Sweets',
    slug: 'snacks-sweets',
    description: 'Chips, biscuits, chocolates, and nuts.',
    image_url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=400',
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 6,
  },
]

export const DEMO_STOREFRONT_PRODUCTS: StorefrontProduct[] = [
  {
    id: 'demo-prod-1',
    name: 'Al Rawabi Fresh Full Cream Milk 2L',
    slug: 'al-rawabi-fresh-milk-2l',
    sku: 'DAIRY-RAW-001',
    barcode: '6291001001011',
    description: '100% pure fresh cow milk fortified with Vitamin A & D. Produced locally in the UAE.',
    brand: 'Al Rawabi',
    unit: 'bottle',
    selling_price: 11.0,
    promo_price: 9.5,
    stock_quantity: 45,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
    is_active: true,
    is_featured: true,
    category_id: 'demo-cat-2',
    category: {
      id: 'demo-cat-2',
      name: 'Dairy & Eggs',
      slug: 'dairy-eggs',
    },
  },
  {
    id: 'demo-prod-2',
    name: 'Al Ain Bottled Mineral Water 1.5L (Pack of 6)',
    slug: 'al-ain-water-1-5l-pack-6',
    sku: 'BEV-ALA-002',
    barcode: '6291002002022',
    description: 'Pure, balanced mineral water delivered to your doorstep in Zone 19 Abu Dhabi.',
    brand: 'Al Ain',
    unit: 'pack',
    selling_price: 9.0,
    promo_price: 7.75,
    stock_quantity: 80,
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&q=80&w=600',
    is_active: true,
    is_featured: true,
    category_id: 'demo-cat-5',
    category: {
      id: 'demo-cat-5',
      name: 'Beverages & Water',
      slug: 'beverages-water',
    },
  },
  {
    id: 'demo-prod-3',
    name: 'Fresh Red Tomatoes 1kg',
    slug: 'fresh-red-tomatoes-1kg',
    sku: 'VEG-TOM-003',
    barcode: '6291003003033',
    description: 'Locally grown greenhouse ripe tomatoes. Ideal for salads, curries, and cooking.',
    brand: 'Local Farm',
    unit: 'kg',
    selling_price: 4.5,
    promo_price: 3.5,
    stock_quantity: 60,
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600',
    is_active: true,
    is_featured: true,
    category_id: 'demo-cat-1',
    category: {
      id: 'demo-cat-1',
      name: 'Fresh Produce',
      slug: 'fresh-produce',
    },
  },
  {
    id: 'demo-prod-4',
    name: 'Fresh Chiquita Bananas 1kg',
    slug: 'fresh-chiquita-bananas-1kg',
    sku: 'FRU-BAN-004',
    barcode: '6291004004044',
    description: 'Sweet, energy-rich yellow bananas. Naturally ripened premium quality.',
    brand: 'Chiquita',
    unit: 'kg',
    selling_price: 5.75,
    promo_price: null,
    stock_quantity: 50,
    image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=600',
    is_active: true,
    is_featured: true,
    category_id: 'demo-cat-1',
    category: {
      id: 'demo-cat-1',
      name: 'Fresh Produce',
      slug: 'fresh-produce',
    },
  },
  {
    id: 'demo-prod-5',
    name: 'India Gate Basmati Rice Classic 5kg',
    slug: 'india-gate-basmati-rice-5kg',
    sku: 'RICE-IND-005',
    barcode: '6291005005055',
    description: 'Extra-long grain aged aromatic Basmati rice for biryanis, pilafs, and daily meals.',
    brand: 'India Gate',
    unit: 'bag',
    selling_price: 42.0,
    promo_price: 36.0,
    stock_quantity: 35,
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
    is_active: true,
    is_featured: true,
    category_id: 'demo-cat-4',
    category: {
      id: 'demo-cat-4',
      name: 'Pantry & Rice',
      slug: 'pantry-staples',
    },
  },
  {
    id: 'demo-prod-6',
    name: 'Fresh Arabic Khubz Bread (Pack of 5)',
    slug: 'fresh-arabic-khubz-bread-5pcs',
    sku: 'BAK-KHU-006',
    barcode: '6291006006066',
    description: 'Traditional freshly baked Abu Dhabi Arabic flatbread. Delivered warm and soft.',
    brand: 'Baqqala Bakery',
    unit: 'pack',
    selling_price: 2.5,
    promo_price: null,
    stock_quantity: 100,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
    is_active: true,
    is_featured: true,
    category_id: 'demo-cat-3',
    category: {
      id: 'demo-cat-3',
      name: 'Bakery & Bread',
      slug: 'bakery-bread',
    },
  },
  {
    id: 'demo-prod-7',
    name: 'Fresh White Table Eggs 30 Pieces',
    slug: 'fresh-white-eggs-30-pieces',
    sku: 'EGG-WHT-007',
    barcode: '6291007007077',
    description: 'Farm fresh grade-A large white eggs tray. High protein nutrition.',
    brand: 'Local Poultry',
    unit: 'tray',
    selling_price: 18.0,
    promo_price: 15.5,
    stock_quantity: 40,
    image_url: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=600',
    is_active: true,
    is_featured: true,
    category_id: 'demo-cat-2',
    category: {
      id: 'demo-cat-2',
      name: 'Dairy & Eggs',
      slug: 'dairy-eggs',
    },
  },
  {
    id: 'demo-prod-8',
    name: 'Lipton Yellow Label Black Tea 100 Bags',
    slug: 'lipton-yellow-label-tea-100-bags',
    sku: 'TEA-LIP-008',
    barcode: '6291008008088',
    description: 'Rich taste and invigorating aroma. Pure Ceylon blend crafted for tea lovers.',
    brand: 'Lipton',
    unit: 'box',
    selling_price: 16.5,
    promo_price: null,
    stock_quantity: 55,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
    is_active: true,
    is_featured: true,
    category_id: 'demo-cat-5',
    category: {
      id: 'demo-cat-5',
      name: 'Beverages & Water',
      slug: 'beverages-water',
    },
  },
]

/**
 * Fetches all active categories for customer storefront navigation and home.
 */
export async function getStorefrontCategories(): Promise<StorefrontCategoryWithCount[]> {
  if (isPlaceholderConfig()) {
    return DEMO_STOREFRONT_CATEGORIES
  }

  try {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !categories || categories.length === 0) {
      if (error) {
        console.warn(
          '[Storefront] Could not fetch categories from Supabase:',
          error.message || error.code || 'database unavailable'
        )
      }
      return DEMO_STOREFRONT_CATEGORIES
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

    return categories.map((cat) => ({
      ...cat,
      product_count: countMap[cat.id] || 0,
    }))
  } catch (err) {
    console.warn(
      '[Storefront] Error connecting to Supabase for categories:',
      err instanceof Error ? err.message : String(err)
    )
    return DEMO_STOREFRONT_CATEGORIES
  }
}

/**
 * Fetches popular/featured products for the homepage.
 */
export async function getStorefrontFeaturedProducts(limit = 8): Promise<StorefrontProduct[]> {
  if (isPlaceholderConfig()) {
    return DEMO_STOREFRONT_PRODUCTS.slice(0, limit)
  }

  try {
    const supabase = await createClient()

    const query = supabase
      .from('products')
      .select(
        `
        id, name, slug, sku, barcode, description, brand, unit,
        selling_price, promo_price, stock_quantity, image_url,
        is_active, is_featured, category_id,
        category:categories(id, name, slug)
      `
      )
      .eq('is_active', true)
      .is('archived_at', null)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn(
          '[Storefront] Could not fetch featured products from Supabase:',
          error.message || error.code || 'database unavailable'
        )
      }
      return DEMO_STOREFRONT_PRODUCTS.slice(0, limit)
    }

    return data as unknown as StorefrontProduct[]
  } catch (err) {
    console.warn(
      '[Storefront] Error connecting to Supabase for featured products:',
      err instanceof Error ? err.message : String(err)
    )
    return DEMO_STOREFRONT_PRODUCTS.slice(0, limit)
  }
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
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(48, Math.max(1, params.limit || 16))
  const offset = (page - 1) * limit

  if (isPlaceholderConfig()) {
    let filtered = [...DEMO_STOREFRONT_PRODUCTS]

    if (params.categorySlug && params.categorySlug !== 'all') {
      filtered = filtered.filter((p) => p.category?.slug === params.categorySlug)
    }

    if (params.query?.trim()) {
      const q = params.query.trim().toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      )
    }

    if (params.minPrice !== undefined && params.minPrice > 0) {
      filtered = filtered.filter((p) => p.selling_price >= (params.minPrice || 0))
    }
    if (params.maxPrice !== undefined && params.maxPrice > 0) {
      filtered = filtered.filter((p) => p.selling_price <= (params.maxPrice || 0))
    }

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)
    return {
      products: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  try {
    const supabase = await createClient()

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

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn(
          '[Storefront] Could not fetch catalog products from Supabase:',
          error.message || error.code || 'database unavailable'
        )
      }
      return {
        products: DEMO_STOREFRONT_PRODUCTS.slice(offset, offset + limit),
        total: DEMO_STOREFRONT_PRODUCTS.length,
        page,
        limit,
        totalPages: Math.ceil(DEMO_STOREFRONT_PRODUCTS.length / limit),
      }
    }

    const total = count || data.length
    const totalPages = Math.ceil(total / limit)

    return {
      products: data as unknown as StorefrontProduct[],
      total,
      page,
      limit,
      totalPages,
    }
  } catch (err) {
    console.warn(
      '[Storefront] Error connecting to Supabase for catalog:',
      err instanceof Error ? err.message : String(err)
    )
    return {
      products: DEMO_STOREFRONT_PRODUCTS.slice(offset, offset + limit),
      total: DEMO_STOREFRONT_PRODUCTS.length,
      page,
      limit,
      totalPages: Math.ceil(DEMO_STOREFRONT_PRODUCTS.length / limit),
    }
  }
}

/**
 * Fetches a single product by slug with category details.
 */
export async function getStorefrontProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  if (isPlaceholderConfig()) {
    return DEMO_STOREFRONT_PRODUCTS.find((p) => p.slug === slug) || null
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id, name, slug, sku, barcode, description, brand, unit,
        selling_price, promo_price, stock_quantity, image_url,
        is_active, is_featured, category_id,
        category:categories(id, name, slug)
      `
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .is('archived_at', null)
      .single()

    if (error || !data) {
      return DEMO_STOREFRONT_PRODUCTS.find((p) => p.slug === slug) || null
    }

    return data as unknown as StorefrontProduct
  } catch {
    return DEMO_STOREFRONT_PRODUCTS.find((p) => p.slug === slug) || null
  }
}

/**
 * Fetches related products within the same category.
 */
export async function getStorefrontRelatedProducts(
  categoryId: string | null,
  currentProductId: string,
  limit = 4
): Promise<StorefrontProduct[]> {
  if (isPlaceholderConfig()) {
    return DEMO_STOREFRONT_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, limit)
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id, name, slug, sku, barcode, description, brand, unit,
        selling_price, promo_price, stock_quantity, image_url,
        is_active, is_featured, category_id,
        category:categories(id, name, slug)
      `
      )
      .eq('category_id', categoryId || '')
      .eq('is_active', true)
      .is('archived_at', null)
      .neq('id', currentProductId)
      .limit(limit)

    if (error || !data || data.length === 0) {
      return DEMO_STOREFRONT_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, limit)
    }

    return data as unknown as StorefrontProduct[]
  } catch {
    return DEMO_STOREFRONT_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, limit)
  }
}
