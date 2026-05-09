# Nomos — Logistics Command Center (Prototype)

A clickable React prototype of a logistics command center for an ag-export operation. It demonstrates how a single canonical record (the "Nomos DB") collapses today's split between booking systems, doc storage, and spreadsheets into one ledger that drives a dashboard, an export ledger, alerts, and a USDA Phyto certification flow.

For full context — problem, users, screens, hypothesis, metrics, what's mocked vs. real — see [`PRD.md`](./PRD.md). The prompts used to generate the prototype are in [`PROMPTS.md`](./PROMPTS.md).

## App Flow

1. **Command Center** (`/`) — KPIs, Daily Intel briefings, container table. Entry point. `⌘K` opens the AI Command Bar; "New booking" opens the PDF intake flow.
2. **Containers Ledger** (`/containers`) — Searchable, filterable canonical ledger grouped by shipment week. Hover any row for a Doc Storage quick-look; row clicks open the Phyto or ERD/LRD side-panels.
3. **Alerts** (`/alerts`) — Active and historical alerts (cutoffs, demurrage risk, missing docs). Acknowledge to move into history.
4. **Settings** (`/settings`) — Carriers, facilities, buyers, integrations.
5. **Phyto Certification Side-Panel** — USDA PPQ-577 form, fields auto-drafted from the ledger; flags missing fields; can attach a draft cert that propagates to the table chip and the Doc Storage hover-card.
6. **ERD/LRD Side-Panel** — Edit Earliest Receiving Date / Latest Receiving Date with carrier-feed cross-check, history, and offline/error states.

## Project Structure

```text
src/
  features/                       # Feature-scoped UI + state
    command-center/
      CommandCenterPage.tsx       # / route
      components/                 # CommandBar, ContainerTable, DailyIntel,
                                  #   PdfBookingFlow, KpiStrip
    containers/
      ContainersLedgerPage.tsx    # /containers route
      components/                 # ContainerLedger, DocsHoverCard, StatusBadge
    phyto/
      components/                 # PhytoCertificationPanel, PhytoPdfPreview
      state/phytoStore.ts         # Cross-screen Phyto draft/attached state
    erd-lrd/
      components/                 # ErdLrdPanel
    alerts/AlertsPage.tsx         # /alerts route
    settings/SettingsPage.tsx     # /settings route
  shared/
    components/Sidebar.tsx        # App nav, used by every page
    data/
      types.ts                    # Container, LogisticsStatus, DocStatus
      containers.ts               # Deterministic seed data ("Nomos DB")
    hooks/useContainers.ts        # Selectors: useAllContainers,
                                  #   useActionRequiredContainers,
                                  #   useContainersByWeek, isIssueRow
  components/ui/                  # shadcn primitives
  pages/NotFound.tsx              # 404
  App.tsx                         # Router wiring
```

### Data Layer

All shipment data flows through `src/shared/`:

- **`data/types.ts`** — Pure type definitions. Display components import these without pulling in seed data.
- **`data/containers.ts`** — The seed ledger. Deterministic so the demo reads the same way every load. Swap this module for an API/Cloud client later.
- **`hooks/useContainers.ts`** — Selectors. Components consume these instead of importing the seed array directly, so the data source can be swapped without touching the UI.
- **`features/phyto/state/phytoStore.ts`** — Lightweight `useSyncExternalStore` for cross-screen Phyto state (drafts attached on the side-panel reflect instantly in the table chip and Doc Storage hover-card).

### Conventions

- One feature per folder. A feature owns its page component, its UI components, and any feature-local state.
- Anything imported by 2+ features lives in `src/shared/`.
- Routing is centralized in `App.tsx`.
- Design tokens (HSL) in `src/index.css` and `tailwind.config.ts`. Components use semantic Tailwind classes — no hardcoded colors.

## Out of Scope

This is a prototype. There is no real backend, no auth, no live carrier feeds. See "What is mocked vs. real" in [`PRD.md`](./PRD.md).
