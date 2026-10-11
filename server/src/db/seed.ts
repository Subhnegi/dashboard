import type { DatabaseSync } from 'node:sqlite';
import { initializeSchema } from './schema.js';
import { getDb, runTransaction } from './connection.js';

export function seedDatabase(db: DatabaseSync): void {
  initializeSchema(db);

  // Clear existing records in proper foreign key order
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DELETE FROM payments;
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM inventory_movements;
    DELETE FROM products;
    DELETE FROM customers;
    DELETE FROM expenses;
    DELETE FROM business_settings;
  `);
  db.exec('PRAGMA foreign_keys = ON;');

  const now = new Date();
  const isoNow = now.toISOString();

  const daysAgo = (d: number, hoursOffset = 0): string => {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000);
    return date.toISOString();
  };

  // 1. Business Settings
  const insertSettings = db.prepare(`
    INSERT INTO business_settings (
      id, business_name, email, phone, address, currency_code,
      default_tax_rate_basis_points, invoice_prefix, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSettings.run(
    'settings_1',
    'Northstar Supplies',
    'billing@northstarsupplies.com',
    '+91 98765 43210',
    'Plot 42, Electronics City Phase 1, Hosur Road, Bengaluru, Karnataka 560100',
    'INR',
    1800,
    'INV-',
    isoNow
  );

  // 2. Products
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, name, sku, category, description, selling_price_minor,
      cost_price_minor, stock_quantity, reorder_level, is_active,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productsData = [
    {
      id: 'prod_1',
      name: 'Wireless Keyboard',
      sku: 'NS-KEY-001',
      category: 'Peripherals',
      description: 'Tenkeyless ergonomic mechanical switch keyboard with dual Bluetooth & 2.4GHz.',
      selling_price_minor: 150000,
      cost_price_minor: 95000,
      stock_quantity: 24,
      reorder_level: 5,
      is_active: 1,
    },
    {
      id: 'prod_2',
      name: 'Wireless Mouse',
      sku: 'NS-MOU-002',
      category: 'Peripherals',
      description: 'Rechargeable silent click optical mouse with adjustable DPI sensor.',
      selling_price_minor: 75000,
      cost_price_minor: 42000,
      stock_quantity: 8,
      reorder_level: 5,
      is_active: 1,
    },
    {
      id: 'prod_3',
      name: 'USB-C Hub Multiport',
      sku: 'NS-HUB-003',
      category: 'Accessories',
      description: '7-in-1 aluminum hub with 4K HDMI, 100W Power Delivery pass-through, and SD card reader.',
      selling_price_minor: 220000,
      cost_price_minor: 140000,
      stock_quantity: 3, // Low stock
      reorder_level: 5,
      is_active: 1,
    },
    {
      id: 'prod_4',
      name: 'Aluminum Laptop Stand',
      sku: 'NS-STD-004',
      category: 'Ergonomics',
      description: 'Adjustable height dual-hinge ventilated stand supporting laptops up to 17 inches.',
      selling_price_minor: 125000,
      cost_price_minor: 70000,
      stock_quantity: 16,
      reorder_level: 4,
      is_active: 1,
    },
    {
      id: 'prod_5',
      name: 'High-Speed HDMI 2.1 Cable (2m)',
      sku: 'NS-HDMI-005',
      category: 'Cables',
      description: 'Braided 48Gbps ultra high-speed cable supporting 8K@60Hz and 4K@120Hz.',
      selling_price_minor: 45000,
      cost_price_minor: 18000,
      stock_quantity: 0, // Out of stock
      reorder_level: 5,
      is_active: 1,
    },
    {
      id: 'prod_6',
      name: 'Mechanical Gaming Keyboard',
      sku: 'NS-MKB-006',
      category: 'Peripherals',
      description: 'Hot-swappable tactile RGB switches with sound dampening foam and volume knob.',
      selling_price_minor: 450000,
      cost_price_minor: 280000,
      stock_quantity: 12,
      reorder_level: 3,
      is_active: 1,
    },
    {
      id: 'prod_7',
      name: 'Ergonomic Desk Mat (Extended)',
      sku: 'NS-MAT-007',
      category: 'Accessories',
      description: 'Water-resistant vegan leather 900x400mm surface with stitched anti-fray borders.',
      selling_price_minor: 180000,
      cost_price_minor: 90000,
      stock_quantity: 2, // Low stock
      reorder_level: 4,
      is_active: 1,
    },
    {
      id: 'prod_8',
      name: '4K Ultra HD Pro Webcam',
      sku: 'NS-CAM-008',
      category: 'Video',
      description: 'HDR video conferencing camera with dual noise-cancelling mics and privacy shutter.',
      selling_price_minor: 550000,
      cost_price_minor: 320000,
      stock_quantity: 15,
      reorder_level: 5,
      is_active: 1,
    },
  ];

  for (const p of productsData) {
    insertProduct.run(
      p.id,
      p.name,
      p.sku,
      p.category,
      p.description,
      p.selling_price_minor,
      p.cost_price_minor,
      p.stock_quantity,
      p.reorder_level,
      p.is_active,
      daysAgo(45),
      daysAgo(1)
    );
  }

  // 3. Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (
      id, name, phone, email, billing_address, notes, is_active,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const customersData = [
    {
      id: 'cust_1',
      name: 'Apex Tech Labs',
      phone: '+91 98201 12345',
      email: 'priya.sharma@apextech.in',
      billing_address: 'Level 4, Orion Tech Park, Whitefield, Bengaluru 560066',
      notes: 'Key enterprise account. Net 30 payment terms.',
      is_active: 1,
    },
    {
      id: 'cust_2',
      name: 'BluePeak Consulting',
      phone: '+91 98112 34567',
      email: 'rahul.verma@bluepeak.co',
      billing_address: 'Suite 201, Maker Chambers V, Nariman Point, Mumbai 400021',
      notes: 'Consulting client. Prefers bank transfer settlements.',
      is_active: 1,
    },
    {
      id: 'cust_3',
      name: 'Horizon Creative Studios',
      phone: '+91 98303 45678',
      email: 'ananya.sen@horizoncreatives.com',
      billing_address: '14 Hauz Khas Village, New Delhi 110016',
      notes: 'Digital agency. High volume accessory purchases.',
      is_active: 1,
    },
    {
      id: 'cust_4',
      name: 'Zen Logistics Pvt Ltd',
      phone: '+91 98404 56789',
      email: 'karan.malhotra@zenlogistics.in',
      billing_address: '88 Mount Road, Guindy Industrial Estate, Chennai 600032',
      notes: 'Quarterly peripheral upgrade contract.',
      is_active: 1,
    },
    {
      id: 'cust_5',
      name: 'DevCraft Software',
      phone: '+91 98905 67890',
      email: 'rohit@devcraft.io',
      billing_address: 'Tower B, Cyber City, Gurugram 122002',
      notes: 'Direct office procurement team.',
      is_active: 1,
    },
  ];

  for (const c of customersData) {
    insertCustomer.run(
      c.id,
      c.name,
      c.phone,
      c.email,
      c.billing_address,
      c.notes,
      c.is_active,
      daysAgo(40),
      daysAgo(2)
    );
  }

  // 4. Sales, Sale Items, Inventory Movements, & Payments
  const insertSale = db.prepare(`
    INSERT INTO sales (
      id, sale_number, customer_id, customer_name_snapshot, customer_contact_snapshot,
      sale_date, status, subtotal_minor, discount_minor, tax_minor, total_minor,
      notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (
      id, sale_id, product_id, product_name_snapshot, sku_snapshot,
      quantity, unit_price_minor, unit_cost_minor, line_subtotal_minor, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMovement = db.prepare(`
    INSERT INTO inventory_movements (
      id, product_id, movement_type, quantity_delta, reason, reference_type, reference_id, note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (
      id, sale_id, amount_minor, payment_date, method, reference, note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sale 1: Apex Tech Labs (Paid)
  insertSale.run(
    'sale_1',
    'ORD-2026-001',
    'cust_1',
    'Apex Tech Labs',
    '+91 98201 12345',
    daysAgo(1, 3),
    'CONFIRMED',
    450000,
    0,
    0,
    450000,
    'Express delivery requested for executive onboarding package',
    daysAgo(1, 3),
    daysAgo(1, 3)
  );
  insertSaleItem.run(
    'item_1_1',
    'sale_1',
    'prod_1',
    'Wireless Keyboard',
    'NS-KEY-001',
    3,
    150000,
    95000,
    450000,
    daysAgo(1, 3)
  );
  insertMovement.run(
    'mov_1_1',
    'prod_1',
    'SALE_FULFILLMENT',
    -3,
    'Customer order fulfillment',
    'SALE',
    'sale_1',
    'Order #ORD-2026-001 fulfilled',
    daysAgo(1, 3)
  );
  insertPayment.run(
    'pay_1',
    'sale_1',
    450000,
    daysAgo(1, 2),
    'BANK_TRANSFER',
    'HDFC-NEFT-8839201',
    'Settled in full via corporate netbanking',
    daysAgo(1, 2)
  );

  // Sale 2: BluePeak Consulting (Partially Paid)
  insertSale.run(
    'sale_2',
    'ORD-2026-002',
    'cust_2',
    'BluePeak Consulting',
    '+91 98112 34567',
    daysAgo(3, 5),
    'CONFIRMED',
    315000,
    0,
    0,
    315000,
    'Partial deposit paid upon order confirmation; balance due in 15 days',
    daysAgo(3, 5),
    daysAgo(3, 5)
  );
  insertSaleItem.run(
    'item_2_1',
    'sale_2',
    'prod_2',
    'Wireless Mouse',
    'NS-MOU-002',
    1,
    75000,
    42000,
    75000,
    daysAgo(3, 5)
  );
  insertSaleItem.run(
    'item_2_2',
    'sale_2',
    'prod_4',
    'Aluminum Laptop Stand',
    'NS-STD-004',
    1,
    125000,
    70000,
    125000,
    daysAgo(3, 5)
  );
  insertSaleItem.run(
    'item_2_3',
    'sale_2',
    'prod_3',
    'USB-C Hub Multiport',
    'NS-HUB-003',
    1,
    220000,
    140000,
    220000,
    daysAgo(3, 5)
  );
  insertMovement.run(
    'mov_2_1',
    'prod_2',
    'SALE_FULFILLMENT',
    -1,
    'Customer order fulfillment',
    'SALE',
    'sale_2',
    'Order #ORD-2026-002',
    daysAgo(3, 5)
  );
  insertMovement.run(
    'mov_2_2',
    'prod_4',
    'SALE_FULFILLMENT',
    -1,
    'Customer order fulfillment',
    'SALE',
    'sale_2',
    'Order #ORD-2026-002',
    daysAgo(3, 5)
  );
  insertMovement.run(
    'mov_2_3',
    'prod_3',
    'SALE_FULFILLMENT',
    -1,
    'Customer order fulfillment',
    'SALE',
    'sale_2',
    'Order #ORD-2026-002',
    daysAgo(3, 5)
  );
  // Partial payment of 200000 out of 315000
  insertPayment.run(
    'pay_2',
    'sale_2',
    200000,
    daysAgo(3, 4),
    'CARD',
    'VISA-AUTH-44129',
    'Advance deposit received',
    daysAgo(3, 4)
  );

  // Sale 3: Horizon Creative Studios (Paid)
  insertSale.run(
    'sale_3',
    'ORD-2026-003',
    'cust_3',
    'Horizon Creative Studios',
    '+91 98303 45678',
    daysAgo(7, 2),
    'CONFIRMED',
    650000,
    0,
    0,
    650000,
    'Creative team workstation refresh package',
    daysAgo(7, 2),
    daysAgo(7, 2)
  );
  insertSaleItem.run(
    'item_3_1',
    'sale_3',
    'prod_8',
    '4K Ultra HD Pro Webcam',
    'NS-CAM-008',
    1,
    550000,
    320000,
    550000,
    daysAgo(7, 2)
  );
  insertSaleItem.run(
    'item_3_2',
    'sale_3',
    'prod_2',
    'Wireless Mouse',
    'NS-MOU-002',
    1,
    75000,
    42000,
    75000,
    daysAgo(7, 2)
  );
  insertMovement.run(
    'mov_3_1',
    'prod_8',
    'SALE_FULFILLMENT',
    -1,
    'Customer order fulfillment',
    'SALE',
    'sale_3',
    'Order #ORD-2026-003',
    daysAgo(7, 2)
  );
  insertMovement.run(
    'mov_3_2',
    'prod_2',
    'SALE_FULFILLMENT',
    -1,
    'Customer order fulfillment',
    'SALE',
    'sale_3',
    'Order #ORD-2026-003',
    daysAgo(7, 2)
  );
  insertPayment.run(
    'pay_3',
    'sale_3',
    650000,
    daysAgo(7, 1),
    'UPI',
    'UPI-REF-9920188',
    'Paid via instant UPI',
    daysAgo(7, 1)
  );

  // Sale 4: Zen Logistics Pvt Ltd (Paid)
  insertSale.run(
    'sale_4',
    'ORD-2026-004',
    'cust_4',
    'Zen Logistics Pvt Ltd',
    '+91 98404 56789',
    daysAgo(14, 6),
    'CONFIRMED',
    900000,
    0,
    0,
    900000,
    'Two mechanical gaming keyboards for dispatch monitoring desk',
    daysAgo(14, 6),
    daysAgo(14, 6)
  );
  insertSaleItem.run(
    'item_4_1',
    'sale_4',
    'prod_6',
    'Mechanical Gaming Keyboard',
    'NS-MKB-006',
    2,
    450000,
    280000,
    900000,
    daysAgo(14, 6)
  );
  insertMovement.run(
    'mov_4_1',
    'prod_6',
    'SALE_FULFILLMENT',
    -2,
    'Customer order fulfillment',
    'SALE',
    'sale_4',
    'Order #ORD-2026-004',
    daysAgo(14, 6)
  );
  insertPayment.run(
    'pay_4',
    'sale_4',
    900000,
    daysAgo(14, 5),
    'BANK_TRANSFER',
    'ICICI-RTGS-110294',
    'Settled in full via RTGS',
    daysAgo(14, 5)
  );

  // 5. Expenses
  const insertExpense = db.prepare(`
    INSERT INTO expenses (
      id, description, category, amount_minor, expense_date, payment_method,
      vendor, notes, is_deleted, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const expensesData = [
    {
      id: 'exp_1',
      description: 'Monthly Office Workspace Rent',
      category: 'Rent',
      amount_minor: 4500000,
      expense_date: daysAgo(5),
      payment_method: 'Bank Transfer',
      vendor: 'Prestige Estate Commercial Rentals',
      notes: 'Office lease rent for Electronics City premises',
    },
    {
      id: 'exp_2',
      description: 'High-Speed Fiber Internet & Telephony',
      category: 'Utilities',
      amount_minor: 480000,
      expense_date: daysAgo(8),
      payment_method: 'Credit Card',
      vendor: 'Airtel Broadband Ltd',
      notes: 'Dual gigabit leased line backup connection',
    },
    {
      id: 'exp_3',
      description: 'Warehouse Packaging & Bubble Wrap',
      category: 'Supplies',
      amount_minor: 850000,
      expense_date: daysAgo(11),
      payment_method: 'UPI',
      vendor: 'National Packaging Corrugated Solutions',
      notes: 'Corrugated boxes, tamper tape, anti-static bubble pouches',
    },
    {
      id: 'exp_4',
      description: 'Quarterly Google Ads & Retargeting Campaign',
      category: 'Marketing',
      amount_minor: 2500000,
      expense_date: daysAgo(18),
      payment_method: 'Credit Card',
      vendor: 'Google India Digital Services',
      notes: 'Search campaigns targeting regional B2B IT buyers',
    },
    {
      id: 'exp_5',
      description: 'Courier Express Delivery Consignments',
      category: 'Logistics',
      amount_minor: 620000,
      expense_date: daysAgo(22),
      payment_method: 'Bank Transfer',
      vendor: 'BlueDart Express Logistics',
      notes: 'Interstate parcel dispatch billing statement',
    },
  ];

  for (const exp of expensesData) {
    insertExpense.run(
      exp.id,
      exp.description,
      exp.category,
      exp.amount_minor,
      exp.expense_date,
      exp.payment_method,
      exp.vendor,
      exp.notes,
      0,
      exp.expense_date,
      exp.expense_date
    );
  }
}

// Standalone execution support: tsx src/db/seed.ts
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  console.log('Seeding SQLite database...');
  const db = getDb();
  runTransaction((txDb) => {
    seedDatabase(txDb);
  });
  console.log('Database successfully seeded with realistic business data.');
}
