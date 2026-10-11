# BusinessFlow — AI IDE Project Specification

> **Purpose:** Build a polished, genuinely functional business-management SaaS demo that can be shown to prospective freelance clients.
>
> **Audience for this specification:** An AI coding agent inside an IDE (for example, Antigravity). Treat this file as the source of truth. Inspect the existing repository before changing it, implement in small phases, and verify the result rather than merely describing intended changes.

---

## 1. Product vision

Build **BusinessFlow**, a responsive business-management application for a small retailer or service business. It should feel like a credible, premium SaaS product—not a static dashboard template.

The demo must let a visitor complete a real workflow:

1. Create or edit a product.
2. Add a customer.
3. Create a sale/order containing one or more products.
4. Validate stock and calculate totals.
5. Save the sale and reduce stock correctly.
6. Generate and view an invoice.
7. Record a full or partial payment.
8. See dashboard metrics, transaction lists, and reports update from persisted data.

A polished appearance matters, but correct business behavior matters just as much. Do not fake working controls or use hardcoded dashboard values after the initial seed data.

### Primary goals

- Demonstrate full-stack engineering skills to potential freelance clients.
- Provide a cohesive, premium interface that looks ready for a real small business.
- Make common tasks obvious and fast.
- Work well on desktop, tablet, and mobile.
- Run locally with minimal setup and no paid third-party APIs.
- Include realistic demo data and a safe way to reset it.

### Out of scope for the initial version

Do not add these unless the core scope is complete and verified:

- AI features or external AI APIs
- Multi-tenant SaaS billing or subscription management
- Real payment gateway integration
- GST/tax compliance claims or jurisdiction-specific tax filing
- Bank integrations
- Multi-warehouse inventory
- Complex accounting or double-entry bookkeeping
- Email/SMS/WhatsApp delivery integrations
- Real customer data or production secrets

This is a portfolio demo, not certified accounting software. Tax rates and invoice wording must be configurable demo settings, not represented as legal or tax advice.

---

## 2. How the AI IDE must work

Before writing code:

1. Inspect the repository, package manager, framework, scripts, current UI, and existing conventions.
2. Summarize the existing architecture and identify what can be reused.
3. Do not overwrite or delete existing work without a clear reason.
4. If a repository already exists, adapt it rather than creating a competing project structure.
5. Create a short implementation checklist and execute it in phases.
6. After each phase, run the available lint, type-check, tests, and build commands. Fix errors before proceeding.
7. If browser automation is available, inspect the actual running application at desktop and mobile sizes.
8. Never claim a test passed unless it was actually run.
9. If a requirement cannot be completed, report it clearly and state what remains.

### Recommended implementation order

- **Phase 0:** Repository audit and implementation plan.
- **Phase 1:** App shell, visual system, routing, responsive behavior, demo seed data.
- **Phase 2:** Database schema and backend API.
- **Phase 3:** Products and inventory.
- **Phase 4:** Customers and expenses.
- **Phase 5:** Sales, stock transactions, and invoices.
- **Phase 6:** Dashboard and reports using real persisted data.
- **Phase 7:** Demo reset, accessibility, responsive QA, edge cases, and final verification.

Build vertical slices that work end to end. Do not create all screens as disconnected mockups and postpone all logic until the end.

---

## 3. Technology and architecture

Use this stack unless the repository already has a sound equivalent:

### Frontend

- React
- TypeScript with strict mode
- Vite
- Tailwind CSS
- shadcn/ui or accessible equivalents for common controls
- React Router for navigation
- TanStack Query for server state, caching, and invalidation
- React Hook Form + Zod for form state and validation
- Recharts for dashboard/report charts
- Lucide icons

### Backend

- Node.js
- Express
- TypeScript if it fits the repository; otherwise use the existing backend language consistently
- Zod validation at API boundaries
- SQLite for local/demo persistence
- A migration or schema-initialization strategy that can be run repeatably

Use a database library that is compatible with the selected Node.js version and environment. If a native SQLite dependency is problematic in the target environment, choose a maintained alternative and document the reason. Do not silently replace database persistence with browser-only state.

### General rules

- Frontend components must not access the database directly.
- Keep API calls in a dedicated client/service layer.
- Keep business rules in backend service functions, not only in UI event handlers.
- Validate all inputs on the server, even when the frontend validates them too.
- Use environment variables for ports and secrets; provide `.env.example` without real credentials.
- Include clear setup and run commands in `README.md`.
- Prefer a simple modular monolith over unnecessary microservices.

