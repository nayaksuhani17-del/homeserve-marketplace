import type { MockProvider } from "./mock/types";

export const VERIFIED_PROVIDER_LABEL = "Verified";
export const UNVERIFIED_PROVIDER_LABEL = "Unverified";

/** Only explicit admin approval counts — never infer from legacy fields. */
export function isProviderVerified(
  provider: { verified?: boolean } | null | undefined
): boolean {
  return provider?.verified === true;
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

/** Reset every provider to unverified (admin must re-approve). */
export function resetAllProviderVerification(
  providers: MockProvider[]
): MockProvider[] {
  return providers.map((p) => ({
    ...p,
    verified: false,
    approved: false,
  }));
}
