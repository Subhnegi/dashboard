import type {
  Product,
  Customer,
  Sale,
  Expense,
  BusinessSettings,
  InventoryMovement,
  Payment,
} from '../types';

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const error = json?.error;
    throw new ApiError(
      res.status,
      error?.code || 'UNKNOWN_ERROR',
      error?.message || `Request failed with status ${res.status}`,
      error?.details
    );
  }

  return json as T;
}

// 1. Products API
export async function getProducts(params?: {
  search?: string;
  category?: string;
  stock_status?: string;
  is_active?: number;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.stock_status) searchParams.set('stock_status', params.stock_status);
  if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));

  const qs = searchParams.toString();
  const data = await request<{ products: Product[] }>(`/api/products${qs ? `?${qs}` : ''}`);
  return data.products;
}

export async function getProduct(id: string): Promise<{ product: Product; movements: InventoryMovement[] }> {
  return request<{ product: Product; movements: InventoryMovement[] }>(`/api/products/${id}`);
}

export async function createProduct(payload: {
  name: string;
  sku?: string | null;
  category: string;
  description?: string | null;
  selling_price_minor: number;
  cost_price_minor: number;
  stock_quantity: number;
  reorder_level: number;
}): Promise<Product> {
  const data = await request<{ product: Product }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const data = await request<{ product: Product }>(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.product;
}

export async function adjustProductStock(
  id: string,
  payload: { delta: number; reason: string; note?: string | null }
): Promise<{ product: Product; movementId: string }> {
  return request<{ product: Product; movementId: string }>(`/api/products/${id}/adjust-stock`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deactivateProduct(id: string): Promise<Product> {
  const data = await request<{ product: Product }>(`/api/products/${id}/deactivate`, {
    method: 'POST',
  });
  return data.product;
}

// 2. Customers API
export async function getCustomers(params?: { search?: string; is_active?: number }): Promise<Customer[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));

  const qs = searchParams.toString();
  const data = await request<{ customers: Customer[] }>(`/api/customers${qs ? `?${qs}` : ''}`);
  return data.customers;
}

export async function getCustomer(id: string): Promise<{ customer: Customer; sales: Sale[] }> {
  return request<{ customer: Customer; sales: Sale[] }>(`/api/customers/${id}`);
}

export async function createCustomer(payload: {
  name: string;
  phone?: string | null;
  email?: string | null;
  billing_address?: string | null;
  notes?: string | null;
}): Promise<Customer> {
  const data = await request<{ customer: Customer }>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.customer;
}

// 3. Sales API
export async function getSales(params?: {
  search?: string;
  status?: string;
  payment_status?: string;
}): Promise<Sale[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.payment_status) searchParams.set('payment_status', params.payment_status);

  const qs = searchParams.toString();
  const data = await request<{ sales: Sale[] }>(`/api/sales${qs ? `?${qs}` : ''}`);
  return data.sales;
}

export async function getSale(id: string): Promise<{ sale: Sale; items: any[]; payments: Payment[] }> {
  return request<{ sale: Sale; items: any[]; payments: Payment[] }>(`/api/sales/${id}`);
}

export async function createSale(payload: {
  customer_id?: string | null;
  customer_name: string;
  customer_contact?: string | null;
  sale_date?: string;
  discount_minor?: number;
  tax_minor?: number;
  notes?: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price_minor?: number;
  }>;
  initial_payment?: {
    amount_minor: number;
    method: string;
    reference?: string | null;
    note?: string | null;
  };
}): Promise<{ sale: Sale; items: any[]; payments: Payment[] }> {
  return request<{ sale: Sale; items: any[]; payments: Payment[] }>('/api/sales', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelSale(id: string, reason: string): Promise<{ sale: Sale }> {
  return request<{ sale: Sale }>(`/api/sales/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// 4. Invoices & Payments API
export async function getInvoice(saleId: string): Promise<any> {
  return request<any>(`/api/sales/${saleId}/invoice`);
}

export async function recordPayment(
  saleId: string,
  payload: { amount_minor: number; method: string; reference?: string | null; note?: string | null }
): Promise<{ payment: Payment; balance_due_minor: number; payment_status: string }> {
  return request<{ payment: Payment; balance_due_minor: number; payment_status: string }>(
    `/api/sales/${saleId}/payments`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

// 5. Expenses API
export async function getExpenses(params?: { search?: string; category?: string }): Promise<Expense[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category) searchParams.set('category', params.category);

  const qs = searchParams.toString();
  const data = await request<{ expenses: Expense[] }>(`/api/expenses${qs ? `?${qs}` : ''}`);
  return data.expenses;
}

export async function createExpense(payload: {
  description: string;
  category: string;
  amount_minor: number;
  expense_date?: string;
  payment_method?: string | null;
  vendor?: string | null;
  notes?: string | null;
}): Promise<Expense> {
  const data = await request<{ expense: Expense }>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/expenses/${id}`, {
    method: 'DELETE',
  });
}

// 6. Dashboard & Reports API
export async function getDashboardData(range: string = '30d'): Promise<any> {
  return request<any>(`/api/dashboard?range=${range}`);
}

export async function getSalesReport(from?: string, to?: string): Promise<any> {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  return request<any>(`/api/reports/sales${qs.toString() ? `?${qs.toString()}` : ''}`);
}

export async function getExpensesReport(from?: string, to?: string): Promise<any> {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  return request<any>(`/api/reports/expenses${qs.toString() ? `?${qs.toString()}` : ''}`);
}

export async function getInventoryReport(): Promise<any> {
  return request<any>('/api/reports/inventory');
}

// 7. Settings & Demo API
export async function getSettings(): Promise<BusinessSettings> {
  const data = await request<{ settings: BusinessSettings }>('/api/settings');
  return data.settings;
}

export async function updateSettings(updates: Partial<BusinessSettings>): Promise<BusinessSettings> {
  const data = await request<{ settings: BusinessSettings }>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.settings;
}

export async function resetDemoDatabase(): Promise<void> {
  await request<{ success: boolean }>('/api/demo/reset', {
    method: 'POST',
  });
}