### Suggested project structure

Adapt this to existing conventions rather than enforcing it blindly.

```text
businessflow/
  client/
    src/
      app/
        router.tsx
        providers.tsx
      components/
        layout/
        ui/
        feedback/
      features/
        dashboard/
        products/
        customers/
        sales/
        invoices/
        expenses/
        reports/
        settings/
      lib/
        api-client.ts
        formatters.ts
        validation.ts
      styles/
      main.tsx
  server/
    src/
      app.ts
      server.ts
      routes/
      middleware/
      db/
        connection.ts
        migrations/
        seed.ts
      modules/
        products/
        customers/
        sales/
        invoices/
        expenses/
        reports/
      shared/
        errors.ts
        validation.ts
  README.md
  .env.example
```

---

## 4. Visual direction

### Design concept

Create a premium, restrained SaaS interface: clean, confident, modern, and practical. The product should look suitable for a startup or small-business owner who uses it every day.

Use a light theme by default. Avoid the generic “AI-generated admin template” look, overused gradients, excessive glassmorphism, too many floating cards, and oversized empty areas.

### Suggested palette

Treat these as starting tokens and keep colors consistent:

- Page background: very light cool neutral, e.g. `#F7F8FA`
- Main surface: white
- Primary text: deep slate/navy, e.g. `#172033`
- Secondary text: muted slate, e.g. `#667085`
- Borders: soft neutral, e.g. `#E5E7EB`
- Primary action: rich indigo/blue-violet, e.g. `#5546D7`
- Positive state: accessible green
- Warning state: amber
- Error/destructive state: red
- Info state: blue

Check contrast. Never rely on color alone to convey state; use text labels and/or icons too. Define reusable design tokens rather than scattering arbitrary hex values throughout the code.

### Typography

Use a modern readable sans-serif, such as Inter or a system font stack. Establish a clear hierarchy:

- Page title: around 24–30px desktop, scaled down on mobile
- Section title: around 16–20px
- Body: around 14–16px
- Table metadata/helper text: around 12–14px

Use consistent line heights and font weights. Avoid using too many font sizes or weights.

### Layout

#### Desktop, around 1440 × 900

- Fixed or sticky left sidebar, approximately 240–260px wide.
- Main content fills remaining space, with comfortable 28–36px padding.
- Header includes breadcrumb or page context, page actions, and a compact profile/demo menu.
- Keep a consistent grid and alignment across every route.
- Use whitespace intentionally; do not let content stretch too wide.
- Tables and forms should have consistent column widths, field heights, and spacing.

#### Tablet

- Sidebar may collapse to icons or become a drawer.
- Cards and form columns should reflow without horizontal page scrolling.
- Data tables may use a horizontally scrollable table container where necessary.

#### Mobile, around 390 × 844

- Use a compact header and a mobile navigation drawer or bottom navigation if it improves usability.
- Main content padding should be approximately 16px.
- Stack metric cards and form fields.
- Actions must remain visible and tappable.
- Tables should scroll within their own container or switch to compact cards; never cause the entire page to overflow horizontally.
- Dialogs should fit the viewport and become full-screen/sheet-style when appropriate.
- Charts must resize and remain readable.
- Ensure there are no clipped buttons, overlapping labels, or inaccessible menus.

### Component style

- Cards: subtle border, small-to-medium radius (roughly 10–14px), restrained shadow only when useful.
- Buttons: clear primary/secondary/tertiary hierarchy, consistent heights, visible focus state, disabled/loading states.
- Inputs: clear labels, helpful validation messages, consistent spacing, keyboard accessibility.
- Tables: clear header row, subtle dividers, aligned numeric columns, readable status badges, hover/focus affordances.
- Badges: muted backgrounds and concise labels.
- Icons: consistent Lucide stroke style and size.
- Use skeletons for loading, purposeful empty states, and toast notifications for completed actions.
- Use confirmation dialogs for destructive or irreversible actions.

---

## 5. Application shell and navigation

### Brand

Use the name **BusinessFlow**. Create a simple typographic wordmark with a small geometric icon. Avoid elaborate logo design.

### Sidebar navigation

Group links logically:

**Workspace**
- Overview
- Products
- Customers
- Sales
- Invoices
- Expenses
- Reports

**Preferences**
- Settings

