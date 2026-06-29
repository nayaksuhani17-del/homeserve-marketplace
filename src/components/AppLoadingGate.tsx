"use client";

import { useEffect, useState } from "react";
import { useMockApp } from "@/context/MockAppContext";
import { LoadingScreen } from "@/components/LoadingSpinner";
import { BRAND_LOADING } from "@/lib/brand";

/** Avoid flashing the loader on fast refreshes (localStorage already warm). */
const LOADER_DELAY_MS = 200;

export function AppLoadingGate({ children }: { children: React.ReactNode }) {
  const { ready } = useMockApp();
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
      {!ready && showBootstrapLoader && <LoadingScreen message={BRAND_LOADING} />}
    </>
  );
}
