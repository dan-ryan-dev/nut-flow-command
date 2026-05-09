# Nomos — Product Requirements Document

_Prototype PRD extracted from the current build of the Nomos Export Command Center._
_Last updated: 2026-05-09_

---

## 1. Product Summary

**Nomos** is an AI-assisted operations cockpit for an almond-export desk. It sits
on top of a fictional canonical database ("Nomos DB") and collapses the busywork
of phytosanitary certification, container tracking, and carrier booking entry
into a single grounded workspace.

The prototype demonstrates how _one source of truth + light AI tooling_ can
replace the patchwork of carrier portals, PDF email attachments, and shared
spreadsheets that export coordinators live in today.

## 2. Target User

**Primary persona: Export Coordinator at a mid-sized agricultural shipper**
(reference customer in the prototype: Capay Canyon Ranch, Oakland, CA).

- Manages 30–60 active containers per week across multiple facilities.
- Owns USDA Phyto Form 577 compliance, carrier bookings, and ERD/LRD dates.
- Daily tools today: carrier web portals, Outlook, Excel, shared drives of PDFs.
- Success measured in: zero demurrage, zero missed cutoffs, zero rejected phytos.

**Secondary persona:** Operations Manager who needs a morning briefing and a
real-time view of "what is at risk this week".

## 3. Problem Statement & Hypothesis

### Problem
Export operators don't lose money on shipping — they lose it on
**documentation drift**. Phyto fields live in PDFs, booking confirmations
arrive as email attachments, and container status hops between carrier portals
and whiteboards. The result: missed cutoffs, demurrage, and rejected
certificates that are entirely preventable.

### Hypothesis
If every operational field is written **once** into a canonical ledger and an AI
agent reads exclusively from that ledger, the export team can:

- Catch missing USDA Form 577 fields **before** the carrier cutoff.
- Log a new booking from a carrier PDF in **seconds** instead of minutes.
- Answer "where is lot 447W?" in natural language without opening five tabs.
- Eliminate demurrage caused by paperwork (not logistics).

The "Grounded in Nomos DB" badge throughout the UI is the visual anchor for
this trust story — every AI surface cites the canonical record.

## 4. Scenario (used for the demo)

You are the export coordinator at Capay Canyon Ranch. It's **Monday of Week 19**.
42 containers are active across four facilities; **3 are at risk** of missing
Friday's MSC LORETO cutoff because their Phyto certificates are incomplete.
The Nomos cockpit is your morning briefing, your search bar, and your document
workbench in one screen.

## 5. Screens

### 5.1 Command Center (`/`)
The morning-briefing dashboard and primary entry point.

- **KPI strip** — Containers this week, Action required, Real-time logging
  rate, Demurrage risk.
- **Daily Intel** — Four AI-generated cards grounded in Nomos DB and live port
  feeds: cutoff risk, port congestion, lot lineage, performance trend.
- **This week's container table** — Triage view with columns for Container,
  Vessel/Voyage, Route, Buyer, Cutoff, **Phyto**, and Status.
  - "Action Required" status chips are clickable → open the **ERD/LRD
    side-panel**.
  - "Missing" Phyto chips are clickable → open the **Phyto Certification
    side-panel** scoped to that container's booking.
- **Command bar (`⌘K`)** — Natural-language search and ask-anything surface
  with simulated AI processing and a "Grounded in Nomos DB" badge.
- **New booking** — PDF drop flow that auto-fills 14 fields from a carrier
  confirmation PDF.

### 5.2 ERD/LRD Side-Panel (Date Adjustment)
Triggered from "Action Required" chips. Implements a full state machine:

- **Loading** — Manifest-grid skeleton.
- **Ready** — Editable ERD/LRD fields with the historical adjustment log.
- **Empty** — "System log empty. No historical date adjustments found for this
  asset."
- **Error** — "Data Sync Interrupted. Manual override required for ERD/LRD
  fields."
- **Validation** — Blocks save if LRD < ERD with crimson alert
  "CRITICAL ERROR: LRD cannot precede ERD."
- **Stale data** — Amber `LATENCY` badge with exact server sync time when
  carrier feed is >2h old.
- **Success** — `Sync Successful` toast + emerald row flash on the saved row
  (~1.6s decay).

### 5.3 Phyto Certification Side-Panel
Triggered from "Missing" Phyto chips. Implements a full state machine:

- **Loading** — Manifest-grid skeleton while AI extracts fields from booking
  records.
- **Ready** — Auto-drafted Form 577 fields + a "V. Verification & Seal" block
  requiring Container ID and Seal Number.
- **Empty** — "No draft found. Please upload a Sales Contract PDF to initiate
  Phyto-ready logic."
- **Error** — "Draft generation failed. Manual entry required for BRC Global
  Standard for Food Safety / USDA compliance."
- **Validation** — Blocks submit if Seal Number or Container ID is missing
  with crimson alert "REQUIRED: USDA Phyto requires a verified Seal Number."
- **Submit to USDA** — Emerald "Submission Pending" toast, dashboard chip
  flips to a green **Pending** state with a clock icon.
- **Preview Draft PDF** — Renders a high-fidelity, populated USDA Form 577.
- **Attach to Booking** — Writes the draft into Doc Storage and flips the
  table chip to a blue **Draft Attached** pill.

### 5.4 Containers Ledger (`/containers`)
Central shipment ledger grouped by **Shipment Week** (collapsible).

- Columns: Container #, Booking #, Lot ID (multi-lot badges), Buyer, Status,
  Docs.
- Logistics statuses: Pending Load · Origin Received · Gated-in · On Vessel ·
  At POD · Closed. Closed rows dim and sort to the bottom of their week.
