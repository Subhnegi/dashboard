export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  selling_price_minor: number; // In paise (INR 1 = 100 paise)
  cost_price_minor: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  billing_address?: string;
  notes?: string;
  is_active: boolean;
  total_sales_count?: number;
  lifetime_value_minor?: number;
  outstanding_balance_minor?: number;
  created_at: string;
  updated_at: string;
}

export type SaleStatus = 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price_minor: number;
  unit_cost_minor?: number;
  line_subtotal_minor: number;
  created_at: string;
}

export interface Payment {
  id: string;
  sale_id: string;
  amount_minor: number;
  payment_date: string;
  method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'OTHER';
  reference?: string;
  note?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  customer_id?: string;
  customer_name_snapshot: string;
  customer_contact_snapshot?: string;
  sale_date: string;
  status: SaleStatus;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  notes?: string;
  items: SaleItem[];
  payments: Payment[];
  amount_paid_minor?: number;
  balance_due_minor?: number;
  payment_status?: PaymentStatus;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'OPENING_BALANCE' | 'SALE' | 'STOCK_RECEIVED' | 'DAMAGED_LOST' | 'MANUAL_CORRECTION' | 'SALE_REVERSAL';
  quantity_delta: number;
  reason: string;
  reference_type?: string;
  reference_id?: string;
  note?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  category: 'Rent' | 'Utilities' | 'Supplies' | 'Marketing' | 'Software' | 'Travel' | 'Other';
  amount_minor: number;
  expense_date: string;
  payment_method?: string;
  vendor?: string;
  notes?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  currency_code: string;
  default_tax_rate_basis_points: number; // e.g. 1800 for 18%
  invoice_prefix: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalSalesMinor: number;
  totalExpensesMinor: number;
  estimatedProfitMinor: number;
  ordersCount: number;
  salesGrowthPercent?: number;
  ordersGrowthPercent?: number;
}
