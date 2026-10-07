'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

export interface CartItem {
  id: string // product UUID
  name: string
  slug: string
  price: number // displayed retail price
  originalPrice?: number
  unit: string
  imageUrl?: string | null
  quantity: number
  maxStock: number
}

interface CartContextType {
  items: CartItem[]
  totalCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isLoaded: boolean
  getItemQuantity: (productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'baqqala_customer_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  // Load cart from localStorage after mount on client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch {
      // fallback
    }
    setIsLoaded(true)
  }, [])

  // Persist cart to localStorage whenever items change after initial load
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e)
    }
  }, [items, isLoaded])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    if (quantity <= 0) return
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id)
      if (existingIndex > -1) {
        const existing = prev[existingIndex]
        const newQty = Math.min(existing.quantity + quantity, item.maxStock || 999)
        const updated = [...prev]
        updated[existingIndex] = {
          ...existing,
          ...item,
          quantity: newQty,
        }
        return updated
      } else {
        const initialQty = Math.min(quantity, item.maxStock || 999)
        return [...prev, { ...item, quantity: initialQty }]
      }
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const validQty = Math.min(quantity, item.maxStock || 999)
          return { ...item, quantity: validQty }
        }
        return item
      })
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const getItemQuantity = useCallback(
    (productId: string) => {
      const found = items.find((i) => i.id === productId)
      return found ? found.quantity : 0
    },
    [items]
  )

  const totalCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0)
  }, [items])

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isLoaded,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
