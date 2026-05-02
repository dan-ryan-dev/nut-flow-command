import { Anchor, LayoutDashboard, Container, FileText, Ship, Building2, Bell, Settings, BookOpen } from "lucide-react";

const nav = [
  { icon: LayoutDashboard, label: "Command Center", active: true },
  { icon: Container, label: "Containers" },
  { icon: Ship, label: "Vessels & ETAs" },
  { icon: FileText, label: "Phyto Certificates" },
  { icon: Building2, label: "Facilities" },
  { icon: Bell, label: "Alerts" },
];

const facilities = [
  { name: "Salida", count: 14 },
  { name: "Modesto", count: 11 },
  { name: "Firebaugh", count: 9 },
  { name: "Chowchilla", count: 6 },
];

export const Sidebar = () => {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <Anchor className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-foreground">HARVEST/OPS</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Export Command</div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-border">
        <div className="px-2 py-1.5 rounded-md bg-secondary flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Org</div>
            <div className="text-sm font-semibold text-foreground">Sierra Nut Co.</div>
          </div>
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
              item.active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-secondary"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}

        <div className="pt-5 pb-1 px-2.5 text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="h-px flex-1 bg-border" />
          Facilities
        </div>
        {facilities.map((f) => (
          <button key={f.name} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm text-foreground/80 hover:bg-secondary">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {f.name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{f.count}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-1">
        <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-foreground/80 hover:bg-secondary">
          <BookOpen className="w-4 h-4" /> Compliance docs
        </button>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-secondary">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">MR</div>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-foreground">Marisol Reyes</div>
            <div className="text-[10px] text-muted-foreground">Logistics Lead · Salida</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
