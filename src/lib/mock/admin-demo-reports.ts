import { demoId } from "@/lib/demo/ids";
import { providerId, userId } from "@/lib/demo/seed-data";
import type { MockReport } from "./types";

/** Seed reports for admin demo moderation queue. */
export function buildAdminDemoReports(): MockReport[] {
  const now = Date.now();
  return [
    {
      id: demoId("report:1"),
      reporterId: userId("customer-james"),
      reporterName: "James Rodriguez",
      providerId: providerId("provider-derek"),
      providerName: "Derek Walsh",
      reason: "No-show",
      details: "Provider did not arrive for scheduled plumbing appointment.",
      status: "open",
      createdAt: new Date(now - 86400000 * 2).toISOString(),
    },
    {
      id: demoId("report:2"),
      reporterId: userId("customer-emily"),
      reporterName: "Emily Chen",
      providerId: providerId("provider-priya"),
      providerName: "Priya Sharma",
      reason: "Poor quality",
      details: "Carpet still had visible stains after deep clean service.",
      status: "open",
      createdAt: new Date(now - 86400000).toISOString(),
    },
    {
      id: demoId("report:3"),
      reporterId: userId("customer-michael"),
      reporterName: "Michael Thompson",
      providerId: providerId("provider-tom"),
      providerName: "Tom Rivera",
      reason: "Overcharged",
      details: "Final bill was higher than the quoted estimate.",
      status: "open",
      createdAt: new Date(now - 3600000 * 5).toISOString(),
    },
  ];
}
