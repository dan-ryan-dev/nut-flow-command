# Integration Plan

## Section 1: M4 Status Check

| Checkpoint | Status | Evidence |
|---|---|---|
| **Screen count** | 5 total routes (4 app screens + 404) | `src/App.tsx` defines `/` (Command Center), `/containers` (Ledger), `/alerts`, `/settings`, and `*` (NotFound). Sidebar lists 4 navigable items. |
| **Living PRD exists** | Yes | `PRD.md` exists at project root. Title reads "Nomos — Living Product Requirements Document" and was last updated 2026-05-09 per its header. |
| **Clean, descriptive naming** | Yes | Examples: `useAllContainers`, `useContainerByBooking`, `CommandCenterPage`, `ContainersLedgerPage`, `LogisticsStatus`, `DocStatus`, `PhytoCertificationPanel`, `ContainerLedger`. No cryptic abbreviations or single-letter variables in feature code. |
| **GitHub connected** | No | `git remote -v` shows remotes pointing to `git.private.lovable-gcp.code.storage`, not GitHub. No `.github/` directory, no Actions workflows, and no GitHub-specific config files are present. |
| **Supabase / database backend** | Yes | `supabase/config.toml`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, and migration files exist. Five tables (`containers`, `documents`, `logistics_events`, `alerts`, `carriers`) were created and seeded with 13 containers and 52 document rows from `src/shared/data/containers.ts`. Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are configured in `.env`. |


---

## Section 2: Data Audit — What's Still Hardcoded?

| Screen / Component | Hardcoded Value | What It Should Query |
|---|---|---|
| `KpiStrip.tsx` (Command Center) | "Containers this week: **42**" / "vs 38 last wk" | `SELECT count(*) FROM containers WHERE shipment_week = current_week` + same for prior week |
| `KpiStrip.tsx` | "Action required: **3** — Phyto + cutoffs" | `SELECT count(*) FROM containers WHERE status = 'action'` |
| `KpiStrip.tsx` | "Logged real-time: **31 / 42** · 74% — up from 19%" | `count(containers WHERE created_at >= shipment_week_start) / count(containers WHERE shipment_week = current_week)`; baseline from a `kpi_history` table |
| `KpiStrip.tsx` | "Demurrage risk: **$0** · 0 incidents · 14 days" | Aggregate over `logistics_events` / a new `demurrage_incidents` table for last 14 days |
| `CommandCenterPage.tsx` header | "**42** active containers · **4** facilities · Week 19" | `count(containers)`, `count(distinct facility)`, derived current `shipment_week` |
| `CommandCenterPage.tsx` footer | "Capay Canyon Ranch · Synced 12 sec ago" | Tenant name from `organizations` (new); sync time from latest `logistics_events.created_at` |
| `DailyIntel.tsx` | All 4 briefing cards (cutoff risk, Oakland B57 congestion, "100% of W19 bookings", "Modesto 14 cleared / 96% phyto-first-try") | New `daily_briefings` table written by a scheduled edge function that aggregates `containers`, `alerts`, `logistics_events` |
| `DailyIntel.tsx` | "Monday, May 4" header + "06:00 PT" timestamp | `daily_briefings.briefing_date` / `generated_at` |
| `CommandBar.tsx` | 5 `ALL_SUGGESTIONS` Q&A pairs with pre-baked answers | LLM call grounded on `containers`/`documents` via edge function |
| `CommandBar.tsx` | "scanning **42** containers" | `count(containers)` |
| `PdfBookingFlow.tsx` | All 14 extracted fields (`BK-99221`, `MSC ARUSHI · 451W`, `MSCU-7741833`, etc.) | Real OCR/LLM extraction → insert into `containers` + `documents` |
| `PdfBookingFlow.tsx` | "12 min manual / ~8 sec PDF / 98.4% accuracy" stat tiles | `intake_metrics` table (new) tracking actual extraction runs |
| `PdfBookingFlow.tsx` success toast | "BK-99221 logged in 9 seconds · Saved 11 min vs manual entry" | Computed from `intake_metrics.duration_ms` |
| `AlertsPage.tsx` | `seed` array (AL-2036…AL-2041) and `historySeed` array (AL-2025, AL-2028, AL-2030) | `SELECT * FROM alerts WHERE acknowledged = false` / `= true` (table exists, unused) |
| `AlertsPage.tsx` header | "synced 12s ago" | `max(created_at)` from `alerts` |
| `SettingsPage.tsx` | `data` object: Shipping Lines (6), Vessels (3), Drayage (2), Labs (2), Terminals (2), Products (2), Pack Types (2), Payment Terms (3), Ports (3), Buyers (2), Alert Rules (2) | `carriers` table exists for Shipping Lines; remaining 10 tabs need new reference tables (see Section 3) |
| `ContainerTable.tsx`, `ContainerLedger.tsx`, `DocsHoverCard.tsx` | `useAllContainers()` / `useContainersByWeek()` reading `src/shared/data/containers.ts` seed array | Replace selector bodies with Supabase queries against `containers` + `documents` (tables exist + seeded, not yet wired) |
| `phytoStore.ts` | In-memory `Set<bookingId>` for attached/pending Phyto | `UPDATE documents SET status = 'draft'/'attached' WHERE booking_id = ? AND doc_type = 'phyto'` |
| `ErdLrdPanel.tsx` | Hardcoded ERD/LRD dates per container; static "LATENCY" badge | `containers.cutoff` + new `erd`, `lrd`, `carrier_last_synced_at` columns |
| `PhytoCertificationPanel.tsx` | Form draft values derived from seed; Submit only flips local state | Persist to `documents` row (`booking_id` + `doc_type='phyto'`); real PCIT submission as future integration |

