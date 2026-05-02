import { Sparkles, AlertTriangle, Ship, FileWarning, TrendingUp, ChevronRight } from "lucide-react";

const briefings = [
  {
    icon: AlertTriangle,
    tone: "action" as const,
    title: "3 containers will miss Friday's MSC LORETO cutoff",
    body: "BK-99182, BK-99204, BK-99211 are missing USDA Phyto fields. Cutoff in 38h. I drafted the certs — 2 clicks to submit.",
    cta: "Review 3 phytos",
  },
  {
    icon: Ship,
    tone: "warn" as const,
    title: "Port of Oakland berth 57 congestion +2 days",
    body: "Live AIS feed shows EVER GIVEN delayed at anchorage. 4 of your bookings affected. Buyers in Shanghai not yet notified.",
    cta: "Notify buyers",
  },
  {
    icon: FileWarning,
    tone: "info" as const,
    title: "Excel sync: 12 rows in salida_shipping_w19.xlsx differ from SQL",
    body: "Most diffs are stale ETAs in Excel. I can reconcile — your version stays canonical.",
    cta: "Open diff",
  },
  {
    icon: TrendingUp,
    tone: "good" as const,
    title: "Modesto ahead of plan — 14 containers cleared this week",
    body: "0 demurrage incidents. Phyto-on-first-try rate at 96% (org avg 35%).",
    cta: "See breakdown",
  },
];

const toneStyles = {
  action: "border-l-accent bg-accent-soft",
  warn: "border-l-warning bg-warning/5",
  info: "border-l-primary/40 bg-secondary/60",
  good: "border-l-success bg-success/5",
} as const;

const iconStyles = {
  action: "text-accent",
  warn: "text-warning",
  info: "text-primary",
  good: "text-success",
} as const;

export const DailyIntel = () => {
  return (
    <section className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between" style={{ backgroundImage: "var(--gradient-navy)" }}>
        <div className="flex items-center gap-2 text-primary-foreground">
          <Sparkles className="w-4 h-4 text-accent" />
          <div>
            <div className="text-sm font-semibold">Daily Intel · Monday, May 4</div>
            <div className="text-[11px] text-primary-foreground/60">Briefing prepared at 06:00 PT · 4 items need you</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary-foreground/70">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live · grounded
        </div>
      </div>
      <div className="divide-y divide-border">
        {briefings.map((b) => (
          <div key={b.title} className={`flex gap-4 px-5 py-3.5 border-l-4 ${toneStyles[b.tone]}`}>
            <b.icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconStyles[b.tone]}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{b.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.body}</div>
            </div>
            <button className="self-start text-xs font-semibold text-primary hover:text-accent flex items-center gap-0.5 shrink-0">
              {b.cta} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
