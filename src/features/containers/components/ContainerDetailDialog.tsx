import type { Container, DocStatus } from "@/shared/data/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { Ship, Search, AlertTriangle, CheckCircle2, Circle, XCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  container: Container | null;
  open: boolean;
  onClose: () => void;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{children}</div>
);

const FieldValue = ({ children, mono = true }: { children: React.ReactNode; mono?: boolean }) => (
  <div className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{children}</div>
);

const fmtDate = (s: string | null | undefined) => {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
};

const daysFromNow = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

type Milestone = { key: string; label: string; sub: string; date: string | null; urgent?: boolean };

const docMeta: { key: keyof Container["docs"]; label: string }[] = [
  { key: "phyto", label: "Phytosanitary" },
  { key: "bol", label: "Bill of Lading" },
  { key: "commercialInvoice", label: "Commercial Invoice" },
  { key: "packingList", label: "Packing List" },
];

const docIcon = (s: DocStatus) => {
  if (s === "attached") return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
  if (s === "draft") return <Circle className="w-3.5 h-3.5 text-warning" />;
  return <XCircle className="w-3.5 h-3.5 text-destructive" />;
};

export const ContainerDetailDialog = ({ container, open, onClose }: Props) => {
  const { toast } = useToast();
  if (!container) return null;

  const lrdDays = daysFromNow(container.cutoff);
  const lrdUrgent = lrdDays !== null && lrdDays <= 3;

  // Progress derivation from logisticsStatus
  const stage = container.logisticsStatus;
  const progress =
    stage === "closed" || stage === "arrived-discharge"
      ? 3
      : stage === "loaded-vessel"
        ? 2
        : stage === "gated-in" || stage === "origin-received"
          ? 1
          : 0;

  const milestones: Milestone[] = [
    { key: "erd", label: "ERD", sub: "Gate Opens", date: null },
    { key: "lrd", label: "LRD", sub: "Port Cutoff", date: container.cutoff, urgent: lrdUrgent },
    { key: "etd", label: "ETD", sub: "Vessel Departs", date: null },
    { key: "eta", label: "ETA", sub: "Arrives POD", date: container.eta },
  ];

  const attachedCount = docMeta.filter((d) => container.docs[d.key] === "attached").length;
  const docPct = Math.round((attachedCount / docMeta.length) * 100);

  const closed = stage === "closed";

  const handleTrack = () =>
    toast({
      title: "Tracking vessel…",
      description: `Checking carrier schedule for ${container.vessel} · ${container.voyage}`,
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Section 1 — Page Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">Shipment Detail</h2>
            {container.purchaseOrder && (
              <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-mono">
                {container.purchaseOrder}
              </span>
            )}
            <StatusBadge status={container.logisticsStatus} />
            {container.alert && (
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
            )}
          </div>
        </div>

        {/* Section 2 — Identity Strip */}
        <div className="grid grid-cols-3 border-b border-border">
          <div className="px-6 py-4 border-r border-border">
            <FieldLabel>Container #</FieldLabel>
            <div className="font-mono text-base font-semibold text-foreground mt-1">{container.id}</div>
          </div>
          <div className="px-6 py-4 border-r border-border">
            <FieldLabel>Booking Reference</FieldLabel>
            <div className="font-mono text-base font-semibold text-foreground mt-1">{container.booking}</div>
          </div>
          <div className="px-6 py-4">
            <FieldLabel>Purchase Order</FieldLabel>
            <div className="font-mono text-base font-semibold text-foreground mt-1">
              {container.purchaseOrder ?? (
                <span className="inline-flex items-center rounded-full bg-warning/15 text-warning-foreground border border-warning/40 px-2 py-0.5 text-xs font-medium">
                  Awaiting
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3 — Schedule Timeline */}
        <div className="px-6 py-5 border-b border-border">
          <FieldLabel>Schedule</FieldLabel>
          <div className="mt-4 flex items-center">
            {milestones.map((m, i) => {
              const filled = i <= progress && !!m.date;
              const isLast = i === milestones.length - 1;
              const muted = !m.date;
              return (
                <div key={m.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center min-w-[70px]">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 ${
                        m.urgent
                          ? "border-destructive bg-destructive animate-pulse"
                          : filled
                            ? "border-primary bg-primary"
                            : muted
                              ? "border-border bg-background"
                              : "border-primary bg-background"
                      }`}
                    />
                    <div
                      className={`mt-2 font-mono text-sm ${m.urgent ? "text-destructive font-semibold" : muted ? "text-muted-foreground" : "text-foreground"}`}
                    >
                      {fmtDate(m.date) ?? "—"}
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</div>
                    <div className="text-[10px] text-muted-foreground">{m.sub}</div>
                  </div>
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-1 bg-border relative -mt-10">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary"
                        style={{ width: i < progress ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4 — Live Track */}
        <div className="px-6 py-4 border-b border-border">
          <button
            type="button"
            onClick={handleTrack}
            disabled={closed}
            className="group w-full inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-md px-4 py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            <div className="text-left">
              <div className="text-sm font-semibold">Live Track Vessel</div>
              <div className="text-[11px] opacity-80">Check carrier schedule for ERD / LRD / ETD / ETA updates</div>
            </div>
          </button>
        </div>

        {/* Section 5 — Readiness */}
        <div className="px-6 py-4 border-b border-border">
          <FieldLabel>Readiness</FieldLabel>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                container.phytoComplete
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-warning/15 text-warning-foreground border-warning/40"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Phyto {container.phytoComplete ? "Complete" : "Pending"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                progress >= 1
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {progress >= 1 ? "Packing Ready" : "Packing Not Ready"}
            </span>
          </div>
        </div>

        {/* Section 6 — Routing + Cargo */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
          <div className="px-6 py-4 md:border-r border-border">
            <FieldLabel>Routing &amp; Logistics</FieldLabel>
            <div className="mt-3 space-y-2.5">
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Vessel</span>
                <FieldValue>{container.vessel}</FieldValue>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Voyage</span>
                <FieldValue>{container.voyage}</FieldValue>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Route</span>
                <FieldValue>
                  {container.pol} → {container.pod}
                </FieldValue>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Destination</span>
                <FieldValue mono={false}>{container.destination}</FieldValue>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            <FieldLabel>Cargo &amp; Trade</FieldLabel>
            <div className="mt-3 space-y-2.5">
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Product</span>
                <FieldValue mono={false}>{container.product}</FieldValue>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Buyer</span>
                <FieldValue mono={false}>{container.buyer}</FieldValue>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Facility</span>
                <FieldValue mono={false}>{container.facility}</FieldValue>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Net Weight</span>
                <FieldValue>{container.weightKg.toLocaleString()} kg</FieldValue>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Lots</span>
                <FieldValue>{container.lots.length ? container.lots.join(", ") : "—"}</FieldValue>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">Week</span>
                <FieldValue mono={false}>{container.shipmentWeek}</FieldValue>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7 — Containers list */}
        <div className="px-6 py-4 border-b border-border">
          <FieldLabel>Containers</FieldLabel>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium py-1.5">Container #</th>
                <th className="text-left font-medium">Lots</th>
                <th className="text-right font-medium">Net Weight</th>
                <th className="text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border last:border-0">
                <td className="py-2 font-mono">{container.id}</td>
                <td className="font-mono text-xs text-muted-foreground">
                  {container.lots.length ? container.lots.join(", ") : "—"}
                </td>
                <td className="text-right font-mono">{container.weightKg.toLocaleString()} kg</td>
                <td className="text-right">
                  <StatusBadge status={container.logisticsStatus} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 8 — Alerts */}
        {container.alert && (
          <div className="px-6 py-4 border-b border-border">
            <FieldLabel>Active Alerts</FieldLabel>
            <div className="mt-2 flex items-start gap-2 rounded-md border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-foreground">
              <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <span>{container.alert}</span>
            </div>
          </div>
        )}

        {/* Section 9 — Documents */}
        <div className="px-6 py-4 pb-6">
          <div className="flex items-center justify-between">
            <FieldLabel>Document Checklist</FieldLabel>
            <span className="text-xs font-mono text-muted-foreground">
              {attachedCount}/{docMeta.length} · {docPct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${docPct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {docMeta.map((d) => {
              const s = container.docs[d.key];
              return (
                <div
                  key={d.key}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {docIcon(s)}
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {s}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
