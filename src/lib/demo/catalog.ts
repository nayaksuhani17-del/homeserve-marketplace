import { SERVICE_CATEGORIES } from "@/lib/constants";
import { demoId } from "./ids";
import { DEMO_CATALOG_SIZE, DEMO_MODE } from "./mode";
import { getComparablePrice, pricingTypeForService } from "@/lib/pricing";
import { enrichProviderQuoteFields } from "@/lib/quotes";
import type { PricingType } from "@/lib/pricing";
import type { ProviderWithUser } from "../types";

export const CATALOG_SIZE = DEMO_MODE ? DEMO_CATALOG_SIZE : 350;
export const DEMO_PAGE_SIZE = 24;

const FIRST_NAMES = [
  "Marcus", "Nina", "David", "Elena", "Tom", "Rachel", "Carlos", "Amanda", "James", "Sophie",
  "Derek", "Priya", "Brandon", "Keisha", "Ryan", "Maria", "Chris", "Aisha", "Jordan", "Lily",
  "Tyler", "Sofia", "Kevin", "Hannah", "Andre", "Fatima", "Jason", "Olivia", "Miguel", "Emma",
  "Brian", "Zara", "Eric", "Chloe", "Daniel", "Ava", "Matthew", "Isabella", "Anthony", "Mia",
  "Joshua", "Grace", "Andrew", "Natalie", "Justin", "Victoria", "Aaron", "Brooklyn", "Samuel", "Layla",
];

const LAST_NAMES = [
  "Reed", "Patel", "O'Brien", "Vasquez", "Nguyen", "Kim", "Mendez", "Foster", "Liu", "Turner",
  "Walsh", "Sharma", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
  "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson",
  "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis",
  "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Hill", "Green",
];

const NEIGHBORHOODS = [
  "Brooklyn Heights", "South Congress", "Capitol Hill", "Coral Gables", "Fremont", "Pearl District",
  "Arcadia", "Lincoln Park", "Midtown", "East Nashville", "Back Bay", "La Jolla", "Silver Lake",
  "Wicker Park", "Ballard", "Deep Ellum", "RiNo", "Short North", "Fishtown", "South End",
  "Cherry Creek", "Highland Park", "Buckhead", "Lakeview", "Logan Square", "Queen Anne",
  "Downtown", "West End", "Old Town", "North Loop", "The Heights", "Mission District",
];

const CITIES = [
  "Brooklyn NY", "Austin TX", "Denver CO", "Miami FL", "Seattle WA", "Portland OR",
  "Phoenix AZ", "Chicago IL", "Atlanta GA", "Nashville TN", "Boston MA", "San Diego CA",
  "Los Angeles CA", "San Francisco CA", "Dallas TX", "Houston TX", "Philadelphia PA",
  "Charlotte NC", "Minneapolis MN", "Columbus OH", "Indianapolis IN", "Detroit MI",
  "Las Vegas NV", "Salt Lake City UT", "Raleigh NC", "Tampa FL", "Orlando FL", "Sacramento CA",
];

