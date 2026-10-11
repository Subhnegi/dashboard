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
  - Node.js + Express + TypeScript + SQLite with Zod API validation (Scheduled for Phase 2).

---

## Getting Started

### Prerequisites

- Node.js `v20+` or `v25+`
- npm `v10+`

### Installation & Run

1. **Install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

3. **Production Build & Type Check:**
   ```bash
   npm run build
   ```

---

## Implemented Workflows & Features (Phase 1)

1. **Responsive App Shell & Brand:**
   - Typographic wordmark with geometric logo.
   - Fixed desktop navigation sidebar (~256px) and responsive mobile slide-out navigation drawer.
   - Dynamic header with breadcrumbs, page title, contextual primary actions, and "Demo Sandbox" indicator.
   - Interactive dialogs for **"Reset Demo Data"** and **"About BusinessFlow"**.
2. **Product Catalog & Stock Invariants:**
   - Product list with search, category filtering, and status badges (`In Stock`, `Low Stock`, `Out of Stock`, `Inactive`).
   - Dedicated "Add Product" form with real-time field validation.
   - Product Detail view with gross margin calculation and inventory movement audit logs.
   - In-app stock adjustment modal recording adjustment reasons (`Stock received`, `Damaged/lost`, etc.).
3. **Customer Directory:**
   - Search by customer name, email, or telephone.
   - Add Customer modal.
   - Customer profile screen with lifetime spend aggregation and sales history.
4. **Sales & Orders Processing:**
   - Multi-line item order creation form with automatic stock validation.
   - Real-time line item recalculation, GST computation, and discount application.
   - Settlement options: Full payment, partial advance payment, or unpaid invoice.
   - Sale Detail screen with payment transaction logs and safe order cancellation with automatic stock restoration.
5. **Invoicing & PDF Print:**
   - Invoices list with payment status and remaining balance tracking.
   - Print-ready invoice template with company header, bill-to details, line items breakdown, and tax details.
   - `@media print` CSS rules automatically stripping navigation, buttons, and sidebars.
6. **Operating Expenses:**
   - Categorized expenses ledger (Rent, Utilities, Supplies, Software, Marketing, Other).
   - Category total KPI cards and Add Expense modal.
7. **Reports & Analytics:**
   - Real-time aggregation of sales revenue, expenses, and net profit.
   - Product sales ranking by volume and revenue.
   - Inventory on hand asset valuation table.
8. **Demo Data Management:**
   - Seeded with realistic sample business data for **Northstar Supplies** (electronic accessories).
   - "Reset demo data" action resets all state atomically.

---

## Known Limitations & Next Phases

- **Phase 1 Status:** Frontend app shell, design system, routing, responsive layouts, and demo seed data are complete and verified.
- **Phase 2:** Connect to dedicated Node.js/Express server and SQLite database for backend persistence and ACID transactions.
