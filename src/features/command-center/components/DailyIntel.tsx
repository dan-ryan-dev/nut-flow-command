import { Sparkles, AlertTriangle, Ship, Database, TrendingUp, ChevronRight, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export const DailyIntel = () => {
  const { data } = useQuery({
    queryKey: ["daily_briefings", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_briefings")
        .select("*")
        .order("briefing_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const cards: Card[] = Array.isArray(data?.cards) ? (data!.cards as unknown as Card[]) : [];
  const dateLabel = data?.briefing_date
    ? new Date(data.briefing_date as string).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "Today";

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
        {cards.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No briefing yet for today.
          </div>
        )}
        {cards.map((b) => {
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