const DESCRIPTIONS: Record<string, string[]> = {
  Plumber: [
    "Licensed plumber specializing in emergency repairs, leak detection, and fixture installs.",
    "Residential plumbing pro — drains, water heaters, and bathroom remodels done right.",
    "Master plumber with same-day availability for urgent pipe and toilet issues.",
  ],
  Electrician: [
    "Licensed electrician for panel upgrades, outlet installs, and whole-home rewiring.",
    "Smart home and EV charger specialist serving homeowners across the metro area.",
    "Fast, code-compliant electrical work with upfront pricing and clean finishes.",
  ],
  "House Cleaning": [
    "Detail-oriented cleaner offering deep cleans, move-outs, and recurring weekly service.",
    "Eco-friendly house cleaning with pet-safe products and flexible scheduling.",
    "Trusted by 200+ local families for reliable, spotless home cleaning.",
  ],
  "Carpet Cleaning": [
    "Steam cleaning and stain removal for carpets, rugs, and upholstery.",
    "Truck-mounted deep extraction — ideal for high-traffic areas and pet stains.",
    "Professional carpet care with quick dry times and satisfaction guaranteed.",
  ],
  Painting: [
    "Interior and exterior painting with meticulous prep and premium finishes.",
    "Color consultation, drywall repair, and full room makeovers for homeowners.",
    "Insured painter delivering crisp lines and on-time project completion.",
  ],
  Cooking: [
    "Personal chef for meal prep, dinner parties, and special occasion catering.",
    "Farm-to-table cooking with dietary accommodations and kitchen cleanup included.",
    "Private chef bringing restaurant-quality meals to your home.",
  ],
  "Car Mechanic": [
    "Mobile mechanic for oil changes, brakes, diagnostics, and pre-purchase inspections.",
    "Dealership-trained tech offering honest repairs at your driveway or office.",
    "ASE-certified mechanic — domestic and import vehicles welcome.",
  ],
  "Computer Repair": [
    "Home IT support — virus removal, data recovery, and network setup.",
    "Laptop and desktop repair with same-day turnaround when parts are in stock.",
    "Wi-Fi troubleshooting, smart device setup, and small business IT help.",
  ],
  "Lawn Mowing": [
    "Weekly lawn care including mowing, edging, and seasonal yard cleanup.",
    "Reliable landscaping maintenance for busy homeowners and rental properties.",
    "Affordable lawn service with text reminders and flexible billing.",
  ],
  "House Shifting": [
    "Local moving crew for apartments, homes, and furniture delivery.",
    "Careful packing, loading, and unloading with dollies and blankets included.",
    "Licensed and insured movers — free estimates for jobs over 3 hours.",
  ],
};

const REVIEW_SNIPPETS = [
  "Showed up on time and did excellent work.",
  "Fair price and very professional.",
  "Would hire again without hesitation.",
  "Fixed the issue quickly — highly recommend.",
  "Friendly, knowledgeable, and left everything clean.",
  "Great communication from start to finish.",
  "Exceeded my expectations for the price.",
  "Reliable and honest — no surprise fees.",
];

const AVAILABILITY = [
  "Mon-Fri: 8am-6pm",
  "Mon-Sat: 9am-5pm",
  "Tue-Sat: 7am-4pm",
  "Mon-Fri: 9am-6pm, Sat: 10am-2pm",
  "Wed-Sun: 10am-8pm",
  "Mon-Sun: On call",
  "Mon-Thu: 8am-5pm, Fri: 8am-2pm",
];

const RATE_RANGES: Record<string, [number, number]> = {
  Plumber: [38, 95],
  Electrician: [42, 90],
  "House Cleaning": [25, 45],
  "Carpet Cleaning": [30, 55],
  Painting: [40, 75],
  Cooking: [55, 120],
  "Car Mechanic": [50, 95],
  "Computer Repair": [45, 85],
  "Lawn Mowing": [22, 40],
  "House Shifting": [65, 110],
};

function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 9301 + salt * 49297) * 49297;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], index: number, salt: number): T {
  return arr[Math.floor(seeded(index, salt) * arr.length)]!;
}

function catalogProviderId(index: number): string {
  return demoId(`catalog-provider:${index}`);
}

function catalogUserId(index: number): string {
  return demoId(`catalog-user:${index}`);
}

function avatar(email: string) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
}

const FIXED_PRICE_RANGES: Record<string, [number, number]> = {
  "House Cleaning": [85, 220],
  "Carpet Cleaning": [99, 249],
  "Lawn Mowing": [35, 75],
};

const ESTIMATE_PRICE_RANGES: Record<string, [number, number]> = {
  Painting: [250, 850],
  Cooking: [200, 500],
  "Car Mechanic": [75, 350],
  "House Shifting": [350, 950],
};

function priceForProvider(
  primaryService: string,
  pricingType: PricingType,
  index: number
): number {
  const [minRate, maxRate] = RATE_RANGES[primaryService] ?? [30, 80];
  const t = seeded(index, 8);

  if (pricingType === "fixed") {
    const [min, max] = FIXED_PRICE_RANGES[primaryService] ?? [minRate * 2.5, maxRate * 3];
    return Math.round(min + t * (max - min));
  }
  if (pricingType === "estimate") {
    const [min, max] = ESTIMATE_PRICE_RANGES[primaryService] ?? [minRate * 4, maxRate * 8];
    return Math.round(min + t * (max - min));
  }
  return Math.round(minRate + t * (maxRate - minRate));
}

