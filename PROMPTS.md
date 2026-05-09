# Nomos — Prompt Log

This document captures the three prompts used to evolve the Nomos Command Center,
along with the documented results of each.

---

## 1. Expand — Add Alerts & Settings screens

### Prompt

> Add two new core screens to the Nomos platform: Alerts and Settings. Ensure full
> navigation between Dashboard, Alerts, and Settings via a consistent sidebar.
>
> **Alerts Screen** — Use the structured 'Alert Queue' list layout. Headers in a
> professional serif font. Tabs for 'Active' and 'History'. Each line item shows a
> 'Payment Overdue' (or relevant logistics tag) in a soft red badge, followed by
> the Container ID, vessel, and ETA.
>
> **Settings Screen** — Carrier management table with Name, SCAC Code, a green
> 'Active' status pill, and edit/toggle icons in the 'Actions' column.
>
> **Global Navigation & Branding** — Apply the Modern Industrial palette
> (Navy accents, Safety Orange for blockers, Slate Grays). Use the Ship icon as
> the app logo. Sidebar must persist across all screens with active-state
> highlighting. Maintain Phyto-Readiness logic from the dashboard.

### Result

- Created `src/pages/Alerts.tsx` with serif headers, Active/History tabs, and the
  Alert Queue list (soft-red badges, container/vessel/ETA columns).
- Created `src/pages/Settings.tsx` with the carriers table (Name, SCAC, green
  Active pill, edit + toggle icons).
- Updated `src/components/command-center/Sidebar.tsx` to persist across all
  routes with active-state highlighting and the Ship logo.
- Wired routes in `src/App.tsx` for `/alerts` and `/settings`.
- Modern Industrial palette (Navy / Safety Orange / Slate) applied via existing
  semantic tokens — no hardcoded colors introduced.

---

## 2. Behavior — ERD/LRD side-panel state machine

### Prompt

> Apply the following behavioral logic to the Date Adjustment side-panel:
>
> - **Loading**: shimmering manifest-grid skeleton.
> - **Empty**: "System log empty. No historical date adjustments found for this asset."
> - **Error**: "Data Sync Interrupted. Manual override required for ERD/LRD fields."
> - **Validation**: block saves where LRD precedes ERD with a crimson alert
>   "CRITICAL ERROR: LRD cannot precede ERD."
> - **Stale Data**: amber 'LATENCY' badge if carrier feed is >2h old, with the
>   exact server sync time.
> - **Success**: technical 'Sync Successful' toast and a momentary emerald row
>   highlight on save.
>
> Maintain the high-density Enterprise Logistics aesthetic.

### Result

- `src/components/command-center/ErdLrdSheet.tsx` now drives a `FetchState`
  machine (`loading | ready | empty | error`) with deterministic per-container
  routing for demo. Manifest-grid skeleton, empty-log copy, and sync-interrupted
  error block all match spec.
- LRD < ERD validation blocks save and renders the crimson uppercase alert.
- Amber `LATENCY` badge appears when the carrier feed timestamp is >2h old,
  showing the exact sync time.
- Save fires a `Sync Successful` sonner toast; `ContainerTable.tsx` flashes the
  saved row with an emerald highlight that decays after ~1.6s.
- Density preserved: kept compact row padding, mono numerics, uppercase micro-labels.

---

## 3. Refine — Phyto Certification side-panel state machine

### Prompt

> Apply the following behavioral logic to the Phyto Certification side-panel:
>
> - **Loading**: shimmering manifest-grid skeleton while AI extracts fields.
> - **Empty**: "No draft found. Please upload a Sales Contract PDF to initiate
>   Phyto-ready logic."
> - **Error**: "Draft generation failed. Manual entry required for BRC/USDA
>   compliance."
> - **Validation**: block submission if Seal Number or Container ID is missing,
>   with a crimson alert: "REQUIRED: USDA Phyto requires a verified Seal Number."
> - **Success**: emerald 'Submission Pending' toast on Submit to USDA, and the
>   dashboard chip flips to 'Pending'.
>
> Maintain the high-density Enterprise Logistics aesthetic.

### Result

- `src/components/command-center/PhytoSheet.tsx` runs the full state machine
  with deterministic per-container routing. `ManifestSkeleton`,
  `EmptyDraftState`, and `ErrorDraftState` components match spec copy.
- Added "V. Verification & Seal" block with Container ID + Seal Number inputs.
  Empty values block submission and surface the crimson REQUIRED alert.
- On submit, `phytoStore.markPending(container.booking)` flips the chip in
  `ContainerTable.tsx` to a green **Pending** chip with a `Clock` icon, and a
  sonner toast confirms "Submission Pending · routed to USDA PCIT".
- `src/state/phytoStore.ts` exposes `markPending`, `isPending`, and the
  `usePhytoPending` hook backing the dashboard chip update.
- Density preserved throughout (mono IDs, micro-label uppercase, compact form grid).

---

_Last updated: 2026-05-09_