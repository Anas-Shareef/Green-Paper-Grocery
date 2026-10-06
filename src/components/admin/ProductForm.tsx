'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, Category } from '@/types/database.types'
import { ProductImageUploader } from './ProductImageUploader'
import { BarcodeScannerModal } from './BarcodeScanner'
import { createCategoryAction } from '@/app/admin/products/actions'
import {
  Camera,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Boxes,
  Tag,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface ProductFormSubmitPayload {
  name: string
  sku: string
  barcode: string | null
  description: string | null
  category_id: string | null
  brand: string | null
  unit: string
  purchase_cost: number
  selling_price: number
  promo_price: number | null
  minimum_selling_price: number
  reorder_level: number
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  opening_stock?: number
  priceChangeReason?: string
}

interface ProductFormProps {
  initialData?: Partial<Product> & { category?: Pick<Category, 'id' | 'name' | 'slug'> | null }
  isEdit?: boolean
  categories: Category[]
  onSubmit: (data: ProductFormSubmitPayload) => Promise<{ success: boolean; error?: string }>
}

const COMMON_UNITS = [
  { value: 'piece', label: 'Piece (pcs)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'box', label: 'Box' },
  { value: 'can', label: 'Can' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'litre', label: 'Litre (L)' },
]

export function ProductForm({
  initialData,
  isEdit = false,
  categories: initialCategories,
  onSubmit,
}: ProductFormProps) {
  const router = useRouter()

  // Form State
  const [name, setName] = useState(initialData?.name || '')
  const [sku, setSku] = useState(initialData?.sku || '')
  const [barcode, setBarcode] = useState(initialData?.barcode || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [brand, setBrand] = useState(initialData?.brand || '')
  const [unit, setUnit] = useState(initialData?.unit || 'piece')

  // Pricing State
  const [purchaseCost, setPurchaseCost] = useState<string>(
    initialData?.purchase_cost !== undefined ? String(initialData.purchase_cost) : '0.00'
  )
  const [sellingPrice, setSellingPrice] = useState<string>(
    initialData?.selling_price !== undefined ? String(initialData.selling_price) : '0.00'
  )
  const [promoPrice, setPromoPrice] = useState<string>(
    initialData?.promo_price !== undefined && initialData?.promo_price !== null
      ? String(initialData.promo_price)
      : ''
  )
  const [minimumSellingPrice, setMinimumSellingPrice] = useState<string>(
    initialData?.minimum_selling_price !== undefined ? String(initialData.minimum_selling_price) : '0.00'
  )
  const [priceChangeReason, setPriceChangeReason] = useState<string>('')

  // Inventory State
  const [openingStock, setOpeningStock] = useState<string>('0')
  const [reorderLevel, setReorderLevel] = useState<string>(
    initialData?.reorder_level !== undefined ? String(initialData.reorder_level) : '5'
  )

  // Image & Visibility State
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url || null)
  const [isActive, setIsActive] = useState<boolean>(initialData?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.is_featured ?? false)

  // Category & Modal UI State
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isCreatingCat, setIsCreatingCat] = useState(false)

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Pricing calculations
  const numCost = parseFloat(purchaseCost) || 0
  const numSelling = parseFloat(sellingPrice) || 0
  const numMin = parseFloat(minimumSellingPrice) || 0
  const numPromo = promoPrice ? parseFloat(promoPrice) : null

  const profitPerUnit = numSelling - numCost
  const profitMarginPct = numSelling > 0 ? ((profitPerUnit / numSelling) * 100).toFixed(1) : '0.0'

  // Pricing Guardrail warnings
  const isSellingBelowMin = numSelling < numMin
  const isPromoBelowMin = numPromo !== null && numPromo < numMin
  const isPromoAboveNormal = numPromo !== null && numPromo > numSelling

  // Generate SKU helper
  const handleAutoGenerateSku = () => {
    if (!name) return
    const prefix = name
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    setSku(`${prefix || 'SKU'}-${rand}`)
  }

  // Quick category creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    try {
      setIsCreatingCat(true)
      const res = await createCategoryAction(newCatName.trim())
      if (res.success && res.data) {
        const newCat: Category = {
          id: res.data.id,
          name: res.data.name,
          slug: res.data.name.toLowerCase().replace(/\s+/g, '-'),
          description: null,
          image_url: null,
          sort_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setCategoriesList((prev) => [...prev, newCat])
        setCategoryId(res.data.id)
        setNewCatName('')
        setIsNewCategoryOpen(false)
      } else {
        alert(res.error || 'Failed to create category')
      }
    } finally {
      setIsCreatingCat(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validation
    if (!name.trim()) {
      setErrorMessage('Product name is required.')
      return
    }
    if (!sku.trim()) {
      setErrorMessage('Product SKU is required.')
      return
    }
    if (numCost < 0) {
      setErrorMessage('Purchase cost cannot be negative.')
      return
    }
    if (numSelling < 0) {
      setErrorMessage('Selling price cannot be negative.')
      return
    }
    if (numMin < 0) {
      setErrorMessage('Minimum selling price cannot be negative.')
      return
    }
    if (isSellingBelowMin) {
      setErrorMessage(`Selling price (${numSelling}) cannot be lower than minimum price (${numMin}).`)
      return
    }
    if (isPromoBelowMin) {
      setErrorMessage(`Promotional price (${numPromo}) cannot be lower than minimum price (${numMin}).`)
      return
    }
    if (isPromoAboveNormal) {
      setErrorMessage(`Promotional price (${numPromo}) cannot exceed normal selling price (${numSelling}).`)
      return
    }

    try {
      setIsSubmitting(true)
      const payload: ProductFormSubmitPayload = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || null,
        description: description.trim() || null,
        category_id: categoryId || null,
        brand: brand.trim() || null,
        unit,
        purchase_cost: numCost,
        selling_price: numSelling,
        promo_price: numPromo,
        minimum_selling_price: numMin,
        reorder_level: parseFloat(reorderLevel) || 5,
        image_url: imageUrl,
        is_active: isActive,
        is_featured: isFeatured,
      }

      if (!isEdit) {
        payload.opening_stock = parseFloat(openingStock) || 0
      } else {
        payload.priceChangeReason = priceChangeReason.trim() || undefined
      }

      const res = await onSubmit(payload)
      if (!res.success) {
        setErrorMessage(res.error || 'Operation failed. Please review your input.')
        return
      }

      setSuccessMessage(isEdit ? 'Product updated successfully.' : 'Product created successfully.')
      setTimeout(() => {
        router.push('/admin/products')
      }, 800)
    } catch (err: unknown) {
      console.error('Error submitting product form:', err)
      setErrorMessage('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Validation Error</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

        {/* SECTION 1: Basic Information */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>
              <p className="text-xs text-muted-foreground">Product identity, SKU, barcode, and description</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Product Name *
              </label>
              <Input
                placeholder="e.g. Al Rawabi Fresh Milk 1L, Fresh Banana UAE"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-sm font-medium"
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  SKU (Stock Keeping Unit) *
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateSku}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Generate SKU
                </button>
              </div>
              <Input
                placeholder="e.g. MLK-1001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="font-mono text-sm uppercase"
              />
            </div>

            {/* Barcode with Camera Scanner */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Barcode (EAN-13 / UPC / Code-128)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 6291001002003"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsScannerOpen(true)}
                  title="Scan barcode with camera"
                  className="shrink-0"
                >
                  <Camera className="h-4 w-4 text-primary" />
                </Button>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewCategoryOpen(true)}
                  className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Category
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select Category...</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Brand (Optional)
              </label>
              <Input
                placeholder="e.g. Al Rawabi, Al Ain, Local Fresh"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Product description, ingredients, storage instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Pricing Guardrails */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Pricing & Financial Guardrails</h2>
              <p className="text-xs text-muted-foreground">Multi-tier prices with server-enforced minimum price rules (AED)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Purchase Cost */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Purchase Cost (AED) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">Supplier acquisition cost</p>
            </div>

            {/* Normal Selling Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Normal Selling Price (AED) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                className={`font-mono text-sm ${isSellingBelowMin ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : ''}`}
              />
              <p className="text-[11px] text-muted-foreground">Standard customer retail price</p>
            </div>

            {/* Minimum Selling Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Minimum Selling Price (AED) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={minimumSellingPrice}
                onChange={(e) => setMinimumSellingPrice(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">Floor threshold: discounts cannot go below</p>
            </div>

            {/* Promo Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Promotional Price (AED)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                className={`font-mono text-sm ${isPromoBelowMin || isPromoAboveNormal ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : ''}`}
              />
              <p className="text-[11px] text-muted-foreground">Discounted active promo price</p>
            </div>
          </div>

          {/* Profit Margin & Validation Status Card */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Gross Profit / Unit
                </span>
                <span className={`text-base font-bold font-mono ${profitPerUnit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {profitPerUnit.toFixed(2)} AED
                </span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Gross Profit Margin
                </span>
                <span className={`text-base font-bold font-mono ${parseFloat(profitMarginPct) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {profitMarginPct}%
                </span>
              </div>
            </div>

            {/* Warning notices */}
            {(isSellingBelowMin || isPromoBelowMin || isPromoAboveNormal) && (
              <div className="flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {isSellingBelowMin && 'Selling price is below floor price. '}
                  {isPromoBelowMin && 'Promo price is below floor price. '}
                  {isPromoAboveNormal && 'Promo price exceeds regular price. '}
                </span>
              </div>
            )}
          </div>

          {/* Edit mode: price change reason */}
          {isEdit && (
            <div className="pt-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Reason for Price Revision (Preserved in Price History Audit)
              </label>
              <Input
                placeholder="e.g. Supplier cost increase, Ramadan seasonal promotion..."
                value={priceChangeReason}
                onChange={(e) => setPriceChangeReason(e.target.value)}
                className="text-xs"
              />
            </div>
          )}
        </div>

        {/* SECTION 3: Inventory Settings */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Inventory Settings</h2>
              <p className="text-xs text-muted-foreground">Opening stock and automated reorder trigger levels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isEdit ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Opening Stock Balance ({unit})
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={openingStock}
                  onChange={(e) => setOpeningStock(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Automatically logged as an atomic `opening_stock` movement
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Current Stock Balance ({unit})
                </label>
                <div className="h-9 px-3 rounded-md border border-border bg-muted/30 flex items-center font-mono text-sm font-semibold text-foreground">
                  {initialData?.stock_quantity ?? 0} {unit}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  To adjust current stock, use the controlled Stock Adjustment tool
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Reorder Alert Level ({unit}) *
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Low stock alerts trigger when quantity falls to or below this level
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: Product Image */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Product Image</h2>
              <p className="text-xs text-muted-foreground">Uploaded to Supabase Storage `product-images` bucket</p>
            </div>
          </div>

          <ProductImageUploader
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
          />
        </div>

        {/* SECTION 5: Status & Visibility */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Status & Storefront Visibility</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <p className="text-xs font-semibold text-foreground">Active for Operations</p>
                <p className="text-[11px] text-muted-foreground">Available for POS and online orders</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <p className="text-xs font-semibold text-foreground">Featured Product</p>
                <p className="text-[11px] text-muted-foreground">Highlighted on homepage showcase</p>
              </div>
            </label>
          </div>
        </div>

        {/* Form Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isSellingBelowMin || isPromoBelowMin || isPromoAboveNormal}
            className="gap-2 min-w-32"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => setBarcode(code)}
      />

      {/* Quick Category Add Modal */}
      {isNewCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Create New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <Input
                placeholder="Category name (e.g. Dairy, Beverages)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewCategoryOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isCreatingCat || !newCatName.trim()}>
                  {isCreatingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