The sidebar should show a clear active state and an optional small icon beside each link. Do not make the interface feel cluttered with unnecessary badges.

### Header

Include:

- Current page title or breadcrumb
- Contextual primary action when relevant, e.g. “Add product” or “Create sale”
- Optional global search if it genuinely works
- A demo/profile menu with “Reset demo data” and “About this demo”
- A small “Demo workspace” indicator so visitors know this is a sandbox

Do not show nonfunctional notification, search, avatar, or menu controls. If a control appears clickable, it must perform a meaningful action.

### Routing

Implement separate routes for major screens, for example:

- `/dashboard`
- `/products`
- `/products/new`
- `/products/:id`
- `/customers`
- `/customers/:id`
- `/sales`
- `/sales/new`
- `/sales/:id`
- `/invoices`
- `/invoices/:id`
- `/expenses`
- `/reports`
- `/settings`

Routes can be adjusted to match project conventions. Refreshing a nested route should work in the deployed SPA configuration. Unknown routes must show a deliberate 404 page with a route back to the dashboard.

---

## 6. Dashboard

The dashboard is the first screen and should immediately communicate the business state. It must be driven by backend data, not permanently hardcoded numbers.

### Top section

- Greeting such as “Good morning” only if local time is implemented correctly; otherwise use a neutral heading such as “Business overview”.
- Date-range selector: Today, 7 days, 30 days, This month, Custom range if feasible.
- Optional “Export report” action if implemented.
- Main action: “Create sale”.

### KPI cards

Show four key metrics:

1. **Sales** — total value of completed sales in the selected date range.
2. **Expenses** — expenses in the selected range.
3. **Estimated profit** — clearly defined as sales revenue minus recorded expenses and, if supported, cost of goods sold. Be explicit about the chosen calculation.
4. **Orders** — count of sales/orders in the selected range.

Each KPI should show:

- Clear label
- Formatted value in INR by default
- Optional comparison to the previous equivalent period only if calculated correctly
- Small supporting text
- Appropriate icon used sparingly

Do not invent percentage changes or show a trend arrow without a valid comparison.

### Charts and summaries

- **Revenue over time:** line or area chart with accessible tooltip and formatted INR values.
- **Sales by product/category:** bar or donut chart only if there is enough meaningful data.
- **Recent transactions:** latest sales with invoice/order number, customer, date, amount, and status.
- **Low-stock products:** products at or below their reorder threshold, with a link to the product detail.
- **Top products:** rank by quantity sold or revenue, clearly indicating the metric.

Every chart should have loading, empty, and error states. Date-range changes must refresh all relevant metrics. Do not add decorative charts with fake data.

### Calculation definitions

Write the chosen definitions in code and documentation. Recommended initial definitions:

- Sales revenue: sum of valid completed/confirmed sales in the selected period; exclude cancelled sales.
- Expenses: sum of recorded expenses in the selected period; exclude deleted records.
- Gross profit estimate: sales line revenue minus line-item cost of goods sold, if cost data is reliably stored.
- Net operating estimate: sales revenue minus cost of goods sold minus recorded expenses, if all components are available.
- If profit cannot be computed reliably, label it “Estimated profit” and document exclusions.

Avoid double-counting tax, payments, or refunds. Do not equate cash collected with sales revenue unless that is explicitly the selected metric.

---

## 7. Products and inventory

### Products list

Show:

- Product name and optional SKU
- Category
- Selling price
- Cost price
- Stock on hand
- Reorder threshold
- Status: In stock, Low stock, Out of stock, Inactive
- Row actions: View/Edit, Adjust stock, Deactivate

Controls:

- Search by name or SKU
- Filter by category and stock status
- Sort by name, stock, or price
- Pagination or a sensible result limit
- “Add product” action
- Clear filters and a helpful empty state

Do not use arbitrary fake status values. Derive stock status from actual quantity and reorder threshold.

### Create/edit product form

Fields:

- Name (required)
- SKU (optional but unique if provided)
- Category
- Description (optional)
- Selling price (required, non-negative)
- Cost price (required or optional by a consistent policy, non-negative)
- Opening stock when creating
- Reorder threshold
- Active/inactive state when editing

Validation:

- Trim names and reject blank strings.
- Price and cost must be finite, non-negative numbers.
- Stock and threshold must be non-negative integers if fractional stock is not in scope.
- Reject duplicate SKUs case-insensitively if SKU is present.
- Show inline messages beside invalid fields.
- Prevent duplicate submission while saving.

