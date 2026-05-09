import { LogisticsStatus } from "@/shared/data/containers";
import { CircleDashed, PackageCheck, DoorOpen, Ship, Anchor, CheckCircle2 } from "lucide-react";

const META: Record<LogisticsStatus, { label: string; className: string; icon: typeof Ship }> = {
  "pending-load": {
    label: "Pending Load",
    className: "bg-secondary text-muted-foreground border border-border",
    icon: CircleDashed,
  },
  "origin-received": {
    label: "Origin Received",
    className: "bg-primary/10 text-primary border border-primary/20",
    icon: PackageCheck,
  },
  "gated-in": {
    label: "Gated-in",
    className: "bg-warning/15 text-warning-foreground border border-warning/40",
    icon: DoorOpen,
  },
  "loaded-vessel": {
    label: "On Vessel",
    className: "bg-primary text-primary-foreground border border-primary",
    icon: Ship,
  },
  "arrived-discharge": {
    label: "At POD",
    className: "bg-success/15 text-success border border-success/30",
    icon: Anchor,
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border border-border",
    icon: CheckCircle2,
  },
};

export const StatusBadge = ({ status }: { status: LogisticsStatus }) => {
  const m = META[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-semibold ${m.className}`}
      style={{
        gap: "6px",
        paddingInline: "0.425rem",
        paddingBlock: "0.085rem",
        fontSize: "9.4px",
        lineHeight: 1.2,
        minWidth: "112px",
      }}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="whitespace-nowrap">{m.label}</span>
    </span>
  );
};
