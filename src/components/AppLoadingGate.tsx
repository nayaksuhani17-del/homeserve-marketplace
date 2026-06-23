"use client";

import { useMockApp } from "@/context/MockAppContext";
import { LoadingOverlay, LoadingScreen } from "@/components/LoadingSpinner";

export function AppLoadingGate({ children }: { children: React.ReactNode }) {
  const { ready, loading } = useMockApp();

  return (
    <>
      {children}
      {!ready && <LoadingScreen message="Loading HomeServe…" />}
      {ready && loading && <LoadingOverlay message="Please wait…" />}
    </>
  );
}
