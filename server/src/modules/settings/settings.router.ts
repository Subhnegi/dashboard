import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../../db/connection.js';
import { validateBody } from '../../shared/validation.js';

export const settingsRouter = Router();

const updateSettingsSchema = z.object({
  business_name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  currency_code: z.string().trim().min(1).optional(),
  default_tax_rate_basis_points: z.number().int().nonnegative().optional(),
  invoice_prefix: z.string().trim().min(1).optional(),
});

// GET /api/settings
settingsRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  let settings = db.prepare(`SELECT * FROM business_settings LIMIT 1`).get();
  if (!settings) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO business_settings (
        id, business_name, email, phone, address, currency_code,
        default_tax_rate_basis_points, invoice_prefix, updated_at
      ) VALUES ('settings_1', 'Northstar Supplies', 'billing@northstarsupplies.com', '+91 98765 43210', 'Bengaluru, India', 'INR', 1800, 'INV-', ?)
    `).run(now);
    settings = db.prepare(`SELECT * FROM business_settings LIMIT 1`).get();
  }
  res.json({ settings });
});

// PATCH /api/settings
settingsRouter.patch('/', validateBody(updateSettingsSchema), (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE business_settings SET
      business_name = COALESCE(?, business_name),
      email = CASE WHEN ? IS NOT NULL THEN ? ELSE email END,
      phone = CASE WHEN ? IS NOT NULL THEN ? ELSE phone END,
      address = CASE WHEN ? IS NOT NULL THEN ? ELSE address END,
      currency_code = COALESCE(?, currency_code),
      default_tax_rate_basis_points = COALESCE(?, default_tax_rate_basis_points),
      invoice_prefix = COALESCE(?, invoice_prefix),
      updated_at = ?
    WHERE id = (SELECT id FROM business_settings LIMIT 1)
  `).run(
    body.business_name ?? null,
    body.email !== undefined ? 1 : null,
    body.email ?? null,
    body.phone !== undefined ? 1 : null,
    body.phone ?? null,
    body.address !== undefined ? 1 : null,
    body.address ?? null,
    body.currency_code ?? null,
    body.default_tax_rate_basis_points ?? null,
    body.invoice_prefix ?? null,
    now
  );

  const updated = db.prepare(`SELECT * FROM business_settings LIMIT 1`).get();
  res.json({ settings: updated });
});
