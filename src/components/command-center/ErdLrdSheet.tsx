import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Container } from "@/data/containers";
import { CalendarClock, Ship, AlertTriangle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ErdLrdSheetProps {
  container: Container | null;
  open: boolean;
  onClose: () => void;
}

const toLocalInput = (iso: string) => {
  // expects "YYYY-MM-DD HH:mm" or "YYYY-MM-DD"
  const [d, t = "12:00"] = iso.split(" ");
  return `${d}T${t}`;
};

export const ErdLrdSheet = ({ container, open, onClose }: ErdLrdSheetProps) => {
  const [erd, setErd] = useState("");
  const [lrd, setLrd] = useState("");
  const [reason, setReason] = useState("vessel-cutoff");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (container) {
      setErd(toLocalInput(container.cutoff));
      // LRD defaults to ETA midnight
      setLrd(`${container.eta}T17:00`);
      setReason("vessel-cutoff");
      setNotes("");
    }
  }, [container]);

  if (!container) return null;

  const onSave = () => {
    toast.success(`ERD/LRD updated for ${container.id}`, {
      description: `New ERD ${erd.replace("T", " ")} · LRD ${lrd.replace("T", " ")}`,
    });
    onClose();
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold">
              <AlertTriangle className="w-3 h-3" /> Action required
            </span>
          </div>
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
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-card font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-card font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
            </div>

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
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3">
          <div className="text-[11px] text-muted-foreground">
            Syncs to carrier EDI & drayage dispatch on save
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:bg-secondary"
          >
            Close
          </button>
          <button
            onClick={onSave}
            className="text-sm font-semibold px-3 py-1.5 rounded-md text-accent-foreground inline-flex items-center gap-1.5"
            style={{ backgroundImage: "var(--gradient-action)" }}
          >
            <Save className="w-3.5 h-3.5" />
            Save changes
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