---

## Section 3: Schema Design

### Existing tables (from M4)

| Table | Fields | Purpose |
|---|---|---|
| `containers` *(existing)* | `container_id text PK-style`, `booking_id text`, `vessel text`, `voyage text`, `pol text`, `pod text`, `destination text`, `buyer text`, `product text`, `weight_kg int`, `eta date`, `cutoff timestamptz`, `status container_status`, `alert text?`, `phyto_complete bool`, `facility text`, `lots text[]`, `shipment_week text`, `logistics_status logistics_status`, `eta_delayed bool`, `created_at`, `updated_at` | Canonical shipment ledger |
| `documents` *(existing)* | `id uuid`, `booking_id text`, `doc_type doc_type`, `status doc_status`, `file_url text?`, `notes text?`, `created_at`, `updated_at` | Per-booking docs (phyto, BOL, CI, packing list) |
| `logistics_events` *(existing)* | `id uuid`, `container_id text`, `status logistics_status`, `occurred_at timestamptz`, `notes text?`, `created_at` | Append-only status timeline |
| `alerts` *(existing)* | `id uuid`, `code text unique`, `tag text`, `tone alert_tone`, `container_ref text?`, `booking_ref text?`, `status_text text`, `occurred_at timestamptz`, `acknowledged bool`, `created_at` | Active + history queue |
| `carriers` *(existing)* | `id uuid`, `name text`, `scac text unique`, `active bool`, `created_at` | Shipping Lines reference data |

### New tables (proposed)

