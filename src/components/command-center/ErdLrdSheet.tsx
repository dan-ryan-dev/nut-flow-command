import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Container } from "@/data/containers";
import { CalendarClock, Ship, AlertTriangle, Save, History, WifiOff, Inbox, RefreshCw, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ErdLrdSheetProps {
  container: Container | null;
  open: boolean;
  onClose: () => void;
  onSaved?: (containerId: string) => void;
}

const toLocalInput = (iso: string) => {
  const [d, t = "12:00"] = iso.split(" ");
  return `${d}T${t}`;
};

type FetchState = "loading" | "ready" | "empty" | "error";

interface HistoryEntry {
  ts: string;
  user: string;
  field: "ERD" | "LRD";
  from: string;
  to: string;
  reason: string;
}

const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const buildDemoHistory = (c: Container): HistoryEntry[] => [
  { ts: "2026-05-02 14:22 PT", user: "M. Alvarez", field: "ERD", from: "2026-05-03 12:00", to: c.cutoff, reason: "Carrier rebook" },
  { ts: "2026-04-29 09:11 PT", user: "carrier-edi", field: "LRD", from: "2026-05-12", to: c.eta, reason: "Vessel cutoff shift" },
  { ts: "2026-04-26 17:48 PT", user: "T. Nguyen", field: "ERD", from: "2026-04-30 17:00", to: "2026-05-03 12:00", reason: "Port congestion" },
];

export const ErdLrdSheet = ({ container, open, onClose, onSaved }: ErdLrdSheetProps) => {
  const [erd, setErd] = useState("");
  const [lrd, setLrd] = useState("");
  const [reason, setReason] = useState("vessel-cutoff");
  const [notes, setNotes] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const feedAgeMin = container ? (hashCode(container.id) % 240) + 5 : 0;
  const isStale = feedAgeMin > 120;
  const lastSyncLabel = (() => {
    const d = new Date(Date.now() - feedAgeMin * 60_000);
    return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  })();

  useEffect(() => {
    if (!container || !open) return;
    setErd(toLocalInput(container.cutoff));
    setLrd(`${container.eta}T17:00`);
    setReason("vessel-cutoff");
    setNotes("");
    setValidationError(null);
    setFetchState("loading");

    const bucket = hashCode(container.id) % 6;
    const next: FetchState = bucket === 0 ? "error" : bucket === 1 ? "empty" : "ready";
    const t = setTimeout(() => {
      setFetchState(next);
      setHistory(next === "ready" ? buildDemoHistory(container) : []);
    }, 700);
    return () => clearTimeout(t);
  }, [container, open]);

  useEffect(() => {
    if (erd && lrd && new Date(lrd) < new Date(erd)) {
      setValidationError("CRITICAL ERROR: LRD cannot precede ERD.");
    } else {
      setValidationError(null);
    }
  }, [erd, lrd]);

  if (!container) return null;

  const onSave = () => {
    if (validationError) return;
    setSaving(true);
    setTimeout(() => {
      toast.success("Sync Successful", {
        description: `${container.id} · carrier EDI ack 200 · new ERD ${erd.replace("T", " ")} · LRD ${lrd.replace("T", " ")}`,
      });
      onSaved?.(container.id);
      setSaving(false);
      onClose();
    }, 400);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto bg-background">
        <SheetHeader
          className="px-6 pt-6 pb-4 space-y-3 border-b border-border"
          style={{ backgroundImage: "var(--gradient-navy)" }}
        >
          <div className="flex items-start justify-between text-primary-foreground">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary-foreground/60 flex items-center gap-1.5">
                <CalendarClock className="w-3 h-3" /> Update ERD / LRD
              </div>
              <SheetTitle className="text-primary-foreground text-lg mt-1 font-serif">
                Reschedule cutoff dates
              </SheetTitle>
              <div className="text-xs text-primary-foreground/70 mt-1 font-mono">
                {container.booking} · {container.id} · {container.vessel} {container.voyage}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold">
                <AlertTriangle className="w-3 h-3" /> Action required
              </span>
              {isStale && (
                <span
                  title={`Carrier feed last synced ${lastSyncLabel}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-warning text-warning-foreground border border-warning/60"
                >
                  <WifiOff className="w-3 h-3" /> Latency · {Math.floor(feedAgeMin / 60)}h{feedAgeMin % 60}m
                </span>
              )}
            </div>
          </div>
          {isStale && (
            <div className="text-[10px] font-mono text-primary-foreground/70 -mt-1">
              Carrier feed last sync: {lastSyncLabel}
            </div>
          )}
        </SheetHeader>

        {container.alert && (
          <div className="mx-6 mt-4 p-3 rounded-md border border-accent/30 bg-accent-soft text-xs text-foreground flex gap-2">
            <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Why this needs attention</div>
              <div className="text-muted-foreground mt-0.5">{container.alert}</div>
            </div>
          </div>
        )}

        <div className="px-6 py-5 space-y-5">
          <section className="border border-border rounded-md overflow-hidden">
            <div className="px-4 py-2 bg-secondary/60 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-foreground/80 flex items-center gap-2">
              <Ship className="w-3 h-3 text-primary" /> Current schedule
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="px-4 py-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current ERD (cutoff)</div>
                <div className="text-sm font-mono mt-1 text-foreground">{container.cutoff}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current ETA / LRD</div>
                <div className="text-sm font-mono mt-1 text-foreground">{container.eta}</div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  New ERD (Earliest Receiving)
                </span>
                <input
                  type="datetime-local"
                  value={erd}
                  onChange={(e) => setErd(e.target.value)}
                  className={`mt-1 w-full px-3 py-2 text-sm rounded-md border bg-card font-mono text-foreground focus:outline-none focus:ring-2 ${validationError ? "border-destructive focus:ring-destructive/40" : "border-border focus:ring-primary/40"}`}
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  New LRD (Latest Receiving)
                </span>
                <input
                  type="datetime-local"
                  value={lrd}
                  onChange={(e) => setLrd(e.target.value)}
                  className={`mt-1 w-full px-3 py-2 text-sm rounded-md border bg-card font-mono text-foreground focus:outline-none focus:ring-2 ${validationError ? "border-destructive focus:ring-destructive/40" : "border-border focus:ring-primary/40"}`}
                />
              </label>
            </div>

            {validationError && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-md border-2 text-xs font-semibold uppercase tracking-wider"
                style={{
                  background: "hsl(348 83% 47% / 0.12)",
                  borderColor: "hsl(348 83% 47%)",
                  color: "hsl(348 83% 47%)",
                }}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-mono">{validationError}</span>
              </div>
            )}

            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Reason for change
              </span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="vessel-cutoff">Vessel cutoff shift</option>
                <option value="port-congestion">Port congestion</option>
                <option value="phyto-pending">Phyto / docs pending</option>
                <option value="carrier-rebook">Carrier rebook</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Notes for ops team
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add context for drayage and warehouse teams…"
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </section>

          <section className="border border-border rounded-md overflow-hidden">
            <div className="px-4 py-2 bg-secondary/60 border-b border-border flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground/80 flex items-center gap-2">
                <History className="w-3 h-3 text-primary" /> Adjustment history · manifest log
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {fetchState === "ready" ? `${history.length} entries` : "—"}
              </span>
            </div>

            {fetchState === "loading" && <HistorySkeleton />}

            {fetchState === "empty" && (
              <div className="px-4 py-8 text-center">
                <Inbox className="w-6 h-6 mx-auto text-muted-foreground/60" />
                <div className="mt-2 text-xs font-mono text-foreground">
                  System log empty. No historical date adjustments found for this asset.
                </div>
              </div>
            )}

            {fetchState === "error" && (
              <div
                className="px-4 py-5 flex items-start gap-3 border-l-2"
                style={{ borderLeftColor: "hsl(348 83% 47%)", background: "hsl(348 83% 47% / 0.06)" }}
              >
                <RefreshCw className="w-4 h-4 mt-0.5" style={{ color: "hsl(348 83% 47%)" }} />
                <div className="text-xs">
                  <div className="font-bold uppercase tracking-wider font-mono" style={{ color: "hsl(348 83% 47%)" }}>
                    Data Sync Interrupted
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Manual override required for ERD/LRD fields.
                  </div>
                </div>
              </div>
            )}

            {fetchState === "ready" && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/40">
                    <th className="text-left font-medium px-4 py-2">Timestamp</th>
                    <th className="text-left font-medium px-3 py-2">User</th>
                    <th className="text-left font-medium px-3 py-2">Field</th>
                    <th className="text-left font-medium px-3 py-2">From → To</th>
                    <th className="text-left font-medium px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {history.map((h, i) => (
                    <tr key={i} className="hover:bg-secondary/30">
                      <td className="px-4 py-2 text-foreground/90 whitespace-nowrap">{h.ts}</td>
                      <td className="px-3 py-2 text-foreground/90">{h.user}</td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded border border-border bg-secondary/60 text-[10px]">{h.field}</span>
                      </td>
                      <td className="px-3 py-2 text-foreground/80">
                        <span className="text-muted-foreground">{h.from}</span>
                        <span className="mx-1 text-muted-foreground">→</span>
                        <span className="text-foreground">{h.to}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{h.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3">
          <div className="text-[11px] text-muted-foreground">
            {validationError ? (
              <span className="font-semibold" style={{ color: "hsl(348 83% 47%)" }}>
                Resolve validation error to enable save
              </span>
            ) : (
              "Syncs to carrier EDI & drayage dispatch on save"
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:bg-secondary"
          >
            Close
          </button>
          <button
            onClick={onSave}
            disabled={!!validationError || saving}
            className="text-sm font-semibold px-3 py-1.5 rounded-md text-accent-foreground inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundImage: "var(--gradient-action)" }}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Syncing…" : "Save changes"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const HistorySkeleton = () => (
  <div>
    <div className="grid grid-cols-[1.6fr_1fr_0.6fr_2fr_1.2fr] gap-3 px-4 py-2 bg-secondary/40 border-b border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-2.5 rounded bg-muted-foreground/15 animate-pulse" />
      ))}
    </div>
    {Array.from({ length: 4 }).map((_, r) => (
      <div key={r} className="grid grid-cols-[1.6fr_1fr_0.6fr_2fr_1.2fr] gap-3 px-4 py-3 border-b border-border last:border-b-0">
        {Array.from({ length: 5 }).map((__, c) => (
          <div
            key={c}
            className="h-3 rounded bg-muted-foreground/10 animate-pulse"
            style={{ animationDelay: `${(r * 5 + c) * 60}ms`, width: c === 2 ? "60%" : c === 3 ? "92%" : "85%" }}
          />
        ))}
      </div>
    ))}
  </div>
);
