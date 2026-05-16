# Nomos — Engineering Handoff

_Full-stack Logistics Command Center. React 18 + Vite + TypeScript + Tailwind + shadcn/ui. Lovable Cloud (Postgres) backend._

See [`PRD.md`](./PRD.md) for product context and [`README.md`](./README.md) for the structural overview. This document is for the engineer who will extend, productionize, or replace pieces of this codebase.

---

## 1. Start Here

If you have one hour, do this in order:

1. **Run it.** `npm install && npm run dev`. Open `/auth`, sign up (or use a seeded test account). Walk through `/`, `/containers`, `/alerts`, `/settings`. All data is live Postgres — changes persist across reloads.
2. **Read the data model.** `src/shared/data/types.ts` (~60 lines) is the canonical `Container` type. The ground truth lives in the `containers` and `documents` tables.
3. **Read one data hook and one feature.** `src/shared/hooks/useContainers.ts` shows React Query selectors over Supabase. `src/features/phyto/` shows a complete feature: state store + side-panel + PDF preview.
4. **Read `App.tsx`.** Six routes (`/auth`, `/`, `/containers`, `/alerts`, `/settings`, `*`), all wrapped in `AuthProvider` + `ProtectedRoute` except `/auth`. Global React Query client handles retries, offline detection, and session expiry.
5. **Then pick your entry point** based on what you're doing:
   - Adding a screen? → copy `src/features/alerts/` as a template and add a route in `App.tsx`.
   - Changing data access? → edit selectors in `src/shared/hooks/`; components never call Supabase directly.
   - Changing visuals? → tokens live in `src/index.css` + `tailwind.config.ts`. Components never hardcode colors.
   - Adding auth rules? → edit RLS policies via migrations in `supabase/migrations/`.

**Conventions, in one paragraph.** One feature per folder under `src/features/`. A feature owns its page, its components, and any feature-local state. Anything used by 2+ features lives in `src/shared/`. Display components import selectors from `src/shared/hooks/`, never the seed array directly. Types live in `src/shared/data/types.ts` and are imported separately from data so type-only imports don't pull in the ledger. shadcn primitives in `src/components/ui/` are vendored — edit them freely, they're yours.

---

## 2. Project Structure

```text
src/
  features/
    command-center/        # / — dashboard
    containers/            # /containers — Shipping Center ledger
    alerts/                # /alerts
    settings/              # /settings (admin only)
    phyto/                 # USDA Form 577 side-panel + cross-screen state
    erd-lrd/               # Date adjustment side-panel
  shared/
    auth/                  # AuthProvider, ProtectedRoute, useAuth hook
    components/
      Sidebar.tsx
      QueryStates.tsx      # QueryErrorCard, EmptyState, InlineErrorBanner, Skeletons
      OfflineBanner.tsx    # Fixed-top offline indicator with retry
    data/types.ts          # Canonical record types
    hooks/useContainers.ts # React Query selectors over Supabase
  components/ui/           # shadcn primitives (vendored)
  pages/
    AuthPage.tsx           # Sign in / Sign up tabs (email + Google OAuth)
    NotFound.tsx
  App.tsx                  # Router + QueryClient + OfflineBanner + AuthProvider
  main.tsx
  index.css                # HSL design tokens
integrations/
  supabase/client.ts       # Preconfigured Supabase client (auto-generated)
  supabase/types.ts        # DB types (auto-generated)
  lovable/index.ts         # Lovable AI Gateway client
supabase/migrations/       # All schema + RLS + seed migrations
```

---

## 3. Data Model

Ground truth is Postgres. `src/shared/hooks/useContainers.ts` joins `containers` + `documents` into the canonical `Container` type.

