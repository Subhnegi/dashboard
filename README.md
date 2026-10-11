# BusinessFlow — SaaS Business Management Application

BusinessFlow is a responsive, full-stack business management application designed for small retailers and service businesses. It provides an end-to-end workflow covering product catalog & stock tracking, customer directory, sales orders with atomic inventory updates, invoices with browser print/PDF layouts, expense tracking, and real-time dashboard analytics.

## Tech Stack & Architecture

- **Frontend (`client/`):**
  - **Framework:** React 19 + TypeScript (Strict Mode) + Vite
  - **Styling:** Tailwind CSS v4 design system with custom CSS tokens (`#F7F8FA` neutral background, `#5546D7` indigo primary action, semantic status badges)
  - **Navigation & Routing:** React Router v7 with deep routes (`/dashboard`, `/products`, `/customers`, `/sales`, `/invoices`, `/expenses`, `/reports`, `/settings`, and custom `404`)
  - **Icons:** Lucide React
  - **State & Seed Persistence:** Centralized reactive data context with atomic reset, seed initialization for fictional business *Northstar Supplies*, and localStorage persistence fallback.
- **Backend (`server/`):**
  - **Runtime & Engine:** Node.js v25 + Express + TypeScript + built-in SQLite engine (`DatabaseSync`)
  - **Architecture:** Modular monolith with strict ACID transactions (`runTransaction`), foreign keys, check constraints, and write-ahead logging (WAL).
  - **Validation & Errors:** Zod schema validation middleware and centralized HTTP error formatting (`{ error: { code, message, details } }`).
  - **Modules:** Products, Customers, Sales (with atomic stock deduction & cancellation reversal), Invoices & Payments, Expenses, Reports, Dashboard, Settings, and Demo Reset.
  - **Automated Integration Tests:** Comprehensive test suite in `server/test/api.test.ts` covering 12 test suites.

---

## Getting Started

### Prerequisites

- Node.js `v20+` or `v25+`
- npm `v10+`

### Installation & Run

1. **Install all dependencies:**
   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```

2. **Run Backend API server:**
   ```bash
   npm run server
   ```
   Runs the Express + SQLite API at [http://localhost:4000](http://localhost:4000).

3. **Run Backend API Tests:**
   ```bash
   npm run test
   ```
   Runs the end-to-end SQLite and HTTP integration test suite.

4. **Seed Database:**
   ```bash
   npm run server:seed
   ```
   Initializes and seeds realistic business records for Northstar Supplies.

5. **Start Frontend Client:**
   ```bash
   npm run client
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

6. **Production Build (Both Server & Client):**
   ```bash
   npm run build
   ```

---

## Implemented Workflows & Features

### Phase 1: Frontend & Visual System
- Symphony design system with custom color tokens, modern typography, and responsive layouts.
- Collapsible fixed sidebar with scrollable body and strict route filtering.
- Centered compact navigation links and demo avatar with live status indicator.
- Standardized `rounded-lg` border radius across all buttons and interactive controls.

### Phase 2: Database Schema & Backend API
- **SQLite Database Schema (`server/src/db/`):**
  - 8 core relational tables: `products`, `customers`, `sales`, `sale_items`, `inventory_movements`, `payments`, `expenses`, `business_settings`.
  - Foreign key constraints, indices, and exact integer paise currency columns (`selling_price_minor`, etc.).
- **Atomic Inventory Invariants:**
  - Sales decrement product stock atomically while recording `SALE_FULFILLMENT` inventory movements.
  - Insufficient stock rejects checkout attempts with HTTP `422 INSUFFICIENT_STOCK`.
  - Order cancellation restores product stock atomically and logs `SALE_CANCELLATION` reversal movements.
- **RESTful Endpoints:**
  - `GET /api/health` & `POST /api/demo/reset`
  - `GET /api/products`, `POST /api/products`, `GET /api/products/:id`, `PATCH /api/products/:id`, `POST /api/products/:id/adjust-stock`, `POST /api/products/:id/deactivate`
  - `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`, `PATCH /api/customers/:id`, `POST /api/customers/:id/deactivate`
  - `GET /api/sales`, `POST /api/sales`, `GET /api/sales/:id`, `POST /api/sales/:id/cancel`
  - `GET /api/sales/:id/invoice`, `POST /api/sales/:id/payments`, `GET /api/payments/recent`
  - `GET /api/expenses`, `POST /api/expenses`, `PATCH /api/expenses/:id`, `DELETE /api/expenses/:id` (soft-delete)
  - `GET /api/reports/sales`, `GET /api/reports/expenses`, `GET /api/reports/inventory`
  - `GET /api/dashboard?range=30d`
  - `GET /api/settings`, `PATCH /api/settings`
- **Automated Verification:** 12/12 integration tests passing covering transactions, stock invariants, unique constraints, and SQL aggregations.
