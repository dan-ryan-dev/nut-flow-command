import { useMemo, useState } from "react";
import { Sidebar } from "@/shared/components/Sidebar";
import { ContainerLedger } from "@/features/containers/components/ContainerLedger";
import { containers, Container } from "@/shared/data/containers";
import { Switch } from "@/components/ui/switch";
import { Search, Download } from "lucide-react";
import { phytoStore } from "@/features/phyto/state/phytoStore";

const isIssueRow = (c: Container) => {
  const phytoMissing = c.docs.phyto === "missing" && !phytoStore.isAttached(c.booking);
  return (
    phytoMissing ||
    c.docs.bol === "missing" ||
    c.docs.commercialInvoice === "missing" ||
    c.docs.packingList === "missing" ||
    !!c.etaDelayed
  );
};

const toCsv = (rows: Container[]) => {
  const header = ["Container", "Booking", "Lots", "Buyer", "Destination", "Status", "Docs", "Shipment Week"];
  const lines = rows.map((r) => {
    const docs = `phyto:${r.docs.phyto};bol:${r.docs.bol};ci:${r.docs.commercialInvoice};pl:${r.docs.packingList}`;
    return [r.id, r.booking, r.lots.join("|"), r.buyer, r.destination, r.logisticsStatus, docs, r.shipmentWeek]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });
  return [header.join(","), ...lines].join("\n");
};

const Containers = () => {
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return containers.filter((c) => {
      if (issuesOnly && !isIssueRow(c)) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.booking.toLowerCase().includes(q) ||
        c.buyer.toLowerCase().includes(q) ||
        c.lots.some((l) => l.toLowerCase().includes(q))
      );
    });
  }, [issuesOnly, query]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomos-containers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card px-6 flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold text-foreground leading-none">Containers · Ledger</h1>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Central shipment record · Layered on Nomos DB · Capay Canyon Ranch
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary/60 w-72">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search container, booking, lot, buyer…"
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground/80 cursor-pointer">
              <Switch checked={issuesOnly} onCheckedChange={setIssuesOnly} />
              Show Issues Only
            </label>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary"
            >
              <Download className="w-3.5 h-3.5" />
              Export to CSV
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
            <div className="grid grid-cols-4 gap-3">
              <Kpi label="Total containers" value={String(containers.length)} sub="across 3 weeks" />
              <Kpi label="Action required" value={String(containers.filter(isIssueRow).length)} sub="missing docs / delayed" tone="action" />
              <Kpi label="On vessel / arrived" value={String(containers.filter((c) => ["loaded-vessel", "arrived-discharge"].includes(c.logisticsStatus)).length)} sub="post-gate-in" tone="good" />
              <Kpi label="Closed" value={String(containers.filter((c) => c.logisticsStatus === "closed").length)} sub="admin complete" />
            </div>

            <ContainerLedger rows={filtered} />

            <div className="text-center text-[11px] text-muted-foreground py-2">
              Layered on Nomos DB · Capay Canyon Ranch · Synced 12 sec ago
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Kpi = ({ label, value, sub, tone = "default" }: { label: string; value: string; sub: string; tone?: "default" | "action" | "good" }) => (
  <div
    className={`rounded-lg border p-4 ${
      tone === "action" ? "border-accent/40 bg-accent-soft" : tone === "good" ? "border-success/30 bg-success/5" : "border-border bg-card"
    }`}
  >
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className={`text-2xl font-bold mt-1 tabular-nums ${tone === "action" ? "text-accent" : "text-foreground"}`}>{value}</div>
    <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
  </div>
);

export default Containers;
