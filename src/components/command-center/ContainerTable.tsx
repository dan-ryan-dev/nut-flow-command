import { useState } from "react";
import { containers, type Container } from "@/data/containers";
import { AlertTriangle, CheckCircle2, Ship, Anchor, FileText, MoreHorizontal } from "lucide-react";
import { PhytoSheet } from "./PhytoSheet";

const statusBadge = (s: Container["status"]) => {
  switch (s) {
    case "action":
      return { label: "Action required", className: "bg-accent text-accent-foreground", icon: AlertTriangle };
    case "in-transit":
      return { label: "In transit", className: "bg-primary/10 text-primary", icon: Ship };
    case "at-port":
      return { label: "At POD", className: "bg-warning/15 text-warning-foreground border border-warning/40", icon: Anchor };
    case "delivered":
      return { label: "Delivered", className: "bg-success/15 text-success border border-success/30", icon: CheckCircle2 };
    default:
      return { label: "Draft", className: "bg-secondary text-muted-foreground", icon: FileText };
  }
};

export const ContainerTable = () => {
  const [phytoFor, setPhytoFor] = useState<Container | null>(null);
  return (
    <section className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">This week's containers</div>
          <div className="text-sm font-semibold text-foreground">42 active · 3 need attention</div>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {["All", "Action", "In transit", "At POD", "Delivered"].map((t, i) => (
            <button
              key={t}
              className={`px-2.5 py-1 rounded-md ${i === 0 ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/50">
            <th className="text-left font-medium px-5 py-2">Container</th>
            <th className="text-left font-medium px-3 py-2">Vessel / Voyage</th>
            <th className="text-left font-medium px-3 py-2">Route</th>
            <th className="text-left font-medium px-3 py-2">Buyer</th>
            <th className="text-left font-medium px-3 py-2">Cutoff</th>
            <th className="text-left font-medium px-3 py-2">Phyto</th>
            <th className="text-left font-medium px-3 py-2">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {containers.map((c) => {
            const b = statusBadge(c.status);
            return (
              <tr key={c.id} className={`hover:bg-secondary/40 ${c.status === "action" ? "bg-accent-soft/40" : ""}`}>
                <td className="px-5 py-3">
                  <div className="font-mono text-[13px] text-foreground">{c.id}</div>
                  <div className="text-[11px] text-muted-foreground">{c.booking} · {c.facility}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-foreground">{c.vessel}</div>
                  <div className="text-[11px] text-muted-foreground">Voy {c.voyage}</div>
                </td>
                <td className="px-3 py-3 text-foreground/90">
                  <div>{c.pol} <span className="text-muted-foreground">→</span> {c.destination}</div>
                  <div className="text-[11px] text-muted-foreground">ETA {c.eta}</div>
                </td>
                <td className="px-3 py-3 text-foreground/90">
                  {c.buyer}
                  <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{c.product}</div>
                </td>
                <td className="px-3 py-3 tabular-nums text-foreground/90">{c.cutoff}</td>
                <td className="px-3 py-3">
                  {c.phytoComplete ? (
                    <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                    </span>
                  ) : (
                    <button
                      onClick={() => setPhytoFor(c)}
                      className="inline-flex items-center gap-1 text-accent text-xs font-semibold underline-offset-2 hover:underline"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Missing 4
                    </button>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${b.className}`}>
                    <b.icon className="w-3 h-3" /> {b.label}
                  </span>
                  {c.alert && <div className="text-[11px] text-accent mt-1">{c.alert}</div>}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <PhytoSheet container={phytoFor} open={!!phytoFor} onClose={() => setPhytoFor(null)} />
    </section>
  );
};