function buildCatalogProvider(index: number): ProviderWithUser {
  const first = pick(FIRST_NAMES, index, 1);
  const last = pick(LAST_NAMES, index, 2);
  const name = `${first} ${last}`;
  const email = `${first.toLowerCase()}.${last.toLowerCase().replace("'", "")}${index}@homeserve-demo.com`;

  const primaryService = pick([...SERVICE_CATEGORIES], index, 3);
  const addSecond = seeded(index, 4) > 0.65;
  const secondary = pick(
    SERVICE_CATEGORIES.filter((s) => s !== primaryService),
    index,
    5
  );
  const services = addSecond ? [primaryService, secondary] : [primaryService];

  const neighborhood = pick(NEIGHBORHOODS, index, 6);
  const city = pick(CITIES, index, 7);
  const location = `${neighborhood}, ${city}`;

  const pricingType = pricingTypeForService(primaryService, index);
  const price = priceForProvider(primaryService, pricingType, index);

  const rating = Math.round((3.2 + seeded(index, 9) * 1.8) * 10) / 10;
  const jobsCompleted = Math.floor(15 + seeded(index, 10) * 280);
  const yearsExperience = Math.floor(2 + seeded(index, 11) * 18);

  const approved = false;

  const distanceMiles = Math.round((0.4 + seeded(index, 13) * 12.5) * 10) / 10;
  const availableToday = seeded(index, 14) > 0.45;
  const availableTomorrow = seeded(index, 15) > 0.35;

  const descPool = DESCRIPTIONS[primaryService] ?? DESCRIPTIONS.Plumber;
  const description = pick(descPool, index, 16);

  const tags: string[] = [];
  if (rating >= 4.5) tags.push("Highly Rated");
  if (getComparablePrice(pricingType, price) <= 35) tags.push("Affordable");
  if (availableToday) tags.push("Fast Responder");
  if (jobsCompleted >= 150) tags.push("Popular");

  const responseTimeMins = availableToday
    ? Math.floor(5 + seeded(index, 18) * 25)
    : Math.floor(45 + seeded(index, 18) * 180);
  const reviewCount = Math.floor(3 + seeded(index, 19) * 45);

  const id = catalogProviderId(index);
  const quote = enrichProviderQuoteFields({
    id,
    pricingType,
    price,
    services,
  });

  return {
    id,
    user_id: catalogUserId(index),
    services,
    pricing_type: pricingType,
    price,
    base_price: quote.basePrice,
    hourly_rate: quote.hourlyRate,
    service_packages: quote.servicePackages,
    location,
    description,
    availability: pick(AVAILABILITY, index, 17),
    rating_avg: rating,
    approved,
    distance_miles: distanceMiles,
    jobs_completed: jobsCompleted,
    years_experience: yearsExperience,
    tags: tags.slice(0, 3),
    available_today: availableToday,
    available_tomorrow: availableTomorrow,
    response_time_mins: responseTimeMins,
    review_count: reviewCount,
    users: {
      name,
      email,
      avatar_url: avatar(email),
    },
  };
}

let catalogCache: ProviderWithUser[] | null = null;

export function getCatalogProviders(): ProviderWithUser[] {
  if (!catalogCache) {
    catalogCache = Array.from({ length: CATALOG_SIZE }, (_, i) => buildCatalogProvider(i));
  }
  return catalogCache;
}

export function getCatalogStats() {
  const all = getCatalogProviders();
  const verified = all.filter((p) => p.approved).length;
  return {
    total: all.length,
    verified,
    pending: all.length - verified,
  };
}

export function getCatalogReviewsForProvider(providerIdValue: string) {
  const providers = getCatalogProviders();
  const index = providers.findIndex((p) => p.id === providerIdValue);
  if (index < 0) return [];

  const reviewCount = 3 + Math.floor(seeded(index, 20) * 6);

  return Array.from({ length: reviewCount }, (_, i) => ({
    rating: Math.min(5, Math.max(3, Math.round(3 + seeded(index, 30 + i) * 2))),
    comment: pick(REVIEW_SNIPPETS, index, 40 + i),
    created_at: new Date(Date.now() - i * 86400000 * 5).toISOString(),
    users: {
      name: `${pick(FIRST_NAMES, index, 50 + i)} ${pick(LAST_NAMES, index, 60 + i).charAt(0)}.`,
    },
  }));
}