### Product details

Show product data, current stock, low-stock state, and stock movement history. Offer an edit action and an “Adjust stock” action.

### Stock adjustments

Support explicit adjustment reasons such as:

- Opening balance
- Stock received
- Damaged/lost
- Manual correction
- Sale reversal/return, if implemented

Each adjustment records product, quantity delta, reason, timestamp, and optional note. Never silently overwrite stock without recording the movement.

For the initial version, stock can be integer units. Do not claim support for fractional quantities unless it is implemented end to end.

### Inventory invariants

- A sale cannot reduce stock below zero.
- Stock validation and decrement must happen atomically on the server.
- Concurrent sale requests must not oversell stock.
- Cancelled sales must not leave stock incorrectly reduced.
- A sale should store a snapshot of product name, SKU, unit price, and unit cost so old invoices remain stable if a product changes later.

---

## 8. Customers

### Customer list

Show:

- Customer name
- Phone (optional)
- Email (optional)
- Number of sales
- Total purchased or lifetime sales value
- Outstanding balance, if payments are implemented
- Created date
- Actions to view/edit/deactivate

Provide search by name, phone, or email and a useful empty state.

### Customer form

Fields:

- Full name (required)
- Phone (optional)
- Email (optional)
- Billing address (optional)
- Notes (optional)

Validation:

- Name cannot be blank.
- Validate email format when supplied.
- Normalize whitespace.
- Avoid making phone mandatory for demo use.

### Customer detail

Show contact information, sales history, invoice links, total purchases, and outstanding balance where supported.

Deleting customers who have historical sales can destroy referential integrity. Prefer deactivation or soft deletion. Existing sales and invoices must retain their customer snapshot even if the customer record is later edited or deactivated.

---

## 9. Sales and order processing

This is the main end-to-end workflow and must be genuinely functional.

### Sales list

Show:

- Order/sale number
- Customer
- Sale date
- Total
- Payment status
- Order status
- Actions: View, Invoice, Cancel if allowed

Filters:

- Search by sale/invoice number or customer
- Date range
- Payment status
- Order status

### Create sale screen

Use a clear step-by-step form or a well-organized single page:

1. Choose customer or “Walk-in customer” if supported.
2. Add products to line items.
3. Enter quantity.
4. Review price and line total.
5. Apply an optional discount if implemented.
6. Review subtotal, tax (optional/configurable), discount, and grand total.
7. Choose payment status/method or record an initial payment.
8. Confirm and create sale.

Each line should show product, available stock, unit price, quantity, and line total.

### Line-item behavior

- Product search/select should be fast and keyboard accessible.
- Show current available stock before confirmation.
- Quantity must be a positive integer and no greater than available stock.
- A product cannot be added twice as separate duplicate rows unless the UI merges the quantities.
- Recalculate line totals and totals immediately in the UI.
- The server must recalculate all totals from stored product prices and validated inputs. Never trust a client-supplied grand total.
- Do not let a stale browser price or stock value bypass server validation.
- If price overrides are allowed, explicitly model them, validate them, and record the override. Otherwise use the product's current selling price.
- Disable submission while saving and prevent accidental duplicate sales.

### Sale creation transaction

The backend should perform these actions in one database transaction:

1. Validate customer and all product IDs.
2. Read current prices/costs and current stock.
3. Verify sufficient stock for every line item.
4. Compute subtotal, discount, tax, and grand total using a consistent currency strategy.
5. Insert the sale and immutable line-item snapshots.
6. Decrement inventory.
7. Insert inventory movement records.
8. Record any initial payment.
9. Commit the transaction.

If any step fails, roll back all steps. The user must never end up with an order but no stock adjustment, or stock reduced without an order.

### Sale details

Display:

- Sale/order number
- Customer details snapshot
- Date and status
- Line items
- Subtotal, discounts, tax, grand total
- Payments and balance due
- Link to invoice

### Cancellation

- Require confirmation and optionally a reason.
- Only allow cancellation when policy permits it.
- Restore stock exactly once and create reversal stock movements.
- Prevent duplicate cancellation/reversal.
- Keep an audit trail rather than deleting the sale.
- Define what happens when a sale has partial/full payments. Do not silently delete or refund payments; if refunds are out of scope, clearly block cancellation in that case and explain why.

---

## 10. Invoices and payments

### Invoice list

Show:

