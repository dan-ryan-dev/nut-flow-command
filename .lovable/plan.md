## Plan: `/containers` Central Ledger Page

Build a new dedicated page at `/containers` that acts as the central shipment ledger, accessible from the sidebar. It reuses the Nomos branding, ship icon, and the existing phyto attachment store so document state stays in sync with the Command Center.

### 1. Routing & Shell
- Add a `/containers` route in `src/App.tsx` pointing to a new `src/pages/Containers.tsx`.
- Convert the sidebar nav (`src/components/command-center/Sidebar.tsx`) from buttons to `react-router-dom` `NavLink`s. The "Command Center" item routes to `/`, "Containers" routes to `/containers`. Active state is driven by the current route (so the ship-icon / NOMOS branding stays consistent).
- The new page reuses the existing `<Sidebar />` and a top header that mirrors the Command Center (title: "Containers · Ledger", subtitle showing total count and week range).

### 2. Data Model Updates
- Extend `src/data/containers.ts`:
  - Add a richer `LogisticsStatus` enum: `"pending-load" | "origin-received" | "gated-in" | "loaded-vessel" | "arrived-discharge" | "closed"`.
  - Add `lots: string[]` (multi-lot support, e.g. `["LOT-24A-118", "LOT-24A-119"]`).
  - Add `shipmentWeek: string` (e.g. `"Week 19 · May 4–10"`).
  - Add `docs: { phyto?: "attached" | "draft" | "missing"; bol?: "attached" | "missing"; commercialInvoice?: "attached" | "missing"; packingList?: "attached" | "missing" }`.
  - Add `etaDelayed?: boolean` for the "Show Issues Only" filter.
- Expand the seed list to ~12–15 containers spread across 3 shipment weeks so grouping is meaningful, including at least one `"closed"` row per week.

### 3. Containers Ledger Table
File: `src/pages/Containers.tsx` plus a `src/components/containers/ContainerLedger.tsx`.

- **Grouping**: Render each `shipmentWeek` as a collapsible section using the existing shadcn `Collapsible` primitive. Section header shows week label, container count, and a small status summary (e.g. "2 action · 1 closed").
- **Columns**: Container #, Booking #, Lot ID, Buyer, Status, Docs, plus a trailing actions cell.
- **Lot ID cell**: render each lot as a small monospace badge; if more than 2, show `+N` overflow with a tooltip listing all lots.
- **Status badges**: new helper `statusMeta()` mapping the 6 logistics statuses to label + color:
  - Pending Load — slate
  - Origin Received — primary/navy soft
  - Gated-in — warning amber
  - Loaded on Vessel — primary
  - Arrived at Discharge — success
  - Closed — muted/outline
- **Closed-row treatment**: rows with `status === "closed"` render with `opacity-60` and a subtle strikethrough on the container number; sorted to the bottom of their week group.
- **Docs column**: paperclip icon plus a count like `3/4`. Wrapped in a shadcn `HoverCard` that opens a "Quick-Look" panel listing each document (Phyto, BOL, Commercial Invoice, Packing List) with status pill, file name, and a "View" link. Phyto status is read live from `phytoStore` via `usePhytoAttached(booking)` so attaching a draft on the Command Center reflects here immediately.

### 4. Utility Bar (top of page)
- Left: page title + "Layered on Nomos DB · Capay Canyon Ranch" sublabel.
- Right side controls:
  - shadcn `Switch` labeled "Show Issues Only" — filters rows where any doc is `missing` or `etaDelayed === true`.
  - "Export to CSV" button (Download icon). Generates a CSV from the currently filtered rows client-side via a Blob download (`container,booking,lots,buyer,status,docs,week`).
  - Search input (filters by container #, booking #, buyer).

### 5. Visual Lineage Hooks
- Closed rows additionally show a tiny "Closed · admin complete" caption under the status pill.
- Empty-state when "Show Issues Only" filters everything out: green check card "All clear — no missing docs or delayed ETAs."

### Files to Create
- `src/pages/Containers.tsx`
- `src/components/containers/ContainerLedger.tsx`
- `src/components/containers/DocsHoverCard.tsx`
- `src/components/containers/StatusBadge.tsx`

### Files to Edit
- `src/App.tsx` — register `/containers` route.
- `src/components/command-center/Sidebar.tsx` — convert nav to `NavLink`s, link Command Center → `/`, Containers → `/containers`.
- `src/data/containers.ts` — add fields, expand dataset, export `shipmentWeeks` helper.
- `src/pages/Index.tsx` — minor: drop the hard-coded `active: true` reliance (handled by router now).

### Out of Scope
- Real backend persistence for docs/CSV.
- Editing status from the ledger (read-only view; status changes still flow from the Command Center).
