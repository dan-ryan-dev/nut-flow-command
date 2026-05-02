import { useSyncExternalStore } from "react";

const attached = new Set<string>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const phytoStore = {
  attach(booking: string) {
    attached.add(booking);
    emit();
  },
  isAttached(booking: string) {
    return attached.has(booking);
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  snapshot() {
    return attached;
  },
};

export const usePhytoAttached = (booking: string) =>
  useSyncExternalStore(
    (l) => phytoStore.subscribe(l),
    () => phytoStore.isAttached(booking),
    () => false,
  );