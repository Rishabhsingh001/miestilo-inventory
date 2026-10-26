# Misterio Lifestyle — Inventory & Order Management System

A production-oriented specification package for building a custom inventory and order management web application with Google Antigravity.

## Product goal
Provide one reliable system to manage products, SKUs, warehouses, stock movements, customers, sales orders, dispatches, returns, suppliers, purchase receipts, alerts, and business reports for a hotel-linen business selling bedsheets, towels, pillow covers, duvets, runners, and related products.

## Recommended stack
- Next.js App Router + React + TypeScript
- Tailwind CSS + shadcn/ui
- MongoDB Atlas + Mongoose
- Next.js Route Handlers for server APIs
- Auth.js or another maintained authentication provider
- Zod + React Hook Form
- TanStack Table
- Recharts
- Vercel hosting
- Cloudinary or S3-compatible object storage for product images and documents
- Vitest/Jest and Playwright for tests

## Read these files in order
1. `ANTIGRAVITY_BUILD_PROMPT.md`
2. `PRD.md`
3. `DESIGN.md`
4. `ARCHITECTURE.md`
5. `DATABASE_SCHEMA.md`
6. `API_SPEC.md`
7. `USER_FLOWS.md`
8. `SECURITY.md`
9. `QA_TEST_PLAN.md`
10. `IMPLEMENTATION_PLAN.md`

## Non-negotiable business rules
- Never allow negative available stock unless an administrator explicitly enables a documented exception (default: disabled).
- Every stock change must create an immutable stock movement record.
- Stock deduction and order status transitions must be performed on the server.
- Do not deduct stock merely because a draft order exists.
- When an order is confirmed, reserve stock; when a shipment is dispatched, convert reserved stock to dispatched stock.
- Support partial shipments and partial returns.
- Use MongoDB transactions where supported by the Atlas deployment tier. If transactions are unavailable, do not silently pretend multi-document operations are atomic; implement a safe alternative and document the limitation.
- Use integer quantities in the configured base unit (normally pieces). Never use floating-point values for physical stock.
- Store timestamps in UTC and display them in the user's configured timezone.
- Keep an audit trail for critical actions.
- All server-side authorization and validation must be enforced even if the UI hides an action.

## MVP scope
Product/SKU catalogue, stock ledger, warehouse locations, customers, sales orders, reservation/dispatch, returns, stock adjustments, dashboard, search/filtering, low-stock alerts, CSV export, role-based access, and audit log.

## Suggested future scope
Purchase orders, supplier management, barcode/QR scanning, batch/lot tracking, multi-company tenancy, accounting integrations, GST invoice generation, courier integration, and offline-first mobile scanning.

## Setup overview
1. Create a Git repository.
2. Create a Next.js TypeScript app using the current stable version.
3. Create a MongoDB Atlas project and database user with least-privilege access.
4. Configure environment variables in local `.env.local` and Vercel project settings.
5. Implement and test authentication and authorization before business modules.
6. Build database models, stock ledger services, and order transitions before dashboard polish.
7. Run automated tests and seed only development/demo data.
8. Deploy a preview to Vercel, validate with realistic workflows, then promote to production.

Never commit real credentials, database connection strings, or customer data.