### `Container` (frontend type)
The unit of work. Represents a physical container + its booking + its docs + its current logistics position.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Container number, e.g. `MSCU-7741820`. Primary identifier on screen. |
| `booking` | `string` | Booking number, e.g. `BK-99182`. Used as the join key for Phyto state. |
| `purchaseOrder` | `string?` | PO number. Editable per-shipment via the Notes dialog. |
| `vessel`, `voyage` | `string` | Vessel name + voyage code. |
| `pol`, `pod`, `destination` | `string` | Port of loading, port of discharge, final destination city. |
| `buyer` | `string` | Receiving customer. |
| `product`, `weightKg` | `string`, `number` | Cargo description + mass. |
| `eta` | `ISO date` | Estimated arrival at POD. |
| `cutoff` | `ISO date+time` | Carrier cutoff. Drives the "Action Required" surface. |
| `status` | `ContainerStatus` | UI-level status: `action`, `in-transit`, `at-port`, `delivered`, `draft`. |
| `alert` | `string?` | Free-text reason when `status === "action"`. |
| `phytoComplete` | `boolean` | Static seed value; the live truth comes from `documents` table. |
| `facility` | enum | One of four origin facilities. |
| `lots` | `string[]` | Multi-lot bookings. Drives the lot-lineage AI card. |
| `shipmentWeek` | `string` | Grouping key for the ledger. |
| `logisticsStatus` | `LogisticsStatus` | Operational state: `pending-load → origin-received → gated-in → loaded-vessel → arrived-discharge → closed`. |
| `docs` | `ContainerDocs` | Per-doc status (`attached` / `draft` / `missing`) for `phyto`, `bol`, `commercialInvoice`, `packingList`. |
| `etaDelayed` | `boolean?` | Flags the row in `isIssueRow`. |

### Database schema (key tables)
| Table | Purpose | RLS |
|---|---|---|
| `organizations` | Multi-tenant org rows. | — |
| `profiles` | One row per auth user: `user_id`, `org_id`, `display_name`. | SELECT same org; UPDATE own row only. |
| `user_roles` | Roles per user per org: `admin`, `coordinator`, `viewer`. | SELECT own + admin reads all org; write requires admin. |
| `containers` | Shipment ledger. Unique `booking_id`. `purchase_order` column. | SELECT same org; write requires admin/coordinator. |
| `documents` | Per-booking doc statuses (`phyto`, `bol`, `commercial-invoice`, `packing-list`). | Same as containers. |
| `container_comments` | Team thread per container: `author_name`, `body`, timestamps. | SELECT same org; INSERT/UPDATE/DELETE by coordinator/admin. |
| `vessels`, `drayage_carriers`, `labs`, `terminals`, `products`, `pack_types`, `payment_terms`, `buyers` | Reference data seeded from Settings. | Same-org read; write requires admin. |

### Integrity
- **Unique constraint:** `containers.booking_id` is unique. Duplicate intake surfaces "Booking BK-XXXXX already exists" inline.
- **Trigger:** `containers_validate_erd_lrd` rejects updates where `lrd < erd`.
- **Org scoping:** Nearly every table has `org_id`. RLS policies scope queries to the user's organization.

### Selectors (`src/shared/hooks/useContainers.ts`)
All selectors use React Query (`useQuery`) with `queryKey: ["containers"]`:
- `useAllContainersQuery()` — raw query object (for error/loading states).
- `useAllContainers()` — array of `Container[]`.
- `useContainerByBooking(booking)` — single container lookup.
- `useActionRequiredContainers()` — filtered to `status === "action"`.
- `useContainersByWeek()` — grouped for the ledger.
- `isIssueRow(c)` — missing docs or delayed ETA.

---

## 4. Auth & RBAC

### Roles
- `admin` — full UI access, including Settings.
- `coordinator` — can create/edit shipments, attach docs, post comments. Cannot access Settings.
- `viewer` — read-only. Cannot acknowledge alerts, submit Phyto, save ERD/LRD, or create new bookings.

### Auth flow
1. `/auth` has tabs for **Sign in** (email/password + Google OAuth) and **Sign up**.
2. On sign-up, the app collects `display_name`, creates a `profiles` row, and assigns `coordinator` role in the first organization.
3. `AuthProvider` subscribes to `onAuthStateChange` before calling `getSession()` to avoid race conditions.
4. Session expiry: any 401/expired JWT triggers `supabase.auth.signOut()`, which fires `SIGNED_OUT`. AuthProvider detects the `nomos:session-expired` flag, shows a toast, and redirects to `/auth?reason=expired`.

