import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles, ShieldCheck, Loader2, Container as ContainerIcon, ArrowRight, CornerDownLeft, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllContainers } from "@/shared/hooks/useContainers";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreateBooking: () => void;
}

// Suggestion prompts only — no canned answers; AI integration lands in a later prompt.
const SUGGESTIONS = [
  { label: "Which containers are At POD but missing Phyto certificates?", kind: "AI Query" },
  { label: "Show me all shipments for Nordmann GmbH in Week 19.", kind: "AI Query" },
  { label: "Which vessels have a port cutoff in the next 48 hours?", kind: "AI Query" },
  { label: "Find all containers associated with Lot ID 447W.", kind: "AI Query" },
  { label: "Show me the total weight of almonds currently On Vessel.", kind: "AI Query" },
];

const pickThree = () => {
  const arr = [...SUGGESTIONS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3);
};

export const CommandBar = ({ open, onClose, onCreateBooking }: Props) => {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState(() => pickThree());
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containers = useAllContainers();
  const alertsQ = useQuery({
    queryKey: ["alerts", "command-bar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, code, tag, status_text, container_ref, booking_ref, tone, acknowledged, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const alerts = alertsQ.data ?? [];

  useEffect(() => {
    if (open) {
      setSuggestions(pickThree());
      setProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQ("");
      setProcessing(false);
    }
  }, [open]);

  const runSuggestion = (label: string) => {
    setQ(label);
    setProcessing(true);
    setTimeout(() => setProcessing(false), 1200);
  };

  const matches = useMemo(() => {
    if (!q) return [];
    const term = q.toLowerCase();
    return containers
      .filter(
        (c) =>
          c.id.toLowerCase().includes(term) ||
          c.booking.toLowerCase().includes(term) ||
          (c.purchaseOrder ?? "").toLowerCase().includes(term) ||
          c.vessel.toLowerCase().includes(term) ||
          c.buyer.toLowerCase().includes(term) ||
          c.destination.toLowerCase().includes(term) ||
          c.facility.toLowerCase().includes(term),
      )
      .slice(0, 5);
  }, [q, containers]);

  const alertMatches = useMemo(() => {
    if (!q) return [];
    const term = q.toLowerCase();
    return alerts
      .filter(
        (a) =>
          (a.status_text ?? "").toLowerCase().includes(term) ||
          (a.container_ref ?? "").toLowerCase().includes(term) ||
          (a.booking_ref ?? "").toLowerCase().includes(term) ||
          (a.tag ?? "").toLowerCase().includes(term) ||
          (a.code ?? "").toLowerCase().includes(term),
      )
      .slice(0, 4);
  }, [q, alerts]);

  if (!open) return null;

  const isCreate = q.toLowerCase().startsWith("new") || q.toLowerCase().includes("booking");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-card rounded-lg shadow-elevated border border-border overflow-hidden"
        style={{ boxShadow: "var(--shadow-elevated)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search container, ask "what ships need a phyto?", or type "new booking"'
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">ESC</kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {!q && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Try asking</div>
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => runSuggestion(s.label)}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-md hover:bg-secondary text-left"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="flex-1 text-sm text-foreground">{s.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.kind}</span>
                </button>
              ))}
              <div className="border-t border-border mt-2 pt-2">
                <button
                  onClick={onCreateBooking}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-md hover:bg-accent-soft text-left group"
                >
                  <div className="w-7 h-7 rounded-md bg-accent text-accent-foreground flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">New booking from PDF</div>
                    <div className="text-xs text-muted-foreground">Drop a carrier confirmation — auto-fill in seconds</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent" />
                </button>
              </div>
              <div className="border-t border-border mt-2 pt-2 px-2.5 pb-1 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30 text-[10px] font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Grounded in Nomos DB
                </span>
              </div>
            </div>
          )}

          {q && processing && (
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
              <div className="text-sm text-foreground font-medium">Processing…</div>
              <div className="text-[11px] text-muted-foreground">Querying Nomos DB · scanning {containers.length} containers</div>
            </div>
          )}

          {q && !processing && matches.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Containers</div>
              {matches.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-secondary cursor-pointer">
                  <ContainerIcon className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-foreground">{c.id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.vessel} · {c.destination} · {c.buyer} · {c.facility}
                    </div>
                  </div>
                  <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          {q && !processing && alertMatches.length > 0 && (
            <div className="p-2 border-t border-border">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Alerts</div>
              {alertMatches.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-secondary cursor-pointer">
                  <AlertTriangle className={`w-4 h-4 ${a.tone === "danger" ? "text-destructive" : a.tone === "warning" ? "text-warning" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{a.status_text}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[a.container_ref, a.booking_ref, a.tag].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {q && !processing && (
            <div className="border-t border-border p-3 bg-secondary/40">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-accent mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">AI answer</div>
                  <div className="text-sm text-foreground leading-relaxed">
                    {isCreate ? (
                      <>Press Enter to start a new booking — or drop the carrier PDF to auto-fill.</>
                    ) : matches.length || alertMatches.length ? (
                      <>
                        Found <span className="font-semibold">{matches.length}</span> container{matches.length === 1 ? "" : "s"}
                        {alertMatches.length > 0 && <> and <span className="font-semibold">{alertMatches.length}</span> alert{alertMatches.length === 1 ? "" : "s"}</>}
                        {" "}matching "{q}".
                      </>
                    ) : (
                      <>
                        No matches in the live ledger.{" "}
                        <button onClick={onCreateBooking} className="font-semibold text-accent underline underline-offset-2 hover:text-accent">
                          Start a new booking
                        </button>{" "}
                        instead.
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30 text-[10px] font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Grounded in Nomos DB
                </span>
                <button onClick={onCreateBooking} className="text-xs font-semibold text-accent hover:underline">
                  Drop PDF instead →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/40 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-card border border-border">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-card border border-border">↵</kbd> open</span>
          </div>
          <span>Powered by Nomos AI · grounded in Nomos DB</span>
        </div>
      </div>
    </div>
  );
};
