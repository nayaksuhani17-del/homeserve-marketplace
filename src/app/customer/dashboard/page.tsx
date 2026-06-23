import { Suspense } from "react";
import { CustomerDashboardClient } from "@/components/CustomerDashboardClient";

export default function CustomerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 animate-fade-in">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        </div>
      }
    >
      <CustomerDashboardClient />
    </Suspense>
  );
}
