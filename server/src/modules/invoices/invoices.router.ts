import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb, runTransaction } from '../../db/connection.js';
import { NotFoundError, BadRequestError } from '../../shared/errors.js';
import { validateBody } from '../../shared/validation.js';

export const invoicesRouter = Router();

const createPaymentSchema = z.object({
  amount_minor: z.number().int().positive('Payment amount must be greater than zero'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'OTHER']),
  payment_date: z.string().trim().optional(),
  reference: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

function sendInvoiceResponse(req: Request, res: Response) {
  const db = getDb();
  const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(req.params.id) as any;
  if (!sale) {
    throw new NotFoundError(`Sale not found`);
  }

  const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(req.params.id);
  const payments = db.prepare(`SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date ASC`).all(req.params.id) as any[];
  const settings = db.prepare(`SELECT * FROM business_settings LIMIT 1`).get() as any;

  let customer = null;
  if (sale.customer_id) {
    customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(sale.customer_id);
  }

  const amountPaidMinor = payments.reduce((sum, p) => sum + Number(p.amount_minor), 0);
  const totalMinor = Number(sale.total_minor);
  const balanceDueMinor = Math.max(0, totalMinor - amountPaidMinor);

  let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  if (amountPaidMinor >= totalMinor && totalMinor > 0) {
    paymentStatus = 'PAID';
  } else if (amountPaidMinor > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  } else {
    paymentStatus = 'UNPAID';
  }

  const invoiceNumber = `${settings?.invoice_prefix || 'INV-'}${sale.sale_number.replace('ORD-', '')}`;

  res.json({
    invoice: {
      invoice_number: invoiceNumber,
      sale,
      customer: customer || {
        name: sale.customer_name_snapshot,
        phone: sale.customer_contact_snapshot,
        email: null,
        billing_address: null,
      },
      business: settings,
      items,
      payments,
      financials: {
        subtotal_minor: sale.subtotal_minor,
        discount_minor: sale.discount_minor,
        tax_minor: sale.tax_minor,
        total_minor: sale.total_minor,
        amount_paid_minor: amountPaidMinor,
        balance_due_minor: balanceDueMinor,
        payment_status: paymentStatus,
      },
    },
  });
}

// GET /api/sales/:id/invoice and GET /:id
invoicesRouter.get('/:id/invoice', sendInvoiceResponse);
invoicesRouter.get('/:id', sendInvoiceResponse);

// POST /api/sales/:id/payments
invoicesRouter.post('/:id/payments', validateBody(createPaymentSchema), (req: Request, res: Response) => {
  const body = req.body;

  const result = runTransaction((txDb) => {
    const sale = txDb.prepare(`SELECT * FROM sales WHERE id = ?`).get(req.params.id) as any;
    if (!sale) {
      throw new NotFoundError(`Sale not found`);
    }

    if (sale.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot record payment on a cancelled sale.`);
    }

    const existingPayments = txDb.prepare(`SELECT * FROM payments WHERE sale_id = ?`).all(req.params.id) as any[];
    const currentPaid = existingPayments.reduce((acc, p) => acc + Number(p.amount_minor), 0);
    const balanceDue = Number(sale.total_minor) - currentPaid;

    if (balanceDue <= 0) {
      throw new BadRequestError(`This sale is already paid in full.`);
    }

    if (body.amount_minor > balanceDue) {
      throw new BadRequestError(
        `Payment amount of ${body.amount_minor} exceeds remaining balance of ${balanceDue}. Overpayment is not permitted.`
      );
    }

    const now = new Date().toISOString();
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const paymentDate = body.payment_date || now;

    txDb.prepare(`
      INSERT INTO payments (
        id, sale_id, amount_minor, payment_date, method, reference, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId,
      sale.id,
      body.amount_minor,
      paymentDate,
      body.method,
      body.reference || null,
      body.note || null,
      now
    );

    const newPayment = txDb.prepare(`SELECT * FROM payments WHERE id = ?`).get(paymentId);
    const updatedBalanceDue = balanceDue - body.amount_minor;

    return {
      payment: newPayment,
      balance_due_minor: updatedBalanceDue,
      payment_status: updatedBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID',
    };
  });

  res.status(201).json(result);
});

// GET /api/payments
invoicesRouter.get('/payments/recent', (_req: Request, res: Response) => {
  const db = getDb();
  const payments = db.prepare(`
    SELECT p.*, s.sale_number, s.customer_name_snapshot
    FROM payments p
    JOIN sales s ON s.id = p.sale_id
    ORDER BY p.payment_date DESC
    LIMIT 100
  `).all();
  res.json({ payments });
});
