import { Suspense } from "react";
import { MessagingDashboardClient } from "@/components/messaging/MessagingDashboardClient";
import { LoadingScreen } from "@/components/LoadingSpinner";

export default function CustomerMessagesPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading messages…" />}>
      <MessagingDashboardClient mode="customer" />
    </Suspense>
  );
}
