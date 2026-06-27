"use client";

import {
  isProviderVerified,
  UNVERIFIED_PROVIDER_LABEL,
} from "@/lib/provider-verification";

type ProviderVerifiedCheckmarkProps = {
  className?: string;
  size?: "sm" | "md";
};

/** Instagram-style blue verified checkmark. */
export function ProviderVerifiedCheckmark({
  className = "",
  size = "sm",
}: ProviderVerifiedCheckmarkProps) {
  const dim = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const icon = size === "md" ? "text-[10px]" : "text-[8px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-white ${dim} ${className}`.trim()}
      title="Verified provider"
      aria-label="Verified provider"
    >
      <span className={`font-bold leading-none ${icon}`} aria-hidden>
        ✓
      </span>
    </span>
  );
}

type ProviderNameWithVerificationProps = {
  name: string;
  verified?: boolean;
  approved?: boolean;
  className?: string;
  nameClassName?: string;
  size?: "sm" | "md";
  showUnverifiedLabel?: boolean;
};

export function ProviderNameWithVerification({
  name,
  verified,
  approved,
  className = "",
  nameClassName = "",
  size = "sm",
  showUnverifiedLabel = false,
}: ProviderNameWithVerificationProps) {
  const isVerified = isProviderVerified({ verified });

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <span className={nameClassName}>{name}</span>
      {isVerified ? (
        <ProviderVerifiedCheckmark size={size} />
      ) : showUnverifiedLabel ? (
        <span
          className={`badge-unverified shrink-0 ${
            size === "md" ? "px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]"
          }`}
        >
          {UNVERIFIED_PROVIDER_LABEL}
        </span>
      ) : null}
    </span>
  );
}