| Table | Fields | Purpose |
|---|---|---|
| `organizations` *(new)* | `id uuid`, `name text` (e.g. "Capay Canyon Ranch"), `created_at` | Multi-tenant root; every other row gets `org_id` |
| `profiles` *(new)* | `id uuid`, `user_id uuid → auth.users`, `org_id uuid → organizations`, `display_name text`, `created_at`, `updated_at` | Per-user metadata + tenant membership |
| `user_roles` *(new)* | `id uuid`, `user_id uuid → auth.users`, `org_id uuid`, `role app_role enum('admin','coordinator','viewer')` | Roles in a separate table (see Section 4) |
| `vessels` *(new)* | `id uuid`, `org_id uuid`, `name text`, `voyage_code text`, `active bool` | Settings → Vessels |
| `drayage_carriers` *(new)* | `id uuid`, `org_id uuid`, `name text`, `code text`, `active bool` | Settings → Drayage |
| `labs` *(new)* | `id uuid`, `org_id uuid`, `name text`, `code text`, `active bool` | Settings → Labs |
| `terminals` *(new)* | `id uuid`, `org_id uuid`, `name text`, `code text`, `active bool` | Settings → Terminals |
| `products` *(new)* | `id uuid`, `org_id uuid`, `name text`, `sku text`, `active bool` | Settings → Products |
| `pack_types` *(new)* | `id uuid`, `org_id uuid`, `name text`, `code text`, `active bool` | Settings → Pack Types |
| `payment_terms` *(new)* | `id uuid`, `org_id uuid`, `name text`, `code text`, `active bool` | Settings → Payment Terms |
| `ports` *(new)* | `id uuid`, `name text`, `unlocode text` (USOAK, DEHAM…), `active bool` | Settings → Ports (likely global, not per-org) |
| `buyers` *(new)* | `id uuid`, `org_id uuid`, `name text`, `code text`, `country text`, `active bool` | Settings → Buyers |
| `alert_rules` *(new)* | `id uuid`, `org_id uuid`, `name text`, `code text`, `condition jsonb` (e.g. `{"trigger":"phyto_missing","window_hours":48}`), `active bool` | Settings → Alert Rules |
| `daily_briefings` *(new)* | `id uuid`, `org_id uuid`, `briefing_date date`, `generated_at timestamptz`, `cards jsonb` (array of `{tone,title,body,cta}`) | Replaces `DailyIntel` hardcoded copy |
| `kpi_snapshots` *(new)* | `id uuid`, `org_id uuid`, `taken_at timestamptz`, `shipment_week text`, `containers_count int`, `action_count int`, `logged_realtime int`, `demurrage_usd int` | Powers KPI deltas ("vs 38 last wk") |
| `intake_metrics` *(new)* | `id uuid`, `org_id uuid`, `booking_id text`, `pdf_filename text`, `duration_ms int`, `fields_extracted int`, `accuracy_pct numeric`, `created_at` | Powers the "~8 sec / 98.4%" stat tiles |
| `container_dates` *(new, or add cols to `containers`)* | `container_id text`, `erd timestamptz`, `lrd timestamptz`, `carrier_last_synced_at timestamptz` | Powers ERD/LRD panel + LATENCY badge |

Add an `org_id uuid` column to every existing per-tenant table (`containers`, `documents`, `logistics_events`, `alerts`, `carriers`).

---

## Section 4: Auth Model & Permissions

### Roles

Stored in `user_roles` (separate table, never on `profiles` — prevents privilege escalation). Enum `app_role`:

| Role | Description |
|---|---|
| `admin` | Org owner. Manages users, reference data (Settings tabs), alert rules, billing. Full CRUD on every per-org table. |
| `coordinator` | Export Coordinator persona from the PRD. Daily user. Full CRUD on `containers`, `documents`, `logistics_events`, `alerts` for their org. Read-only on reference tables. |
| `viewer` | Operations Manager persona. Read-only across the entire org dataset. Cannot ack alerts, attach phytos, or edit ERD/LRD. |

Roles are checked via a `SECURITY DEFINER` function `has_role(_user_id uuid, _org_id uuid, _role app_role)` to avoid recursive RLS.

### What each role can do per screen

| Screen | viewer | coordinator | admin |
|---|---|---|---|
| Command Center (`/`) | read | read + open Phyto/ERD panels + create bookings | same as coordinator |
| Containers Ledger (`/containers`) | read + CSV export | read + edit dates/docs + export | same as coordinator |
| Alerts (`/alerts`) | read | read + acknowledge | read + ack + manage rules |
| Settings (`/settings`) | hidden | hidden | full CRUD on all reference tabs + user/role mgmt |
| Phyto panel — Submit | hidden | yes | yes |
| ERD/LRD panel — Save | hidden | yes | yes |
| PDF booking intake | hidden | yes | yes |

### RLS rules

Every per-tenant table gets the same two-policy pattern: read scoped to org membership, writes scoped to org + role.