- Invoice number
- Customer
- Issue date
- Due date if supported
- Total
- Amount paid
- Balance due
- Status: Draft, Unpaid, Partially paid, Paid, Overdue, or Cancelled where relevant

Do not show contradictory statuses. For example, “Paid” requires the recorded eligible payments to cover the invoice balance.

### Invoice view

Use a print-friendly invoice layout with:

- Business name and demo contact details
- Invoice number and issue date
- Customer/bill-to information
- Line-item descriptions, quantity, unit price, and line total
- Subtotal, discount, tax if configured, and total
- Payments recorded and remaining balance
- Clear payment terms/demo note
- Footer stating this is a portfolio demo where appropriate

Use seeded fictional business/customer details only.

### PDF/print behavior

- Provide a real “Print / Save PDF” action using browser print styles or a PDF library.
- Hide app navigation, buttons, and background decorations in print mode.
- Keep invoice columns aligned and totals readable.
- Avoid breaking a line item across pages where possible.
- Verify the output through print preview or an equivalent test.
- Do not claim server-generated PDF if the app only uses browser printing.

### Payment recording

Support full and partial payments:

- Amount (positive and no greater than remaining balance)
- Payment date
- Method: Cash, Bank transfer, Card, Other
- Optional reference/note

The server validates amounts and updates derived payment status. Use a transaction when creating a payment. Prevent overpayment unless a deliberate credit/refund feature is added. Payment history should be append-only for this demo; do not silently edit or delete recorded payments.

### Currency and rounding

- Default currency: INR (`₹`).
- Format money consistently using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
- Store monetary values as integer paise where practical, or use a well-defined decimal representation. Avoid floating-point arithmetic for financial totals.
- Document rounding rules and apply the same logic on client and server.
- Display two decimal places where appropriate.

### Tax disclaimer

If tax is included, make it configurable and clearly mark demo tax settings. Do not represent the generated invoice as compliant with all GST or other tax requirements. Tax rules and invoice fields must be reviewed before adapting the product for real use.

---

## 11. Expenses

### Expense list

Show:

- Date
- Description
- Category
- Amount
- Payment method
- Optional vendor
- Actions to view/edit/delete according to policy

Support date range, category, and text filters. Use pagination or a sensible result limit.

### Expense form

Fields:

- Description (required)
- Amount (positive)
- Category (e.g. Rent, Utilities, Supplies, Marketing, Travel, Other)
- Date
- Payment method (optional)
- Vendor (optional)
- Notes (optional)

Validate all values on the server. Confirm before deleting. If an expense is deleted, ensure reports recalculate correctly. For auditability, soft-delete or record the deletion where practical.

### Expense summary

Display total expenses for the selected range and category breakdown. Dashboard expense figures must come from this same source of truth.

---

## 12. Reports

Reports should be useful and consistent with the dashboard definitions.

### Required reports

- Sales over time
- Expenses over time
- Sales by product
- Best-selling products by quantity or revenue
- Inventory on hand and low-stock list
- Payment collection/outstanding balances if payments are implemented

### Filters and export

- Date range where relevant
- Category/product filter where useful
- CSV export for tabular reports if practical
- Print-friendly report view

### Data correctness

- Use the same calculation helpers or backend aggregation rules as the dashboard.
- Exclude cancelled sales consistently.
- Avoid counting partial payments as new revenue if revenue is already counted at sale creation.
- Handle empty data without rendering misleading zero-length charts or broken axes.
- State whether a report uses sale date, payment date, or expense date.

---

## 13. Settings and demo controls

### Business profile

Allow editing of demo business name, contact details, and address used on invoices. Clearly label them as demo settings.

### Preferences

At minimum:

- Currency display (INR initially; avoid claiming full multi-currency accounting unless fully supported)
- Optional default tax rate for the demo
- Default low-stock threshold only if product-level threshold fallback is implemented
- Invoice prefix/number format if safely implemented

### Reset demo data

This is important for client presentations.

- Put “Reset demo data” in the demo menu/settings.
- Show a confirmation dialog explaining that demo changes will be erased.
- Reinitialize products, customers, sales, invoices/payment records, expenses, and settings from seed data.
- Run the reset atomically or use a reliable migration/seed strategy.
- Prevent a failed reset from leaving the database partially empty.
- Show a success toast only after the server confirms completion.
- Never expose this reset endpoint as an unrestricted production operation. It is for the local/demo environment only and should be disabled or protected outside demo mode.

