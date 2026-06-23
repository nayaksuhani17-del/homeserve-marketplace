"use client";

import dynamic from "next/dynamic";

const DemoSession = dynamic(
  () => import("@/components/DemoSession").then((m) => m.DemoSession),
  { ssr: false }
);

const LiveActivity = dynamic(
  () => import("@/components/LiveActivity").then((m) => m.LiveActivity),
  { ssr: false }
);

export function ClientLayoutExtras() {
  return (
    <>
      <DemoSession />
      <LiveActivity />
    </>
  );
}