| Table | Per-user isolation? | Policy |
|---|---|---|
| `organizations` | No | Read: any member of the org. Write: `admin` only. |
| `profiles` | Own row | Read: any member of same org. Update: only `auth.uid() = user_id`. |
| `user_roles` | Own row read, admin write | Read: own roles + admins read all org roles. Write: `admin` only. |
| `containers` | Per-org | Read: `org_id IN (user's orgs)`. Write: `has_role(uid, org_id, 'coordinator' OR 'admin')`. |
| `documents` | Per-org via `containers.booking_id` join (or denormalize `org_id`) | Same as `containers`. |
| `logistics_events` | Per-org via `container_id` | Read: org members. Insert: coordinator/admin. No update/delete. |
| `alerts` | Per-org | Read: org members. Update (acknowledge): coordinator/admin. |
| `carriers`, `vessels`, `drayage_carriers`, `labs`, `terminals`, `products`, `pack_types`, `payment_terms`, `buyers`, `alert_rules` | Per-org | Read: org members. Write: `admin` only. |
| `ports` | Global | Read: any authenticated user. Write: platform-level only (no app UI). |
| `daily_briefings`, `kpi_snapshots`, `intake_metrics` | Per-org | Read: org members. Insert: service role (edge function). |

Current prototype RLS (public read, authenticated write on all five existing tables) is fine for the demo but **must be tightened to `org_id`-scoped policies** before any second tenant or real customer data lands.

---

## Section 5: Prompts

### Prompt 1 — Schema Expansion

```
Extend the Nomos backend so the UI runs entirely off Supabase instead of hardcoded constants.

1. Create these new tables with RLS enabled (per-org scoping where noted):
   - organizations (id, name)
   - profiles (user_id → auth.users, org_id, display_name)
   - user_roles (user_id, org_id, role app_role enum: admin/coordinator/viewer) — separate table, NEVER on profiles
   - vessels, drayage_carriers, labs, terminals, products, pack_types, payment_terms, buyers, alert_rules — all (id, org_id, name, code, active)
   - ports (id, name, unlocode, active) — global, not per-org
   - daily_briefings (id, org_id, briefing_date, generated_at, cards jsonb)
   - kpi_snapshots (id, org_id, taken_at, shipment_week, containers_count, action_count, logged_realtime, demurrage_usd)
   - intake_metrics (id, org_id, booking_id, pdf_filename, duration_ms, fields_extracted, accuracy_pct)
   Add columns to containers: erd timestamptz, lrd timestamptz, carrier_last_synced_at timestamptz.
   Add org_id uuid to containers, documents, logistics_events, alerts, carriers.

2. Add a SECURITY DEFINER function has_role(_user_id uuid, _org_id uuid, _role app_role) to use inside RLS policies (no recursion).

3. Replace hardcoded values in the UI with real queries via @tanstack/react-query and src/integrations/supabase/client:
   - KpiStrip.tsx: derive all 4 tiles from containers + kpi_snapshots (containers this week, action required, logged real-time, demurrage 14-day rollup).
   - CommandCenterPage.tsx header: "42 active · 4 facilities · Week 19" → live counts.
   - DailyIntel.tsx: read latest row from daily_briefings.
   - CommandBar.tsx: "scanning 42 containers" → live count; remove ALL_SUGGESTIONS canned answers (leave the UI, swap data source in a later prompt).
   - AlertsPage.tsx: replace `seed` and `historySeed` with SELECTs against alerts (acknowledged = false / true). Acknowledge button does UPDATE.
   - SettingsPage.tsx: each of the 11 tabs reads its own reference table; Add/Edit/Toggle become real INSERT/UPDATE.
   - useContainers.ts selectors (useAllContainers, useContainerByBooking, useActionRequiredContainers, useContainersByWeek): replace bodies with Supabase queries — DO NOT change signatures, every component import stays the same.
   - phytoStore.ts: replace the in-memory Set with documents table writes (booking_id + doc_type='phyto', status='draft'/'attached').
   - ErdLrdPanel.tsx: read/write containers.erd/lrd; show real LATENCY badge based on carrier_last_synced_at.
   - PdfBookingFlow.tsx: on Confirm, INSERT into containers + documents and log a row in intake_metrics.

Seed the new reference tables from the hardcoded arrays in SettingsPage.tsx. Keep the existing containers/documents seed.
```

