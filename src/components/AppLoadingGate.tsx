"use client";

import { useEffect, useState } from "react";
import { useMockApp } from "@/context/MockAppContext";
import { LoadingOverlay, LoadingScreen } from "@/components/LoadingSpinner";

/** Avoid flashing the loader on fast refreshes (localStorage already warm). */
const LOADER_DELAY_MS = 200;

export function AppLoadingGate({ children }: { children: React.ReactNode }) {
  const { ready, loading } = useMockApp();
  const [showBootstrapLoader, setShowBootstrapLoader] = useState(false);

  useEffect(() => {
    if (ready) {
      setShowBootstrapLoader(false);
      return;
    }
    const timer = setTimeout(() => setShowBootstrapLoader(true), LOADER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  return (
    <>
      {children}
      {!ready && showBootstrapLoader && <LoadingScreen message="Loading HomeServe…" />}
      {ready && loading && <LoadingOverlay message="Please wait…" />}
    </>
  );
}