### Role-gated UI
- `Sidebar.tsx` filters nav items by role (e.g. Settings is admin-only).
- Action buttons throughout the UI are conditionally rendered based on `useAuth().role`:
  - **viewer:** Acknowledge, Phyto Submit, ERD/LRD Save, "New booking" are hidden.
  - **coordinator:** Settings nav entry is hidden.
  - **admin:** everything visible.

---

## 5. Components — What Each File Does

### Routing & shell
| File | Purpose |
|---|---|
| `src/App.tsx` | Router. Six routes (`/auth`, `/`, `/containers`, `/alerts`, `/settings`, `*`). Wraps QueryClientProvider (with global error + retry config), Toasters, TooltipProvider, OfflineBanner, AuthProvider, ProtectedRoute. |
| `src/main.tsx` | Vite entry. Mounts `<App />`. |
| `src/shared/components/Sidebar.tsx` | Persistent left nav. Rendered by every page. Active state via `react-router` `NavLink`. Role-filtered entries + user avatar + logout. |
| `src/shared/components/OfflineBanner.tsx` | Fixed-top banner listening to `online`/`offline` events. Shows "You're offline" with a Retry button that invalidates all queries on reconnect. |
| `src/shared/components/QueryStates.tsx` | Reusable resilience primitives: `QueryErrorCard` (centered error + Retry), `EmptyState` (icon + CTA), `InlineErrorBanner` (red alert strip), `SkeletonBlock` / `SkeletonRows` (loading placeholders). |

### Auth
| File | Purpose |
|---|---|
| `src/shared/auth/AuthProvider.tsx` | Context provider. Manages session, user, profile, and roles. Loads profile + roles on auth state change. Exposes `useAuth()` hook. |
| `src/shared/auth/ProtectedRoute.tsx` | Redirects unauthenticated users to `/auth`. Shows "Loading…" during auth bootstrap. |
| `src/pages/AuthPage.tsx` | Sign in / Sign up tabs. Email/password + Google OAuth. Collects `display_name` on signup. |

### Command Center (`/`)
| File | Purpose |
|---|---|
| `features/command-center/CommandCenterPage.tsx` | Page orchestrator. Owns `⌘K` keybind + the PDF intake modal. Composes the four sections. |
| `components/KpiStrip.tsx` | Four hero KPI tiles. Fetched from `intake_metrics` table; shows skeletons on load and `QueryErrorCard` on failure. |
| `components/DailyIntel.tsx` | Four AI-styled briefing cards. Fetched from backend; skeleton + error states. |
| `components/ContainerTable.tsx` | This-week triage table. Renders Phyto/Status chips that open the side-panels. |
| `components/CommandBar.tsx` | `⌘K` palette. Natural-language ask surface with simulated grounded answers. Updated "no matches" state links to new booking. |
| `components/PdfBookingFlow.tsx` | PDF drop → simulated extraction → 14-field form → INSERT into `containers` + `documents` + `intake_metrics`. Duplicate `booking_id` surfaces inline error without clearing form. |

### Shipping Center (`/containers`)
| File | Purpose |
|---|---|
| `features/containers/ContainersLedgerPage.tsx` | Page shell + filters + CSV export (client-side `Blob`). Skeleton rows while loading; empty state with "New booking" CTA when zero rows. |
| `components/ContainerLedger.tsx` | Week-grouped collapsible ledger. PO # column. "Closed" rows dim and sort to bottom. |
| `components/DocsHoverCard.tsx` | Hover-card for the Docs column. Reads `documents` table so a freshly attached draft appears immediately. |
| `components/StatusBadge.tsx` | Logistics-status pill. Single source of truth for status colors. |
| `components/ShipmentCommentsDialog.tsx` | Dialog per container: editable PO field (Save), team comment textarea (Post), scrollable thread with author names + timestamps. Org-scoped. |

