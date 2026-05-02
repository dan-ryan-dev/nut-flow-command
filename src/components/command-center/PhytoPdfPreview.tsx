import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Container } from "@/data/containers";
import { Paperclip, ShieldCheck, Stamp, FileText } from "lucide-react";
import { toast } from "sonner";
import { phytoStore } from "@/state/phytoStore";

interface Props {
  container: Container | null;
  open: boolean;
  onClose: () => void;
  onAttached?: () => void;
}

const Field = ({ label, value, span = 1 }: { label: string; value: string; span?: number }) => (
  <div
    className="border border-neutral-400 px-2 py-1.5"
    style={{ gridColumn: `span ${span} / span ${span}` }}
  >
    <div className="text-[8px] uppercase tracking-wider text-neutral-600 font-semibold">{label}</div>
    <div className="text-[11px] text-neutral-900 font-serif leading-snug mt-0.5 min-h-[14px]">{value}</div>
  </div>
);

export const PhytoPdfPreview = ({ container, open, onClose, onAttached }: Props) => {
  if (!container) return null;
  const certNo = `PHY-${container.booking.replace("BK-", "")}-D`;

  const handleAttach = () => {
    phytoStore.attach(container.booking);
    toast.success(`Draft attached to ${container.booking} in Nomos Doc Storage.`, {
      description: "Phytosanitary Certificate · status updated to Drafted",
    });
    onAttached?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 bg-secondary/40 border-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm font-semibold text-foreground">Preview · PPQ Form 577</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {certNo} · DRAFT — not yet certified
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border border-success/30 bg-success/5 text-success">
            <ShieldCheck className="w-3 h-3" /> Populated from Nomos DB
          </span>
        </div>

        {/* PDF page */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          <div
            className="mx-auto bg-white shadow-2xl border border-neutral-300 text-neutral-900"
            style={{ width: "100%", maxWidth: "640px", aspectRatio: "8.5 / 11", padding: "28px 32px" }}
          >
            {/* Form header */}
            <div className="flex items-start justify-between border-b-2 border-neutral-800 pb-2">
              <div>
                <div className="text-[9px] font-bold tracking-wider text-neutral-700">
                  UNITED STATES DEPARTMENT OF AGRICULTURE
                </div>
                <div className="text-[9px] tracking-wider text-neutral-700">ANIMAL AND PLANT HEALTH INSPECTION SERVICE</div>
                <div className="text-[14px] font-bold text-neutral-900 mt-1 font-serif">
                  PHYTOSANITARY CERTIFICATE
                </div>
                <div className="text-[8px] text-neutral-600">PPQ FORM 577</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-bold text-neutral-700">No.</div>
                <div className="text-[11px] font-mono text-neutral-900 border border-neutral-400 px-2 py-0.5 mt-0.5">
                  {certNo}
                </div>
              </div>
            </div>

            {/* Plant Protection Org */}
            <div className="text-center text-[9px] text-neutral-700 my-2 italic font-serif">
              Plant Protection Organization of the United States of America
              <br />
              TO: Plant Protection Organization(s) of <span className="font-semibold not-italic">Germany (DE)</span>
            </div>

            {/* Block I */}
            <div className="grid grid-cols-2 gap-0">
              <Field label="I. Name and address of exporter" value="Capay Canyon Ranch · 1820 Crows Landing Rd, Salida CA 95368" />
              <Field
                label="II. Declared name and address of consignee"
                value="— address pending from buyer reply —"
              />
            </div>
            <div className="grid grid-cols-3 gap-0">
              <Field label="III. Number and description of packages" value="1 × 40' HC reefer · 1,260 cartons" />
              <Field label="IV. Distinguishing marks" value={container.id} />
              <Field label="V. Place of origin" value={`${container.facility}, CA, USA`} />
            </div>
            <div className="grid grid-cols-2 gap-0">
              <Field
                label="VI. Means of conveyance"
                value={`Vessel ${container.vessel} / Voy ${container.voyage}`}
              />
              <Field label="VII. Point of entry" value={container.pod} />
            </div>
            <div className="grid grid-cols-2 gap-0">
              <Field label="VIII. Name of produce / botanical name" value="— Prunus dulcis (suggested) —" />
              <Field label="IX. Quantity declared" value={`${container.weightKg.toLocaleString()} kg net`} />
            </div>

            {/* Additional declaration */}
            <div className="border border-neutral-400 px-2 py-1.5 mt-0">
              <div className="text-[8px] uppercase tracking-wider text-neutral-600 font-semibold">
                X. Additional Declaration
              </div>
              <div className="text-[10px] font-serif text-neutral-900 mt-0.5 leading-snug">
                The plants, plant products or other regulated articles described herein have been inspected
                and/or tested according to appropriate official procedures and are considered to be free from
                the quarantine pests specified by the importing contracting party. Lot found free from
                <em> Aspergillus flavus</em> per pre-export sampling 2026-04-29 (Nomos DB · QA lab report).
              </div>
            </div>

            {/* Disinfestation */}
            <div className="mt-2">
              <div className="text-[9px] font-bold text-neutral-800 uppercase tracking-wider mb-1">
                Disinfestation and/or Disinfection Treatment
              </div>
              <div className="grid grid-cols-4 gap-0">
                <Field label="Date" value="— pending —" />
                <Field label="Treatment" value="Methyl Bromide (MB)" />
                <Field label="Chemical" value="— pending —" />
                <Field label="Duration & Temp" value="— pending —" />
              </div>
            </div>

            {/* Certification block */}
            <div className="mt-3 border-t-2 border-neutral-800 pt-2">
              <div className="grid grid-cols-2 gap-0">
                <Field label="Place of Issue" value="Sacramento, CA" />
                <Field label="Date of Issue" value="— upon officer signature —" />
              </div>
              <div className="grid grid-cols-2 gap-0">
                <Field label="Name of authorized officer" value="— USDA APHIS / PCIT queue —" />
                <Field label="Signature & Stamp" value="" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[8px] text-neutral-500">
              <span className="italic">No financial liability with respect to this certificate shall attach to USDA-APHIS.</span>
              <span className="font-mono">{container.booking} · {container.id}</span>
            </div>

            {/* Watermark */}
            <div className="relative">
              <div
                className="absolute -top-[420px] left-1/2 -translate-x-1/2 text-[110px] font-black text-neutral-900/5 uppercase tracking-widest pointer-events-none select-none"
                style={{ transform: "translate(-50%, 0) rotate(-20deg)" }}
              >
                Draft
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-card">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Stamp className="w-3 h-3" />
            Rendered live from Nomos DB · 4 fields still missing on submitted version
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:bg-secondary"
          >
            Close
          </button>
          <button
            onClick={handleAttach}
            className="text-sm font-semibold px-3 py-1.5 rounded-md text-accent-foreground inline-flex items-center gap-1.5"
            style={{ backgroundImage: "var(--gradient-action)" }}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Attach to Booking {container.booking}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};