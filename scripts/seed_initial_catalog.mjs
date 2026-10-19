import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {}
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

async function seedCatalog() {
  console.log('--- Baqqala Grocery Safe Catalogue Seed Script ---')
  console.log('Target Supabase:', supabaseUrl)

  // 1. Categories
  const categoriesToSeed = [
    {
      name: 'Fresh Produce',
      slug: 'fresh-produce',
      description: 'Farm-fresh local vegetables, greens, and fruits delivered daily to Zone 19.',
      image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600',
      sort_order: 1,
      is_active: true,
    },
    {
      name: 'Dairy & Eggs',
      slug: 'dairy-eggs',
      description: 'Fresh milk, laban, yogurts, cheeses, and farm eggs.',
      image_url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&q=80&w=600',
      sort_order: 2,
      is_active: true,
    },
    {
      name: 'Bakery & Bread',
      slug: 'bakery-bread',
      description: 'Fresh Arabic khubz, sliced breads, buns, and morning pastries.',
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
      sort_order: 3,
      is_active: true,
    },
    {
      name: 'Pantry & Rice',
      slug: 'pantry-staples',
      description: 'Basmati rice, cooking oils, flour, sugar, lentils, and canned foods.',
      image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
      sort_order: 4,
      is_active: true,
    },
    {
      name: 'Beverages & Water',
      slug: 'beverages-water',
      description: 'Drinking water, juices, sodas, and hot beverages.',
      image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&q=80&w=600',
      sort_order: 5,
      is_active: true,
    },
    {
      name: 'Snacks & Sweets',
      slug: 'snacks',
      description: 'Chips, biscuits, chocolates, and nuts.',
      image_url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=600',
      sort_order: 6,
      is_active: true,
    },
  ]

  const categoryMap = new Map()

  for (const cat of categoriesToSeed) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('slug', cat.slug)
      .maybeSingle()

    if (existing) {
      console.log(`[Category] Found existing: ${cat.name} (${existing.id})`)
      categoryMap.set(cat.slug, existing.id)
    } else {
      const { data: created, error } = await supabase
        .from('categories')
        .insert(cat)
        .select()
        .single()

      if (error) {
        console.error(`[Category] Error creating ${cat.name}:`, error.message)
      } else {
        console.log(`[Category] Created: ${cat.name} (${created.id})`)
        categoryMap.set(cat.slug, created.id)
      }
    }
  }

  // 2. Suppliers
  const suppliersToSeed = [
    {
      name: 'Al Ain Farms LLC',
      contact_person: 'Mohammad Rashid',
      phone: '+971 2 555 1234',
      whatsapp: '+971 2 555 1234',
      email: 'orders@alainfarms.com',
      address: 'Al Ain Industrial Area, Abu Dhabi',
      notes: 'Fresh dairy, laban, and poultry deliveries (daily 6:00 AM)',
      is_active: true,
    },
    {
      name: 'Agthia Consumer Goods',
      contact_person: 'Tariq Al Mansoori',
      phone: '+971 2 666 5678',
      whatsapp: '+971 2 666 5678',
      email: 'distribution@agthia.com',
      address: 'Mussafah Industrial Area M-14, Abu Dhabi',
      notes: 'Al Ain Water, Grand Mills flour, and food staples',
      is_active: true,
    },
  ]

  for (const sup of suppliersToSeed) {
    const { data: existing } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('name', sup.name)
      .maybeSingle()

    if (existing) {
      console.log(`[Supplier] Found existing: ${sup.name}`)
    } else {
      const { error } = await supabase.from('suppliers').insert(sup)
      if (error) console.error(`[Supplier] Error creating ${sup.name}:`, error.message)
      else console.log(`[Supplier] Created: ${sup.name}`)
    }
  }

  // 3. Products
  const productsToSeed = [
    {
      name: 'Al Ain Fresh Milk Full Cream 2L',
      slug: 'al-ain-fresh-milk-full-cream-2l',
      sku: 'DRY-MLK-001',
      barcode: '6291001001011',
      description: '100% pure fresh cow milk produced locally in UAE. Rich in calcium and essential vitamins.',
      categorySlug: 'dairy-eggs',
      brand: 'Al Ain Farms',
      unit: 'bottle',
      purchase_cost: 8.75,
      selling_price: 11.5,
      promo_price: null,
      stock_quantity: 45,
      reorder_level: 10,
      image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Fresh UAE Cucumber (Khayar) 1kg',
      slug: 'fresh-uae-cucumber-1kg',
      sku: 'VEG-CUC-002',
      barcode: '6291002002022',
      description: 'Crisp, tender locally grown greenhouse cucumbers. Ideal for Arabic salads and fattoush.',
      categorySlug: 'fresh-produce',
      brand: 'Abu Dhabi Local Farms',
      unit: 'kg',
      purchase_cost: 2.8,
      selling_price: 4.5,
      promo_price: null,
      stock_quantity: 60,
      reorder_level: 15,
      image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&q=80&w=600',
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Local Farm Fresh Eggs Large (Pack of 30)',
      slug: 'local-farm-fresh-eggs-30pcs',
      sku: 'EGG-LCL-003',
      barcode: '6291003003033',
      description: 'Grade A fresh brown eggs from local poultry farms in Abu Dhabi. High protein nutrition.',
      categorySlug: 'dairy-eggs',
      brand: 'Jenan',
      unit: 'tray',
      purchase_cost: 16.5,
      selling_price: 22.0,
      promo_price: null,
      stock_quantity: 40,
      reorder_level: 8,
      image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&q=80&w=600',
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Fresh Chiquita Bananas 1kg',
      slug: 'fresh-chiquita-bananas-1kg',
      sku: 'FRU-BAN-004',
      barcode: '6291004004044',
      description: 'Sweet, energy-rich yellow bananas. Naturally ripened premium quality fruit.',
      categorySlug: 'fresh-produce',
      brand: 'Chiquita',
      unit: 'kg',
      purchase_cost: 4.1,
      selling_price: 5.75,
      promo_price: null,
      stock_quantity: 50,
      reorder_level: 12,
      image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=600',
      is_active: true,
      is_featured: true,
    },
    {
      name: 'India Gate Basmati Rice Classic 5kg',
      slug: 'india-gate-basmati-rice-5kg',
      sku: 'RICE-IND-005',
      barcode: '6291005005055',
      description: 'Extra-long grain aged aromatic Basmati rice for biryanis, pilafs, and authentic home cooking.',
      categorySlug: 'pantry-staples',
      brand: 'India Gate',
      unit: 'bag',
      purchase_cost: 29.5,
      selling_price: 42.0,
      promo_price: 36.0,
      stock_quantity: 35,
      reorder_level: 5,
      image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Fresh Arabic Khubz Bread (Pack of 5)',
      slug: 'fresh-arabic-khubz-bread-5pcs',
      sku: 'BAK-KHU-006',
      barcode: '6291006006066',
      description: 'Traditional freshly baked Abu Dhabi Arabic flatbread. Delivered warm and soft daily.',
      categorySlug: 'bakery-bread',
      brand: 'Baqqala Bakery',
      unit: 'pack',
      purchase_cost: 1.25,
      selling_price: 2.5,
      promo_price: null,
      stock_quantity: 100,
      reorder_level: 20,
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Al Ain Zero Bottled Water 500ml (Pack of 12)',
      slug: 'al-ain-zero-water-500ml-pack12',
      sku: 'BEV-WTR-007',
      barcode: '6291007007077',
      description: 'Zero sodium pure bottled drinking water. Perfect everyday hydration for home and work.',
      categorySlug: 'beverages-water',
      brand: 'Al Ain',
      unit: 'pack',
      purchase_cost: 6.8,
      selling_price: 9.5,
      promo_price: null,
      stock_quantity: 80,
      reorder_level: 15,
      image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&q=80&w=600',
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Noor Pure Sunflower Cooking Oil 1.5L',
      slug: 'noor-pure-sunflower-oil-1-5l',
      sku: 'OIL-NOR-008',
      barcode: '6291008008088',
      description: 'Light, healthy sunflower cooking oil enriched with Vitamins A & D. Great for frying and roasting.',
      categorySlug: 'pantry-staples',
      brand: 'Noor',
      unit: 'bottle',
      purchase_cost: 13.5,
      selling_price: 18.5,
      promo_price: null,
      stock_quantity: 30,
      reorder_level: 6,
      image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600',
      is_active: true,
      is_featured: false,
    },
  ]

  for (const prod of productsToSeed) {
    const { categorySlug, ...prodData } = prod
    const categoryId = categoryMap.get(categorySlug) || null

    const { data: existing } = await supabase
      .from('products')
      .select('id, name')
      .eq('slug', prod.slug)
      .maybeSingle()

    if (existing) {
      console.log(`[Product] Found existing: ${prod.name}`)
    } else {
      const payload = {
        ...prodData,
        category_id: categoryId,
      }

      const { data: created, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error(`[Product] Error creating ${prod.name}:`, error.message)
      } else {
        console.log(`[Product] Created: ${prod.name} (${created.id})`)

        // Also create initial inventory movement for opening stock
        await supabase.from('inventory_movements').insert({
          product_id: created.id,
          movement_type: 'opening_stock',
          quantity: prod.stock_quantity,
          previous_stock: 0,
          resulting_stock: prod.stock_quantity,
          unit_cost: prod.purchase_cost,
          notes: 'Initial catalogue stock load',
        })
      }
    }
  }

  console.log('--- Catalogue seed completed successfully! ---')
}

seedCatalog().catch(console.error)
