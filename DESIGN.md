# Design System — Misterio Lifestyle Inventory & Order Management

## 1. Visual direction
Use the supplied Monetra dashboard image as a visual reference, not as a screen to copy literally. The target is a calm, premium, modern operations dashboard suitable for a hospitality linen manufacturer/distributor. Prioritize data clarity, scanability, and speed for warehouse and sales teams.

## 2. Design principles
- Light, clean, low-noise interface.
- White and near-white surfaces on a soft cool-gray page background.
- Lime/leaf green for primary actions, positive states, and selected chart series.
- Rounded cards and inputs, subtle borders, restrained shadows.
- Compact left navigation rail/sidebar; top header with page title, breadcrumbs or context, search, notifications, and profile menu.
- Use whitespace to group information, not to waste screen space.
- Tables are operational tools: readable density, sticky headers when helpful, clear status labels, and accessible row actions.
- Do not use green for every element. Use neutral text and restrained status colors.

## 3. Suggested tokens
These are initial tokens; verify contrast and refine during implementation.

### Color
- `--app-bg: #F3F5F4` (soft gray-green background)
- `--surface: #FFFFFF`
- `--surface-muted: #F8FAF8`
- `--border: #E7EBE7`
- `--text-primary: #171B18`
- `--text-secondary: #68716B`
- `--brand: #A7F432` (bright lime action accent)
- `--brand-hover: #92DF20`
- `--brand-soft: #F0FBD9`
- `--success: #218653`
- `--warning: #B7791F`
- `--danger: #C83C3C`
- `--info: #3D78B8`
- `--chart-neutral: #E8ECE8`
- `--focus: #4D7C0F`

Ensure text on lime buttons has sufficient contrast; use dark text rather than white if needed. Never rely on color alone to communicate status.

### Typography
- Preferred: `Inter` or `Geist Sans` for interface; use one family consistently.
- Page title: 24–30px, semibold.
- Section title: 15–18px, semibold.
- KPI number: 24–32px, semibold; tabular numerals enabled.
- Body: 13–14px.
- Table: 12–14px depending on density.
- Helper/metadata: 11–12px.
- Keep line height comfortable; avoid tiny labels for critical information.

### Radius and elevation
- Cards: 16–20px.
- Inputs/buttons: 10–12px.
- Badges: pill or 8px radius.
- Cards: subtle 0–1 low-opacity shadow plus 1px border.
- Popovers/modals: stronger but still soft elevation.
- Avoid heavy gradients, glassmorphism, excessive blur, or thick shadows.

### Spacing
Use a 4px base spacing scale. Common gaps: 8, 12, 16, 20, 24, 32px. Main content padding: 24px desktop, 16px tablet, 12–16px mobile.

## 4. Layout
### Desktop
- Fixed or collapsible left sidebar around 220–248px expanded and 64–76px collapsed.
- Header around 64–72px high.
- Main content uses max-width appropriate for tables and dashboard; allow wide tables to use available width.
- Dashboard grid: four KPI cards on wide screens, two on tablet, one/two on mobile.
- Main dashboard can use a wider analytics column and a narrower “Attention required” column.

### Tablet
- Collapsible sidebar or drawer.
- KPI grid adapts to two columns.
- Tables can scroll horizontally or switch to compact list cards for key workflows.

### Mobile
- Navigation drawer or bottom-safe mobile navigation.
- One-column cards.
- Prioritize search, key status, and primary action.
- Forms use full-width controls.
- Avoid tiny icon-only actions without accessible labels.
- Data tables may use horizontally scrollable regions with the first identifying column sticky where feasible.

## 5. Navigation structure
- Overview
- Inventory
  - Products & SKUs
  - Stock Movements
  - Receive Stock
  - Transfers
  - Adjustments / Stocktake
  - Warehouses
- Orders
  - All Orders
  - Create Order
  - Dispatches
  - Returns
- Customers
- Suppliers (Phase 2 unless MVP explicitly includes it)
- Reports
- Team & Permissions
- Audit Log
- Settings

