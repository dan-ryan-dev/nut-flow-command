import type { Container } from "@/shared/data/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Ship, Anchor, MapPin, Package, Calendar, Building2, Hash } from "lucide-react";

interface Props {
  container: Container | null;
  open: boolean;
  onClose: () => void;
}

export const ContainerDetailDialog = ({ container, open, onClose }: Props) => {
  if (!container) return null;
  const rows: { icon: typeof Ship; label: string; value: string }[] = [
    { icon: Hash, label: "Container", value: container.id },
    { icon: Hash, label: "Booking", value: container.booking },
    { icon: Hash, label: "Purchase order", value: container.purchaseOrder ?? "—" },
    { icon: Ship, label: "Vessel / Voyage", value: `${container.vessel} · ${container.voyage}` },
    { icon: Anchor, label: "Route", value: `${container.pol} → ${container.pod}` },
    { icon: MapPin, label: "Destination", value: container.destination },
    { icon: Building2, label: "Buyer / Facility", value: `${container.buyer} · ${container.facility}` },
    { icon: Package, label: "Product", value: `${container.product} · ${container.weightKg.toLocaleString()} kg` },
    { icon: Calendar, label: "ETA / Cutoff", value: `ETA ${container.eta} · Cutoff ${container.cutoff}` },
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{container.id}</DialogTitle>
          <DialogDescription>
            {container.shipmentWeek} · {container.status}
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3 py-2.5">
              <r.icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground w-32 mt-0.5">{r.label}</div>
              <div className="flex-1 text-sm text-foreground">{r.value}</div>
            </div>
          ))}
        </div>
        {container.alert && (
          <div className="text-xs text-accent bg-accent-soft rounded-md px-3 py-2">{container.alert}</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
