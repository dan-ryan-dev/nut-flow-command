// Selector hooks over the canonical ledger. Display components import these
// instead of `containers` directly so the data source can later be swapped
// for an API/Cloud query without touching the UI.

import { useMemo } from "react";
import { containers as seed } from "@/shared/data/containers";
import { phytoStore } from "@/features/phyto/state/phytoStore";
import type { Container } from "@/shared/data/types";

export const useAllContainers = (): Container[] => seed;

export const useContainerByBooking = (booking: string): Container | undefined =>
  useMemo(() => seed.find((c) => c.booking === booking), [booking]);

export const useActionRequiredContainers = (): Container[] =>
  useMemo(() => seed.filter((c) => c.status === "action"), []);

export const useContainersByWeek = (): { week: string; items: Container[] }[] =>
  useMemo(() => {
    const map = new Map<string, Container[]>();
    seed.forEach((c) => {
      if (!map.has(c.shipmentWeek)) map.set(c.shipmentWeek, []);
      map.get(c.shipmentWeek)!.push(c);
    });
    return Array.from(map.entries()).map(([week, items]) => ({ week, items }));
  }, []);

// Issue rows = missing docs (with Phyto store overlay) or delayed ETA.
export const isIssueRow = (c: Container): boolean => {
  const phytoMissing = c.docs.phyto === "missing" && !phytoStore.isAttached(c.booking);
  return (
    phytoMissing ||
    c.docs.bol === "missing" ||
    c.docs.commercialInvoice === "missing" ||
    c.docs.packingList === "missing" ||
    !!c.etaDelayed
  );
};
