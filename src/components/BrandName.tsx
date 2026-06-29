import { BRAND_TAGLINE } from "@/lib/brand";

type BrandSize = "sm" | "md" | "lg" | "hero";

type BrandNameProps = {
  size?: BrandSize;
  className?: string;
  /** Show the article "the" before the name (default true). */
  withThe?: boolean;
};

type BrandTaglineProps = {
  size?: BrandSize;
  className?: string;
};

type BrandLockupProps = {
  size?: BrandSize;
  className?: string;
  withThe?: boolean;
  showTagline?: boolean;
  /** Hide tagline below the `sm` breakpoint (navbar). */
  taglineResponsive?: boolean;
  align?: "start" | "center";
};

const sizeStyles = {
  sm: { the: "text-[10px] leading-none", name: "text-lg leading-none", theNudge: "top-[0.14em]" },
  md: { the: "text-xs leading-none", name: "text-2xl leading-none", theNudge: "top-[0.12em]" },
  lg: { the: "text-sm leading-none", name: "text-2xl leading-none", theNudge: "top-[0.12em]" },
  hero: {
    the: "text-sm sm:text-base leading-none",
    name: "text-3xl sm:text-4xl leading-none",
    theNudge: "top-[0.1em] sm:top-[0.11em]",
  },
} as const;

/** Tagline scales with lockup size; kept small and within logo width. */
const taglineSizes: Record<BrandSize, string> = {
  sm: "text-[6px] leading-[1.1] tracking-[0.02em]",
  md: "text-[7px] leading-[1.1] tracking-[0.03em]",
  lg: "text-[7px] leading-[1.1] tracking-[0.03em]",
  hero: "text-[8px] sm:text-[9px] leading-[1.1] tracking-[0.04em]",
};

function BrandWordmark({ size }: { size: BrandSize }) {
  const styles = sizeStyles[size];
  return (
    <span className={`${styles.name} font-bold tracking-tight`}>
      <span className="text-gray-900">haus</span>
      <span className="text-green-600">fix</span>
    </span>
  );
}

export function BrandName({
  size = "md",
  className = "",
  withThe = true,
}: BrandNameProps) {
  const styles = sizeStyles[size];

  return (
    <span className={`inline-flex items-baseline gap-0.5 whitespace-nowrap ${className}`}>
      {withThe && (
        <span
          className={`${styles.the} ${styles.theNudge} relative shrink-0 font-light text-gray-400`}
        >
          the
        </span>
      )}
      <BrandWordmark size={size} />
    </span>
  );
}

export function BrandTagline({ size = "md", className = "" }: BrandTaglineProps) {
  return (
    <p
      className={`block w-full min-w-0 whitespace-nowrap text-center font-light lowercase text-gray-400 ${taglineSizes[size]} ${className}`}
    >
      {BRAND_TAGLINE}
    </p>
  );
}

export function BrandLockup({
  size = "md",
  className = "",
  withThe = true,
  showTagline = false,
  taglineResponsive = false,
  align = "start",
}: BrandLockupProps) {
  const alignClass = align === "center" ? "justify-items-center" : "justify-items-start";

  return (
    <div
      className={`inline-grid w-max max-w-full grid-cols-1 gap-px ${alignClass} ${className}`}
    >
      <BrandName size={size} withThe={withThe} />
      {showTagline && (
        <div className="min-w-0">
          <BrandTagline
            size={size}
            className={taglineResponsive ? "hidden sm:block" : undefined}
          />
        </div>
      )}
    </div>
  );
}

/** Navbar / header logo mark (wordmark only). */
export function BrandLogo({ className = "" }: { className?: string }) {
  return <BrandName size="sm" className={className} />;
}
