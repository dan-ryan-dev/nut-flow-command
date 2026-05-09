// Hero KPI tiles for the Command Center. Pulled out so the page component
// stays focused on layout/orchestration.

interface Kpi {
  label: string;
  value: string;
  sub: string;
  tone: "default" | "action" | "good";
}

const KPIS: Kpi[] = [
  { label: "Containers this week", value: "42", sub: "vs 38 last wk", tone: "default" },
  { label: "Action required", value: "3", sub: "Phyto + cutoffs", tone: "action" },
  { label: "Logged real-time", value: "31 / 42", sub: "74% — up from 19%", tone: "good" },
  { label: "Demurrage risk", value: "$0", sub: "Simulated goal · 0 incidents · 14 days", tone: "good" },
];

export const KpiStrip = () => (
  <div className="grid grid-cols-4 gap-3">
    {KPIS.map((k) => (
      <div
        key={k.label}
        className={`rounded-lg border p-4 ${
          k.tone === "action"
            ? "border-accent/40 bg-accent-soft"
            : k.tone === "good"
            ? "border-success/30 bg-success/5"
            : "border-border bg-card"
        }`}
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
        <div className={`text-2xl font-bold mt-1 tabular-nums ${k.tone === "action" ? "text-accent" : "text-foreground"}`}>
          {k.value}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
      </div>
    ))}
  </div>
);
