## Refactor — feature-grouped architecture

The codebase currently mixes routing pages, presentation, state, and seed data across loosely-named folders (`components/command-center`, `components/containers`, `pages/`, `data/`, `state/`). This refactor groups files by feature, gives panels and pages clearer names, and isolates the in-memory data layer so it can later be swapped for a real backend.

### 1. New folder structure

```text
src/
  features/
    command-center/         # / route — dashboard
      CommandCenterPage.tsx          (← pages/Index.tsx)
      components/
        DailyIntel.tsx
        ContainerTable.tsx
        CommandBar.tsx
        PdfBookingFlow.tsx
        KpiStrip.tsx                 (extracted from Index.tsx)
    phyto/                  # Phyto Certification workflow
      components/
        PhytoCertificationPanel.tsx  (← PhytoSheet.tsx)
        PhytoPdfPreview.tsx
      state/
        phytoStore.ts                (← src/state/phytoStore.ts)
    erd-lrd/                # Date-adjustment workflow
      components/
        ErdLrdPanel.tsx              (← ErdLrdSheet.tsx)
    containers/             # /containers route — ledger
      ContainersLedgerPage.tsx       (← pages/Containers.tsx)
      components/
        ContainerLedger.tsx
        DocsHoverCard.tsx
        StatusBadge.tsx
    alerts/                 # /alerts route
      AlertsPage.tsx                 (← pages/Alerts.tsx)
      data/alerts.ts                 (extracted seed rows)
    settings/               # /settings route
      SettingsPage.tsx               (← pages/Settings.tsx)
      data/carriers.ts               (extracted seed rows)
  shared/
    components/Sidebar.tsx           (← command-center/Sidebar.tsx)
    data/
      containers.ts                  (← src/data/containers.ts — seed only)
      types.ts                       (Container, DocStatus, etc. types)
    hooks/
      useContainers.ts               (selectors: byWeek, actionRequired, byBooking…)
  components/ui/…           (shadcn — unchanged)
  hooks/                    (use-mobile, use-toast — unchanged)
  lib/utils.ts              (unchanged)
  pages/NotFound.tsx        (unchanged)
  App.tsx, main.tsx, index.css
```

### 2. Renames (file → new path / component name)

| Old | New | New component name |
|---|---|---|
| `pages/Index.tsx` | `features/command-center/CommandCenterPage.tsx` | `CommandCenterPage` |
| `components/command-center/PhytoSheet.tsx` | `features/phyto/components/PhytoCertificationPanel.tsx` | `PhytoCertificationPanel` |
| `components/command-center/ErdLrdSheet.tsx` | `features/erd-lrd/components/ErdLrdPanel.tsx` | `ErdLrdPanel` |
| `pages/Containers.tsx` | `features/containers/ContainersLedgerPage.tsx` | `ContainersLedgerPage` |
| `pages/Alerts.tsx` | `features/alerts/AlertsPage.tsx` | `AlertsPage` |
| `pages/Settings.tsx` | `features/settings/SettingsPage.tsx` | `SettingsPage` |
| `components/command-center/Sidebar.tsx` | `shared/components/Sidebar.tsx` | `Sidebar` |
| `state/phytoStore.ts` | `features/phyto/state/phytoStore.ts` | (same) |
| `data/containers.ts` | `shared/data/containers.ts` + `shared/data/types.ts` | (split) |

Other command-center children (`DailyIntel`, `ContainerTable`, `CommandBar`, `PdfBookingFlow`) move under `features/command-center/components/` keeping their names. Container ledger children (`ContainerLedger`, `DocsHoverCard`, `StatusBadge`) move under `features/containers/components/`.

### 3. Separating data logic from display

- `shared/data/types.ts` holds all type exports (`Container`, `LogisticsStatus`, `DocStatus`, `ContainerDocs`, `SHIPMENT_WEEKS`).
- `shared/data/containers.ts` holds only the seed array and re-exports types.
- `shared/hooks/useContainers.ts` exposes pure selectors so components don't import the raw array:
  - `useAllContainers()`, `useContainersByWeek()`, `useActionRequiredContainers()`, `useContainerByBooking(id)`.
- `features/alerts/data/alerts.ts` and `features/settings/data/carriers.ts` lift the inline rows out of the page components.
- `KpiStrip` is extracted from `CommandCenterPage` so the page becomes pure layout.
- `phytoStore` keeps `useSyncExternalStore` but lives next to its feature.

### 4. Wiring updates

- `App.tsx` imports the four new page components from their feature folders.
- All intra-component imports updated to the new paths (`@/features/...`, `@/shared/...`).
- No behaviour changes — same routes, same UI, same toasts, same state machines.
- `tsconfig` paths already include `@/*` so no config edits needed.

### 5. README

Replace `README.md` with a project-structure-focused version covering:
1. **What it is** — one-paragraph product summary (link to `PRD.md`).
2. **App flow** — Command Center → Phyto/ERD-LRD panels → Containers ledger, with the `phytoStore` cross-screen sync called out.
3. **Project structure** — annotated tree matching section 1 above, explaining the role of `features/`, `shared/`, `components/ui/`.
4. **Data layer** — how to read seed data via `useContainers` selectors instead of importing the array directly; how to swap seed for a real API later.
5. **Run locally / scripts** — keep the existing dev/build commands.
6. **Out of scope** — short note pointing to `PRD.md` for the full mocked-vs-real breakdown.

`PROMPTS.md` and `PRD.md` are unchanged.

### 6. Verification

- After moves, run a project-wide import grep to confirm no `@/components/command-center`, `@/components/containers`, `@/state/`, `@/data/`, or old `pages/Index|Alerts|Settings|Containers` references remain.
- Rely on the harness typecheck/build to catch any missed import.
- Spot-check the preview at `/`, `/containers`, `/alerts`, `/settings` and click a Missing-Phyto chip and an Action-Required chip to confirm both panels still open.
