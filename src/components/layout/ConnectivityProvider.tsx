"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { flush, pending, type OutboxItem } from "@/lib/offline/outbox";

interface ConnectivityValue {
  online: boolean;
  queued: OutboxItem[];
  syncing: boolean;
  refreshQueue: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const ConnectivityContext = createContext<ConnectivityValue>({
  online: true, queued: [], syncing: false,
  refreshQueue: async () => {}, syncNow: async () => {},
});

export const useConnectivity = () => useContext(ConnectivityContext);

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  // نبدأ متصلين دائمًا حتى لا يختلف عرض الخادم عن العميل (hydration).
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState<OutboxItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshQueue = useCallback(async () => {
    setQueued(await pending());
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current || typeof navigator === "undefined" || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await flush();
      await refreshQueue();
      if (result.sent > 0) {
        window.dispatchEvent(new CustomEvent("beheira:synced", { detail: result }));
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshQueue]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void refreshQueue();

    const handleOnline = () => {
      setOnline(true);
      void syncNow();
    };
    const handleOffline = () => setOnline(false);
    const handleQueued = () => void refreshQueue();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beheira:queued", handleQueued);

    // محاولة دورية هادئة — الشبكة قد تعود دون إطلاق حدث online.
    const timer = window.setInterval(() => void syncNow(), 30_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beheira:queued", handleQueued);
      window.clearInterval(timer);
    };
  }, [refreshQueue, syncNow]);

  const value = useMemo(
    () => ({ online, queued, syncing, refreshQueue, syncNow }),
    [online, queued, syncing, refreshQueue, syncNow],
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}