Use icons consistently (Lucide). Each navigation item needs a text label when expanded and a tooltip when collapsed.

## 6. Dashboard composition
Reference-inspired structure:
1. Greeting/page heading with a short operational summary.
2. Global search field.
3. KPI cards:
   - Available units
   - Active SKUs
   - Open orders
   - Low-stock SKUs
4. Stock movement chart with date-range and warehouse filters.
5. Recent stock movement table.
6. Attention panel:
   - Low-stock items
   - Orders awaiting dispatch
   - Recent returns requiring inspection
7. Quick actions:
   - Receive stock
   - Create order
   - Record dispatch
   - Stock adjustment

KPI cards must link to useful filtered pages. Charts must have accessible labels and a tabular alternative where possible.

## 7. Component requirements
- `AppShell`: sidebar, header, content container.
- `PageHeader`: title, description, breadcrumbs, actions.
- `KpiCard`: label, value, delta only if meaningful, icon.
- `DataTable`: server pagination, sorting, filters, column visibility if useful, row actions.
- `StatusBadge`: label plus icon/text, not color only.
- `SearchInput`: debounced where appropriate, clear action.
- `FilterBar`: date range, warehouse, category, status.
- `EmptyState`: explain what is missing and show a permitted next action.
- `ErrorState`: safe explanation and retry action.
- `Skeleton`: stable loading layout.
- `ConfirmDialog`: destructive action confirmation.
- `QuantityInput`: integer validation, unit label, min/max hints.
- `StockLevelIndicator`: available amount and reorder threshold.
- `OrderTimeline`: ordered events with actor/time.
- `ShipmentCard`: shipped items, carrier/tracking, dispatch time.
- `AuditDetails`: before/after summary with sensitive fields redacted.

## 8. Tables
Recommended columns:
### Inventory
SKU, product, category, variant, warehouse, on-hand, reserved, available, damaged/quarantined, reorder level, status, actions.

### Orders
Order number, customer, order date, required date, total units, fulfillment status, payment/commercial status if configured, destination, owner, actions.

### Stock movements
Date/time, SKU, product, movement type, quantity delta, source/destination, reference, actor, reason.

### Customers
Customer/company, customer code, contact, phone/email, total orders, last order, status.

Always display units and distinguish quantity from monetary values. Use a negative sign or explicit In/Out movement label consistently.

## 9. Interaction patterns
- Primary action uses lime background and dark text.
- Secondary action uses white/neutral background and border.
- Destructive action uses red styling and confirmation.
- Save buttons show loading and prevent duplicate submission.
- After success, show a concise toast and update the relevant data.
- For stock changes, show a confirmation summary before posting: SKU, quantity, warehouse, movement type, and reason.
- Do not use optimistic UI for critical stock writes unless rollback and conflict behavior are carefully implemented.
- Use modal/drawer for quick lightweight actions; use full page for complex forms.

## 10. Status semantics
- Draft: neutral gray
- Confirmed / reserved: blue or neutral with clear text
- Picking / packing: violet or blue
- Partially fulfilled: amber
- Dispatched / fulfilled: green
- Cancelled: gray
- Returned / inspection required: amber
- Failed / blocked: red

Use text labels, not color alone.

## 11. Accessibility
- Keyboard accessible navigation, dialogs, tables, and menus.
- Visible focus ring.
- Semantic headings and form labels.
- Contrast should meet WCAG AA where practical.
- Status must be readable by screen readers.
- Respect reduced-motion settings.
- Charts need summaries or table alternatives.
- Touch targets should generally be at least 40–44px on mobile.

## 12. Responsive and visual QA checklist
- Sidebar never covers page content.
- Tables remain usable at 1280px, 768px, and 360px widths.
- No horizontal page overflow (table-level scroll is acceptable).
- Long customer names and SKU values truncate gracefully with accessible full values.
- Forms display validation next to the relevant field.
- Loading, empty, error, permission denied, and success states match the system.
- Use realistic but fictional seed content; no hard-coded production KPI values.
