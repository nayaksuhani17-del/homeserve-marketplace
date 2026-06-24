"use client";

import dynamic from "next/dynamic";

const LiveActivity = dynamic(
  () => import("@/components/LiveActivity").then((m) => m.LiveActivity),
  { ssr: false }
);

export function ClientLayoutExtras() {
  return <LiveActivity />;
}
