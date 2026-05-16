import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, Plus, Anchor, Bell, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/shared/components/Sidebar";
import { CommandBar } from "@/features/command-center/components/CommandBar";
import { PdfBookingFlow } from "@/features/command-center/components/PdfBookingFlow";
import { DailyIntel } from "@/features/command-center/components/DailyIntel";
import { ContainerTable } from "@/features/command-center/components/ContainerTable";
import { KpiStrip } from "@/features/command-center/components/KpiStrip";
import { useAllContainers } from "@/shared/hooks/useContainers";
import { useAuth } from "@/shared/auth/AuthProvider";
import { ContainerDetailDialog } from "@/features/containers/components/ContainerDetailDialog";
import type { Container } from "@/shared/data/types";

const SEARCH_PILLS = [
  "What is the ETA for MSC LORETO?",
  "Show missing phytos for Week 19",
  "Any delayed containers at Oakland?",
];

const CommandCenterPage = () => {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [cmdInitialQuery, setCmdInitialQuery] = useState<string | undefined>(undefined);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const containers = useAllContainers();
  const { role, user } = useAuth();
  const canWrite = role === "coordinator" || role === "admin";
  const isAuthed = !!user;
  const activeCount = containers.length;
  const facilityCount = new Set(containers.map((c) => c.facility)).size;
  const currentWeek = containers[0]?.shipmentWeek ?? "—";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openPdf = () => {
    setCmdOpen(false);
    setPdfOpen(true);
  };

  const openCmd = (query?: string) => {
    setCmdInitialQuery(query);
    setCmdOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {!isAuthed && (
          <div className="border-b border-border bg-secondary/60 px-6 py-2 flex items-center gap-3 text-xs">
            <LogIn className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              You're viewing Nomos in read-only preview mode. Sign in to load your shipments and save changes.
            </span>
            <Link
              to="/auth"
              className="ml-auto px-3 py-1 rounded-md bg-primary text-primary-foreground font-semibold"
            >
              Sign in
            </Link>
          </div>
        )}
        {/* Top bar */}
        <header className="border-b border-border bg-card px-6 py-3 flex items-center gap-4">
          <div className="min-w-0 shrink-0">
            <h1 className="text-base font-semibold text-foreground leading-none">Command Center</h1>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {activeCount} active · {facilityCount} facilities · {currentWeek}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2 max-w-3xl mx-auto">
            <button
              onClick={() => openCmd()}
              className="w-full max-w-2xl flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-secondary/60 hover:bg-secondary text-left transition-colors shadow-sm"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1 truncate">
                Search containers, ask Daily Intel anything (e.g., "Show ERD for booking BK-99182")...
              </span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">⌘K</kbd>
            </button>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {SEARCH_PILLS.map((p) => (
                <button
                  key={p}
                  onClick={() => openCmd(p)}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-accent" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="relative p-2 rounded-md hover:bg-secondary text-foreground/70">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
            </button>
            {canWrite && (
              <button
                onClick={() => setPdfOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-accent-foreground"
                style={{ backgroundImage: "var(--gradient-action)", boxShadow: "var(--shadow-card)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                New booking
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
            <KpiStrip />
            <DailyIntel />
            <ContainerTable />

            <div className="text-center text-[11px] text-muted-foreground py-2">
              Layered on Nomos DB · Capay Canyon Ranch · Synced 12 sec ago
            </div>
          </div>
        </div>
      </main>

      <CommandBar
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onCreateBooking={openPdf}
        onSelectContainer={(c) => setSelectedContainer(c)}
        initialQuery={cmdInitialQuery}
      />
      <ContainerDetailDialog
        container={selectedContainer}
        open={!!selectedContainer}
        onClose={() => setSelectedContainer(null)}
      />
      <PdfBookingFlow
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        onComplete={() => toast.success("Booking BK-99221 logged in 9 seconds", { description: "Saved 11 min vs manual entry" })}
      />

      {/* Hint pill */}
      {!cmdOpen && !pdfOpen && canWrite && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs shadow-elevated" style={{ boxShadow: "var(--shadow-elevated)" }}>
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Try <kbd className="px-1.5 py-0.5 bg-primary-glow rounded text-[10px]">⌘K</kbd> or drop a PDF on
          <button onClick={() => setPdfOpen(true)} className="font-semibold underline underline-offset-2">New booking</button>
        </div>
      )}
    </div>
  );
};

export default CommandCenterPage;
