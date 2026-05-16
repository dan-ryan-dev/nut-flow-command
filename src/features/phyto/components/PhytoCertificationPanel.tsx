import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Container } from "@/shared/data/types";
import { AlertTriangle, CheckCircle2, FileText, Sparkles, ShieldCheck, Stamp, FileSearch, Upload, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { PhytoPdfPreview } from "./PhytoPdfPreview";
import { phytoStore } from "@/features/phyto/state/phytoStore";
import { useAuth } from "@/shared/auth/AuthProvider";

interface Props {
  container: Container | null;
  open: boolean;
  onClose: () => void;
}

type FieldStatus = "ok" | "missing" | "draft";

interface PhytoField {
  block: string;
  label: string;
  value?: string;
  status: FieldStatus;
  source?: string;
  hint?: string;
}

// USDA PPQ Form 577 — Phytosanitary Certificate logical block layout.
// Pure data builder — kept outside the component so it stays testable.
const buildFields = (c: Container): PhytoField[] => [
  { block: "I. Description of Consignment", label: "Exporter (Name & Address)", value: "Capay Canyon Ranch · 1820 Crows Landing Rd, Salida CA 95368", status: "ok", source: "Nomos DB · facility profile" },
  { block: "I. Description of Consignment", label: "Consignee (Name & Address)", status: "missing", source: "Nomos DB · buyer record incomplete", hint: `${c.buyer} street address & postal code not on file` },
  { block: "I. Description of Consignment", label: "Place of Origin", value: `${c.facility}, California, USA`, status: "ok", source: "Nomos DB" },
  { block: "I. Description of Consignment", label: "Means of Conveyance", value: `Vessel ${c.vessel} / Voy ${c.voyage}`, status: "ok", source: "Carrier feed" },
  { block: "I. Description of Consignment", label: "Point of Entry", value: `${c.pod}`, status: "ok", source: "Carrier feed" },
  { block: "II. Description of Plants & Plant Products", label: "Botanical Name", status: "missing", source: "USDA APHIS requires Latin binomial", hint: "Suggest: Prunus dulcis (Mill.) D.A.Webb" },
  { block: "II. Description of Plants & Plant Products", label: "Commercial Description", value: c.product, status: "ok", source: "Nomos DB · SKU" },
  { block: "II. Description of Plants & Plant Products", label: "Number & Type of Packages", value: "1 × 40' HC reefer container, 1,260 cartons", status: "ok", source: "Nomos DB · packing list" },
  { block: "II. Description of Plants & Plant Products", label: "Distinguishing Marks", value: c.id, status: "ok", source: "Container manifest" },
  { block: "II. Description of Plants & Plant Products", label: "Quantity Declared", value: `${c.weightKg.toLocaleString()} kg net`, status: "ok", source: "Nomos DB · weight ticket" },
  { block: "III. Additional Declaration & Treatment", label: "Treatment Date", status: "missing", source: "Fumigation log not yet posted", hint: "Salida fumigation chamber B logs sync at 18:00 PT" },
  { block: "III. Additional Declaration & Treatment", label: "Treatment Type", value: "Methyl Bromide (MB) — pending log", status: "draft", source: "Standing protocol for EU shipments" },
  { block: "III. Additional Declaration & Treatment", label: "Chemical Concentration & Duration", status: "missing", source: "Auto-fills once treatment date posts" },
  { block: "III. Additional Declaration & Treatment", label: "Additional Declaration (EU 2019/2072)", value: "Lot found free from Aspergillus flavus per pre-export sampling 2026-04-29", status: "ok", source: "Nomos DB · QA lab report" },
  { block: "IV. Certification", label: "Place of Issue", value: "Sacramento, CA", status: "ok", source: "USDA APHIS field office" },
  { block: "IV. Certification", label: "Authorized Officer", value: "Pending — auto-routes after fields complete", status: "draft", source: "USDA PCIT queue" },
];

const statusStyles: Record<FieldStatus, { dot: string; label: string; chip: string }> = {
  ok: { dot: "bg-success", label: "Verified", chip: "text-success border-success/30 bg-success/5" },
  missing: { dot: "bg-accent", label: "Missing", chip: "text-accent border-accent/40 bg-accent-soft" },
  draft: { dot: "bg-warning", label: "Draft", chip: "text-warning-foreground border-warning/40 bg-warning/10" },
};

type FetchState = "loading" | "ready" | "empty" | "error";

const routeFetchState = (id: string): FetchState => {
  const hash = Array.from(id).reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return hash % 17 === 0 ? "empty" : hash % 13 === 0 ? "error" : "ready";
};

export const PhytoCertificationPanel = ({ container, open, onClose }: Props) => {
  const { role } = useAuth();
  const canWrite = role === "coordinator" || role === "admin";
  if (!container) return null;
  const fields = buildFields(container);
  const missing = fields.filter((f) => f.status === "missing");
  const blocks = Array.from(new Set(fields.map((f) => f.block)));
  const [previewOpen, setPreviewOpen] = useState(false);

  const target = routeFetchState(container.id);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  useEffect(() => {
    if (!open) return;
    setFetchState("loading");
    const t = setTimeout(() => setFetchState(target), 850);
    return () => clearTimeout(t);
  }, [open, container.id, target]);

  const [sealNumber, setSealNumber] = useState("");
  const [containerIdInput, setContainerIdInput] = useState(container.id);
  const [validationError, setValidationError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setSealNumber("");
      setContainerIdInput(container.id);
      setValidationError(null);
    }
  }, [open, container.id]);

  const handleSubmit = () => {
    if (!sealNumber.trim() || !containerIdInput.trim()) {
      setValidationError("REQUIRED: USDA Phyto requires a verified Seal Number.");
      return;
    }
    setValidationError(null);
    phytoStore.markPending(container.booking);
    toast.success("Submission Pending", {
      description: `${container.id} routed to USDA PCIT · awaiting officer signature`,
      className: "border-success/40",
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-y-auto bg-background">
        <SheetHeader className="px-6 pt-6 pb-4 space-y-3 border-b border-border" style={{ backgroundImage: "var(--gradient-navy)" }}>
          <div className="flex items-start justify-between text-primary-foreground">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary-foreground/60 flex items-center gap-1.5">
                <Stamp className="w-3 h-3" /> USDA APHIS · PPQ Form 577
              </div>
              <SheetTitle className="text-primary-foreground text-lg mt-1">Phytosanitary Certificate — Draft</SheetTitle>
              <div className="text-xs text-primary-foreground/70 mt-1 font-mono">
                {container.booking} · {container.id} · {container.vessel} {container.voyage}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-primary-foreground/60">Cert No.</div>
              <div className="font-mono text-sm text-primary-foreground">PHY-{container.booking.replace("BK-", "")}-D</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold">
              <AlertTriangle className="w-3 h-3" /> {missing.length} fields missing
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-foreground/10 text-primary-foreground text-[11px] border border-primary-foreground/20">
              <ShieldCheck className="w-3 h-3 text-success" /> Grounded in Nomos DB
            </span>
            <span className="ml-auto text-[11px] text-primary-foreground/70 tabular-nums">
              Cutoff {container.cutoff}
            </span>
          </div>
        </SheetHeader>

        {fetchState === "loading" && <ManifestSkeleton />}
        {fetchState === "empty" && <EmptyDraftState />}
        {fetchState === "error" && <ErrorDraftState onRetry={() => setFetchState("loading")} />}

        {fetchState === "ready" && (
        <>
        <div className="mx-6 mt-4 p-3 rounded-md border border-accent/30 bg-accent-soft flex gap-3">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="text-xs text-foreground flex-1">
            <div className="font-semibold">Daily Intel can resolve {missing.length} of {missing.length} gaps.</div>
            <div className="text-muted-foreground mt-0.5">
              Botanical name + treatment fields can be drafted from your Nomos protocol library. Consignee address needs 1 buyer reply.
            </div>
          </div>
          <button
            onClick={() => toast.success("Drafted 3 fields from Nomos DB", { description: "Buyer email queued for consignee address" })}
            className="self-start text-xs font-semibold px-2.5 py-1 rounded-md text-accent-foreground"
            style={{ backgroundImage: "var(--gradient-action)" }}
          >
            Auto-draft
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {blocks.map((block) => {
            const blockFields = fields.filter((f) => f.block === block);
            const blockMissing = blockFields.filter((f) => f.status === "missing").length;
            return (
              <section key={block} className="border border-border rounded-md overflow-hidden">
                <div className="px-4 py-2 bg-secondary/60 border-b border-border flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground/80 flex items-center gap-2">
                    <FileText className="w-3 h-3 text-primary" /> {block}
                  </div>
                  {blockMissing > 0 ? (
                    <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                      {blockMissing} missing
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Complete
                    </span>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {blockFields.map((f) => {
                    const s = statusStyles[f.status];
                    return (
                      <div key={f.label} className="grid grid-cols-[200px_1fr_auto] gap-4 px-4 py-3 items-start">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground pt-0.5 flex items-start gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${s.dot}`} />
                          {f.label}
                        </div>
                        <div className="text-sm text-foreground">
                          {f.value ? (
                            <div className="font-medium">{f.value}</div>
                          ) : (
                            <div className="italic text-accent font-medium">— not on certificate —</div>
                          )}
                          {f.hint && <div className="text-[11px] text-muted-foreground mt-0.5">{f.hint}</div>}
                          {f.source && (
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">
                              Source · {f.source}
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest font-semibold border rounded px-1.5 py-0.5 ${s.chip}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="px-6 pb-5">
          <section className="border border-border rounded-md overflow-hidden">
            <div className="px-4 py-2 bg-secondary/60 border-b border-border flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground/80 flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-accent" /> V. Verification & Seal
              </div>
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">required</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border">
              <label className="bg-card px-4 py-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Container ID</span>
                <input
                  value={containerIdInput}
                  onChange={(e) => setContainerIdInput(e.target.value)}
                  className="font-mono text-sm bg-transparent border-b border-border focus:border-accent outline-none py-1"
                />
              </label>
              <label className="bg-card px-4 py-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Seal Number</span>
                <input
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  placeholder="e.g. SL-7821934"
                  className="font-mono text-sm bg-transparent border-b border-border focus:border-accent outline-none py-1 placeholder:text-muted-foreground/50"
                />
              </label>
            </div>
            {validationError && (
              <div className="px-4 py-2.5 bg-destructive/10 border-t border-destructive/40 flex items-center gap-2 text-[12px] font-semibold text-destructive uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" /> {validationError}
              </div>
            )}
          </section>
        </div>
        </>
        )}

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3">
          <div className="text-[11px] text-muted-foreground">
            {fields.length - missing.length} of {fields.length} fields verified · syncs to USDA PCIT on submit
          </div>
          <button onClick={onClose} className="ml-auto text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:bg-secondary">
            Close
          </button>
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={fetchState !== "ready"}
            className="text-sm font-semibold px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-secondary inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSearch className="w-3.5 h-3.5" />
            Preview Draft
          </button>
          {canWrite && (
            <button
              onClick={handleSubmit}
              disabled={fetchState !== "ready"}
              className="text-sm font-semibold px-3 py-1.5 rounded-md text-accent-foreground inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundImage: "var(--gradient-action)" }}
            >
              <Send className="w-3.5 h-3.5" />
              Submit to USDA
            </button>
          )}
        </div>
        <PhytoPdfPreview
          container={container}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onAttached={onClose}
        />
      </SheetContent>
    </Sheet>
  );
};

const ManifestSkeleton = () => (
  <div className="px-6 py-5 space-y-4">
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      Extracting fields from booking record…
    </div>
    {[0, 1, 2].map((b) => (
      <div key={b} className="border border-border rounded-md overflow-hidden">
        <div className="px-4 py-2 bg-secondary/60 border-b border-border">
          <div className="h-3 w-48 rounded bg-foreground/10 animate-pulse" />
        </div>
        <div className="divide-y divide-border">
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="grid grid-cols-[200px_1fr_80px] gap-4 px-4 py-3 items-center">
              <div className="h-2.5 rounded bg-foreground/10 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 rounded bg-foreground/10 animate-pulse" style={{ width: `${60 + ((b + r) * 7) % 35}%` }} />
                <div className="h-2 rounded bg-foreground/5 animate-pulse w-1/3" />
              </div>
              <div className="h-4 rounded bg-foreground/10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const EmptyDraftState = () => (
  <div className="px-6 py-10 flex flex-col items-center text-center">
    <div className="w-12 h-12 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground">
      <Upload className="w-5 h-5" />
    </div>
    <div className="mt-3 text-sm font-semibold text-foreground">No draft found</div>
    <div className="mt-1 text-xs text-muted-foreground max-w-sm">
      Please upload a Sales Contract PDF to initiate Phyto-ready logic.
    </div>
    <button className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-accent-foreground" style={{ backgroundImage: "var(--gradient-action)" }}>
      <Upload className="w-3.5 h-3.5" /> Upload Sales Contract
    </button>
  </div>
);

const ErrorDraftState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="mx-6 mt-4 border border-destructive/40 bg-destructive/5 rounded-md px-4 py-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-destructive uppercase tracking-wider">Draft generation failed</div>
        <div className="text-xs text-foreground mt-1">
          Manual entry required for BRC Global Standard for Food Safety / USDA compliance.
        </div>
      </div>
      <button onClick={onRetry} className="text-xs font-semibold px-2.5 py-1 rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center gap-1.5">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  </div>
);