- **Docs hover-card** quick-look for Phyto / BOL / Commercial Invoice /
  Packing List, kept in sync with the Phyto attachment store.
- "Show Issues Only" filter and "Export to CSV" action (client-side Blob).

### 5.5 Alerts (`/alerts`)
Structured Alert Queue with serif headers and Active / History tabs. Each
row shows a soft-red logistics tag (e.g., "Payment Overdue"), Container ID,
vessel, and ETA.

### 5.6 Settings (`/settings`)
Carrier management table: Name, SCAC code, green Active status pill, and
edit/toggle actions.

### 5.7 Global Navigation
Persistent sidebar across all routes with active-state highlighting and a
Ship icon as the app logo. Modern Industrial palette (Navy / Safety Orange /
Slate) applied via semantic tokens.

## 6. Primary User Flow

1. Operator lands on the **Command Center** and reads the Daily Intel
   briefing. Top alert flags 3 containers at risk of missing Friday's cutoff.
2. Operator clicks the **Missing** Phyto chip on a row → Phyto side-panel
   opens for `BK-99182`.
3. Operator clicks **Preview Draft PDF** → modal renders the populated USDA
   Form 577.
4. Operator clicks **Attach to Booking BK-99182** → toast confirms attach;
   the Phyto chip becomes **Draft Attached**.
5. Operator clicks an **Action Required** chip → ERD/LRD side-panel opens,
   adjusts dates, saves; row flashes emerald.
6. Operator hits `⌘K`, asks "Find all containers associated with Lot ID
   447W" and gets a grounded answer in ~1.5s.
7. Operator opens **Containers** to verify the draft appears in the booking's
   Docs hover-card, then exports the week's ledger to CSV.
8. As loads complete, statuses move through to **Closed**, dimming the row
   and pushing it to the bottom of its Shipment Week group.

## 7. Key Metrics

### Product KPIs (surfaced in the UI)
- **Containers this week** — operational volume.
- **Action required** — count of rows needing intervention (Phyto + cutoffs).
- **Logged real-time** — % of containers with status updated through Nomos
  rather than reconstructed after the fact (prototype shows 31/42, up from 19%).
- **Demurrage risk** — dollar exposure from at-risk containers (prototype
  shows $0 across a 14-day window). _Simulated goal, not a live calculation:
  the value is derived from the current deterministic seed data and is
  intended to illustrate the target state, not a real-time financial figure._

### Outcome metrics the prototype is designed to move
- **Time to log a booking** — target: <15s from PDF drop (vs ~12 min manual).
- **Phyto rejections at USDA PCIT** — target: 0 per quarter.
- **Missed cutoffs per month** — target: 0.
- **Demurrage incidents** — target: 0 caused by documentation.
- **"Where is X?" answer time** — target: <2s via command bar.

## 8. Mocked vs. Real

### Real in the prototype
- React 18 + Vite + TypeScript + Tailwind + shadcn/ui frontend.
- Full client-side state machines for the ERD/LRD and Phyto side-panels
  (loading / ready / empty / error / validation / success).
- Cross-screen state sync via `src/state/phytoStore.ts` (Phyto attach +
  pending status reflects instantly in both Command Center table and
  Containers ledger Docs hover-card) using `useSyncExternalStore`.
- Client-side CSV export of the Containers ledger (Blob download).
- Routing, persistent sidebar, and active-state navigation across `/`,
  `/containers`, `/alerts`, `/settings`.
- Design system: Modern Industrial HSL semantic tokens in `index.css` and
  `tailwind.config.ts`; no hardcoded colors in components.
- Deterministic seed data (`src/data/containers.ts`) so the demo reads the
  same way every time.

### Mocked / simulated
- **Nomos DB** — there is no backend. All "canonical ledger" data is in-memory
  seed data.
- **AI surfaces** — Daily Intel cards, command-bar answers, and Phyto field
  extraction are pre-written and gated behind ~850–1500ms timers to feel like
  real agent calls.
- **Carrier feeds** — port congestion, ETAs, and the >2h "LATENCY" staleness
  signal are deterministic per container.
- **PDF booking ingest** — fields are pre-mapped; no real OCR / parsing.
- **USDA submission** — "Submit to USDA" only flips local state and shows a
  toast; nothing is transmitted to PCIT.
- **Auth, persistence, real carrier APIs, server-side CSV** — out of scope.
- **Randomization** — only the command-bar suggestions and AI fallback answers
  are randomized; everything else is deterministic.

## 9. Out of Scope (this prototype)

- Real authentication, RBAC, or multi-tenant data isolation.
- Persistence beyond a browser session.
- Live carrier API integrations (Maersk, MSC, CMA, ONE, etc.).
- Real USDA PCIT submission and signed phyto retrieval.
- Real OCR / LLM extraction from carrier PDFs.
- Mobile / responsive layouts below tablet.
- Notifications, email, or SMS surfaces.

## 10. Design Principles

- **High-density Enterprise Logistics aesthetic** — compact rows, mono
  numerics, uppercase micro-labels, restrained color use.
- **Modern Industrial palette** — Navy primary, Safety Orange for blockers,
  Slate grays, Emerald for success, Amber for latency, Crimson for critical
  validation errors.
- **Grounded AI** — every AI surface shows a "Grounded in Nomos DB" badge and
  cites the underlying record.
- **State machines on every async surface** — loading / ready / empty / error
  / validation / success are all explicit, never implicit.
- **One source of truth** — the same Phyto attach action updates the Command
  Center chip, the Containers ledger Docs hover-card, and the dashboard
  Pending state in lockstep.

---

_See `PROMPTS.md` for the prompt log that drove the Expand / Behavior /
Refine iterations of this prototype._
