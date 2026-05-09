// Cross-screen Phyto state — keeps the dashboard chip, ledger Docs hover-card,
// and side-panel in sync without a global state library.

import { useSyncExternalStore } from "react";

const attached = new Set<string>();
const pending = new Set<string>();
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
  markPending(booking: string) {
    pending.add(booking);
    emit();
  },
  isPending(booking: string) {
    return pending.has(booking);
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

export const usePhytoPending = (booking: string) =>
  useSyncExternalStore(
    (l) => phytoStore.subscribe(l),
    () => phytoStore.isPending(booking),
    () => false,
  );
