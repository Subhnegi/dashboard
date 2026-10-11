import type { Product, StockStatus, Sale, PaymentStatus } from '../types';

/**
 * Format paise (minor units) into Indian Rupee string (₹)
 * Example: 150000 paise -> ₹1,500.00
 */
export function formatCurrency(minorUnits: number): string {
  const rupees = (minorUnits || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format compact currency for charts and KPI cards
 */
export function formatCompactCurrency(minorUnits: number): string {
  const rupees = (minorUnits || 0) / 100;
  if (Math.abs(rupees) >= 100000) {
    return `₹${(rupees / 100000).toFixed(1)}L`;
  }
  if (Math.abs(rupees) >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}k`;
  }
  return formatCurrency(minorUnits);
}

/**
 * Format date string into human readable localized date
 * Example: 2026-10-11T12:00:00Z -> 11 Oct 2026
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Derive stock status strictly according to product stock quantity and reorder level
 */
export function getProductStockStatus(product: Product): StockStatus {
  if (!product.is_active) {
    return 'INACTIVE';
  }
  if (product.stock_quantity <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (product.stock_quantity <= product.reorder_level) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}

/**
 * Derive payment status strictly from sale total and eligible payments
 */
export function getSalePaymentStatus(sale: Sale): PaymentStatus {
  const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount_minor, 0);
  if (totalPaid >= sale.total_minor) {
    return 'PAID';
  }
  if (totalPaid > 0) {
    return 'PARTIALLY_PAID';
  }
  return 'UNPAID';
}

/**
 * Calculate outstanding balance for a sale
 */
export function getSaleBalanceDue(sale: Sale): number {
  const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount_minor, 0);
  return Math.max(0, sale.total_minor - totalPaid);
}
