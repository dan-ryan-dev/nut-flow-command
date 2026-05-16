import { useState } from "react";
import { Sidebar } from "@/shared/components/Sidebar";
import { AlertTriangle, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/auth/AuthProvider";
import {
  QueryErrorCard,
  EmptyState,
  SkeletonRows,
  InlineErrorBanner,
} from "@/shared/components/QueryStates";

type AlertRow = {
  id: string;
  tag: string;
  tone: "danger" | "warning" | "info";
  container_ref: string | null;
  booking_ref: string | null;
  status_text: string;
  occurred_at: string;
  acknowledged: boolean;
  code: string;
};

const toneStyles: Record<AlertRow["tone"], string> = {
  danger: "bg-accent-soft text-accent border-accent/30",
  warning: "bg-warning/10 text-warning-foreground border-warning/40",
  info: "bg-secondary text-foreground/70 border-border",
};

const fmtTimestamp = (iso: string) =>
  new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";

const useAlerts = (acknowledged: boolean) =>
  useQuery({
    queryKey: ["alerts", acknowledged],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("acknowledged", acknowledged)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AlertRow[];
    },
  });

const AlertsPage = () => {
  const [tab, setTab] = useState<"active" | "history">("active");
  const activeQ = useAlerts(false);
  const historyQ = useAlerts(true);
  const qc = useQueryClient();
  const { role } = useAuth();
  const canAck = role === "coordinator" || role === "admin";
  const [ackError, setAckError] = useState<string | null>(null);

  const ack = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ acknowledged: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      setAckError(null);
      const item = activeQ.data?.find((a) => a.id === id);
      toast.success(`${item?.container_ref ?? item?.booking_ref ?? "Alert"} acknowledged`);
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e: Error) => {
      setAckError(e.message);
      toast.error("Could not acknowledge", { description: e.message });
    },
  });

  const currentQ = tab === "active" ? activeQ : historyQ;
  const rows = currentQ.data ?? [];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card px-6 flex items-center gap-4">
          <div>
            <h1 className="font-serif text-lg font-semibold text-foreground leading-none tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Alert Queue
            </h1>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {activeQ.data?.length ?? 0} active · {historyQ.data?.length ?? 0} resolved
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Alerts
              </h2>
              <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-card">
                {(["active", "history"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1 text-xs rounded capitalize transition-colors ${
                      tab === t ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <InlineErrorBanner message={ackError} />
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {currentQ.isLoading ? (
                <div className="p-4"><SkeletonRows rows={4} rowClassName="h-12" /></div>
              ) : currentQ.isError ? (
                <QueryErrorCard error={currentQ.error} onRetry={() => currentQ.refetch()} title="Couldn't load alerts" />
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="w-5 h-5 text-success" />}
                  title={tab === "active" ? "All clear" : "No resolved alerts yet"}
                  description={tab === "active" ? "No active alerts. Nothing to worry about." : undefined}
                />
              ) : rows.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${a.tone === "danger" ? "text-accent" : a.tone === "warning" ? "text-warning" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${toneStyles[a.tone]}`}>
                    {a.tag}
                  </span>
                  <div className="font-mono text-sm text-foreground tabular-nums w-56 truncate">
                    {a.container_ref ?? a.booking_ref ?? a.code}
                  </div>
                  <div className="text-sm text-foreground/70 flex-1 truncate">{a.status_text}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">{fmtTimestamp(a.occurred_at)}</div>
                  {tab === "active" ? (
                    canAck ? (
                    <button
                      onClick={() => ack.mutate(a.id)}
                      disabled={ack.isPending}
                      className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-glow transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> Acknowledge
                    </button>
                    ) : null
                  ) : (
                    <span className="ml-2 text-[11px] uppercase tracking-wider text-success font-semibold">Resolved</span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center text-[11px] text-muted-foreground py-2">
              Phyto-readiness logic synced with Command Center · Nomos DB
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AlertsPage;
