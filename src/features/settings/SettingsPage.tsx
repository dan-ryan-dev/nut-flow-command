import { useState } from "react";
import { Sidebar } from "@/components/command-center/Sidebar";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";

const tabs = [
  "Shipping Lines",
  "Vessels",
  "Drayage Carriers",
  "Labs",
  "Terminals",
  "Products",
  "Pack Types",
  "Payment Terms",
  "Ports",
  "Buyers",
  "Alert Rules",
] as const;

type Tab = (typeof tabs)[number];

const data: Record<Tab, { name: string; code: string; active: boolean }[]> = {
  "Shipping Lines": [
    { name: "CMA CGM", code: "CMDU", active: true },
    { name: "Hapag Lloyd", code: "HLCU", active: true },
    { name: "MSC", code: "MSCU", active: true },
    { name: "Maersk", code: "MAEU", active: true },
    { name: "ONE", code: "ONEY", active: true },
    { name: "Evergreen", code: "EGLV", active: false },
  ],
  Vessels: [
    { name: "MSC LORETO", code: "Voy 447W", active: true },
    { name: "EVER GIVEN", code: "Voy 220E", active: true },
    { name: "CMA CGM MARCO POLO", code: "Voy 118N", active: true },
  ],
  "Drayage Carriers": [
    { name: "Central Valley Drayage", code: "CVDR", active: true },
    { name: "Pacific Inland", code: "PINL", active: true },
  ],
  Labs: [
    { name: "USDA Modesto", code: "USDA-MOD", active: true },
    { name: "Salida Phyto Lab", code: "SAL-PHY", active: true },
  ],
  Terminals: [
    { name: "Oakland Berth 57", code: "OAK-B57", active: true },
    { name: "Oakland Berth 58", code: "OAK-B58", active: true },
  ],
  Products: [
    { name: "Nonpareil Almonds 23/25", code: "ALM-2325", active: true },
    { name: "Walnuts Chandler", code: "WAL-CHA", active: true },
  ],
  "Pack Types": [
    { name: "VP Cartons 50lb", code: "VP-50", active: true },
    { name: "Bulk Totes 1000lb", code: "BT-1000", active: true },
  ],
  "Payment Terms": [
    { name: "Net 30", code: "N30", active: true },
    { name: "CAD", code: "CAD", active: true },
    { name: "Letter of Credit", code: "LOC", active: false },
  ],
  Ports: [
    { name: "Port of Oakland", code: "USOAK", active: true },
    { name: "Hamburg", code: "DEHAM", active: true },
    { name: "Shanghai", code: "CNSHA", active: true },
  ],
  Buyers: [
    { name: "Nordmann GmbH", code: "NORD-DE", active: true },
    { name: "Shanghai Foods Co", code: "SHF-CN", active: true },
  ],
  "Alert Rules": [
    { name: "Phyto missing < 48h cutoff", code: "RULE-01", active: true },
    { name: "Demurrage risk > 7 days", code: "RULE-02", active: true },
  ],
};

const SettingsPage = () => {
  const [tab, setTab] = useState<Tab>("Shipping Lines");
  const rows = data[tab];
  const singular = tab.endsWith("s") ? tab.slice(0, -1) : tab;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card px-6 flex items-center gap-4">
          <div>
            <h1 className="font-semibold text-base text-foreground leading-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Settings
            </h1>
            <div className="text-[11px] text-muted-foreground mt-0.5">Manage reference data used across Nomos</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
            {/* Tab bar */}
            <div className="border-b border-border">
              <div className="flex flex-wrap gap-1">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                      tab === t
                        ? "border-accent text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Action header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {tab}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{rows.length} entries</p>
              </div>
              <button
                onClick={() => toast.info(`Add ${singular} flow`)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-semibold text-white bg-[hsl(220_15%_10%)] hover:bg-[hsl(220_15%_18%)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {singular}
              </button>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-medium">Name</th>
                    <th className="text-left px-5 py-2.5 font-medium">SCAC / Code</th>
                    <th className="text-left px-5 py-2.5 font-medium">Status</th>
                    <th className="text-right px-5 py-2.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.code} className="hover:bg-secondary/40">
                      <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-foreground/70">{r.code}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            r.active
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${r.active ? "bg-success" : "bg-muted-foreground"}`} />
                          {r.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toast.info(`Edit ${r.name}`)}
                            className="p-1.5 rounded hover:bg-secondary text-foreground/60 hover:text-foreground"
                            aria-label="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toast.info(`Toggled ${r.name}`)}
                            className="p-1.5 rounded hover:bg-secondary text-foreground/60 hover:text-foreground"
                            aria-label="Toggle"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;