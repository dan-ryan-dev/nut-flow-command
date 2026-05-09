import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Container, DocStatus } from "@/data/containers";
import { Paperclip, FileText, CheckCircle2, AlertTriangle, FileEdit } from "lucide-react";
import { usePhytoAttached } from "@/state/phytoStore";

const docMeta = (s: DocStatus) => {
  if (s === "attached") return { label: "Attached", icon: CheckCircle2, className: "text-success" };
  if (s === "draft") return { label: "Draft attached", icon: FileEdit, className: "text-primary" };
  return { label: "Missing", icon: AlertTriangle, className: "text-accent" };
};

export const DocsHoverCard = ({ container }: { container: Container }) => {
  const phytoDraft = usePhytoAttached(container.booking);
  const phytoStatus: DocStatus = phytoDraft && container.docs.phyto === "missing" ? "draft" : container.docs.phyto;

  const docs: { key: string; name: string; file: string; status: DocStatus }[] = [
    { key: "phyto", name: "USDA Phytosanitary (PPQ-577)", file: `${container.booking}-phyto.pdf`, status: phytoStatus },
    { key: "bol", name: "Bill of Lading", file: `${container.booking}-bol.pdf`, status: container.docs.bol },
    { key: "ci", name: "Commercial Invoice", file: `${container.booking}-ci.pdf`, status: container.docs.commercialInvoice },
    { key: "pl", name: "Packing List", file: `${container.booking}-pl.pdf`, status: container.docs.packingList },
  ];

  const attachedCount = docs.filter((d) => d.status !== "missing").length;
  const total = docs.length;
  const hasMissing = attachedCount < total;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium tabular-nums ${
            hasMissing
              ? "border-accent/40 bg-accent-soft/60 text-accent"
              : "border-border bg-secondary/60 text-foreground/80 hover:bg-secondary"
          }`}
        >
          <Paperclip className="w-3 h-3" />
          {attachedCount}/{total}
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b border-border bg-secondary/40">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Doc Storage · Quick-Look</div>
          <div className="text-xs font-semibold text-foreground">{container.booking} · {container.id}</div>
        </div>
        <ul className="divide-y divide-border">
          {docs.map((d) => {
            const m = docMeta(d.status);
            const Icon = m.icon;
            return (
              <li key={d.key} className="flex items-center gap-2 px-3 py-2">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground truncate">{d.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">
                    {d.status === "missing" ? "— not yet uploaded —" : d.file}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${m.className}`}>
                  <Icon className="w-3 h-3" />
                  {m.label}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
          Synced from Nomos Doc Storage
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
