# Nomos — Engineering Handoff

_Logistics Command Center prototype. React 18 + Vite + TypeScript + Tailwind + shadcn/ui. No backend._

See [`PRD.md`](./PRD.md) for product context and [`README.md`](./README.md) for the structural overview. This document is for the engineer who will extend, productionize, or replace pieces of this codebase.

---

## 1. Start Here

If you have one hour, do this in order:

1. **Run it.** `npm install && npm run dev`. Open `/`. Hit `⌘K`. Click a "Missing" Phyto chip. Click an "Action Required" chip. Click "New booking" and drop any PDF. Walk through `/containers`, `/alerts`, `/settings`. Everything you see is in-memory — no network calls leave the browser.
2. **Read the data model.** `src/shared/data/types.ts` (~50 lines) is the canonical record. Everything in the app is a view over an array of `Container`.
3. **Read one selector and one feature.** `src/shared/hooks/useContainers.ts` shows how UI gets data. `src/features/phyto/` shows a complete feature: state store + side-panel + PDF preview.
4. **Read `App.tsx`.** Five routes, all top-level pages live in `src/features/*/`. There is no router nesting, no auth guard, no layout wrapper — every page renders its own `Sidebar`.
5. **Then pick your entry point** based on what you're doing:
   - Wiring a real backend? → §3 Data Model + §6 Mocked vs Real (the swap points are marked).
   - Adding a screen? → copy `src/features/alerts/` as a template and add a route in `App.tsx`.
   - Adding cross-screen state? → copy the `phytoStore` pattern in `src/features/phyto/state/`.
   - Changing visuals? → tokens live in `src/index.css` + `tailwind.config.ts`. Components never hardcode colors.

**Conventions, in one paragraph.** One feature per folder under `src/features/`. A feature owns its page, its components, and any feature-local state. Anything used by 2+ features lives in `src/shared/`. Display components import selectors from `src/shared/hooks/`, never the seed array directly. Types live in `src/shared/data/types.ts` and are imported separately from data so type-only imports don't pull in the ledger. shadcn primitives in `src/components/ui/` are vendored — edit them freely, they're yours.

---

## 2. Project Structure

```text
src/
  features/
    command-center/        # / — dashboard
    containers/            # /containers — ledger
    alerts/                # /alerts
    settings/              # /settings
    phyto/                 # USDA Form 577 side-panel + cross-screen state
    erd-lrd/               # Date adjustment side-panel
  shared/
    components/Sidebar.tsx
    data/types.ts          # Canonical record types
    data/containers.ts     # Seed ledger ("Nomos DB")
    hooks/useContainers.ts # Selectors over the ledger
  components/ui/           # shadcn primitives (vendored)
  pages/NotFound.tsx
  App.tsx                  # Router
  main.tsx
  index.css                # HSL design tokens
```

---

## 3. Data Model

Defined in `src/shared/data/types.ts`. One canonical record powers every screen.

### `Container`
The unit of work. Represents a physical container + its booking + its docs + its current logistics position.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Container number, e.g. `MSCU-7741820`. Primary identifier on screen. |
| `booking` | `string` | Booking number, e.g. `BK-99182`. Used as the join key for Phyto state. |
| `vessel`, `voyage` | `string` | Vessel name + voyage code. |
| `pol`, `pod`, `destination` | `string` | Port of loading, port of discharge, final destination city. |
| `buyer` | `string` | Receiving customer. |
| `product`, `weightKg` | `string`, `number` | Cargo description + mass. |
| `eta` | `ISO date` | Estimated arrival at POD. |
| `cutoff` | `ISO date+time` | Carrier cutoff. Drives the "Action Required" surface. |
| `status` | `ContainerStatus` | UI-level status: `action`, `in-transit`, `at-port`, `delivered`, `draft`. |
| `alert` | `string?` | Free-text reason when `status === "action"`. |
| `phytoComplete` | `boolean` | Static seed value; the live truth comes from `phytoStore`. |
| `facility` | enum | One of four origin facilities. |
| `lots` | `string[]` | Multi-lot bookings. Drives the lot-lineage AI card. |
| `shipmentWeek` | `string` | Grouping key for the Containers ledger. |
| `logisticsStatus` | `LogisticsStatus` | Operational state: `pending-load → origin-received → gated-in → loaded-vessel → arrived-discharge → closed`. |
| `docs` | `ContainerDocs` | Per-doc status (`attached` / `draft` / `missing`) for `phyto`, `bol`, `commercialInvoice`, `packingList`. |
| `etaDelayed` | `boolean?` | Flags the row in `isIssueRow`. |

