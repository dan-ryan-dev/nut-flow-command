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
