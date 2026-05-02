export type ContainerStatus = "action" | "in-transit" | "at-port" | "delivered" | "draft";

export interface Container {
  id: string;
  booking: string;
  vessel: string;
  voyage: string;
  pol: string; // port of loading
  pod: string; // port of discharge
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
}

export const containers: Container[] = [
  {
    id: "MSCU-7741820",
    booking: "BK-99182",
    vessel: "MSC LORETO",
    voyage: "447W",
    pol: "Oakland",
    pod: "Rotterdam",
    destination: "Hamburg, DE",
    buyer: "Nordmann GmbH",
    product: "Nonpareil Almonds 23/25",
    weightKg: 22680,
    eta: "2026-05-14",
    cutoff: "2026-05-04 17:00",
    status: "action",
    alert: "Phyto field missing — vessel cutoff in 38h",
    phytoComplete: false,
    facility: "Salida",
  },
  {
    id: "TCLU-4419902",
    booking: "BK-99183",
    vessel: "EVER GIVEN",
    voyage: "112E",
    pol: "Oakland",
    pod: "Shanghai",
    destination: "Shanghai, CN",
    buyer: "Sunrise Foods Ltd",
    product: "Carmel Almonds 25/27",
    weightKg: 23150,
    eta: "2026-05-22",
    cutoff: "2026-05-06 12:00",
    status: "action",
    alert: "ETA shifted +2 days — Port of Oakland congestion",
    phytoComplete: true,
    facility: "Modesto",
  },
  {
    id: "HLXU-2298471",
    booking: "BK-99184",
    vessel: "ONE STORK",
    voyage: "088W",
    pol: "Oakland",
    pod: "Algeciras",
    destination: "Barcelona, ES",
    buyer: "Mediterránea SA",
    product: "Pistachios In-Shell",
    weightKg: 21400,
    eta: "2026-05-19",
    cutoff: "2026-05-05 17:00",
    status: "in-transit",
    phytoComplete: true,
    facility: "Firebaugh",
  },
  {
    id: "MAEU-9930012",
    booking: "BK-99185",
    vessel: "MAERSK ESSEX",
    voyage: "221N",
    pol: "Oakland",
    pod: "Mumbai",
    destination: "Mumbai, IN",
    buyer: "Tata Trade Co",
    product: "Walnuts Halves",
    weightKg: 22100,
    eta: "2026-05-28",
    cutoff: "2026-05-08 12:00",
    status: "at-port",
    phytoComplete: true,
    facility: "Chowchilla",
  },
  {
    id: "CMAU-7712334",
    booking: "BK-99186",
    vessel: "CMA CGM MARCO POLO",
    voyage: "551W",
    pol: "Oakland",
    pod: "Hamburg",
    destination: "Berlin, DE",
    buyer: "Edeka Zentrale",
    product: "Nonpareil Almonds 27/30",
    weightKg: 22680,
    eta: "2026-05-16",
    cutoff: "2026-05-04 17:00",
    status: "in-transit",
    phytoComplete: true,
    facility: "Salida",
  },
  {
    id: "OOLU-6610091",
    booking: "BK-99187",
    vessel: "OOCL TOKYO",
    voyage: "334E",
    pol: "Oakland",
    pod: "Yokohama",
    destination: "Tokyo, JP",
    buyer: "Marubeni Corp",
    product: "Almond Slivers",
    weightKg: 19800,
    eta: "2026-05-25",
    cutoff: "2026-05-07 12:00",
    status: "delivered",
    phytoComplete: true,
    facility: "Modesto",
  },
];
