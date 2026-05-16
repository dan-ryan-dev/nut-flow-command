// Hero KPI tiles for the Command Center — derived live from `containers`
// + the latest row in `kpi_snapshots`.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Kpi {
  label: string;
  value: string;
  sub: string;
  tone: "default" | "action" | "good";
}

const useKpis = (): Kpi[] => {
  const containersQ = useQuery({
    queryKey: ["containers", "kpi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("containers")
        .select("status, shipment_week, logistics_status");
      if (error) throw error;
      return data ?? [];
    },
  });

  const snapshotQ = useQuery({
    queryKey: ["kpi_snapshots", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kpi_snapshots")
        .select("*")
        .order("taken_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const rows = containersQ.data ?? [];
  const week = snapshotQ.data?.shipment_week ?? rows[0]?.shipment_week ?? "this week";
  const thisWeek = rows.filter((r) => r.shipment_week === week);
  const actionCount = rows.filter((r) => r.status === "action").length;
  const loggedRealtime = snapshotQ.data?.logged_realtime ?? thisWeek.length;
  const demurrage = Number(snapshotQ.data?.demurrage_usd ?? 0);

  return [
    {
      label: "Containers this week",
      value: String(thisWeek.length),
      sub: `${week}`,
      tone: "default",
    },
    {
      label: "Action required",
      value: String(actionCount),
      sub: "Phyto + cutoffs",
      tone: "action",
    },
    {
      label: "Logged real-time",
      value: `${loggedRealtime} / ${thisWeek.length || rows.length}`,
      sub: "Carrier feed sync",
      tone: "good",
    },
    {
      label: "Demurrage risk",
      value: `$${demurrage.toLocaleString()}`,
      sub: "14-day rollup",
      tone: "good",
    },
  ];
};

export const KpiStrip = () => {
  const kpis = useKpis();
  return (
    <div className="grid grid-cols-4 gap-3">
      {kpis.map((k) => (
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
};
