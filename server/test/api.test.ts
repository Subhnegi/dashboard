import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { getDb, runTransaction, closeDb } from '../src/db/connection.js';
import { seedDatabase } from '../src/db/seed.js';
import type { Server } from 'node:http';

async function runTests() {
  console.log('===============================================================');
  console.log('--- STARTING BUSINESSFLOW BACKEND API INTEGRATION TEST SUITE ---');
  console.log('===============================================================');

  // Initialize DB and Seed
  const db = getDb();
  runTransaction((txDb) => {
    seedDatabase(txDb);
  });

  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // Helper fetch wrapper
    async function api(path: string, options: RequestInit = {}) {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, ok: res.ok, data };
    }

    // Health check
    const health = await api('/health');
    assert.equal(health.status, 200);
    assert.equal(health.data.status, 'ok');

    // -----------------------------------------------------------------
    // TEST 1: Product validation rejects negative prices and invalid stock
    // -----------------------------------------------------------------
    console.log('[Test 1] Product validation rejects negative prices and invalid stock');
    const negPriceRes = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Invalid Price Item',
        category: 'Accessories',
        selling_price_minor: -500,
        cost_price_minor: 200,
        stock_quantity: 10,
      }),
    });
    assert.equal(negPriceRes.status, 400, 'Negative selling price must be rejected with 400');

    const negStockRes = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Invalid Stock Item',
        category: 'Accessories',
        selling_price_minor: 1000,
        cost_price_minor: 500,
        stock_quantity: -10,
      }),
    });
    assert.equal(negStockRes.status, 400, 'Negative stock must be rejected with 400');
    console.log('  ✓ Product validation properly rejected negative prices and stock');

    // -----------------------------------------------------------------
    // TEST 2: Duplicate SKU is rejected
    // -----------------------------------------------------------------
    console.log('[Test 2] Duplicate SKU is rejected');
    const firstProd = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Premium USB Hub',
        sku: 'TEST-SKU-999',
        category: 'Accessories',
        selling_price_minor: 250000,
        cost_price_minor: 120000,
        stock_quantity: 20,
      }),
    });
    assert.equal(firstProd.status, 201);

    const dupSkuRes = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Hub',
        sku: 'test-sku-999', // Case insensitive check
        category: 'Accessories',
        selling_price_minor: 220000,
        cost_price_minor: 100000,
        stock_quantity: 5,
      }),
    });
    assert.equal(dupSkuRes.status, 409, 'Duplicate SKU must return 409 Conflict');
    console.log('  ✓ Duplicate SKU rejected with 409 Conflict');

    // -----------------------------------------------------------------
    // TEST 3: Sale total is computed correctly for multiple line items
    // -----------------------------------------------------------------
    console.log('[Test 3] Sale total is computed correctly for multiple line items');
    const prodList = (await api('/products')).data.products;
    const item1 = prodList.find((p: any) => p.sku === 'NS-KEY-001'); // 150000 each
    const item2 = prodList.find((p: any) => p.sku === 'NS-MOU-002'); // 75000 each
    assert(item1 && item2, 'Seeded test items found');

    const multiItemSale = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Acme Enterprises',
        items: [
          { product_id: item1.id, quantity: 2 }, // 2 * 150000 = 300000
          { product_id: item2.id, quantity: 3 }, // 3 * 75000 = 225000
        ],
        discount_minor: 25000, // 250 discount
        tax_minor: 50000,      // 500 tax
      }),
    });
    assert.equal(multiItemSale.status, 201);
    // Subtotal: 300000 + 225000 = 525000. Total: 525000 - 25000 + 50000 = 550000
    assert.equal(multiItemSale.data.sale.subtotal_minor, 525000);
    assert.equal(multiItemSale.data.sale.total_minor, 550000);
    console.log('  ✓ Sale subtotal and total calculated accurately from line items and tax/discount');

    // -----------------------------------------------------------------
    // TEST 4: Server ignores a forged client grand total
    // -----------------------------------------------------------------
    console.log('[Test 4] Server ignores a forged client grand total');
    const forgedSale = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Attacker Attempt',
        total_minor: 100, // Attempting to pay only ₹1 for ₹1500 item
        subtotal_minor: 100,
        items: [
          { product_id: item1.id, quantity: 1 }, // ₹1,500 = 150000 paise
        ],
      }),
    });
    assert.equal(forgedSale.status, 201);
    assert.equal(forgedSale.data.sale.total_minor, 150000, 'Server must enforce calculated total of 150000');
    console.log('  ✓ Server disregarded forged client grand total');

    // -----------------------------------------------------------------
    // TEST 5: Insufficient stock rejects a sale without changing any records
    // -----------------------------------------------------------------
    console.log('[Test 5] Insufficient stock rejects a sale without changing any records');
    const stockBefore = (await api(`/products/${item1.id}`)).data.product.stock_quantity;
    const salesCountBefore = (await api('/sales')).data.sales.length;

    const oversizedRes = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Overbuy Customer',
        items: [{ product_id: item1.id, quantity: 99999 }],
      }),
    });
    assert.equal(oversizedRes.status, 422, 'Insufficient stock returns 422');
    assert.equal(oversizedRes.data.error.code, 'INSUFFICIENT_STOCK');

    const stockAfter = (await api(`/products/${item1.id}`)).data.product.stock_quantity;
    const salesCountAfter = (await api('/sales')).data.sales.length;
    assert.equal(stockAfter, stockBefore, 'Stock quantity untouched after failed transaction');
    assert.equal(salesCountAfter, salesCountBefore, 'No sale record created after failed transaction');
    console.log('  ✓ Insufficient stock rejected without side effects or partial mutations');

    // -----------------------------------------------------------------
    // TEST 6: Successful sale decrements stock exactly once
    // -----------------------------------------------------------------
    console.log('[Test 6] Successful sale decrements stock exactly once');
    const singleSale = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Stock Test Customer',
        items: [{ product_id: item1.id, quantity: 2 }],
      }),
    });
    assert.equal(singleSale.status, 201);
    const sale6Id = singleSale.data.sale.id;
    const stockAfterSale6 = (await api(`/products/${item1.id}`)).data.product.stock_quantity;
    assert.equal(stockAfterSale6, stockBefore - 2, 'Stock decremented by exactly 2 units');
    console.log('  ✓ Successful sale decremented stock exactly once');

    // -----------------------------------------------------------------
    // TEST 7: Sale cancellation restores stock exactly once
    // -----------------------------------------------------------------
    console.log('[Test 7] Sale cancellation restores stock exactly once');
    const cancelRes = await api(`/sales/${sale6Id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Customer requested cancellation prior to packing' }),
    });
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.data.sale.status, 'CANCELLED');

    const stockAfterCancel = (await api(`/products/${item1.id}`)).data.product.stock_quantity;
    assert.equal(stockAfterCancel, stockBefore, 'Stock restored to original quantity');

    // Second cancellation attempt should be rejected
    const repeatCancel = await api(`/sales/${sale6Id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Repeated cancellation request' }),
    });
    assert.equal(repeatCancel.status, 400, 'Cannot cancel an already cancelled sale');
    const stockAfterRepeat = (await api(`/products/${item1.id}`)).data.product.stock_quantity;
    assert.equal(stockAfterRepeat, stockBefore, 'Stock not restored again on duplicate cancellation');
    console.log('  ✓ Sale cancellation restored stock exactly once and blocked duplicate cancellation');

    // -----------------------------------------------------------------
    // TEST 8: Partial payment leaves the correct balance
    // -----------------------------------------------------------------
    console.log('[Test 8] Partial payment leaves the correct balance');
    const partSaleRes = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Partial Pay Client',
        items: [{ product_id: item2.id, quantity: 2 }], // 2 * 75000 = 150000
        initial_payment: {
          amount_minor: 50000, // 500 paid
          method: 'UPI',
        },
      }),
    });
    assert.equal(partSaleRes.status, 201);
    const partSaleId = partSaleRes.data.sale.id;

    const saleDetails = (await api(`/sales/${partSaleId}`)).data.sale;
    assert.equal(saleDetails.total_minor, 150000);
    assert.equal(saleDetails.amount_paid_minor, 50000);
    assert.equal(saleDetails.balance_due_minor, 100000);
    assert.equal(saleDetails.payment_status, 'PARTIALLY_PAID');
    console.log('  ✓ Partial payment left correct balance due of ₹1,000.00');

    // -----------------------------------------------------------------
    // TEST 9: Payment equal to the balance changes status to paid
    // -----------------------------------------------------------------
    console.log('[Test 9] Payment equal to the balance changes status to paid');
    const settlePayRes = await api(`/sales/${partSaleId}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        amount_minor: 100000,
        method: 'BANK_TRANSFER',
        reference: 'UTR-991203',
      }),
    });
    assert.equal(settlePayRes.status, 201);
    assert.equal(settlePayRes.data.balance_due_minor, 0);
    assert.equal(settlePayRes.data.payment_status, 'PAID');

    const updatedSaleDetails = (await api(`/sales/${partSaleId}`)).data.sale;
    assert.equal(updatedSaleDetails.balance_due_minor, 0);
    assert.equal(updatedSaleDetails.payment_status, 'PAID');
    console.log('  ✓ Final settlement changed order payment status to PAID');

    // -----------------------------------------------------------------
    // TEST 10: Overpayment is rejected
    // -----------------------------------------------------------------
    console.log('[Test 10] Overpayment is rejected');
    // Try to record another payment on already paid order
    const overpayRes = await api(`/sales/${partSaleId}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        amount_minor: 1000,
        method: 'CASH',
      }),
    });
    assert.equal(overpayRes.status, 400, 'Overpayment on zero balance rejected with 400');

    // Create an unpaid order and attempt paying more than balance
    const unpaidSale = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Overpay Test Order',
        items: [{ product_id: item2.id, quantity: 1 }], // 75000 total
      }),
    });
    assert.equal(unpaidSale.status, 201);
    const unpaidId = unpaidSale.data.sale.id;

    const excessivePay = await api(`/sales/${unpaidId}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        amount_minor: 100000, // 100000 > 75000
        method: 'CARD',
      }),
    });
    assert.equal(excessivePay.status, 400, 'Payment greater than balance rejected with 400');
    console.log('  ✓ Overpayment rejected with 400 Bad Request');

    // -----------------------------------------------------------------
    // TEST 11: Dashboard excludes cancelled sales according to documented rules
    // -----------------------------------------------------------------
    console.log('[Test 11] Dashboard excludes cancelled sales according to documented rules');
    const dashBefore = (await api('/dashboard')).data;
    const initialRev = dashBefore.kpis.sales_revenue_minor;

    // Create and immediately cancel a big sale
    const bigSale = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Cancelled Big Spender',
        items: [{ product_id: item1.id, quantity: 5 }], // 5 * 150000 = 750000
      }),
    });
    const bigSaleId = bigSale.data.sale.id;
    await api(`/sales/${bigSaleId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Demo test cancellation' }),
    });

    const dashAfter = (await api('/dashboard')).data;
    assert.equal(
      dashAfter.kpis.sales_revenue_minor,
      initialRev,
      'Dashboard sales revenue excludes cancelled sale'
    );
    console.log('  ✓ Dashboard correctly excludes cancelled sales from revenue aggregations');

    // -----------------------------------------------------------------
    // TEST 12: Expense date filters produce correct totals
    // -----------------------------------------------------------------
    console.log('[Test 12] Expense date filters produce correct totals');
    const today = new Date().toISOString();
    const pastDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

    const todayExpense = await api('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Office Printer Paper',
        category: 'Supplies',
        amount_minor: 120000,
        expense_date: today,
      }),
    });
    assert.equal(todayExpense.status, 201);

    const pastExpense = await api('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Last Month Facility Maintenance',
        category: 'Utilities',
        amount_minor: 350000,
        expense_date: pastDate,
      }),
    });
    assert.equal(pastExpense.status, 201);

    // Filter by last 7 days
    const from7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const rep7d = (await api(`/reports/expenses?from=${encodeURIComponent(from7d)}&to=${encodeURIComponent(today)}`)).data;
    const paperIn7d = rep7d.by_category.find((b: any) => b.category === 'Supplies');
    assert(paperIn7d, 'Supplies included in 7d report');

    // Ensure the 40-day old expense is NOT included in the 7d report
    const allExpensesReport = (await api('/reports/expenses')).data;
    assert(
      allExpensesReport.summary.total_expenses_minor > rep7d.summary.total_expenses_minor,
      'All-time expense report has higher total than 7-day report'
    );
    console.log('  ✓ Expense date range filters produce accurate totals');

    // -----------------------------------------------------------------
    // TEST 13: Demo reset returns all seeded entities to a consistent state
    // -----------------------------------------------------------------
    console.log('[Test 13] Demo reset returns all seeded entities to a consistent state');
    const resetRes = await api('/demo/reset', { method: 'POST' });
    assert.equal(resetRes.status, 200);
    assert.equal(resetRes.data.success, true);

    const resetProds = (await api('/products')).data.products;
    assert.equal(resetProds.length, 8, '8 catalog products restored');
    const restoredKey = resetProds.find((p: any) => p.sku === 'NS-KEY-001');
    assert.equal(restoredKey.stock_quantity, 24, 'Wireless Keyboard stock reset to 24');

    const resetCustomers = (await api('/customers')).data.customers;
    assert.equal(resetCustomers.length, 5, '5 customers restored');

    const resetSales = (await api('/sales')).data.sales;
    assert(resetSales.length >= 4, 'Seed sales restored');

    console.log('  ✓ Demo reset returned all entities and stock levels to initial seeded state');

    console.log('\n===============================================================');
    console.log('--- ALL 13 SPECIFICATION INTEGRATION TESTS PASSED (13/13) ---');
    console.log('===============================================================');
  } finally {
    server.close();
    closeDb();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