### Phyto Certification
| File | Purpose |
|---|---|
| `features/phyto/components/PhytoCertificationPanel.tsx` | Right side-panel. Full state machine: loading / ready / empty / error / validation / success. Submit + Attach actions UPSERT into `documents` table (no error on duplicate). Role-gated (viewers cannot submit). |
| `features/phyto/components/PhytoPdfPreview.tsx` | Modal that renders a populated USDA Form 577 with the panel's draft values. |
| `features/phyto/state/phytoStore.ts` | Reads/writes `documents` table (`doc_type='phyto'`) instead of in-memory Sets. Cross-screen sync via React Query invalidation. |

### ERD/LRD
| File | Purpose |
|---|---|
| `features/erd-lrd/components/ErdLrdPanel.tsx` | Date-adjustment side-panel. Validates `LRD ≥ ERD` client-side + server-side via trigger. Writes to `containers` table. Shows `LATENCY` badge based on `carrier_last_synced_at`. Role-gated save button. |

### Alerts (`/alerts`)
| File | Purpose |
|---|---|
| `features/alerts/AlertsPage.tsx` | Active / History tabs. Reads from backend. Acknowledge updates status (coordinator/admin only; viewers see read-only list). Inline error banner on mutation failure. Skeleton + empty states. |

### Settings (`/settings`)
| File | Purpose |
|---|---|
| `features/settings/SettingsPage.tsx` | Reference-data tabs: Shipping Lines, Vessels, Drayage, Labs, Terminals, Products, Pack Types, Payment Terms, Ports, Buyers, Alert Rules. CRUD against real tables. Admin-only route. Empty tabs highlight the "Add" button. Inline error banners on mutations. |

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

## 6. Key Flows

**Phyto attach (cross-screen sync).** Click "Missing" chip on Command Center row → `PhytoCertificationPanel` opens scoped to that booking → user clicks "Attach to Booking" → UPSERT into `documents` (`doc_type='phyto', status='draft'`) → React Query invalidates `containers` query → dashboard chip, ledger Docs hover-card, and Phyto panel all re-render with the new state in the same tick.

**ERD/LRD edit.** Click "Action Required" chip → `ErdLrdPanel` opens → edit dates → client validation `LRD ≥ ERD` → server trigger enforces the same → UPDATE `containers.erd` / `containers.lrd` → success toast + emerald row flash. Changes persist across reloads.

**`⌘K` ask.** `CommandBar` runs an ~850–1500ms timer then returns a pre-written grounded answer keyed off keywords in the query (lot ID, booking, vessel). Falls back to a randomized "I don't have that" line.

**PDF booking intake.** Drop any PDF → simulated extraction progress → 14 fields pre-filled → confirm → INSERT into `containers` + `documents` + log row in `intake_metrics`. Duplicate `booking_id` surfaces inline error: "Booking BK-XXXXX already exists".

**Shipment comments.** Click "Notes" on any ledger row → `ShipmentCommentsDialog` opens → edit PO # (Save) or post a comment (Post) → INSERT/UPDATE against `containers` / `container_comments`. Org-scoped; thread shows author name + timestamp.

**Offline handling.** When `navigator.onLine` goes false, `OfflineBanner` appears at the top of the viewport. Queries retry up to 3 times with exponential backoff (max 8s). On reconnect, clicking "Retry" invalidates all cached queries. Auth errors are suppressed while offline to avoid false sign-outs.

---

## 7. Resilience Patterns

Every screen uses these patterns consistently:

| Pattern | Component | Usage |
|---|---|---|
| **Loading** | `SkeletonRows` / `SkeletonBlock` | Tables show 4–6 skeleton rows; KPIs show skeleton blocks. Never raw spinners. |
| **Error** | `QueryErrorCard` | Centered card with error message + Retry button. Never a blank screen. |
| **Empty** | `EmptyState` | Icon + title + description + optional CTA button. |
| **Inline error** | `InlineErrorBanner` | Red strip inside forms (PDF intake, ERD/LRD, Phyto, Settings) when mutations fail. Form input is preserved. |
| **Offline** | `OfflineBanner` | Fixed-top banner when `navigator.onLine === false`. Retry invalidates all queries on reconnect. |
| **Session expiry** | `AuthProvider` + global `QueryCache` | Detects 401/JWT expired → sign out → redirect to `/auth?reason=expired` with toast. |

