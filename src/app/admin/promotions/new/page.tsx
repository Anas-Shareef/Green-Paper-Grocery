import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { PromotionForm } from '@/components/admin/promotions/PromotionForm'

export const metadata = {
  title: 'Create Promotion | Baqqala Admin',
}

export default async function NewPromotionPage() {
  const supabase = await createClient()

  // Fetch active products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, selling_price')
    .eq('is_active', true)
    .is('archived_at', null)
    .order('name', { ascending: true })

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Create New Promotion"
        description="Define controlled discounts with date bounds, minimum spend, and category/product targeting."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Promotions', href: '/admin/promotions' },
          { label: 'New Promotion' },
        ]}
      />

      <PromotionForm
        products={(products || []).map((p) => ({
          id: p.id,
          name: p.name,
          selling_price: Number(p.selling_price),
        }))}
        categories={categories || []}
      />
    </div>
  )
}
