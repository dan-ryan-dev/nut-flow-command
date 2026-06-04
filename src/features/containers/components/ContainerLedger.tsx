import { useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, MessageSquare } from "lucide-react";
import { Container, LogisticsStatus } from "@/shared/data/containers";
import { StatusBadge } from "./StatusBadge";
import { DocsHoverCard } from "./DocsHoverCard";
import { phytoStore } from "@/features/phyto/state/phytoStore";
import { ShipmentCommentsDialog } from "./ShipmentCommentsDialog";

const STATUS_ORDER: Record<LogisticsStatus, number> = {
  "pending-load": 0,
  "origin-received": 1,
  "gated-in": 2,
  "loaded-vessel": 3,
  "arrived-discharge": 4,
  closed: 99,
};

const sortRows = (rows: Container[]) =>
  [...rows].sort((a, b) => STATUS_ORDER[a.logisticsStatus] - STATUS_ORDER[b.logisticsStatus] || a.id.localeCompare(b.id));

export const ContainerLedger = ({ rows, onSelectContainer }: { rows: Container[]; onSelectContainer?: (c: Container) => void }) => {
  const groups = useMemo(() => {
    const map = new Map<string, Container[]>();
    rows.forEach((r) => {
      if (!map.has(r.shipmentWeek)) map.set(r.shipmentWeek, []);
      map.get(r.shipmentWeek)!.push(r);
    });
    return Array.from(map.entries()).map(([week, items]) => ({ week, items: sortRows(items) }));
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-8 text-center">
        <div className="text-sm font-semibold text-success">All clear</div>
        <div className="text-xs text-muted-foreground mt-1">No missing docs or delayed ETAs in the ledger.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <WeekGroup key={g.week} week={g.week} items={g.items} onSelectContainer={onSelectContainer} />
      ))}
    </div>
  );
};

const WeekGroup = ({ week, items, onSelectContainer }: { week: string; items: Container[]; onSelectContainer?: (c: Container) => void }) => {
  const [open, setOpen] = useState(true);
  const closed = items.filter((i) => i.logisticsStatus === "closed").length;
  const action = items.filter((i) => i.docs.bol === "missing" || i.docs.phyto === "missing" || i.etaDelayed).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="bg-card rounded-lg border border-border overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full px-5 py-3 border-b border-border flex items-center justify-between hover:bg-secondary/40">
            <div className="flex items-center gap-3">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Shipment Week</div>
                <div className="text-sm font-semibold text-foreground">{week}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="tabular-nums">{items.length} containers</span>
              {action > 0 && <span className="text-accent font-semibold">{action} action</span>}
              {closed > 0 && <span>{closed} closed</span>}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/40">
                <th className="text-left font-medium px-5 py-2">Container #</th>
                <th className="text-left font-medium px-3 py-2">Booking #</th>
                <th className="text-left font-medium px-3 py-2">PO #</th>
                <th className="text-left font-medium px-3 py-2">Lot ID</th>
                <th className="text-left font-medium px-3 py-2">Buyer</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-left font-medium px-3 py-2">Docs</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((c) => (
                <Row key={c.id} c={c} onSelect={onSelectContainer} />
              ))}
            </tbody>
          </table>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
};

const Row = ({ c, onSelect }: { c: Container; onSelect?: (c: Container) => void }) => {
  const isClosed = c.logisticsStatus === "closed";
  const visibleLots = c.lots.slice(0, 2);
  const overflow = c.lots.length - visibleLots.length;
  const [open, setOpen] = useState(false);
  return (
    <tr className={`hover:bg-secondary/30 ${isClosed ? "opacity-55" : ""}`}>
      <td className="px-5 py-3">
        <button
          type="button"
          onClick={() => onSelect?.(c)}
          className="text-left group"
        >
          <div className={`font-mono text-[13px] text-foreground group-hover:text-primary group-hover:underline underline-offset-2 decoration-primary/40 ${isClosed ? "line-through decoration-muted-foreground/60" : ""}`}>
            {c.id}
          </div>
        </button>
        <div className="text-[11px] text-muted-foreground">{c.facility} · {c.product}</div>
      </td>
      <td className="px-3 py-3 font-mono text-[12px] text-foreground/90">{c.booking}</td>
      <td className="px-3 py-3 font-mono text-[12px] text-foreground/90">
        {c.purchaseOrder ?? <span className="text-muted-foreground/60">—</span>}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 flex-wrap">
          {visibleLots.map((l) => (
            <span key={l} className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary/60 text-foreground/80">
              {l}
            </span>
          ))}
          {overflow > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary/60 text-muted-foreground cursor-help">
                  +{overflow}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs font-mono space-y-0.5">
                  {c.lots.map((l) => <div key={l}>{l}</div>)}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-foreground/90">
        {c.buyer}
        <div className="text-[11px] text-muted-foreground">{c.destination}</div>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={c.logisticsStatus} />
        {isClosed && <div className="text-[10px] text-muted-foreground mt-1">Admin complete</div>}
        {c.etaDelayed && !isClosed && <div className="text-[10px] text-accent mt-1">ETA delayed</div>}
      </td>
      <td className="px-3 py-3">
        <DocsHoverCard container={c} />
      </td>
      <td className="px-3 py-3">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-card text-[11px] text-foreground/80 hover:bg-secondary"
        >
          <MessageSquare className="w-3 h-3" /> Notes
        </button>
        <ShipmentCommentsDialog container={c} open={open} onOpenChange={setOpen} />
      </td>
    </tr>
  );
};

// Touch the store import so TS keeps it; future row-level reactions live here.
void phytoStore;
