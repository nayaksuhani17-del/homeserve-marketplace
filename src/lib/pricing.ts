export type PricingType = "hourly" | "fixed" | "estimate";

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  hourly: "Hourly rate",
  fixed: "Fixed price",
  estimate: "Starting estimate",
};

/** Default pricing model by primary service category. */
export const SERVICE_PRICING_TYPE: Record<string, PricingType> = {
  Plumber: "hourly",
  Electrician: "hourly",
  "Computer Repair": "hourly",
  "House Cleaning": "fixed",
  "Carpet Cleaning": "fixed",
  "Lawn Mowing": "fixed",
  Painting: "estimate",
  Cooking: "estimate",
  "Car Mechanic": "estimate",
  "House Shifting": "estimate",
};

export function pricingTypeForService(service: string, index = 0): PricingType {
  const base = SERVICE_PRICING_TYPE[service] ?? "hourly";
  // ~25% of catalog entries use an alternate model for variety
  if (index > 0 && index % 4 === 0) {
    const cycle: PricingType[] = ["hourly", "fixed", "estimate"];
    const offset = cycle.indexOf(base);
    return cycle[(offset + 1) % cycle.length]!;
  }
  return base;
}

export function formatProviderPrice(pricingType: PricingType, price: number): string {
  const amount = `$${Math.round(price)}`;
  switch (pricingType) {
    case "hourly":
      return `${amount}/hour`;
    case "fixed":
      return `${amount} per job`;
    case "estimate":
      return `Starts at ${amount}`;
  }
}

export function formatProviderPriceAmount(pricingType: PricingType, price: number): {
  main: string;
  suffix?: string;
} {
  const amount = `$${Math.round(price)}`;
  switch (pricingType) {
    case "hourly":
      return { main: amount, suffix: "/hour" };
    case "fixed":
      return { main: amount, suffix: " per job" };
    case "estimate":
      return { main: `Starts at ${amount}` };
  }
}

/** Normalize price for filter/sort comparisons across pricing models. */
export function getComparablePrice(pricingType: PricingType, price: number): number {
  switch (pricingType) {
    case "hourly":
      return price;
    case "fixed":
      return price / 3;
    case "estimate":
      return price / 5;
  }
}

export function estimateBookingCost(
  pricingType: PricingType,
  price: number,
  hours: number
): number {
  switch (pricingType) {
    case "hourly":
      return Math.round(price * hours);
    case "fixed":
      return Math.round(price);
    case "estimate":
      return Math.round(price + Math.max(0, hours - 2) * price * 0.12);
  }
}

export function bookingCostLabel(
  pricingType: PricingType,
  price: number,
  hours: number
): string {
  const cost = estimateBookingCost(pricingType, price, hours);
  switch (pricingType) {
    case "hourly":
      return `$${cost} ($${Math.round(price)}/hr × ${hours}h)`;
    case "fixed":
      return `$${cost} (fixed job rate)`;
    case "estimate":
      return `$${cost} (starting estimate${hours > 2 ? `, ${hours}h job` : ""})`;
  }
}
