export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'admin' | 'staff' | 'customer'
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
  | 'failed_delivery'

export type PromotionType =
  | 'product'
  | 'category'
  | 'cart'
  | 'first_order'
  | 'buy_x_get_y'
  | 'minimum_spend'

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_item'

export type PromotionStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'expired'
  | 'archived'

export type LoyaltyTransactionType =
  | 'earn'
  | 'redeem'
  | 'expire'
  | 'adjustment'
  | 'reversal'

export type DeliveryStatus =
  | 'unassigned'
  | 'assigned'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'

export type ItemFulfillmentStatus =
  | 'pending'
  | 'picked'
  | 'packed'
  | 'unavailable'
export type PaymentMethod =
  | 'cash'
  | 'card_on_delivery'
  | 'card_online'
  | 'credit'
  | 'other'
  | 'bank_transfer'
  | 'cheque'
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
export type PurchaseStatus =
  | 'draft'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled'
  | 'closed'
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
          auth_user_id: string | null
          name: string
          email: string | null
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
          auth_user_id?: string | null
          name: string
          email?: string | null
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
          auth_user_id?: string | null
          name?: string
          email?: string | null
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
        Relationships: [
          {
            foreignKeyName: 'customers_auth_user_id_fkey'
            columns: ['auth_user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          label: string
          recipient_name: string
          phone: string
          building_or_villa: string
          street: string
          area: string
          city: string
          emirate: string
          zone: string
          delivery_instructions: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          label?: string
          recipient_name: string
          phone: string
          building_or_villa: string
          street: string
          area: string
          city?: string
          emirate?: string
          zone?: string
          delivery_instructions?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          label?: string
          recipient_name?: string
          phone?: string
          building_or_villa?: string
          street?: string
          area?: string
          city?: string
          emirate?: string
          zone?: string
          delivery_instructions?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_addresses_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      suppliers: {
        Row: {
          id: string
          supplier_code: string | null
          name: string
          contact_person: string | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          address: string | null
          tax_identifier: string | null
          payment_terms: string
          credit_limit: number
          notes: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_code?: string | null
          name: string
          contact_person?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          address?: string | null
          tax_identifier?: string | null
          payment_terms?: string
          credit_limit?: number
          notes?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_code?: string | null
          name?: string
          contact_person?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          address?: string | null
          tax_identifier?: string | null
          payment_terms?: string
          credit_limit?: number
          notes?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
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
          promotion_discount: number
          coupon_discount: number
          loyalty_discount: number
          coupon_id: string | null
          coupon_code_snapshot: string | null
          loyalty_points_redeemed: number
          loyalty_points_earned: number
          promotion_snapshots: Json
          tax_amount: number
          delivery_fee: number
          total_amount: number
          delivery_address: string
          delivery_notes: string | null
          recipient_name: string | null
          recipient_phone: string | null
          internal_notes: string | null
          assigned_driver_id: string | null
          confirmed_at: string | null
          preparing_at: string | null
          ready_at: string | null
          out_for_delivery_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          failed_at: string | null
          failure_reason: string | null
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
          promotion_discount?: number
          coupon_discount?: number
          loyalty_discount?: number
          coupon_id?: string | null
          coupon_code_snapshot?: string | null
          loyalty_points_redeemed?: number
          loyalty_points_earned?: number
          promotion_snapshots?: Json
          tax_amount?: number
          delivery_fee?: number
          total_amount?: number
          delivery_address: string
          delivery_notes?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          internal_notes?: string | null
          assigned_driver_id?: string | null
          confirmed_at?: string | null
          preparing_at?: string | null
          ready_at?: string | null
          out_for_delivery_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          failed_at?: string | null
          failure_reason?: string | null
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
          promotion_discount?: number
          coupon_discount?: number
          loyalty_discount?: number
          coupon_id?: string | null
          coupon_code_snapshot?: string | null
          loyalty_points_redeemed?: number
          loyalty_points_earned?: number
          promotion_snapshots?: Json
          tax_amount?: number
          delivery_fee?: number
          total_amount?: number
          delivery_address?: string
          delivery_notes?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          internal_notes?: string | null
          assigned_driver_id?: string | null
          confirmed_at?: string | null
          preparing_at?: string | null
          ready_at?: string | null
          out_for_delivery_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          failed_at?: string | null
          failure_reason?: string | null
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
          fulfillment_status: ItemFulfillmentStatus
          prepared_quantity: number
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
          fulfillment_status?: ItemFulfillmentStatus
          prepared_quantity?: number
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
          fulfillment_status?: ItemFulfillmentStatus
          prepared_quantity?: number
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
          purchase_number: string
          supplier_id: string
          invoice_number: string
          purchase_date: string
          expected_delivery_date: string | null
          subtotal: number
          supplier_discount: number
          tax_amount: number
          additional_charges: number
          total_amount: number
          attachment_url: string | null
          notes: string | null
          status: PurchaseStatus
          invoice_status: 'unbilled' | 'partially_billed' | 'billed'
          payment_status: PaymentStatus
          ordered_at: string | null
          ordered_by: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          purchase_number?: string
          supplier_id: string
          invoice_number?: string
          purchase_date?: string
          expected_delivery_date?: string | null
          subtotal?: number
          supplier_discount?: number
          tax_amount?: number
          additional_charges?: number
          total_amount?: number
          attachment_url?: string | null
          notes?: string | null
          status?: PurchaseStatus
          invoice_status?: 'unbilled' | 'partially_billed' | 'billed'
          payment_status?: PaymentStatus
          ordered_at?: string | null
          ordered_by?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          purchase_number?: string
          supplier_id?: string
          invoice_number?: string
          purchase_date?: string
          expected_delivery_date?: string | null
          subtotal?: number
          supplier_discount?: number
          tax_amount?: number
          additional_charges?: number
          total_amount?: number
          attachment_url?: string | null
          notes?: string | null
          status?: PurchaseStatus
          invoice_status?: 'unbilled' | 'partially_billed' | 'billed'
          payment_status?: PaymentStatus
          ordered_at?: string | null
          ordered_by?: string | null
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
          {
            foreignKeyName: 'purchases_ordered_by_fkey'
            columns: ['ordered_by']
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
          received_quantity: number
          purchase_price: number
          discount_amount: number
          tax_amount: number
          final_unit_cost: number
          total_cost: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id: string
          quantity: number
          received_quantity?: number
          purchase_price: number
          discount_amount?: number
          tax_amount?: number
          final_unit_cost: number
          total_cost: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string
          quantity?: number
          received_quantity?: number
          purchase_price?: number
          discount_amount?: number
          tax_amount?: number
          final_unit_cost?: number
          total_cost?: number
          notes?: string | null
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
      goods_received_notes: {
        Row: {
          id: string
          purchase_id: string
          supplier_id: string
          grn_number: string
          delivery_note_number: string | null
          status: 'completed' | 'cancelled'
          notes: string | null
          received_at: string
          received_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          supplier_id: string
          grn_number: string
          delivery_note_number?: string | null
          status?: 'completed' | 'cancelled'
          notes?: string | null
          received_at?: string
          received_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          supplier_id?: string
          grn_number?: string
          delivery_note_number?: string | null
          status?: 'completed' | 'cancelled'
          notes?: string | null
          received_at?: string
          received_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goods_received_notes_purchase_id_fkey'
            columns: ['purchase_id']
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goods_received_notes_supplier_id_fkey'
            columns: ['supplier_id']
            referencedRelation: 'suppliers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goods_received_notes_received_by_fkey'
            columns: ['received_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      goods_received_items: {
        Row: {
          id: string
          grn_id: string
          purchase_item_id: string
          product_id: string
          ordered_quantity: number
          previously_received_quantity: number
          received_quantity: number
          accepted_quantity: number
          rejected_quantity: number
          unit_cost: number
          total_cost: number
          batch_number: string | null
          expiry_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          grn_id: string
          purchase_item_id: string
          product_id: string
          ordered_quantity: number
          previously_received_quantity?: number
          received_quantity: number
          accepted_quantity: number
          rejected_quantity?: number
          unit_cost: number
          total_cost: number
          batch_number?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          grn_id?: string
          purchase_item_id?: string
          product_id?: string
          ordered_quantity?: number
          previously_received_quantity?: number
          received_quantity?: number
          accepted_quantity?: number
          rejected_quantity?: number
          unit_cost?: number
          total_cost?: number
          batch_number?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goods_received_items_grn_id_fkey'
            columns: ['grn_id']
            referencedRelation: 'goods_received_notes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goods_received_items_purchase_item_id_fkey'
            columns: ['purchase_item_id']
            referencedRelation: 'purchase_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goods_received_items_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      supplier_invoices: {
        Row: {
          id: string
          supplier_id: string
          purchase_id: string | null
          invoice_number: string
          invoice_date: string
          due_date: string
          subtotal: number
          discount_amount: number
          tax_amount: number
          total_amount: number
          paid_amount: number
          outstanding_amount: number
          status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
          attachment_url: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          purchase_id?: string | null
          invoice_number: string
          invoice_date?: string
          due_date: string
          subtotal?: number
          discount_amount?: number
          tax_amount?: number
          total_amount?: number
          paid_amount?: number
          outstanding_amount?: number
          status?: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
          attachment_url?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          purchase_id?: string | null
          invoice_number?: string
          invoice_date?: string
          due_date?: string
          subtotal?: number
          discount_amount?: number
          tax_amount?: number
          total_amount?: number
          paid_amount?: number
          outstanding_amount?: number
          status?: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
          attachment_url?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'supplier_invoices_supplier_id_fkey'
            columns: ['supplier_id']
            referencedRelation: 'suppliers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supplier_invoices_purchase_id_fkey'
            columns: ['purchase_id']
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supplier_invoices_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      supplier_payments: {
        Row: {
          id: string
          payment_number: string
          supplier_id: string
          invoice_id: string | null
          amount: number
          payment_date: string
          payment_method: PaymentMethod
          reference: string | null
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          payment_number?: string
          supplier_id: string
          invoice_id?: string | null
          amount: number
          payment_date?: string
          payment_method?: PaymentMethod
          reference?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          payment_number?: string
          supplier_id?: string
          invoice_id?: string | null
          amount?: number
          payment_date?: string
          payment_method?: PaymentMethod
          reference?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'supplier_payments_supplier_id_fkey'
            columns: ['supplier_id']
            referencedRelation: 'suppliers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supplier_payments_invoice_id_fkey'
            columns: ['invoice_id']
            referencedRelation: 'supplier_invoices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supplier_payments_recorded_by_fkey'
            columns: ['recorded_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      supplier_returns: {
        Row: {
          id: string
          return_number: string
          supplier_id: string
          purchase_id: string
          status: 'draft' | 'requested' | 'approved' | 'completed' | 'rejected' | 'cancelled'
          total_amount: number
          reason: string
          notes: string | null
          requested_by: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          return_number?: string
          supplier_id: string
          purchase_id: string
          status?: 'draft' | 'requested' | 'approved' | 'completed' | 'rejected' | 'cancelled'
          total_amount?: number
          reason: string
          notes?: string | null
          requested_by?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          return_number?: string
          supplier_id?: string
          purchase_id?: string
          status?: 'draft' | 'requested' | 'approved' | 'completed' | 'rejected' | 'cancelled'
          total_amount?: number
          reason?: string
          notes?: string | null
          requested_by?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'supplier_returns_supplier_id_fkey'
            columns: ['supplier_id']
            referencedRelation: 'suppliers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supplier_returns_purchase_id_fkey'
            columns: ['purchase_id']
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supplier_returns_requested_by_fkey'
            columns: ['requested_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supplier_returns_approved_by_fkey'
            columns: ['approved_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      supplier_return_items: {
        Row: {
          id: string
          return_id: string
          product_id: string
          quantity: number
          unit_cost: number
          total_cost: number
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          return_id: string
          product_id: string
          quantity: number
          unit_cost: number
          total_cost: number
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          return_id?: string
          product_id?: string
          quantity?: number
          unit_cost?: number
          total_cost?: number
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'supplier_return_items_return_id_fkey'
            columns: ['return_id']
            referencedRelation: 'supplier_returns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supplier_return_items_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          from_status: OrderStatus | null
          to_status: OrderStatus
          changed_by: string | null
          reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          from_status?: OrderStatus | null
          to_status: OrderStatus
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          from_status?: OrderStatus | null
          to_status?: OrderStatus
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_status_history_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_status_history_changed_by_fkey'
            columns: ['changed_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      order_notes: {
        Row: {
          id: string
          order_id: string
          author_id: string | null
          note: string
          visibility: 'internal' | 'customer'
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          author_id?: string | null
          note: string
          visibility?: 'internal' | 'customer'
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          author_id?: string | null
          note?: string
          visibility?: 'internal' | 'customer'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_notes_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_notes_author_id_fkey'
            columns: ['author_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      deliveries: {
        Row: {
          id: string
          order_id: string
          assigned_to: string | null
          status: DeliveryStatus
          delivery_address: string
          recipient_name: string | null
          recipient_phone: string | null
          delivery_notes: string | null
          assigned_at: string | null
          picked_up_at: string | null
          delivered_at: string | null
          failed_at: string | null
          failure_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          assigned_to?: string | null
          status?: DeliveryStatus
          delivery_address: string
          recipient_name?: string | null
          recipient_phone?: string | null
          delivery_notes?: string | null
          assigned_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          assigned_to?: string | null
          status?: DeliveryStatus
          delivery_address?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          delivery_notes?: string | null
          assigned_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'deliveries_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deliveries_assigned_to_fkey'
            columns: ['assigned_to']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      promotions: {
        Row: {
          id: string
          name: string
          description: string | null
          promotion_type: PromotionType
          discount_type: DiscountType
          discount_value: number
          minimum_order_amount: number
          maximum_discount_amount: number | null
          buy_quantity: number | null
          get_quantity: number | null
          start_at: string
          end_at: string | null
          status: PromotionStatus
          usage_limit: number | null
          usage_count: number
          per_customer_limit: number | null
          is_exclusive: boolean
          banner_text: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          promotion_type: PromotionType
          discount_type: DiscountType
          discount_value: number
          minimum_order_amount?: number
          maximum_discount_amount?: number | null
          buy_quantity?: number | null
          get_quantity?: number | null
          start_at?: string
          end_at?: string | null
          status?: PromotionStatus
          usage_limit?: number | null
          usage_count?: number
          per_customer_limit?: number | null
          is_exclusive?: boolean
          banner_text?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          promotion_type?: PromotionType
          discount_type?: DiscountType
          discount_value?: number
          minimum_order_amount?: number
          maximum_discount_amount?: number | null
          buy_quantity?: number | null
          get_quantity?: number | null
          start_at?: string
          end_at?: string | null
          status?: PromotionStatus
          usage_limit?: number | null
          usage_count?: number
          per_customer_limit?: number | null
          is_exclusive?: boolean
          banner_text?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'promotions_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      promotion_products: {
        Row: {
          id: string
          promotion_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          promotion_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          promotion_id?: string
          product_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'promotion_products_promotion_id_fkey'
            columns: ['promotion_id']
            referencedRelation: 'promotions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'promotion_products_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      promotion_categories: {
        Row: {
          id: string
          promotion_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          id?: string
          promotion_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          id?: string
          promotion_id?: string
          category_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'promotion_categories_promotion_id_fkey'
            columns: ['promotion_id']
            referencedRelation: 'promotions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'promotion_categories_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      coupons: {
        Row: {
          id: string
          code: string
          promotion_id: string
          usage_limit: number | null
          usage_count: number
          per_customer_limit: number
          minimum_order_amount: number | null
          maximum_discount_amount: number | null
          start_at: string
          end_at: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          promotion_id: string
          usage_limit?: number | null
          usage_count?: number
          per_customer_limit?: number
          minimum_order_amount?: number | null
          maximum_discount_amount?: number | null
          start_at?: string
          end_at?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          promotion_id?: string
          usage_limit?: number | null
          usage_count?: number
          per_customer_limit?: number
          minimum_order_amount?: number | null
          maximum_discount_amount?: number | null
          start_at?: string
          end_at?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'coupons_promotion_id_fkey'
            columns: ['promotion_id']
            referencedRelation: 'promotions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coupons_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          id: string
          coupon_id: string
          customer_id: string
          order_id: string
          discount_amount: number
          redeemed_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          customer_id: string
          order_id: string
          discount_amount: number
          redeemed_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          customer_id?: string
          order_id?: string
          discount_amount?: number
          redeemed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'coupon_redemptions_coupon_id_fkey'
            columns: ['coupon_id']
            referencedRelation: 'coupons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coupon_redemptions_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coupon_redemptions_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      customer_loyalty_accounts: {
        Row: {
          id: string
          customer_id: string
          points_balance: number
          lifetime_points_earned: number
          lifetime_points_redeemed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          points_balance?: number
          lifetime_points_earned?: number
          lifetime_points_redeemed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          points_balance?: number
          lifetime_points_earned?: number
          lifetime_points_redeemed?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_loyalty_accounts_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          id: string
          customer_id: string
          order_id: string | null
          transaction_type: LoyaltyTransactionType
          points: number
          balance_before: number
          balance_after: number
          reason: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          order_id?: string | null
          transaction_type: LoyaltyTransactionType
          points: number
          balance_before: number
          balance_after: number
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          order_id?: string | null
          transaction_type?: LoyaltyTransactionType
          points?: number
          balance_before?: number
          balance_after?: number
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'loyalty_transactions_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'loyalty_transactions_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
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
      receive_purchase_order_atomic: {
        Args: {
          p_purchase_id: string
          p_items: Json
          p_delivery_note?: string | null
          p_notes?: string | null
          p_user_id?: string | null
        }
        Returns: Json
      }
      record_supplier_payment_atomic: {
        Args: {
          p_supplier_id: string
          p_invoice_id?: string | null
          p_amount: number
          p_payment_method: PaymentMethod
          p_payment_date?: string | null
          p_reference?: string | null
          p_notes?: string | null
          p_user_id?: string | null
        }
        Returns: Json
      }
      complete_supplier_return_atomic: {
        Args: {
          p_return_id: string
          p_user_id?: string | null
        }
        Returns: Json
      }
      generate_document_code: {
        Args: {
          p_prefix: string
          p_seq: string
        }
        Returns: string
      }
      create_customer_order_atomic: {
        Args: {
          p_customer_id?: string | null
          p_items: Json
          p_delivery_address: string
          p_delivery_notes?: string | null
          p_payment_method?: PaymentMethod
          p_order_source?: OrderSource
          p_user_id?: string | null
          p_coupon_code?: string | null
          p_loyalty_points_to_redeem?: number
        }
        Returns: Json
      }
      cancel_customer_order_atomic: {
        Args: {
          p_order_id: string
          p_reason?: string | null
          p_user_id?: string | null
        }
        Returns: Json
      }
      transition_order_status_atomic: {
        Args: {
          p_order_id: string
          p_next_status: OrderStatus
          p_reason?: string | null
          p_notes?: string | null
          p_driver_id?: string | null
          p_failure_reason?: string | null
        }
        Returns: Json
      }
      assign_order_delivery_atomic: {
        Args: {
          p_order_id: string
          p_driver_id: string
          p_notes?: string | null
        }
        Returns: Json
      }
      update_item_fulfillment_atomic: {
        Args: {
          p_order_id: string
          p_item_id: string
          p_status: string
          p_prepared_qty?: number
        }
        Returns: Json
      }
      collect_order_payment_atomic: {
        Args: {
          p_order_id: string
          p_amount: number
          p_payment_method: PaymentMethod
          p_reference?: string | null
        }
        Returns: Json
      }
      cancel_order_staff_atomic: {
        Args: {
          p_order_id: string
          p_reason: string
          p_restock?: boolean
        }
        Returns: Json
      }
      add_order_note_atomic: {
        Args: {
          p_order_id: string
          p_note: string
          p_visibility?: string
        }
        Returns: Json
      }
      adjust_loyalty_points_atomic: {
        Args: {
          p_customer_id: string
          p_points: number
          p_reason: string
        }
        Returns: Json
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
      promotion_type: PromotionType
      discount_type: DiscountType
      promotion_status: PromotionStatus
      loyalty_transaction_type: LoyaltyTransactionType
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
export type CustomerAddress = Tables<'customer_addresses'>
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
export type GoodsReceivedNote = Tables<'goods_received_notes'>
export type GoodsReceivedItem = Tables<'goods_received_items'>
export type SupplierInvoice = Tables<'supplier_invoices'>
export type SupplierPayment = Tables<'supplier_payments'>
export type SupplierReturn = Tables<'supplier_returns'>
export type SupplierReturnItem = Tables<'supplier_return_items'>
export type OrderStatusHistory = Tables<'order_status_history'>
export type OrderNote = Tables<'order_notes'>
export type Delivery = Tables<'deliveries'>
export type Promotion = Tables<'promotions'>
export type PromotionProduct = Tables<'promotion_products'>
export type PromotionCategory = Tables<'promotion_categories'>
export type Coupon = Tables<'coupons'>
export type CouponRedemption = Tables<'coupon_redemptions'>
export type CustomerLoyaltyAccount = Tables<'customer_loyalty_accounts'>
export type LoyaltyTransaction = Tables<'loyalty_transactions'>