### Prompt 2 — Auth UI + Row-Level Security

```
Add authentication and lock the app down per Section 4 of Integration Plan.md.

1. Create an /auth route with tabs for Sign in and Sign up. Use email/password + Google. On signup collect display_name and create a profiles row + a user_roles row (default role: coordinator, org_id = first organization for now).
   - Set emailRedirectTo: window.location.origin on signUp().
   - Use onAuthStateChange BEFORE getSession() in the auth provider.
   - Do NOT enable auto-confirm; users verify via email.

2. Add a ProtectedRoute wrapper around /, /containers, /alerts, /settings. Unauthenticated users redirect to /auth.

3. Update Sidebar.tsx to show the logged-in user's display_name (from profiles) and a Logout button that calls supabase.auth.signOut() and routes to /auth. Hide the Settings nav entry for non-admin roles.

4. Tighten RLS — replace the current "public read / authenticated write" policies on containers, documents, logistics_events, alerts, carriers with org-scoped policies using has_role():
   - SELECT: row's org_id IS IN (user's orgs from user_roles)
   - INSERT/UPDATE/DELETE on containers/documents/logistics_events: has_role(uid, org_id, 'coordinator') OR has_role(uid, org_id, 'admin')
   - UPDATE on alerts (acknowledge): same as above
   - All reference tables (vessels, labs, buyers, etc.): SELECT for any org member, write requires 'admin'
   - profiles: SELECT same org, UPDATE own row only
   - user_roles: SELECT own + admin reads all org roles; write requires admin

5. Hide UI affordances per role:
   - viewer: hide Acknowledge button, Phyto Submit, ERD/LRD Save, "New booking" button
   - coordinator: hide Settings nav entry
   - admin: full UI

6. Verify two seeded test users (one coordinator in Org A, one in Org B) see only their own org's containers, alerts, and documents.
```

### Prompt 3 — Edge Cases

```
Make the entire Nomos app resilient. Cover these failure modes everywhere they apply (Command Center, Containers Ledger, Alerts, Settings, Phyto panel, ERD/LRD panel, PDF intake, Command Bar):

1. Database connection failure
   - Wrap every Supabase query with React Query error handling.
   - On error: show a centered card with the error message + a "Retry" button that re-runs the query. Never show a blank screen.

2. Empty data states
   - Containers Ledger with zero containers: "No shipments yet — drop a carrier PDF to log your first booking" + button that opens PdfBookingFlow.
   - Alerts with zero active: "All clear — no active alerts" with a calm illustration tone.
   - Settings tab with zero rows: "No {entity} yet" + the existing Add button highlighted.
   - Command Bar with no matches: keep the existing fallback copy but link to "Start a new booking".

3. Form submission failure
   - PhytoCertificationPanel Submit, ErdLrdPanel Save, SettingsPage Add/Edit, PdfBookingFlow Confirm, AlertsPage Acknowledge: on error show an inline red banner above the form with the error message; DO NOT clear the form fields.

4. Loading states
   - Replace every spinner-only state with skeleton screens matching the final layout:
     - KpiStrip: 4 skeleton tiles
     - DailyIntel: 4 skeleton briefing rows
     - ContainerTable / ContainerLedger: 6 skeleton rows
     - AlertsPage: 4 skeleton alert rows
     - SettingsPage table: 5 skeleton rows
     - Phyto + ERD/LRD panels: skeleton field grid

5. Session expiry
   - In the auth provider, on SIGNED_OUT or expired-token errors from any query, redirect to /auth?reason=expired and show a toast: "Your session expired — please sign in again."

Also handle:
- ERD/LRD where LRD < ERD: keep existing client validation, add server-side check.
- Phyto attach when document row already exists: UPSERT, don't error.
- PDF intake with duplicate booking_id: surface "Booking BK-XXXXX already exists" inline.
```

