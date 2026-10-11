import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { getDb, runTransaction, closeDb } from '../src/db/connection.js';
import { seedDatabase } from '../src/db/seed.js';
import type { Server } from 'node:http';

async function runTests() {
  console.log('--- STARTING BUSINESSFLOW BACKEND API INTEGRATION TESTS ---');

  // 1. Initialize DB and Seed
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

    // TEST 1: Health Check
    console.log('[Test 1] GET /api/health');
    const health = await api('/health');
    assert.equal(health.status, 200);
    assert.equal(health.data.status, 'ok');
    console.log('  ✓ Health check passed');

    // TEST 2: Demo Reset
    console.log('[Test 2] POST /api/demo/reset');
    const reset = await api('/demo/reset', { method: 'POST' });
    assert.equal(reset.status, 200);
    assert.equal(reset.data.success, true);
    console.log('  ✓ Demo reset passed');

    // TEST 3: Products List & Seed Check
    console.log('[Test 3] GET /api/products');
    const prodList = await api('/products');
    assert.equal(prodList.status, 200);
    assert(Array.isArray(prodList.data.products));
    assert(prodList.data.products.length >= 8);
    const keyboard = prodList.data.products.find((p: any) => p.sku === 'NS-KEY-001');
    assert(keyboard, 'Wireless Keyboard seeded');
    assert.equal(keyboard.stock_quantity, 24);
    console.log(`  ✓ Products list returned ${prodList.data.products.length} catalog items`);

    // TEST 4: Product Creation & Unique SKU Enforcement
    console.log('[Test 4] POST /api/products & SKU validation');
    const newProd = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'USB-C Fast Charger 65W',
        sku: 'NS-CHG-009',
        category: 'Charging',
        selling_price_minor: 199900,
        cost_price_minor: 110000,
        stock_quantity: 15,
        reorder_level: 5,
      }),
    });
    assert.equal(newProd.status, 201);
    assert.equal(newProd.data.product.name, 'USB-C Fast Charger 65W');
    const createdId = newProd.data.product.id;

    // Verify opening stock movement created
    const prodDetail = await api(`/products/${createdId}`);
    assert.equal(prodDetail.status, 200);
    assert(prodDetail.data.movements.length > 0, 'Opening balance movement recorded');
    assert.equal(prodDetail.data.movements[0].movement_type, 'OPENING_BALANCE');

    // Duplicate SKU should be rejected with 409
    const dupSku = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Another Charger',
        sku: 'ns-chg-009', // Case-insensitive test
        category: 'Charging',
        selling_price_minor: 150000,
        cost_price_minor: 90000,
        stock_quantity: 5,
      }),
    });
    assert.equal(dupSku.status, 409, 'Duplicate SKU rejected with 409');
    console.log('  ✓ Product creation and duplicate SKU rejection verified');

    // TEST 5: Stock Adjustment & Invariants
    console.log('[Test 5] POST /api/products/:id/adjust-stock');
    const adjust = await api(`/products/${createdId}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({
        delta: 10,
        reason: 'Restock shipment received from supplier',
      }),
    });
    assert.equal(adjust.status, 200);
    assert.equal(adjust.data.product.stock_quantity, 25);

    // Negative adjustment past 0 should fail with 400
    const invalidAdjust = await api(`/products/${createdId}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({
        delta: -50,
        reason: 'Accidental removal',
      }),
    });
    assert.equal(invalidAdjust.status, 400, 'Cannot reduce stock below zero');
    console.log('  ✓ Stock adjustments and non-negative invariants verified');

    // TEST 6: Customer Management
    console.log('[Test 6] Customers CRUD');
    const newCust = await api('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Vanguard Systems',
        phone: '+91 99001 22334',
        email: 'procurement@vanguard.in',
        billing_address: '4th Floor, Tech Hub, Pune 411001',
      }),
    });
    assert.equal(newCust.status, 201);
    const custId = newCust.data.customer.id;

    const custDetail = await api(`/customers/${custId}`);
    assert.equal(custDetail.status, 200);
    assert.equal(custDetail.data.customer.name, 'Vanguard Systems');
    console.log('  ✓ Customer creation and details verified');

    // TEST 7: Sale Creation with Atomic Stock Decrement
    console.log('[Test 7] POST /api/sales with atomic stock reduction');
    const initialKeyboardStock = (await api(`/products/${keyboard.id}`)).data.product.stock_quantity;

    const saleRes = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: custId,
        customer_name: 'Vanguard Systems',
        customer_contact: '+91 99001 22334',
        items: [
          {
            product_id: keyboard.id,
            quantity: 4,
          },
        ],
        notes: 'Integration test order',
        initial_payment: {
          amount_minor: 600000,
          method: 'BANK_TRANSFER',
          reference: 'IMPS-TEST-9921',
        },
      }),
    });
    assert.equal(saleRes.status, 201);
    const saleId = saleRes.data.sale.id;
    assert.equal(saleRes.data.sale.total_minor, 600000); // 4 * 150000

    // Verify stock was reduced atomically
    const afterStock = (await api(`/products/${keyboard.id}`)).data.product.stock_quantity;
    assert.equal(afterStock, initialKeyboardStock - 4, 'Stock decremented by 4');
    console.log('  ✓ Sale created with atomic stock decrement');

    // TEST 8: Insufficient Stock Rejection
    console.log('[Test 8] Insufficient Stock Rejection (422)');
    const oversizedSale = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Walk-in Customer',
        items: [
          {
            product_id: keyboard.id,
            quantity: 9999, // Way more than available stock
          },
        ],
      }),
    });
    assert.equal(oversizedSale.status, 422, 'Oversized sale rejected with 422');
    console.log('  ✓ Overselling prevented with INSUFFICIENT_STOCK error');

    // TEST 9: Invoice & Payments
    console.log('[Test 9] Invoices & Payment Recording');
    const invRes = await api(`/sales/${saleId}/invoice`);
    assert.equal(invRes.status, 200);
    assert(invRes.data.invoice.invoice_number.startsWith('INV-'));
    assert.equal(invRes.data.invoice.financials.amount_paid_minor, 600000);
    assert.equal(invRes.data.invoice.financials.balance_due_minor, 0);
    assert.equal(invRes.data.invoice.financials.payment_status, 'PAID');
    console.log('  ✓ Invoice formatting and payment settlement verified');

    // TEST 10: Sale Cancellation & Stock Restoration
    console.log('[Test 10] POST /api/sales/:id/cancel with stock reversal');
    const cancelRes = await api(`/sales/${saleId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Customer cancelled prior to dispatch',
      }),
    });
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.data.sale.status, 'CANCELLED');

    // Verify stock was restored
    const restoredStock = (await api(`/products/${keyboard.id}`)).data.product.stock_quantity;
    assert.equal(restoredStock, initialKeyboardStock, 'Stock restored to original quantity');
    console.log('  ✓ Sale cancellation restored stock atomically');

    // TEST 11: Expenses CRUD & Soft-Delete
    console.log('[Test 11] Expenses module & soft-delete');
    const expRes = await api('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Team Coffee & Refreshments',
        category: 'Supplies',
        amount_minor: 45000,
        payment_method: 'Cash',
      }),
    });
    assert.equal(expRes.status, 201);
    const expId = expRes.data.expense.id;

    const delExp = await api(`/expenses/${expId}`, { method: 'DELETE' });
    assert.equal(delExp.status, 200);

    const expList = await api('/expenses');
    assert(!expList.data.expenses.some((e: any) => e.id === expId), 'Soft-deleted expense excluded from list');
    console.log('  ✓ Expense created and soft-deleted');

    // TEST 12: Live Dashboard & Reports Aggregations
    console.log('[Test 12] GET /api/dashboard & GET /api/reports/sales');
    const dash = await api('/dashboard');
    assert.equal(dash.status, 200);
    assert(dash.data.kpis.sales_revenue_minor > 0);
    assert(dash.data.kpis.total_customers >= 5);
    assert(dash.data.kpis.total_products >= 8);

    const reportsSales = await api('/reports/sales');
    assert.equal(reportsSales.status, 200);
    assert(reportsSales.data.summary.total_revenue_minor > 0);
    assert(reportsSales.data.best_selling.length > 0);

    const reportsInv = await api('/reports/inventory');
    assert.equal(reportsInv.status, 200);
    assert(reportsInv.data.summary.total_units > 0);
    assert(reportsInv.data.summary.valuation_at_cost_minor > 0);
    console.log('  ✓ Dashboard and reports live SQL aggregations verified');

    console.log('\n--- ALL BACKEND INTEGRATION TESTS PASSED (12/12) ---');
  } finally {
    server.close();
    closeDb();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
