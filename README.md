# Nomos — Export Command Center

A clickable prototype of an AI-assisted operations cockpit for an almond-export
desk. The app sits on top of a fictional canonical database ("Nomos DB") and
demonstrates how a single, grounded source of truth plus light AI tooling can
collapse the busywork of phyto certificates, container tracking, and carrier
booking entry.

## Hypothesis

Export operators don't lose money on shipping — they lose it on
**documentation drift**. Phytosanitary fields live in PDFs, booking confirmations
arrive as email attachments, and container status hops between carrier portals
and whiteboards. If every field is written once into a canonical ledger and an
AI agent reads from that ledger, the team can:

- Catch missing USDA Form 577 fields *before* the carrier cutoff.
- Log a new booking from a carrier PDF in seconds instead of minutes.
- Answer "where is lot 447W?" in natural language without opening five tabs.
- Eliminate demurrage caused by paperwork, not logistics.

The prototype is built to make that hypothesis feel real in a demo.

## Scenario

You are the export coordinator at **Capay Canyon Ranch**, shipping almonds out
of Oakland to buyers in the EU and APAC. It's Monday of Week 19. Forty-two
containers are active across four facilities; three are at risk of missing
Friday's MSC LORETO cutoff because their Phyto certificates are incomplete.
The Nomos cockpit is your morning briefing, your search bar, and your
document workbench in one screen.

## Key Screens

### 1. Command Center (`/`)
- **Daily Intel briefing** — four AI-generated cards grounded in Nomos DB and
  live port feeds (cutoff risk, port congestion, lineage, performance).
- **KPI strip** — containers this week, action required, real-time logging
  rate, demurrage risk.
- **This week's container table** — quick triage view with a dedicated
  **Phyto** column that shows "Missing", "Complete", or "Draft Attached".
- **Command bar (`⌘K`)** — randomized natural-language suggestions, simulated
  AI processing, and a "Grounded in Nomos DB" trust badge.
- **PDF booking flow** — drop a carrier PDF, watch 14 fields auto-fill.

### 2. Phyto slide-over + PDF Preview
- Opens from the Phyto column. Shows the missing USDA Form 577 fields drawn
  from the booking record.
- "Preview Draft PDF" renders a high-fidelity Form 577 populated with
  Nomos DB data.
- "Attach to Booking BK-99182" writes the draft into the booking's Doc
  Storage, flips the doc-task status to *Drafted*, and turns the table
  badge into a blue **Draft Attached** pill.

### 3. Containers Ledger (`/containers`)
- Central shipment ledger grouped by **Shipment Week** (collapsible).
- Columns: Container #, Booking #, Lot ID (multi-lot badges), Buyer,
  Status, Docs.
- Logistics statuses: Pending Load · Origin Received · Gated-in · On Vessel
  · At POD · Closed. Closed rows dim and sort to the bottom of their week.
- Docs hover-card "quick-look" panel for Phyto / BOL / Commercial Invoice /
  Packing List, kept in sync with the Phyto attachment store.
- "Show Issues Only" filter and "Export to CSV" action.

## User Flow

1. Operator lands on the **Command Center** and reads the Daily Intel
   briefing. The top alert flags 3 containers at risk of missing Friday's
   cutoff.
2. Operator clicks **Review 3 phytos** (or the Missing badge on a row) and
   the **Phyto slide-over** opens for `BK-99182`.
3. Operator clicks **Preview Draft PDF** → modal renders the populated
   USDA Form 577.
4. Operator clicks **Attach to Booking BK-99182** → toast confirms
   "Draft attached to BK-99182 in Nomos Doc Storage". The Phyto column
   badge changes to **Draft Attached**.
5. Operator hits `⌘K`, asks *"Find all containers associated with Lot ID
   447W"* and gets a grounded answer in ~1.5s.
6. Operator opens **Containers** from the sidebar to verify the same draft
   shows up in that booking's Docs hover-card, then exports the week's
   ledger to CSV.
7. As loads complete, statuses move through to **Closed**, which dims the
   row and pushes it to the bottom of its Shipment Week group.

## Main Build Decisions

- **Stack**: React 18 + Vite + TypeScript, Tailwind CSS, shadcn/ui,
  React Router, TanStack Query. No backend — this is a frontend prototype.
- **Design system**: Modern industrial palette (navy / white / safety
  orange) defined as HSL semantic tokens in `src/index.css` and
  `tailwind.config.ts`. Components consume tokens (`bg-primary`,
  `text-accent`, `bg-accent-soft`) rather than raw colors so the look stays
  consistent across both pages.
- **State**: Local component state plus a tiny external store
  (`src/state/phytoStore.ts`) using `useSyncExternalStore` so attaching a
  Phyto draft on the Command Center reflects instantly in the Containers
  ledger without a global state library.
- **Data**: Seed data lives in `src/data/containers.ts` (containers, lots,
  shipment weeks, doc states). Everything is deterministic so the demo
  reads the same way every time, except for randomized command-bar
  suggestions and AI fallback answers.
- **AI surfaces are simulated**: command-bar processing uses a 1.5s timer
  to feel like a real agent call, and answers are pre-written per
  suggestion. The "Grounded in Nomos DB" badge is the visual anchor for
  the trust story.
- **Status badges**: Centralized in `src/components/containers/StatusBadge.tsx`
  with `inline-flex`, fixed `min-width`, and a 6px icon-text gap so the
  ledger columns don't shift as statuses change.
- **Routing**: `/` is the Command Center, `/containers` is the ledger.
  Sidebar uses `NavLink`s for active state.
- **Out of scope**: real auth, persistence, carrier API integrations, and
  CSV server-side generation. The CSV export is a client-side Blob.

## Run Locally

```bash
npm install
npm run dev
```

Then open the printed local URL. Press `⌘K` (or `Ctrl+K`) to try the
command bar.