---

## 14. Data model

Adapt names as needed, but preserve the relationships and invariants.

### `products`

- `id`
- `name`
- `sku` nullable, unique when present
- `category`
- `description` nullable
- `selling_price_minor` (integer paise) or equivalent exact money type
- `cost_price_minor` nullable or required by a documented policy
- `stock_quantity` integer, non-negative
- `reorder_level` integer, non-negative
- `is_active`
- `created_at`
- `updated_at`

### `customers`

- `id`
- `name`
- `phone` nullable
- `email` nullable
- `billing_address` nullable
- `notes` nullable
- `is_active`
- `created_at`
- `updated_at`

### `sales`

- `id`
- `sale_number` unique
- `customer_id` nullable for supported walk-in sales
- `customer_name_snapshot`
- `customer_contact_snapshot` nullable
- `sale_date`
- `status` (e.g. `CONFIRMED`, `CANCELLED`)
- `subtotal_minor`
- `discount_minor`
- `tax_minor`
- `total_minor`
- `notes` nullable
- `created_at`
- `updated_at`
- `cancelled_at` nullable
- `cancellation_reason` nullable

### `sale_items`

- `id`
- `sale_id`
- `product_id` nullable if product is later deactivated/deleted under an allowed policy
- `product_name_snapshot`
- `sku_snapshot` nullable
- `quantity` positive integer
- `unit_price_minor`
- `unit_cost_minor` nullable
- `line_subtotal_minor`
- `created_at`

### `inventory_movements`

- `id`
- `product_id`
- `movement_type`
- `quantity_delta` signed integer
- `reason`
- `reference_type` nullable (e.g. sale)
- `reference_id` nullable
- `note` nullable
- `created_at`

### `payments`

- `id`
- `sale_id`
- `amount_minor` positive integer
- `payment_date`
- `method`
- `reference` nullable
- `note` nullable
- `created_at`

### `expenses`

- `id`
- `description`
- `category`
- `amount_minor` positive integer
- `expense_date`
- `payment_method` nullable
- `vendor` nullable
- `notes` nullable
- `is_deleted` or equivalent soft-delete state
- `created_at`
- `updated_at`

### `business_settings`

- `id`
- `business_name`
- `email` nullable
- `phone` nullable
- `address` nullable
- `currency_code`
- `default_tax_rate_basis_points` or another exact representation
- `invoice_prefix`
- `updated_at`

### Data integrity

- Use foreign keys and appropriate indexes.
- Use unique constraints for sale/invoice numbers and non-empty SKUs.
- Store timestamps consistently (UTC in database where practical; display local time intentionally).
- Do not hard-delete records that are referenced by sales, invoice history, payments, or inventory movements.
- Derive payment status from total and valid payments, or maintain it only with transactional consistency.
- Consider an `invoices` table only if invoice lifecycle differs meaningfully from the sale lifecycle. Otherwise use a stable invoice number associated with the sale and document the design.
- Add schema migrations or a repeatable initialization script.

---

## 15. API design

Use consistent JSON responses and HTTP status codes. Example routes (adjust to existing conventions):

### Health and demo

- `GET /api/health`
- `POST /api/demo/reset` — demo-only, protected/disabled outside demo mode

### Dashboard and reports

- `GET /api/dashboard?range=30d`
- `GET /api/reports/sales?from=...&to=...`
- `GET /api/reports/expenses?from=...&to=...`
- `GET /api/reports/products?from=...&to=...`
- `GET /api/reports/inventory`

### Products

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `POST /api/products/:id/adjust-stock`
- `POST /api/products/:id/deactivate`

### Customers

- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PATCH /api/customers/:id`
- `POST /api/customers/:id/deactivate`

### Sales

- `GET /api/sales`
- `POST /api/sales`
- `GET /api/sales/:id`
- `POST /api/sales/:id/cancel`

### Payments/invoices

- `GET /api/sales/:id/invoice`
- `POST /api/sales/:id/payments`
- `GET /api/payments` if needed for a payment list

### Expenses and settings

- `GET /api/expenses`
- `POST /api/expenses`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id` (soft-delete recommended)
- `GET /api/settings`
- `PATCH /api/settings`

### API standards

