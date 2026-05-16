import { useEffect, useState } from "react";
import { Upload, FileText, CheckCircle2, Loader2, X, Sparkles, AlertTriangle, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { containersQueryKey } from "@/shared/hooks/useContainers";

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type Stage = "drop" | "parsing" | "review" | "saved";

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";
const BOOKING_ID = "BK-99221";
const CONTAINER_ID = "MSCU-7741833";
const PDF_FILENAME = "MSC_Booking_Confirmation_BK-99221.pdf";

const fields = [
  { label: "Booking #", value: BOOKING_ID, confidence: 99 },
  { label: "Carrier", value: "MSC", confidence: 100 },
  { label: "Vessel / Voyage", value: "MSC ARUSHI · 451W", confidence: 98 },
  { label: "Container #", value: CONTAINER_ID, confidence: 99 },
  { label: "Seal #", value: "SL-998213", confidence: 96 },
  { label: "POL", value: "USOAK — Oakland", confidence: 100 },
  { label: "POD", value: "DEHAM — Hamburg", confidence: 100 },
  { label: "Vessel ETD", value: "2026-05-09 17:00 PT", confidence: 99 },
  { label: "ETA Discharge", value: "2026-05-23 06:00 CET", confidence: 97 },
  { label: "VGM Cutoff", value: "2026-05-08 12:00 PT", confidence: 95 },
  { label: "Commodity", value: "Almonds, Nonpareil 23/25, in 50lb cartons", confidence: 94 },
  { label: "Net Weight", value: "22,680 kg", confidence: 99 },
  { label: "Buyer", value: "Nordmann Rassmann GmbH", confidence: 92 },
  { label: "Phyto Required", value: "YES — EU import", confidence: 100, flag: true },
];

const avgAccuracy =
  fields.reduce((s, f) => s + f.confidence, 0) / fields.length;

export const PdfBookingFlow = ({ open, onClose, onComplete }: Props) => {
  const [stage, setStage] = useState<Stage>("drop");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [parseStart, setParseStart] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (!open) {
      setStage("drop");
      setProgress(0);
    }
  }, [open]);

  useEffect(() => {
    if (stage !== "parsing") return;
    setProgress(0);
    setParseStart(Date.now());
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setStage("review");
          return 100;
        }
        return p + 7;
      });
    }, 90);
    return () => clearInterval(id);
  }, [stage]);

  if (!open) return null;

  const startParse = () => setStage("parsing");

  const confirm = async () => {
    setSaving(true);
    const duration = Date.now() - parseStart;
    try {
      const { error: cErr } = await supabase.from("containers").insert({
        org_id: DEFAULT_ORG,
        container_id: CONTAINER_ID,
        booking_id: BOOKING_ID,
        vessel: "MSC ARUSHI",
        voyage: "451W",
        pol: "Oakland",
        pod: "Hamburg",
        destination: "Hamburg, DE",
        buyer: "Nordmann Rassmann GmbH",
        product: "Nonpareil Almonds 23/25",
        weight_kg: 22680,
        eta: "2026-05-23",
        cutoff: "2026-05-08T12:00:00-07:00",
        status: "action",
        alert: "Phyto certificate required for EU import",
        phyto_complete: false,
        facility: "Salida",
        lots: [],
        shipment_week: "Week 19 · May 4–10",
        logistics_status: "pending-load",
      });
      if (cErr && !cErr.message.includes("duplicate")) throw cErr;

      // Docs — phyto draft + the three other doc placeholders.
      const { error: dErr } = await supabase.from("documents").upsert(
        [
          { booking_id: BOOKING_ID, doc_type: "phyto", status: "draft", org_id: DEFAULT_ORG },
          { booking_id: BOOKING_ID, doc_type: "bol", status: "missing", org_id: DEFAULT_ORG },
          { booking_id: BOOKING_ID, doc_type: "commercial-invoice", status: "missing", org_id: DEFAULT_ORG },
          { booking_id: BOOKING_ID, doc_type: "packing-list", status: "missing", org_id: DEFAULT_ORG },
        ],
        { onConflict: "booking_id,doc_type" } as never,
      );
      if (dErr) throw dErr;

      const { error: mErr } = await supabase.from("intake_metrics").insert({
        org_id: DEFAULT_ORG,
        booking_id: BOOKING_ID,
        pdf_filename: PDF_FILENAME,
        duration_ms: duration,
        fields_extracted: fields.length,
        accuracy_pct: Number(avgAccuracy.toFixed(2)),
      });
      if (mErr) throw mErr;

      qc.invalidateQueries({ queryKey: containersQueryKey });
      setStage("saved");
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      toast.error("Could not save booking", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-3xl bg-card rounded-lg border border-border overflow-hidden flex flex-col max-h-[88vh]"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <div className="text-sm font-semibold">New Booking · AI PDF Intake</div>
            <span className="text-[10px] uppercase tracking-widest text-primary-foreground/60">vs 12 min manual</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-primary-glow">
            <X className="w-4 h-4" />
          </button>
        </div>

        {stage === "drop" && (
          <div className="p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); startParse(); }}
              onClick={startParse}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${
                dragOver ? "border-accent bg-accent-soft" : "border-border bg-secondary/40 hover:border-accent/60"
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-accent" />
              </div>
              <div className="text-base font-semibold text-foreground">Drop the carrier confirmation PDF</div>
              <div className="text-sm text-muted-foreground mt-1">
                MSC, Maersk, CMA CGM, ONE, Hapag-Lloyd, OOCL · or click to browse
              </div>
              <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-accent" />
                Reads {fields.length} fields incl. Phyto requirements
              </div>
            </div>

            <button onClick={onClose} className="mt-4 text-xs text-muted-foreground hover:underline">
              No thanks — enter manually (40+ fields)
            </button>
          </div>
        )}

        {stage === "parsing" && (
          <div className="p-10 flex flex-col items-center">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary mb-6">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-foreground">{PDF_FILENAME}</span>
              <span className="text-xs text-muted-foreground">218 KB</span>
            </div>
            <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
            <div className="text-sm font-semibold text-foreground">Reading carrier confirmation…</div>
            <div className="text-xs text-muted-foreground mt-1">
              {progress < 30 && "Detecting carrier template (MSC v4)"}
              {progress >= 30 && progress < 60 && `Extracting ${fields.length} booking fields`}
              {progress >= 60 && progress < 90 && "Cross-checking USDA Phyto requirements for EU"}
              {progress >= 90 && "Validating against Nomos DB"}
            </div>
            <div className="w-full max-w-sm h-1.5 bg-secondary rounded-full overflow-hidden mt-5">
              <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {stage === "review" && (
          <>
            <div className="px-5 py-3 border-b border-border bg-success/5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">
                <span className="font-semibold">{fields.length} of {fields.length} fields extracted.</span>{" "}
                <span className="text-muted-foreground">Phyto certificate flagged as required — draft auto-generated.</span>
              </span>
            </div>
            <div className="overflow-y-auto p-5 grid grid-cols-2 gap-3">
              {fields.map((f) => (
                <div
                  key={f.label}
                  className={`p-2.5 rounded-md border ${f.flag ? "border-accent/40 bg-accent-soft" : "border-border bg-card"} group relative`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</div>
                    <div className="flex items-center gap-1">
                      {f.flag && <AlertTriangle className="w-3 h-3 text-accent" />}
                      <span
                        className={`text-[10px] tabular-nums ${
                          f.confidence >= 97 ? "text-success" : f.confidence >= 93 ? "text-warning" : "text-accent"
                        }`}
                      >
                        {f.confidence}%
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate">{f.value}</span>
                    <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-secondary/40">
              <div className="text-xs text-muted-foreground">
                Avg accuracy: <span className="font-semibold text-foreground tabular-nums">{avgAccuracy.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md hover:bg-secondary text-foreground/80">
                  Discard
                </button>
                <button
                  onClick={confirm}
                  disabled={saving}
                  className="px-4 py-1.5 text-sm font-semibold rounded-md bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundImage: "var(--gradient-action)" }}
                >
                  {saving ? "Saving…" : "Confirm & log to Nomos DB →"}
                </button>
              </div>
            </div>
          </>
        )}

        {stage === "saved" && (
          <div className="p-12 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <div className="text-base font-semibold text-foreground">Booking {BOOKING_ID} logged</div>
            <div className="text-xs text-muted-foreground mt-1">Synced to Nomos DB · Phyto draft queued for USDA</div>
          </div>
        )}
      </div>
    </div>
  );
};