### Cross-screen Phyto state
`src/features/phyto/state/phytoStore.ts` is a tiny `useSyncExternalStore` keeping two `Set<bookingId>`s: `attached` and `pending`. The Phyto side-panel writes to it; the Command Center chip, the ledger Docs hover-card, and any selector that needs Phyto truth read from it. Replace this with React Query / a real store when wiring a backend.

### Selectors (`src/shared/hooks/useContainers.ts`)
The only sanctioned way to read the ledger from a component:
- `useAllContainers()`
- `useContainerByBooking(booking)`
- `useActionRequiredContainers()`
- `useContainersByWeek()` — grouped for the ledger
- `isIssueRow(c)` — overlays `phytoStore` on top of `docs.phyto`

When you replace `data/containers.ts` with an API, these selector signatures stay the same. Components do not change.

---

## 4. Components — What Each File Does

### Routing & shell
| File | Purpose |
|---|---|
| `src/App.tsx` | Router. Five routes: `/`, `/containers`, `/alerts`, `/settings`, `*`. Wraps Toasters + TooltipProvider + React Query. |
| `src/main.tsx` | Vite entry. Mounts `<App />`. |
| `src/shared/components/Sidebar.tsx` | Persistent left nav. Rendered by every page (no layout wrapper). Active state via `react-router` `NavLink`. |

### Command Center (`/`)
| File | Purpose |
|---|---|
| `features/command-center/CommandCenterPage.tsx` | Page orchestrator. Owns `⌘K` keybind + the PDF intake modal. Composes the four sections. |
| `components/KpiStrip.tsx` | Four hero KPI tiles. Static values; the only "computed" tile is the simulated demurrage goal — see `PRD.md` §7. |
| `components/DailyIntel.tsx` | Four AI-styled briefing cards (cutoff risk, port congestion, lot lineage, performance trend). Pre-written copy on a fake delay. |
| `components/ContainerTable.tsx` | This-week triage table. Renders Phyto/Status chips that open the side-panels. |
| `components/CommandBar.tsx` | `⌘K` palette. Natural-language ask surface with simulated grounded answers. |
| `components/PdfBookingFlow.tsx` | PDF drop → "extracting" → 14-field auto-filled form → success toast. Field mapping is hard-coded. |

### Containers Ledger (`/containers`)
| File | Purpose |
|---|---|
| `features/containers/ContainersLedgerPage.tsx` | Page shell + filters + CSV export (client-side `Blob`). |
| `components/ContainerLedger.tsx` | Week-grouped collapsible ledger. "Closed" rows dim and sort to the bottom of their week. |
| `components/DocsHoverCard.tsx` | Hover-card for the Docs column. Reads `phytoStore` so a freshly attached draft appears immediately. |
| `components/StatusBadge.tsx` | Logistics-status pill. Single source of truth for status colors. |

### Phyto Certification
| File | Purpose |
|---|---|
| `features/phyto/components/PhytoCertificationPanel.tsx` | Right side-panel. Full state machine: loading / ready / empty / error / validation / success. Submit + Attach actions write to `phytoStore`. |
| `features/phyto/components/PhytoPdfPreview.tsx` | Modal that renders a populated USDA Form 577 with the panel's draft values. |
| `features/phyto/state/phytoStore.ts` | Cross-screen Phyto state (see §3). |

### ERD/LRD
| File | Purpose |
|---|---|
| `features/erd-lrd/components/ErdLrdPanel.tsx` | Date-adjustment side-panel. Same six-state machine as Phyto. Validates `LRD ≥ ERD`. Shows a `LATENCY` badge when the simulated carrier feed is stale. |

### Alerts (`/alerts`)
| File | Purpose |
|---|---|
| `features/alerts/AlertsPage.tsx` | Active / History tabs. Acknowledge moves an item to history (in-component `useState`, not the ledger). Seed lives at the top of the file. |

### Settings (`/settings`)
| File | Purpose |
|---|---|
| `features/settings/SettingsPage.tsx` | Reference-data tabs: Shipping Lines, Vessels, Drayage, Labs, Terminals, Products, Pack Types, Payment Terms, Ports, Buyers, Alert Rules. Edit/toggle actions are toasts only. Seed is local to the file. |

### Shared primitives
| File | Purpose |
|---|---|
| `src/components/ui/*` | shadcn/Radix primitives. Vendored, editable. |
| `src/components/NavLink.tsx` | Thin `react-router` wrapper used by the sidebar. |
| `src/hooks/use-toast.ts`, `use-mobile.tsx` | shadcn-shipped hooks. |
| `src/lib/utils.ts` | `cn()` helper. |
| `src/index.css`, `tailwind.config.ts` | Design tokens (HSL) + Tailwind theme. **All colors live here. Components must use semantic classes.** |
| `src/pages/NotFound.tsx` | 404. |

