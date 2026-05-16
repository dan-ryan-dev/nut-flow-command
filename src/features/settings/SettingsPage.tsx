import { useState } from "react";
import { Sidebar } from "@/shared/components/Sidebar";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Tab =
  | "Shipping Lines"
  | "Vessels"
  | "Drayage Carriers"
  | "Labs"
  | "Terminals"
  | "Products"
  | "Pack Types"
  | "Payment Terms"
  | "Ports"
  | "Buyers"
  | "Alert Rules";

const tabs: Tab[] = [
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
];

// Maps each tab to (table, name column, code column). Carriers uses `scac`,
// ports uses `unlocode`; everything else uses `code`.
const tabConfig: Record<Tab, { table: string; codeKey: "code" | "scac" | "unlocode"; orgScoped: boolean }> = {
  "Shipping Lines":   { table: "carriers",         codeKey: "scac",     orgScoped: true  },
  Vessels:            { table: "vessels",          codeKey: "code",     orgScoped: true  },
  "Drayage Carriers": { table: "drayage_carriers", codeKey: "code",     orgScoped: true  },
  Labs:               { table: "labs",             codeKey: "code",     orgScoped: true  },
  Terminals:          { table: "terminals",        codeKey: "code",     orgScoped: true  },
  Products:           { table: "products",         codeKey: "code",     orgScoped: true  },
  "Pack Types":       { table: "pack_types",       codeKey: "code",     orgScoped: true  },
  "Payment Terms":    { table: "payment_terms",    codeKey: "code",     orgScoped: true  },
  Ports:              { table: "ports",            codeKey: "unlocode", orgScoped: false },
  Buyers:             { table: "buyers",           codeKey: "code",     orgScoped: true  },
  "Alert Rules":      { table: "alert_rules",      codeKey: "code",     orgScoped: true  },
};

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";

type Row = { id: string; name: string; active: boolean } & Record<string, unknown>;

const SettingsPage = () => {
  const [tab, setTab] = useState<Tab>("Shipping Lines");
  const cfg = tabConfig[tab];
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings", cfg.table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(cfg.table as never)
        .select(`id, name, active, ${cfg.codeKey}`)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const stamp = Date.now().toString().slice(-5);
      const payload: Record<string, unknown> = {
        name: `New ${singular(tab)} ${stamp}`,
        [cfg.codeKey]: `NEW-${stamp}`,
        active: true,
      };
      if (cfg.orgScoped) payload.org_id = DEFAULT_ORG;
      const { error } = await supabase.from(cfg.table as never).insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${singular(tab)} added`);
      qc.invalidateQueries({ queryKey: ["settings", cfg.table] });
    },
    onError: (e: Error) => toast.error("Add failed", { description: e.message }),
  });

  const toggleMut = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase
        .from(cfg.table as never)
        .update({ active: !row.active } as never)
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: (_d, row) => {
      toast.success(`Toggled ${row.name}`);
      qc.invalidateQueries({ queryKey: ["settings", cfg.table] });
    },
    onError: (e: Error) => toast.error("Toggle failed", { description: e.message }),
  });

  const renameMut = useMutation({
    mutationFn: async ({ row, name }: { row: Row; name: string }) => {
      const { error } = await supabase
        .from(cfg.table as never)
        .update({ name } as never)
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", cfg.table] });
    },
    onError: (e: Error) => toast.error("Edit failed", { description: e.message }),
  });

  const rows = data ?? [];

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

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {tab}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isLoading ? "Loading…" : `${rows.length} entries`}
                </p>
              </div>
              <button
                onClick={() => addMut.mutate()}
                disabled={addMut.isPending}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-semibold text-white bg-[hsl(220_15%_10%)] hover:bg-[hsl(220_15%_18%)] transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {singular(tab)}
              </button>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-medium">Name</th>
                    <th className="text-left px-5 py-2.5 font-medium">{cfg.codeKey.toUpperCase()}</th>
                    <th className="text-left px-5 py-2.5 font-medium">Status</th>
                    <th className="text-right px-5 py-2.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!isLoading && rows.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No {tab.toLowerCase()} yet. Click Add to create the first one.
                    </td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/40">
                      <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-foreground/70">{String(r[cfg.codeKey] ?? "")}</td>
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
                            onClick={() => {
                              const next = window.prompt(`Rename ${r.name} to:`, r.name);
                              if (next && next !== r.name) renameMut.mutate({ row: r, name: next });
                            }}
                            className="p-1.5 rounded hover:bg-secondary text-foreground/60 hover:text-foreground"
                            aria-label="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleMut.mutate(r)}
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

const singular = (t: Tab) => (t.endsWith("s") ? t.slice(0, -1) : t);

export default SettingsPage;
