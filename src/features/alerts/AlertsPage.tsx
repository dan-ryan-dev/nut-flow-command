import { useState } from "react";
import { Sidebar } from "@/shared/components/Sidebar";
import { AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

type AlertItem = {
  id: string;
  tag: string;
  tone: "danger" | "warning" | "info";
  container: string;
  status: string;
  timestamp: string;
  history?: boolean;
};

const seed: AlertItem[] = [
  { id: "AL-2041", tag: "Payment Overdue", tone: "danger", container: "MSCU-7741820", status: "56 days past ETA", timestamp: "2026-05-09 06:12 PT" },
  { id: "AL-2040", tag: "Phyto Missing", tone: "danger", container: "BK-99182", status: "Cutoff in 38h · USDA fields incomplete", timestamp: "2026-05-09 05:48 PT" },
  { id: "AL-2039", tag: "Cutoff Risk", tone: "warning", container: "BK-99204", status: "MSC LORETO cutoff in 41h", timestamp: "2026-05-09 05:30 PT" },
  { id: "AL-2038", tag: "Berth Congestion", tone: "warning", container: "EVER GIVEN · Oakland B57", status: "+2 days at anchorage", timestamp: "2026-05-09 04:10 PT" },
  { id: "AL-2037", tag: "Demurrage Risk", tone: "danger", container: "HLCU-3320981", status: "12 days past free time", timestamp: "2026-05-08 21:55 PT" },
  { id: "AL-2036", tag: "Buyer Unnotified", tone: "info", container: "BK-99211", status: "Shanghai contact pending", timestamp: "2026-05-08 18:02 PT" },
];

const historySeed: AlertItem[] = [
  { id: "AL-2030", tag: "Phyto Missing", tone: "danger", container: "BK-98991", status: "Resolved · cert attached", timestamp: "2026-05-06 11:02 PT", history: true },
  { id: "AL-2028", tag: "Cutoff Risk", tone: "warning", container: "BK-98980", status: "Booking made cutoff", timestamp: "2026-05-05 14:20 PT", history: true },
  { id: "AL-2025", tag: "Payment Overdue", tone: "danger", container: "CMAU-6610022", status: "Paid · 32 days late", timestamp: "2026-05-03 09:14 PT", history: true },
];

const toneStyles: Record<AlertItem["tone"], string> = {
  danger: "bg-accent-soft text-accent border-accent/30",
  warning: "bg-warning/10 text-warning-foreground border-warning/40",
  info: "bg-secondary text-foreground/70 border-border",
};

const Alerts = () => {
  const [tab, setTab] = useState<"active" | "history">("active");
  const [active, setActive] = useState(seed);
  const [history, setHistory] = useState(historySeed);

  const acknowledge = (id: string) => {
    const item = active.find((a) => a.id === id);
    if (!item) return;
    setActive((prev) => prev.filter((a) => a.id !== id));
    setHistory((prev) => [{ ...item, history: true, status: `Acknowledged · ${item.status}` }, ...prev]);
    toast.success(`${item.container} acknowledged`);
  };

  const rows = tab === "active" ? active : history;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card px-6 flex items-center gap-4">
          <div>
            <h1 className="font-serif text-lg font-semibold text-foreground leading-none tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Alert Queue
            </h1>
            <div className="text-[11px] text-muted-foreground mt-0.5">{active.length} active · {history.length} resolved · synced 12s ago</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Alerts
              </h2>
              <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-card">
                {(["active", "history"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1 text-xs rounded capitalize transition-colors ${
                      tab === t ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {rows.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">No alerts in this view.</div>
              )}
              {rows.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${a.tone === "danger" ? "text-accent" : a.tone === "warning" ? "text-warning" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${toneStyles[a.tone]}`}>
                    {a.tag}
                  </span>
                  <div className="font-mono text-sm text-foreground tabular-nums w-56 truncate">{a.container}</div>
                  <div className="text-sm text-foreground/70 flex-1 truncate">{a.status}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">{a.timestamp}</div>
                  {tab === "active" ? (
                    <button
                      onClick={() => acknowledge(a.id)}
                      className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-glow transition-colors"
                    >
                      <Check className="w-3 h-3" /> Acknowledge
                    </button>
                  ) : (
                    <span className="ml-2 text-[11px] uppercase tracking-wider text-success font-semibold">Resolved</span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center text-[11px] text-muted-foreground py-2">
              Phyto-readiness logic synced with Command Center · Nomos DB
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Alerts;