- Parse and validate query params and request bodies.
- Return meaningful status codes: 200, 201, 400, 404, 409, 422 where appropriate, and 500 for unexpected server failures.
- Use a consistent error shape, e.g. `{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Not enough stock available.", "details": {} } }`.
- Never send stack traces or secrets to the browser.
- Use pagination for growing lists.
- Use parameterized database queries.
- Use a transaction for multi-table business operations.
- Add CORS/security middleware appropriate to the actual deployment architecture.
- Do not create endpoints that pretend to work but return hardcoded placeholder data.

---

## 16. Interaction and feedback standards

Every interactive element must have a defined outcome.

### Loading

- Show a button-level spinner/label while submitting.
- Show skeletons for larger loading areas.
- Prevent double submission for mutations.
- Keep layout stable while data loads.

### Success

- Show a concise toast, such as “Product created”.
- Update/invalidate relevant cached queries.
- Close the dialog or navigate to the resulting detail page where appropriate.
- Ensure the new record is visible in the relevant list.

### Validation errors

- Show actionable inline messages near the field.
- Preserve valid user-entered values.
- Focus or scroll to the first invalid field when reasonable.
- Do not rely on browser alert boxes for normal validation.

### API errors

- Display a human-readable message.
- Distinguish not-found, validation, insufficient-stock, and server errors.
- Avoid silently swallowing errors.
- Offer retry for recoverable loading failures.

### Empty states

Each list/chart should explain what is missing and offer a relevant action, e.g. “No products yet” with “Add product”. Do not display fake rows to fill empty space.

### Confirmation

Require confirmation before:
- Deleting or deactivating records where consequential
- Cancelling a sale
- Resetting demo data
- Making an inventory adjustment that may be accidental

### Keyboard and accessibility

- All actions must be keyboard reachable.
- Use semantic buttons and links.
- Provide visible focus indicators.
- Inputs require labels.
- Dialogs must manage focus and support Escape where appropriate.
- Icons that convey meaning need accessible labels.
- Do not use color as the only indicator of errors/status.

---

## 17. Security and reliability

Although this is a demo, implement safe basics:

- Validate data on the server.
- Use parameterized SQL queries.
- Avoid rendering user-entered content as raw HTML.
- Keep secrets out of source control and frontend bundles.
- Do not enable unrestricted reset/admin operations in production.
- Add request size limits and sensible error handling.
- Configure CORS narrowly for the intended frontend origin when separate origins are used.
- Use a consistent not-found/error middleware.
- Prevent duplicate mutation requests where practical.
- Use database transactions for sales, payments, stock changes, cancellations, and reset.
- Do not trust price, stock, payment status, or totals sent by the browser.
- Use safe defaults for deployed demo mode; no real personal data or credentials.
- If authentication is not implemented, clearly describe the app as an open demo workspace and do not present it as secure multi-user software.

---

## 18. Seed data

Create believable fictional sample data so the first visit looks populated and the workflows can be tested.

Example business: **Northstar Supplies** (fictional).

### Example products

- Wireless Keyboard — SKU `NS-KEY-001` — selling price ₹1,500 — cost ₹950 — stock 24 — reorder level 5
- Wireless Mouse — SKU `NS-MOU-002` — selling price ₹750 — cost ₹420 — stock 8 — reorder level 5
- USB-C Hub — SKU `NS-HUB-003` — selling price ₹2,200 — cost ₹1,400 — stock 3 — reorder level 5
- Laptop Stand — SKU `NS-STD-004` — selling price ₹1,250 — cost ₹700 — stock 16 — reorder level 4
- HDMI Cable — SKU `NS-HDMI-005` — selling price ₹450 — cost ₹180 — stock 0 — reorder level 5

### Example customers

Use fictional names and clearly invented contact details. Avoid real personal information. Include a walk-in customer option only if the workflow supports it.

### Sales and expenses

Seed several transactions across the last 30 days, including:
- Completed sales
- One partially paid sale if partial payments are supported
- A few paid invoices
- A low-stock product
- An out-of-stock product
- Expenses across several categories

Ensure seed data is internally consistent: sale line items match sale totals, payments do not exceed totals, stock quantities agree with recorded movements where the implementation maintains that relationship, and dashboard figures match report calculations. Generate relative dates from the current date during seeding so the dashboard does not look stale months later.

---

## 19. Quality assurance checklist

Do not call the project complete until the applicable checks pass.

### Functional checks

