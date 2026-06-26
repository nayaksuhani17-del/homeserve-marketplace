import type { MockProvider } from "./mock/types";

export const VERIFIED_PROVIDER_LABEL = "Verified ✅";
export const UNVERIFIED_PROVIDER_LABEL = "Unverified Provider";

/** Primary check — supports legacy `approved` field during migration. */
export function isProviderVerified(
  provider: { verified?: boolean; approved?: boolean } | null | undefined
): boolean {
  if (!provider) return false;
  return Boolean(provider.verified ?? provider.approved);
}

/** Apply verified state and keep legacy `approved` in sync. */
export function withProviderVerification(
  provider: MockProvider,
  verified: boolean
): MockProvider {
  return {
    ...provider,
    verified,
    approved: verified,
    rejected: verified ? false : provider.rejected,
  };
}
