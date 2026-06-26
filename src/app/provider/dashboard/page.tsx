import { Suspense } from "react";
import { ProviderDashboardClient } from "@/components/ProviderDashboardClient";
import { LoadingScreen } from "@/components/LoadingSpinner";

export default function ProviderDashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading dashboard…" />}>
      <ProviderDashboardClient />
    </Suspense>
  );
}
