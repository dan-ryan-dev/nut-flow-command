import { useEffect, useState } from "react";
import { Search, Sparkles, Plus, Anchor, Bell } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/shared/components/Sidebar";
import { CommandBar } from "@/features/command-center/components/CommandBar";
import { PdfBookingFlow } from "@/features/command-center/components/PdfBookingFlow";
import { DailyIntel } from "@/features/command-center/components/DailyIntel";
import { ContainerTable } from "@/features/command-center/components/ContainerTable";
import { KpiStrip } from "@/features/command-center/components/KpiStrip";
import { useAllContainers } from "@/shared/hooks/useContainers";

const CommandCenterPage = () => {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const containers = useAllContainers();
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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card px-6 flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold text-foreground leading-none">Command Center</h1>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {activeCount} active containers · {facilityCount} facilities · {currentWeek}
            </div>
          </div>

          <button
            onClick={() => setCmdOpen(true)}
            className="ml-auto flex items-center gap-2 w-[420px] px-3 py-1.5 rounded-md border border-border bg-secondary/60 hover:bg-secondary text-left transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground flex-1">
              Search containers, ask Daily Intel anything…
            </span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">⌘K</kbd>
          </button>

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

      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} onCreateBooking={openPdf} />
      <PdfBookingFlow
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        onComplete={() => toast.success("Booking BK-99221 logged in 9 seconds", { description: "Saved 11 min vs manual entry" })}
      />

      {/* Hint pill */}
      {!cmdOpen && !pdfOpen && (
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
