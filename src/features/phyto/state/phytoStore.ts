// Phyto draft state is now backed by the documents table. The exported
// surface (phytoStore.attach / .markPending / .isAttached / .isPending and
// the React hooks) stays identical so existing imports keep working.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

type Row = { booking_id: string; status: "attached" | "draft" | "missing" };

const phytoQueryKey = ["documents", "phyto"] as const;

// In-memory cache mirrors the query so the legacy `phytoStore.isAttached`
// (synchronous) API keeps working. The hook below keeps it warm.
let attached = new Set<string>();
let pending = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const refresh = async () => {
  const { data, error } = await supabase
    .from("documents")
    .select("booking_id, status")
    .eq("doc_type", "phyto");
  if (error) return;
  const nextAttached = new Set<string>();
  const nextPending = new Set<string>();
  (data as Row[]).forEach((r) => {
    if (r.status === "attached") nextAttached.add(r.booking_id);
    else if (r.status === "draft") nextPending.add(r.booking_id);
  });
  attached = nextAttached;
  pending = nextPending;
  emit();
};

export const phytoStore = {
  async attach(booking: string) {
    await supabase
      .from("documents")
      .upsert(
        {
          booking_id: booking,
          doc_type: "phyto",
          status: "attached",
          org_id: "00000000-0000-0000-0000-000000000001",
        },
        { onConflict: "booking_id,doc_type" } as never,
      );
    attached.add(booking);
    pending.delete(booking);
    emit();
    refresh();
  },
  async markPending(booking: string) {
    await supabase
      .from("documents")
      .upsert(
        {
          booking_id: booking,
          doc_type: "phyto",
          status: "draft",
          org_id: "00000000-0000-0000-0000-000000000001",
        },
        { onConflict: "booking_id,doc_type" } as never,
      );
    pending.add(booking);
    emit();
    refresh();
  },
  isAttached: (booking: string) => attached.has(booking),
  isPending: (booking: string) => pending.has(booking),
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  snapshot: () => attached,
};

// Kicks off an initial fetch on import so synchronous reads work.
void refresh();

// Hooks --------------------------------------------------------------------
const usePhytoSync = () => {
  const qc = useQueryClient();
  useQuery({
    queryKey: phytoQueryKey,
    queryFn: async () => {
      await refresh();
      return true;
    },
  });
  void qc;
};

export const usePhytoAttached = (booking: string) => {
  usePhytoSync();
  return useSyncExternalStore(
    (l) => phytoStore.subscribe(l),
    () => phytoStore.isAttached(booking),
    () => false,
  );
};

export const usePhytoPending = (booking: string) => {
  usePhytoSync();
  return useSyncExternalStore(
    (l) => phytoStore.subscribe(l),
    () => phytoStore.isPending(booking),
    () => false,
  );
};
