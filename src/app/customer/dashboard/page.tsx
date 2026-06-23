import { Suspense } from "react";
import { CustomerDashboardClient } from "@/components/CustomerDashboardClient";
import { LoadingScreen } from "@/components/LoadingSpinner";

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading dashboard…" />}>
      <CustomerDashboardClient />
    </Suspense>
  );
}