---

## Section 6: Edge Case Checklist

- [ ] **DB connection failure** — Every query shows an error card with a Retry button instead of a blank screen.
- [ ] **Empty containers ledger** — First-run user sees a "Drop a PDF" CTA, not an empty table.
- [ ] **Empty alerts queue** — "All clear" message instead of a blank list.
- [ ] **Empty settings tab** — Per-tab empty state highlighting the Add button.
- [ ] **Form submission failure** — Inline error above the form; user input preserved.
- [ ] **Loading skeletons** — Every fetching screen (KPIs, briefings, ledger, alerts, settings, panels) shows layout-matching skeletons.
- [ ] **Session expiry** — Auto-redirect to `/auth?reason=expired` with a toast.
- [ ] **LRD before ERD** — Both client and server reject; existing emerald-flash success path stays intact.
- [ ] **Phyto re-attach** — UPSERT on `documents` so re-attaching a draft doesn't error.
- [ ] **Duplicate booking_id on PDF intake** — Inline "already exists" error in `PdfBookingFlow` instead of a 409 toast.
- [ ] **Cutoff already passed** — `ContainerTable` "Action Required" chip switches to "Missed cutoff" tone; no edit on `ErdLrdPanel`.
- [ ] **Stale carrier feed** — `LATENCY` badge appears in `ErdLrdPanel` when `carrier_last_synced_at` > 30 min old.
- [ ] **Acknowledge race** — Two coordinators acking the same alert: second click shows "Already acknowledged by X" and refreshes.
- [ ] **CSV export with zero rows** — Disable the Export button; tooltip "Nothing to export".
- [ ] **PDF intake mid-upload close** — Modal close during `parsing` cancels the simulated job cleanly with no orphaned `intake_metrics` row.
- [ ] **Cross-screen Phyto sync after error** — If `documents` write fails, the chip rolls back and shows the prior state.
- [ ] **Role downgrade mid-session** — Hidden affordances re-evaluate on next route change; server RLS denies any stale write.
- [ ] **Wrong-org container lookup via URL** — Direct navigation to a booking outside the user's org returns a 404-style "Not found in your workspace".
- [ ] **Long lot list overflow** — `lots[]` with 10+ entries truncates with "+N more" in the table; full list visible on hover.
- [ ] **Realtime disconnect** — "Synced 12s ago" header indicator turns amber and shows last-good time when websocket drops.

---

## Section 7: Stress Test Plan

### Test 1 — Carrier feed offline mid-edit (connection failure)

**Setup:** Sign in as a coordinator. Open `/containers`. Click an "Action Required" row to open `ErdLrdPanel`. Edit the ERD date. Before clicking Save, open browser DevTools → Network → set "Offline".

**Steps:**
1. Click **Save** in the panel.
2. Observe.
3. Restore the network.
4. Click **Retry**.

**Expected:**
- Inline red error banner appears above the form ("Couldn't reach the database — check your connection").
- Date fields keep the values the user typed.
- `LATENCY` badge appears on the panel within 5 seconds.
- After network restore, Retry succeeds and the row flashes emerald.
- No duplicate `logistics_events` row is written.

### Test 2 — Brand-new org, zero shipments (empty state)

**Setup:** Sign up a brand-new user with a fresh email. Default role = coordinator. New `organizations` row, no seeded containers/documents/alerts.

**Steps:**
1. Land on `/` (Command Center).
2. Visit `/containers`, `/alerts`, `/settings` in order.
3. Click "New booking" and cancel the modal.

**Expected:**
- KPI strip shows zeros (not "42") with "No baseline yet" subtext, not "vs 38 last wk".
- Daily Intel shows "No briefing for today yet — comes back at 06:00 PT" instead of stale cards.
- Containers Ledger shows the empty state card with a "Drop your first PDF" CTA wired to `PdfBookingFlow`.
- Alerts shows "All clear — no active alerts".
- Settings → Shipping Lines (and every other tab) shows "No {entity} yet" + highlighted Add button.
- `⌘K` Command Bar still opens; suggestion list shows "Start by logging your first booking".