---

## 8. Mocked vs Real

### Real
- All UI: routing, side-panels, modals, tables, hover-cards, toasts, validation, state machines.
- **Backend:** Postgres tables for containers, documents, reference data, comments, intake metrics, orgs, profiles, roles.
- **Auth:** Email/password + Google OAuth, RBAC with three roles, org-scoped RLS.
- **Cross-screen Phyto sync:** via React Query mutation + invalidation against `documents` table.
- **ERD/LRD persistence:** writes to `containers` table; server trigger enforces `LRD ≥ ERD`.
- **Settings CRUD:** real INSERT/UPDATE/DELETE against reference tables.
- **Alerts:** backend-scoped queries; acknowledge updates the record.
- **KPIs / Daily Intel:** fetched from backend tables.
- **Client-side CSV export:** from the ledger (`Blob` download).
- **Design system:** HSL semantic tokens; no hardcoded colors in components.
- **Resilience:** React Query with retries, skeletons, error cards, empty states, offline banner.

### Mocked — and where to swap it
| What | Where | Swap with |
|---|---|---|
| AI answers (`⌘K`, Daily Intel) | `CommandBar.tsx`, `DailyIntel.tsx` | LLM call grounded on the ledger query result via Lovable AI Gateway. |
| PDF booking extraction | `PdfBookingFlow.tsx` | Real OCR/LLM extraction; map output to the same 14 fields. |
| USDA submission | `PhytoCertificationPanel.tsx` (Submit handler) | PCIT integration; today it only writes to `documents` + toasts. |
| Carrier feed staleness / ETAs / congestion | Hard-coded per container in seed + `ErdLrdPanel.tsx` | Real carrier API; recompute the `LATENCY` badge from a real `lastSyncedAt`. |
| `⌘K` grounded answers | `CommandBar.tsx` | Vector search over shipments + LLM synthesis. |

### Out of scope entirely
Mobile layouts <tablet, email/SMS notifications, real-time WebSocket updates (uses polling via React Query), server-side CSV generation.

---

## 9. Where to Begin (by task)

- **Add a screen.** Create `src/features/<name>/`, add `components/`, `state/` as needed. Page component renders `<Sidebar />` + content. Register the route in `App.tsx` above the `*` catch-all. Add a sidebar entry in `src/shared/components/Sidebar.tsx`.
- **Add a backend table.** Write a migration in `supabase/migrations/`. Include RLS policies scoped to `org_id`. Add the type to `src/shared/data/types.ts` if it joins into `Container`. Write selectors in `src/shared/hooks/`.
- **Change auth rules.** Edit RLS policies in a new migration. Update `AuthProvider.tsx` if new role logic is needed. Update component gating if UI affordances should change.
- **Change visuals.** Edit tokens in `src/index.css` + `tailwind.config.ts`. Never add raw hex/rgb in components. Run the app in both light and dark.
- **Productionize Phyto.** Real PCIT submission goes in the `PhytoCertificationPanel` Submit handler. The "Pending" → "Accepted" transition should update the `documents` row so all surfaces update together.
- **Add real-time updates.** Enable Supabase Realtime on the table, then subscribe in the relevant page component. Remember RLS still applies to realtime.

---

## 10. Tooling Notes

- **Stack:** React 18, Vite 5, TypeScript 5, Tailwind 3, shadcn/ui, react-router 6, @tanstack/react-query, sonner toasts, lucide-react icons.
- **Backend:** Lovable Cloud (Postgres + Auth). Migrations in `supabase/migrations/`.
- **AI Gateway:** `src/integrations/lovable/index.ts` — Lovable AI client for LLM calls without API keys.
- **Tests:** Vitest configured (`src/test/`), one example test only. No coverage on features.
- **Lint:** `eslint.config.js`. Run before PRs.
- **Build:** `npm run build`. No env vars required for the build (Supabase credentials are injected at runtime via `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
- **Path alias:** `@/*` → `src/*`.
