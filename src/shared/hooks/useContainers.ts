// Live Supabase-backed selectors. Component signatures kept identical so
// every consumer that imports these hooks keeps working — the data source
// is now Postgres instead of the seed array.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Container, ContainerDocs, DocStatus } from "@/shared/data/types";

const emptyDocs = (): ContainerDocs => ({
  phyto: "missing",
  bol: "missing",
  commercialInvoice: "missing",
  packingList: "missing",
});

type DbContainer = {
  container_id: string;
  booking_id: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  destination: string;
  buyer: string;
  product: string;
  weight_kg: number;
  eta: string;
  cutoff: string;
  status: Container["status"];
  alert: string | null;
  phyto_complete: boolean;
  facility: string;
  lots: string[];
  shipment_week: string;
  logistics_status: Container["logisticsStatus"];
  eta_delayed: boolean;
};

type DbDoc = {
  booking_id: string;
  doc_type: "phyto" | "bol" | "commercial-invoice" | "packing-list";
  status: DocStatus;
};

const fetchAll = async (): Promise<Container[]> => {
  const [{ data: rows, error: cErr }, { data: docs, error: dErr }] = await Promise.all([
    supabase.from("containers").select("*"),
    supabase.from("documents").select("booking_id, doc_type, status"),
  ]);
  if (cErr) throw cErr;
  if (dErr) throw dErr;

  const docMap = new Map<string, ContainerDocs>();
  (docs ?? []).forEach((d: DbDoc) => {
    const cur = docMap.get(d.booking_id) ?? emptyDocs();
    if (d.doc_type === "phyto") cur.phyto = d.status;
    else if (d.doc_type === "bol") cur.bol = d.status;
    else if (d.doc_type === "commercial-invoice") cur.commercialInvoice = d.status;
    else if (d.doc_type === "packing-list") cur.packingList = d.status;
    docMap.set(d.booking_id, cur);
  });

  return ((rows ?? []) as DbContainer[]).map((r) => ({
    id: r.container_id,
    booking: r.booking_id,
    vessel: r.vessel,
    voyage: r.voyage,
    pol: r.pol,
    pod: r.pod,
    destination: r.destination,
    buyer: r.buyer,
    product: r.product,
    weightKg: r.weight_kg,
    eta: r.eta,
    cutoff: r.cutoff,
    status: r.status,
    alert: r.alert ?? undefined,
    phytoComplete: r.phyto_complete,
    facility: r.facility as Container["facility"],
    lots: r.lots ?? [],
    shipmentWeek: r.shipment_week,
    logisticsStatus: r.logistics_status,
    docs: docMap.get(r.booking_id) ?? emptyDocs(),
    etaDelayed: r.eta_delayed,
  }));
};

export const containersQueryKey = ["containers"] as const;

export const useAllContainers = (): Container[] => {
  const { data } = useQuery({ queryKey: containersQueryKey, queryFn: fetchAll });
  return data ?? [];
};

export const useContainerByBooking = (booking: string): Container | undefined => {
  const all = useAllContainers();
  return all.find((c) => c.booking === booking);
};

export const useActionRequiredContainers = (): Container[] => {
  const all = useAllContainers();
  return all.filter((c) => c.status === "action");
};

export const useContainersByWeek = (): { week: string; items: Container[] }[] => {
  const all = useAllContainers();
  const map = new Map<string, Container[]>();
  all.forEach((c) => {
    if (!map.has(c.shipmentWeek)) map.set(c.shipmentWeek, []);
    map.get(c.shipmentWeek)!.push(c);
  });
  return Array.from(map.entries()).map(([week, items]) => ({ week, items }));
};

// Issue rows = missing docs or delayed ETA (kept signature-compatible).
export const isIssueRow = (c: Container): boolean => {
  const phytoMissing = c.docs.phyto === "missing";
  return (
    phytoMissing ||
    c.docs.bol === "missing" ||
    c.docs.commercialInvoice === "missing" ||
    c.docs.packingList === "missing" ||
    !!c.etaDelayed
  );
};