### Test 3 — Double-click submit storm (rapid repeated actions)

**Setup:** Sign in as a coordinator. Open `/` and open `PhytoCertificationPanel` for a booking with `phyto = missing`.

**Steps:**
1. Click **Submit** 8 times in under one second.
2. Switch to `/alerts` and spam **Acknowledge** on the top alert 10 times.
3. Open `PdfBookingFlow`, drop a PDF, and during `parsing` close + reopen the modal 5 times in 3 seconds.

**Expected:**
- Phyto: exactly one `documents` UPSERT executes; button shows a spinner + disabled state on click 1; subsequent clicks are no-ops. Cross-screen chip + Docs hover-card update exactly once.
- Alerts: exactly one `alerts.acknowledged = true` UPDATE; alert disappears from active and appears once in history. Subsequent clicks show a toast "Already acknowledged".
- PDF intake: each close cancels the running `setInterval` cleanly; no orphan `intake_metrics` rows; final confirm writes exactly one `containers` row and four `documents` rows.
- No duplicate `logistics_events` entries anywhere.

---

## Section 8: Handoff Note

### What's Real vs. What's Mocked

| Feature | Status | Notes |
|---|---|---|
| Routing, Sidebar, layout shell | Real | `src/App.tsx`, 4 routes + 404 |
| Design tokens (HSL) | Real | `src/index.css`, `tailwind.config.ts` |
| Containers ledger & schema | Real (data), Mocked (UI bind) | Tables seeded with 13 containers; UI still reads `src/shared/data/containers.ts` |
| Documents schema | Real (data), Mocked (UI bind) | 52 rows seeded; UI still uses `phytoStore` in-memory |
| Phyto cross-screen sync | Mocked | `phytoStore.ts` uses `useSyncExternalStore` + `Set` |
| Phyto USDA submission | Mocked | Submit only flips local state + toasts |
| ERD/LRD edits | Mocked | Validates client-side; no persistence |
| PDF booking intake | Mocked | 14 fields hardcoded; PDF bytes discarded |
| Command Bar AI answers | Mocked | 5 canned answers + random fallback |
| Daily Intel briefings | Mocked | 4 hardcoded cards |
| KPI tiles | Mocked | 4 hardcoded values |
| Alerts (active + history) | Mocked | Local `useState` seed; `alerts` table exists but unused by UI |
| Settings reference tabs (11) | Mocked | Local arrays; only `carriers` has a real table |
| CSV export | Real | Client-side `Blob` from `useContainersByWeek()` |
| Authentication | Not built | `auth.users` empty; no `/auth` route |
| RLS | Permissive prototype | Public read + authenticated write on all 5 tables; not org-scoped |
| Edge functions | None | No `supabase/functions/` directory |
| Realtime | Not enabled | No `supabase_realtime` publication additions |

### Database Schema Summary

- **containers** — Canonical shipment ledger. PK on `container_id`, linked to docs by `booking_id`. 13 demo rows seeded.
- **documents** — Phyto / BOL / Commercial Invoice / Packing List, keyed by `booking_id + doc_type`. 52 demo rows seeded.
- **logistics_events** — Append-only status timeline per `container_id`. Empty.
- **alerts** — Active + history queue. Empty (UI uses local seed).
- **carriers** — Shipping-line reference data (SCAC codes). Empty.

### Auth & RLS Model

- **No auth implemented yet.** All five tables currently allow **public read** and **authenticated write** — fine for the demo, unsafe for any second tenant.
- **Planned roles** (from Section 4): `admin`, `coordinator`, `viewer`, stored in a separate `user_roles` table, checked via a `has_role(uid, org_id, role)` `SECURITY DEFINER` function.
- **Planned isolation:** every per-tenant row gains `org_id`; RLS scopes SELECT to org membership and writes to coordinator/admin.

### Edge Cases Handled

_To be filled in after the lab — see Section 6 checklist._

### Known Gaps

_To be filled in after stress testing — see Section 7 plan._

### Live URL

_To be filled in after deployment._

