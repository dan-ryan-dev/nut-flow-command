import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const OfflineBanner = () => {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const qc = useQueryClient();

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      qc.invalidateQueries();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [qc]);

  if (online) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[100] bg-accent text-accent-foreground shadow-md"
    >
      <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <WifiOff className="w-4 h-4 shrink-0" />
        <div className="flex-1">
          <span className="font-semibold">You're offline.</span>{" "}
          <span className="opacity-90">
            Nomos will reconnect automatically when your connection is restored.
          </span>
        </div>
        <button
          onClick={() => {
            if (navigator.onLine) {
              setOnline(true);
              qc.invalidateQueries();
            }
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/15 hover:bg-background/25 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    </div>
  );
};