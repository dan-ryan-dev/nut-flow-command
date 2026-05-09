// Pure type definitions for the canonical shipment record ("Nomos DB").
// No data, no logic — kept separate so display components can import types
// without pulling in the seed array.

export type ContainerStatus =
  | "action"
  | "in-transit"
  | "at-port"
  | "delivered"
  | "draft";

export type LogisticsStatus =
  | "pending-load"
  | "origin-received"
  | "gated-in"
  | "loaded-vessel"
  | "arrived-discharge"
  | "closed";

export type DocStatus = "attached" | "draft" | "missing";

export interface ContainerDocs {
  phyto: DocStatus;
  bol: DocStatus;
  commercialInvoice: DocStatus;
  packingList: DocStatus;
}

export interface Container {
  id: string;
  booking: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  destination: string;
  buyer: string;
  product: string;
  weightKg: number;
  eta: string;
  cutoff: string;
  status: ContainerStatus;
  alert?: string;
  phytoComplete: boolean;
  facility: "Salida" | "Modesto" | "Firebaugh" | "Chowchilla";
  lots: string[];
  shipmentWeek: string;
  logisticsStatus: LogisticsStatus;
  docs: ContainerDocs;
  etaDelayed?: boolean;
}

export const SHIPMENT_WEEKS = [
  "Week 19 · May 4–10",
  "Week 18 · Apr 27–May 3",
  "Week 17 · Apr 20–26",
] as const;
