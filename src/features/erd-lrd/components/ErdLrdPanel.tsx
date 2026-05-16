import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Container } from "@/shared/data/types";
import { CalendarClock, Ship, AlertTriangle, Save, History, WifiOff, Inbox, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { containersQueryKey } from "@/shared/hooks/useContainers";
import { useAuth } from "@/shared/auth/AuthProvider";

interface Props {
  container: Container | null;
  open: boolean;
  onClose: () => void;
  onSaved?: (containerId: string) => void;
}

const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const [date, time = "12:00"] = iso.split(" ");
    return `${date}T${time}`;
  }
  return d.toISOString().slice(0, 16);
};

const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

export const ErdLrdPanel = ({ container, open, onClose, onSaved }: Props) => {
  const [erd, setErd] = useState("");
  const [lrd, setLrd] = useState("");
  const [reason, setReason] = useState("vessel-cutoff");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const qc = useQueryClient();
  const { role } = useAuth();
  const canWrite = role === "coordinator" || role === "admin";

  // Pull live record (for erd/lrd/carrier_last_synced_at).
  const { data: live } = useQuery({
    queryKey: ["containers", container?.id, "erd-lrd"],
    enabled: !!container && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("containers")
        .select("erd, lrd, carrier_last_synced_at")
        .eq("container_id", container!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Logistics-event history for this container.
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["logistics_events", container?.id],
    enabled: !!container && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("logistics_events")
        .select("occurred_at, status, notes")
        .eq("container_id", container!.id)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!container || !open) return;
    setErd(toLocalInput(live?.erd) || toLocalInput(container.cutoff));
    setLrd(toLocalInput(live?.lrd) || `${container.eta}T17:00`);
    setReason("vessel-cutoff");
    setNotes("");
    setValidationError(null);
  }, [container, open, live]);

  useEffect(() => {
    if (erd && lrd && new Date(lrd) < new Date(erd)) {
      setValidationError("CRITICAL ERROR: LRD cannot precede ERD.");
    } else {
      setValidationError(null);
    }
  }, [erd, lrd]);

  const save = useMutation({
    mutationFn: async () => {
      if (!container) return;
      const { error: cErr } = await supabase
        .from("containers")
        .update({
          erd: toIso(erd),
          lrd: toIso(lrd),
          carrier_last_synced_at: new Date().toISOString(),
        })
        .eq("container_id", container.id);
      if (cErr) throw cErr;
      // Log a history event
      const { error: eErr } = await supabase.from("logistics_events").insert({
        container_id: container.id,
        status: container.logisticsStatus,
        notes: `ERD/LRD updated · ${reason}${notes ? " · " + notes : ""}`,
        org_id: "00000000-0000-0000-0000-000000000001",
      });
      if (eErr) throw eErr;
    },
    onSuccess: () => {
      toast.success("Sync Successful", {
        description: `${container?.id} · new ERD ${erd.replace("T", " ")} · LRD ${lrd.replace("T", " ")}`,
      });
      qc.invalidateQueries({ queryKey: containersQueryKey });
      qc.invalidateQueries({ queryKey: ["logistics_events", container?.id] });
      qc.invalidateQueries({ queryKey: ["containers", container?.id, "erd-lrd"] });
      if (container) onSaved?.(container.id);
      onClose();
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  if (!container) return null;

  // Real latency badge — compute against carrier_last_synced_at.
  const lastSyncIso = live?.carrier_last_synced_at;
  const feedAgeMin = lastSyncIso
    ? Math.floor((Date.now() - new Date(lastSyncIso).getTime()) / 60_000)
    : null;
  const isStale = feedAgeMin !== null && feedAgeMin > 120;
  const lastSyncLabel = lastSyncIso
    ? new Date(lastSyncIso).toISOString().replace("T", " ").slice(0, 16) + " UTC"
    : "never";

  const onSave = () => {
    if (validationError) return;
    save.mutate();
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
              {isStale && feedAgeMin !== null && (
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
                <div className="text-sm font-mono mt-1 text-foreground">{live?.erd ?? container.cutoff}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current ETA / LRD</div>
                <div className="text-sm font-mono mt-1 text-foreground">{live?.lrd ?? container.eta}</div>
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
                <History className="w-3 h-3 text-primary" /> Logistics event log
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {history ? `${history.length} entries` : "—"}
              </span>
            </div>

            {historyLoading && <HistorySkeleton />}

            {!historyLoading && history && history.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Inbox className="w-6 h-6 mx-auto text-muted-foreground/60" />
                <div className="mt-2 text-xs font-mono text-foreground">
                  System log empty. No historical events found for this asset.
                </div>
              </div>
            )}

            {!historyLoading && history && history.length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/40">
                    <th className="text-left font-medium px-4 py-2">Timestamp</th>
                    <th className="text-left font-medium px-3 py-2">Status</th>
                    <th className="text-left font-medium px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {history.map((h, i) => (
                    <tr key={i} className="hover:bg-secondary/30">
                      <td className="px-4 py-2 text-foreground/90 whitespace-nowrap">
                        {new Date(h.occurred_at).toISOString().replace("T", " ").slice(0, 16)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded border border-border bg-secondary/60 text-[10px]">{h.status}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{h.notes ?? ""}</td>
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
              "Syncs to Nomos DB on save"
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:bg-secondary"
          >
            Close
          </button>
          {canWrite && (
            <button
              onClick={onSave}
              disabled={!!validationError || save.isPending}
              className="text-sm font-semibold px-3 py-1.5 rounded-md text-accent-foreground inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundImage: "var(--gradient-action)" }}
            >
              <Save className="w-3.5 h-3.5" />
              {save.isPending ? "Syncing…" : "Save changes"}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const HistorySkeleton = () => (
  <div>
    {Array.from({ length: 3 }).map((_, r) => (
      <div key={r} className="grid grid-cols-3 gap-3 px-4 py-3 border-b border-border last:border-b-0">
        {Array.from({ length: 3 }).map((__, c) => (
          <div key={c} className="h-3 rounded bg-muted-foreground/10 animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);
