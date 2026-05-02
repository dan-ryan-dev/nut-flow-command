import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles, Ship, FileText, Container as ContainerIcon, ArrowRight, CornerDownLeft } from "lucide-react";
import { containers } from "@/data/containers";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreateBooking: () => void;
}

const suggestions = [
  { icon: Sparkles, label: "Show every container at risk of missing this Friday's cutoff", kind: "AI Query" },
  { icon: Sparkles, label: "Which Hamburg shipments are missing Phyto fields?", kind: "AI Query" },
  { icon: Ship, label: "Port of Oakland — live berth & congestion", kind: "Live data" },
  { icon: FileText, label: "Generate USDA Phyto draft for BK-99182", kind: "Action" },
];

export const CommandBar = ({ open, onClose, onCreateBooking }: Props) => {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQ("");
  }, [open]);

  const matches = useMemo(() => {
    if (!q) return [];
    const term = q.toLowerCase();
    return containers
      .filter(
        (c) =>
          c.id.toLowerCase().includes(term) ||
          c.booking.toLowerCase().includes(term) ||
          c.vessel.toLowerCase().includes(term) ||
          c.buyer.toLowerCase().includes(term) ||
          c.destination.toLowerCase().includes(term),
      )
      .slice(0, 5);
  }, [q]);

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
                  onClick={() => setQ(s.label)}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-md hover:bg-secondary text-left"
                >
                  <s.icon className="w-4 h-4 text-accent" />
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
                    <div className="text-xs text-muted-foreground">Drop a carrier confirmation — auto-fill 14 fields in ~8 sec</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent" />
                </button>
              </div>
            </div>
          )}

          {q && matches.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Containers</div>
              {matches.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-secondary cursor-pointer">
                  <ContainerIcon className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-foreground">{c.id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.vessel} · {c.destination} · {c.buyer}
                    </div>
                  </div>
                  <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          {q && (
            <div className="border-t border-border p-3 bg-secondary/40">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-accent mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">AI answer</div>
                  <div className="text-sm text-foreground leading-relaxed">
                    {isCreate ? (
                      <>Press Enter to start a new booking — or drop the carrier PDF to auto-fill.</>
                    ) : matches.length ? (
                      <>Found <span className="font-semibold">{matches.length}</span> containers matching "{q}". 2 are flagged for missing Phyto fields.</>
                    ) : (
                      <>No containers match. I can search the legacy SQL system or create a new booking from a PDF.</>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground">Querying legacy SQL · live</div>
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
          <span>Powered by Nomos AI · grounded in Nomos DB + Port of Oakland feed</span>
        </div>
      </div>
    </div>
  );
};
