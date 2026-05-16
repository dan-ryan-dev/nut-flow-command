import { Sparkles, AlertTriangle, Ship, Database, TrendingUp, ChevronRight, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QueryErrorCard, SkeletonRows } from "@/shared/components/QueryStates";
import { useAllContainersQuery } from "@/shared/hooks/useContainers";
import type { Container } from "@/shared/data/types";

type Tone = "action" | "warn" | "info" | "good";
type Card = { icon: string; tone: Tone; title: string; body: string; cta: string };

const iconMap: Record<string, typeof AlertTriangle> = {
  AlertTriangle,
  Ship,
  Database,
  TrendingUp,
};

const toneStyles: Record<Tone, string> = {
  action: "border-l-accent bg-accent-soft",
  warn: "border-l-warning bg-warning/5",
  info: "border-l-primary/40 bg-secondary/60",
  good: "border-l-success bg-success/5",
};

const iconStyles: Record<Tone, string> = {
  action: "text-accent",
  warn: "text-warning",
  info: "text-primary",
  good: "text-success",
};

const buildCards = (containers: Container[], alerts: AlertRow[]): Card[] => {
  const cards: Card[] = [];
  const now = Date.now();

  // 1. Cutoffs in next 48h
  const soonCutoff = containers.filter((c) => {
    const t = new Date(c.cutoff).getTime();
    return !isNaN(t) && t - now > 0 && t - now < 48 * 3600 * 1000;
  });
  if (soonCutoff.length) {
    cards.push({
      icon: "Ship",
      tone: "warn",
      title: `${soonCutoff.length} container${soonCutoff.length === 1 ? "" : "s"} with port cutoff in next 48h`,
      body: soonCutoff
        .slice(0, 3)
        .map((c) => `${c.id} · ${c.vessel}`)
        .join("  ·  "),
      cta: "Review",
    });
  }

  // 2. Missing phyto at POD / in transit
  const missingPhyto = containers.filter((c) => !c.phytoComplete && c.status !== "draft" && c.status !== "delivered");
  if (missingPhyto.length) {
    cards.push({
      icon: "AlertTriangle",
      tone: "action",
      title: `${missingPhyto.length} shipment${missingPhyto.length === 1 ? "" : "s"} missing phytosanitary certificates`,
      body: missingPhyto
        .slice(0, 3)
        .map((c) => `${c.id} → ${c.destination}`)
        .join("  ·  "),
      cta: "Attach phyto",
    });
  }

  // 3. Delayed ETAs
  const delayed = containers.filter((c) => c.etaDelayed);
  if (delayed.length) {
    cards.push({
      icon: "TrendingUp",
      tone: "warn",
      title: `${delayed.length} container${delayed.length === 1 ? "" : "s"} with delayed ETA`,
      body: delayed
        .slice(0, 3)
        .map((c) => `${c.id} · ${c.buyer}`)
        .join("  ·  "),
      cta: "Investigate",
    });
  }

  // 4. Open alerts
  const openAlerts = alerts.filter((a) => !a.acknowledged);
  if (openAlerts.length) {
    cards.push({
      icon: "AlertTriangle",
      tone: openAlerts.some((a) => a.tone === "danger") ? "action" : "warn",
      title: `${openAlerts.length} unacknowledged alert${openAlerts.length === 1 ? "" : "s"}`,
      body: openAlerts.slice(0, 3).map((a) => a.status_text).join("  ·  "),
      cta: "View alerts",
    });
  }

  // 5. All-clear baseline
  if (cards.length === 0) {
    cards.push({
      icon: "Database",
      tone: "good",
      title: `All ${containers.length} containers on track`,
      body: "No cutoffs in the next 48 hours, no missing phytos, no delayed ETAs.",
      cta: "Open ledger",
    });
  }

  return cards;
};

type AlertRow = {
  id: string;
  status_text: string;
  tone: "danger" | "warning" | "info";
  acknowledged: boolean;
  container_ref: string | null;
  booking_ref: string | null;
};

export const DailyIntel = () => {
  const containersQ = useAllContainersQuery();
  const alertsQ = useQuery({
    queryKey: ["alerts", "daily-intel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, status_text, tone, acknowledged, container_ref, booking_ref")
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AlertRow[];
    },
  });

  const isLoading = containersQ.isLoading || alertsQ.isLoading;
  const error = containersQ.error ?? alertsQ.error;
  const isError = containersQ.isError || alertsQ.isError;

  const cards: Card[] = !isLoading && !isError
    ? buildCards(containersQ.data ?? [], alertsQ.data ?? [])
    : [];

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between" style={{ backgroundImage: "var(--gradient-navy)" }}>
        <div className="flex items-center gap-2 text-primary-foreground">
          <Sparkles className="w-4 h-4 text-accent" />
          <div>
            <div className="text-sm font-semibold">Daily Intel · {dateLabel}</div>
            <div className="text-[11px] text-primary-foreground/60">Verified against Nomos DB + Live Port Feeds</div>
          </div>
        </div>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary-foreground/80 hover:text-primary-foreground border border-primary-foreground/15 rounded-full px-2.5 py-1">
                <ShieldCheck className="w-3 h-3 text-success" />
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live · grounded
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              Every insight is grounded in canonical booking records — no spreadsheets, no whiteboards.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={4} rowClassName="h-14" /></div>
        ) : isError ? (
          <QueryErrorCard error={error} onRetry={() => { containersQ.refetch(); alertsQ.refetch(); }} title="Couldn't load briefing" />
        ) : cards.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No briefing yet for today.
          </div>
        ) : cards.map((b) => {
          const Icon = iconMap[b.icon] ?? Database;
          return (
            <div key={b.title} className={`flex gap-4 px-5 py-3.5 border-l-4 ${toneStyles[b.tone]}`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconStyles[b.tone]}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{b.title}</div>
                <div className="text-xs font-light text-muted-foreground mt-0.5 leading-relaxed">{b.body}</div>
              </div>
              <button className="self-start text-xs font-semibold text-primary hover:text-accent flex items-center gap-0.5 shrink-0">
                {b.cta} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