---

## 5. Key Flows

**Phyto attach (cross-screen sync).** Click "Missing" chip on Command Center row → `PhytoCertificationPanel` opens scoped to that booking → user clicks "Attach to Booking" → `phytoStore.attach(booking)` → `useSyncExternalStore` re-renders the dashboard chip (now "Draft Attached") and the `/containers` Docs hover-card (Phyto now shows "Draft") in the same tick.

**ERD/LRD edit.** Click "Action Required" chip → `ErdLrdPanel` opens → edit dates → client validation `LRD ≥ ERD` → success toast + emerald row flash (~1.6s). Nothing is persisted across reload.

**`⌘K` ask.** `CommandBar` runs an ~850–1500ms timer then returns a pre-written grounded answer keyed off keywords in the query (lot ID, booking, vessel). Falls back to a randomized "I don't have that" line.

**PDF booking intake.** Drop any PDF → simulated extraction progress → 14 hard-coded fields appear pre-filled → confirm → success toast. The PDF bytes are discarded.

---

## 6. Mocked vs Real

### Real
- All UI: routing, side-panels, modals, tables, hover-cards, toasts, validation, state machines.
- Cross-screen Phyto sync via `phytoStore`.
- Client-side CSV export from the ledger (`Blob` download).
- Design system: HSL semantic tokens; no hardcoded colors in components.
- Deterministic seed so the demo is reproducible.

### Mocked — and where to swap it
| What | Where | Swap with |
|---|---|---|
| Ledger ("Nomos DB") | `src/shared/data/containers.ts` | API client. Keep `useContainers` selectors stable. |
| Phyto state | `src/features/phyto/state/phytoStore.ts` | React Query mutation + invalidate, or a real store. |
| AI answers (`⌘K`, Daily Intel) | `CommandBar.tsx`, `DailyIntel.tsx` | LLM call grounded on the ledger query result. |
| PDF booking extraction | `PdfBookingFlow.tsx` | Real OCR/LLM extraction; map output to the same 14 fields. |
| USDA submission | `PhytoCertificationPanel.tsx` (Submit handler) | PCIT integration; today it only flips local state + toasts. |
| Carrier feed staleness / ETAs / congestion | Hard-coded per container in seed + `ErdLrdPanel.tsx` | Real carrier API; recompute the `LATENCY` badge from a real `lastSyncedAt`. |
| Alerts ack | `AlertsPage.tsx` local `useState` | Persist on the alert record. |
| Settings edits | `SettingsPage.tsx` local seed + toasts | CRUD against reference tables. |

### Out of scope entirely
Auth, RBAC, multi-tenant isolation, persistence, server-side CSV, mobile layouts <tablet, email/SMS notifications.

---

## 7. Where to Begin (by task)

- **Wire a backend.** Add a client at `src/shared/data/api.ts`. Replace the body of `useContainers` selectors with React Query hooks calling that client. Do not change selector signatures or component imports. Then port `phytoStore` to a mutation that invalidates the container query.
- **Add a screen.** Create `src/features/<name>/`, add `components/`, `state/` as needed. Page component renders `<Sidebar />` + content. Register the route in `App.tsx` above the `*` catch-all. Add a sidebar entry in `src/shared/components/Sidebar.tsx`.
- **Add a cross-screen interaction.** Mirror `phytoStore`: `useSyncExternalStore` + `Set` + `subscribe/emit`. Keep it inside the owning feature; expose a hook.
- **Change visuals.** Edit tokens in `src/index.css` + `tailwind.config.ts`. Never add raw hex/rgb in components. Run the app in both light and dark.
- **Productionize Phyto.** Real PCIT submission goes in the `PhytoCertificationPanel` Submit handler. The "Pending" → "Accepted" transition belongs in `phytoStore` so all surfaces update together.

---

## 8. Tooling Notes

- **Stack:** React 18, Vite 5, TypeScript 5, Tailwind 3, shadcn/ui, react-router 6, @tanstack/react-query (provider only — not yet used for fetching), sonner toasts, lucide-react icons.
- **Tests:** Vitest configured (`src/test/`), one example test only. No coverage on features.
- **Lint:** `eslint.config.js`. Run before PRs.
- **Build:** `npm run build`. No env vars required (no backend).
- **Path alias:** `@/*` → `src/*`.