- [ ] App starts using documented commands.
- [ ] Direct navigation and browser refresh work on every route.
- [ ] Products can be created, edited, searched, filtered, and deactivated.
- [ ] Duplicate SKU is rejected.
- [ ] Stock adjustments create movement history.
- [ ] Customers can be created, edited, searched, and deactivated.
- [ ] A sale can be created with multiple products.
- [ ] Insufficient stock is rejected by the server.
- [ ] Sale creation updates stock and movement history atomically.
- [ ] A failed sale does not partially mutate the database.
- [ ] Sale totals are calculated server-side and use exact currency arithmetic.
- [ ] Repeated submission does not create duplicate sales.
- [ ] Invoice details match the persisted sale snapshot.
- [ ] Full and partial payments update balance/status correctly.
- [ ] Overpayment is rejected.
- [ ] Sale cancellation restores stock once, or is safely blocked by the documented payment policy.
- [ ] Expenses affect reports and dashboard totals correctly.
- [ ] Date filters affect the correct metrics.
- [ ] Charts have loading, empty, and error states.
- [ ] Print/PDF invoice layout is usable.
- [ ] Demo reset restores a consistent initial state.
- [ ] Errors are visible and actionable.

### Visual checks

Test at minimum:
- [ ] Desktop 1440 × 900
- [ ] Laptop 1280 × 800
- [ ] Tablet approximately 768 × 1024
- [ ] Mobile 390 × 844
- [ ] Narrow mobile approximately 360px wide

Check:
- [ ] No unintended horizontal page scrolling.
- [ ] Sidebar/navigation works at each breakpoint.
- [ ] Tables remain usable.
- [ ] Forms fit the viewport.
- [ ] Dialogs and dropdowns are not clipped.
- [ ] Text contrast and focus states are adequate.
- [ ] Loading, empty, error, and success states look intentional.
- [ ] No broken icons, images, fonts, or console errors.
- [ ] Every visible control has a meaningful behavior.
- [ ] Layout does not jump excessively during loading.

### Engineering checks

- [ ] TypeScript type-check passes.
- [ ] Lint passes if configured.
- [ ] Automated tests cover critical business rules.
- [ ] Production build succeeds.
- [ ] No secrets or real personal data are committed.
- [ ] README includes setup, environment variables, database initialization, seed/reset instructions, and known limitations.

---

## 20. Minimum automated tests

Prioritize tests for business logic rather than snapshots alone.

1. Product validation rejects negative prices and invalid stock.
2. Duplicate SKU is rejected.
3. Sale total is computed correctly for multiple line items.
4. Server ignores a forged client grand total.
5. Insufficient stock rejects a sale without changing any records.
6. Successful sale decrements stock exactly once.
7. Sale cancellation restores stock exactly once.
8. Partial payment leaves the correct balance.
9. Payment equal to the balance changes status to paid.
10. Overpayment is rejected.
11. Dashboard excludes cancelled sales according to documented rules.
12. Expense date filters produce correct totals.
13. Demo reset returns all seeded entities to a consistent state.

Use integration tests with a temporary test database for transaction-critical behavior when feasible.

---

## 21. Definition of done

The project is ready to show a prospective client only when:

- It has a coherent and premium visual design across all major routes.
- It is responsive and usable on mobile.
- The main sale → stock update → invoice → payment → dashboard workflow works end to end.
- Data persists after refresh.
- Server-side validation and database transactions protect the critical operations.
- The dashboard and reports reflect actual stored data.
- There are no obvious broken buttons, dead links, placeholder charts, or console errors.
- The demo can be reset to a consistent seeded state.
- Critical automated tests, type-check, and production build pass.
- The README accurately explains how to run and test the project.
- Any remaining limitations are explicitly documented.

---

## 22. Final instructions to the AI coding agent

Start by auditing the repository and reporting the current state. Then implement **Phase 1 only** and verify it. Continue through the phases in order, keeping the app runnable at each stage.

Do not stop after generating a plan, screenshots, or static UI. Implement the working application. Do not rewrite the entire codebase unnecessarily. Do not add features outside the scope while core workflows are incomplete.

After implementation, provide a concise report with:

1. Features actually implemented.
2. Important architecture/database decisions.
3. Commands used to run the app.
4. Tests, type-check, lint, and build commands actually run, with honest results.
5. Screens/routes verified and viewport sizes tested.
6. Known limitations and any unfinished work.

**The final standard:** BusinessFlow should look polished enough to attract attention in a portfolio, and behave reliably enough that a client can click through the main business workflow without encountering fake functionality.
