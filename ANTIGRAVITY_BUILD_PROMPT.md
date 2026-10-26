# Google Antigravity — Master Build Prompt

You are the lead product engineer, software architect, UI designer, QA engineer, and security reviewer for **Misterio Lifestyle Inventory & Order Management System**.

Build a robust business web application from the specification files in this folder. Read all specification documents before writing implementation code. Treat `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_SPEC.md`, `SECURITY.md`, and `QA_TEST_PLAN.md` as the source of truth. If documents conflict, prioritize security and data integrity, then PRD business rules, then architecture, then design. Record any unresolved ambiguity in `DECISIONS.md` instead of inventing a silent assumption.

## Required working method
1. Inspect the repository and existing code before modifying anything.
2. Write a concise implementation plan with checkboxes and identify risks.
3. Build in small, verifiable milestones; do not generate the entire app as one unreviewed code dump.
4. At the end of each milestone, run type checking, linting, relevant unit tests, and build checks. Fix failures before proceeding.
5. Use strict TypeScript. Avoid `any` unless documented and truly unavoidable.
6. Keep all database access and secrets on the server. Never expose MongoDB credentials to the browser.
7. Use reusable components, typed service functions, consistent error handling, accessible controls, and responsive layouts.
8. Implement authorization on the server for every protected operation.
9. Make inventory ledger and order state transitions reliable, idempotent where applicable, and concurrency-safe.
10. Add tests for stock reservation, dispatch, cancellation, returns, duplicate requests, concurrent stock changes, and permission boundaries.
11. Do not use mock data in production screens once the real backend is implemented. Seed/demo data must be clearly marked and development-only.
12. Do not claim an integration works until it is configured and tested. Document any external credentials/setup required.

## Build milestones
- M0: repository inspection, decisions, architecture, environment template, app shell.
- M1: database connection, schemas, indexes, authentication, roles, audit logging.
- M2: products, categories, SKUs, units, warehouses, stock ledger.
- M3: customers and suppliers.
- M4: order creation, confirmation/reservation, fulfillment, partial dispatch, cancellation, returns.
- M5: dashboard KPIs, stock movement reporting, order reporting, low-stock alerts, exports.
- M6: responsive polish, accessibility, loading/empty/error states, security review.
- M7: test suite, seed script, deployment guide, Vercel preview verification.

## Product requirements
- Product categories include Bedsheets, Towels, Pillow Covers, Duvets, Duvet Covers, Bed Runners, Bath Mats, and Other Hotel Linen. Categories must be configurable.
- Each sellable variation must have a unique SKU. Variants may include size, fabric, GSM, color, weave, and packaging.
- Track on-hand, reserved, available, damaged, and dispatched quantities as derived values from the ledger or a rigorously reconciled stock balance.
- Track stock by warehouse and optionally by bin/location.
- Sales orders include customer, ship-to address, order date, expected dispatch/delivery dates, line items, quantity, unit price, discount/tax fields where configured, status, notes, and shipment history.
- Support draft, confirmed, partially fulfilled, fulfilled, cancelled, and returned/partially returned states, with explicit allowed transitions.
- Dashboard includes total SKUs, total available units, low-stock SKUs, open orders, dispatched today, and recent stock movements.
- Reports include daily stock-in/out, order status, customer order history, SKU movement, low-stock, and stock valuation where cost data exists.
- Provide CSV export with permission checks.
- Maintain audit logs for sensitive changes.
- Use a professional light dashboard inspired by the provided image: white cards, light gray canvas, lime-green primary accents, compact left sidebar, rounded corners, clean charts, readable tables, and restrained typography.

## Required deliverables in the repository
- Working Next.js application
- `.env.example` (no secrets)
- Database models and indexes
- Server-side service layer
- API route handlers
- Seed script with fictional demo data only
- Unit/integration tests and key end-to-end tests
- `README.md` with setup, run, test, and deploy instructions
- `DECISIONS.md`
- `CHANGELOG.md` or milestone notes
- Error, loading, empty, and permission-denied UI states

## Definition of done
A feature is not done merely because its page renders. It must have validation, authorization, error handling, meaningful tests, responsive UI, and correct data persistence. Before finalizing, report:
- Features implemented
- Tests executed and results
- Environment variables still required
- Known limitations
- Exact deployment steps
- Any requirements not implemented, with reasons
