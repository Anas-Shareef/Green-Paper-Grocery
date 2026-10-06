export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'admin' | 'staff'
export type OrderSource = 'website' | 'whatsapp' | 'manual' | 'walk_in'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
export type PaymentMethod =
  | 'cash'
  | 'card_on_delivery'
  | 'card_online'
  | 'credit'
  | 'other'
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'failed'
  | 'refunded'
export type InventoryMovementType =
  | 'purchase'
  | 'sale'
  | 'customer_return'
  | 'supplier_return'
  | 'damaged'
  | 'expired'
  | 'adjustment'
  | 'opening_stock'
export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled'
export type CustomerSegment =
  | 'new'
  | 'regular'
  | 'high_value'
  | 'inactive'
  | 'vip'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: UserRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          sku: string | null
          barcode: string | null
          description: string | null
          category_id: string | null
          brand: string | null
          unit: string
          purchase_cost: number
          selling_price: number
          promo_price: number | null
          minimum_selling_price: number
          stock_quantity: number
          reorder_level: number
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          archived_at: string | null
          archived_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sku?: string | null
          barcode?: string | null
          description?: string | null
          category_id?: string | null
          brand?: string | null
          unit?: string
          purchase_cost?: number
          selling_price?: number
          promo_price?: number | null
          minimum_selling_price?: number
          stock_quantity?: number
          reorder_level?: number
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sku?: string | null
          barcode?: string | null
          description?: string | null
          category_id?: string | null
          brand?: string | null
          unit?: string
          purchase_cost?: number
          selling_price?: number
          promo_price?: number | null
          minimum_selling_price?: number
          stock_quantity?: number
          reorder_level?: number
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_archived_by_fkey'
            columns: ['archived_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      customers: {
        Row: {
          id: string
          name: string
          mobile: string
          whatsapp: string | null
          address: string
          villa_or_building: string | null
          area: string | null
          zone: string | null
          notes: string | null
          first_order_at: string | null
          last_order_at: string | null
          total_orders: number
          total_spend: number
          customer_segment: CustomerSegment
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          mobile: string
          whatsapp?: string | null
          address: string
          villa_or_building?: string | null
          area?: string | null
          zone?: string | null
          notes?: string | null
          first_order_at?: string | null
          last_order_at?: string | null
          total_orders?: number
          total_spend?: number
          customer_segment?: CustomerSegment
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          mobile?: string
          whatsapp?: string | null
          address?: string
          villa_or_building?: string | null
          area?: string | null
          zone?: string | null
          notes?: string | null
          first_order_at?: string | null
          last_order_at?: string | null
          total_orders?: number
          total_spend?: number
          customer_segment?: CustomerSegment
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          address: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          category: string
          amount: number
          description: string | null
          expense_date: string
          payment_method: PaymentMethod
          attachment_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          amount: number
          description?: string | null
          expense_date?: string
          payment_method?: PaymentMethod
          attachment_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          amount?: number
          description?: string | null
          expense_date?: string
          payment_method?: PaymentMethod
          attachment_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string | null
          order_source: OrderSource
          status: OrderStatus
          payment_method: PaymentMethod
          payment_status: PaymentStatus
          subtotal: number
          discount_amount: number
          total_amount: number
          delivery_address: string
          delivery_notes: string | null
          order_date: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_id?: string | null
          order_source?: OrderSource
          status?: OrderStatus
          payment_method?: PaymentMethod
          payment_status?: PaymentStatus
          subtotal?: number
          discount_amount?: number
          total_amount?: number
          delivery_address: string
          delivery_notes?: string | null
          order_date?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string | null
          order_source?: OrderSource
          status?: OrderStatus
          payment_method?: PaymentMethod
          payment_status?: PaymentStatus
          subtotal?: number
          discount_amount?: number
          total_amount?: number
          delivery_address?: string
          delivery_notes?: string | null
          order_date?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          selling_price: number
          purchase_cost_at_sale: number
          discount_amount: number
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          selling_price: number
          purchase_cost_at_sale?: number
          discount_amount?: number
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          selling_price?: number
          purchase_cost_at_sale?: number
          discount_amount?: number
          total_amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      purchases: {
        Row: {
          id: string
          supplier_id: string
          invoice_number: string
          purchase_date: string
          subtotal: number
          supplier_discount: number
          total_amount: number
          attachment_url: string | null
          notes: string | null
          status: PurchaseStatus
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          invoice_number: string
          purchase_date?: string
          subtotal?: number
          supplier_discount?: number
          total_amount?: number
          attachment_url?: string | null
          notes?: string | null
          status?: PurchaseStatus
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          invoice_number?: string
          purchase_date?: string
          subtotal?: number
          supplier_discount?: number
          total_amount?: number
          attachment_url?: string | null
          notes?: string | null
          status?: PurchaseStatus
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'purchases_supplier_id_fkey'
            columns: ['supplier_id']
            referencedRelation: 'suppliers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchases_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string
          quantity: number
          purchase_price: number
          discount_amount: number
          final_unit_cost: number
          total_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id: string
          quantity: number
          purchase_price: number
          discount_amount?: number
          final_unit_cost: number
          total_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string
          quantity?: number
          purchase_price?: number
          discount_amount?: number
          final_unit_cost?: number
          total_cost?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'purchase_items_purchase_id_fkey'
            columns: ['purchase_id']
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_items_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      inventory_movements: {
        Row: {
          id: string
          product_id: string
          movement_type: InventoryMovementType
          quantity: number
          previous_stock: number | null
          resulting_stock: number | null
          reference_type: string | null
          reference_id: string | null
          unit_cost: number | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          movement_type: InventoryMovementType
          quantity: number
          previous_stock?: number | null
          resulting_stock?: number | null
          reference_type?: string | null
          reference_id?: string | null
          unit_cost?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          movement_type?: InventoryMovementType
          quantity?: number
          previous_stock?: number | null
          resulting_stock?: number | null
          reference_type?: string | null
          reference_id?: string | null
          unit_cost?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_movements_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inventory_movements_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: 'info' | 'warning' | 'success' | 'error'
          is_read: boolean
          link: string | null
          entity_type: string | null
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: 'info' | 'warning' | 'success' | 'error'
          is_read?: boolean
          link?: string | null
          entity_type?: string | null
          entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'success' | 'error'
          is_read?: boolean
          link?: string | null
          entity_type?: string | null
          entity_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      settings: {
        Row: {
          key: string
          value: Json
          category: string
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          value: Json
          category?: string
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          key?: string
          value?: Json
          category?: string
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'settings_updated_by_fkey'
            columns: ['updated_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      product_price_history: {
        Row: {
          id: string
          product_id: string
          purchase_cost: number
          normal_selling_price: number
          promo_price: number | null
          minimum_selling_price: number
          effective_from: string
          effective_until: string | null
          changed_by: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          purchase_cost: number
          normal_selling_price: number
          promo_price?: number | null
          minimum_selling_price: number
          effective_from?: string
          effective_until?: string | null
          changed_by?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          purchase_cost?: number
          normal_selling_price?: number
          promo_price?: number | null
          minimum_selling_price?: number
          effective_from?: string
          effective_until?: string | null
          changed_by?: string | null
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_price_history_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_price_history_changed_by_fkey'
            columns: ['changed_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      inventory_counts: {
        Row: {
          id: string
          reference: string
          status: 'draft' | 'in_progress' | 'completed' | 'cancelled'
          counted_by: string | null
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reference: string
          status?: 'draft' | 'in_progress' | 'completed' | 'cancelled'
          counted_by?: string | null
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reference?: string
          status?: 'draft' | 'in_progress' | 'completed' | 'cancelled'
          counted_by?: string | null
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_counts_counted_by_fkey'
            columns: ['counted_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      inventory_count_items: {
        Row: {
          id: string
          inventory_count_id: string
          product_id: string
          system_quantity: number
          counted_quantity: number
          difference: number
          system_quantity_at_completion: number | null
          interim_movement_quantity: number | null
          actual_reconciliation_difference: number | null
          resulting_stock: number | null
          completed_at: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          inventory_count_id: string
          product_id: string
          system_quantity: number
          counted_quantity: number
          difference: number
          system_quantity_at_completion?: number | null
          interim_movement_quantity?: number | null
          actual_reconciliation_difference?: number | null
          resulting_stock?: number | null
          completed_at?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          inventory_count_id?: string
          product_id?: string
          system_quantity?: number
          counted_quantity?: number
          difference?: number
          system_quantity_at_completion?: number | null
          interim_movement_quantity?: number | null
          actual_reconciliation_difference?: number | null
          resulting_stock?: number | null
          completed_at?: string | null
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_count_items_inventory_count_id_fkey'
            columns: ['inventory_count_id']
            referencedRelation: 'inventory_counts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inventory_count_items_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_batches: {
        Row: {
          id: string
          product_id: string
          batch_number: string
          expiry_date: string
          quantity: number
          purchase_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          batch_number: string
          expiry_date: string
          quantity?: number
          purchase_cost?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          batch_number?: string
          expiry_date?: string
          quantity?: number
          purchase_cost?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_batches_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      is_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mutate_stock_atomic: {
        Args: {
          p_product_id: string
          p_quantity_change: number
          p_movement_type: InventoryMovementType
          p_reference_type?: string | null
          p_reference_id?: string | null
          p_unit_cost?: number | null
          p_notes?: string | null
          p_user_id?: string | null
          p_allow_negative?: boolean
        }
        Returns: number
      }
      get_inventory_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_products: number
          total_stock_quantity: number
          total_inventory_value: number
          low_stock_count: number
          out_of_stock_count: number
        }[]
      }
      complete_inventory_count_atomic: {
        Args: {
          p_count_id: string
          p_items: Json
          p_user_id?: string | null
        }
        Returns: Json
      }
      create_product_atomic: {
        Args: {
          p_product_data: Json
          p_user_id?: string | null
        }
        Returns: string
      }
      record_product_price_change: {
        Args: {
          p_product_id: string
          p_purchase_cost: number
          p_normal_selling_price: number
          p_promo_price?: number | null
          p_minimum_selling_price?: number
          p_reason?: string | null
          p_user_id?: string | null
        }
        Returns: Json
      }
      log_audit_event_atomic: {
        Args: {
          p_action: string
          p_entity_type: string
          p_entity_id?: string | null
          p_old_values?: Json | null
          p_new_values?: Json | null
        }
        Returns: string
      }
    }
    Enums: {
      user_role: UserRole
      order_source: OrderSource
      order_status: OrderStatus
      payment_method: PaymentMethod
      payment_status: PaymentStatus
      inventory_movement_type: InventoryMovementType
      purchase_status: PurchaseStatus
      customer_segment: CustomerSegment
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience Type Helpers for Application Layer
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type Profile = Tables<'profiles'>
export type Category = Tables<'categories'>
export type Product = Tables<'products'>
export type Customer = Tables<'customers'>
export type Supplier = Tables<'suppliers'>
export type Expense = Tables<'expenses'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Purchase = Tables<'purchases'>
export type PurchaseItem = Tables<'purchase_items'>
export type InventoryMovement = Tables<'inventory_movements'>
export type AuditLog = Tables<'audit_logs'>
export type Notification = Tables<'notifications'>
export type Setting = Tables<'settings'>
export type ProductPriceHistory = Tables<'product_price_history'>
export type InventoryCount = Tables<'inventory_counts'>
export type InventoryCountItem = Tables<'inventory_count_items'>
export type ProductBatch = Tables<'product_batches'>

