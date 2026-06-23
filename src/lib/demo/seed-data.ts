import { demoId } from "./ids";

export type DemoUserSeed = {
  key: string;
  name: string;
  email: string;
  role: "admin" | "customer" | "provider";
  avatarUrl: string;
};

export type DemoProviderSeed = {
  userKey: string;
  services: string[];
  hourlyRate: number;
  location: string;
  description: string;
  availability: string;
  approved: boolean;
  distanceMiles: number;
  jobsCompleted: number;
  yearsExperience: number;
  tags: string[];
  availableToday: boolean;
  availableTomorrow: boolean;
};

export type DemoReviewSeed = {
  customerKey: string;
  providerKey: string;
  rating: number;
  comment: string;
};

export type DemoBookingSeed = {
  customerKey: string;
  providerKey: string;
  service: string;
  date: string;
  status: "pending" | "confirmed";
};

function avatar(email: string) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
}

export const DEMO_USERS: DemoUserSeed[] = [
  {
    key: "admin",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
    avatarUrl: avatar("admin@test.com"),
  },
  {
    key: "customer-sarah",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@demo.com",
    role: "customer",
    avatarUrl: avatar("sarah.mitchell@demo.com"),
  },
  {
    key: "customer-james",
    name: "James Rodriguez",
    email: "james.rodriguez@demo.com",
    role: "customer",
    avatarUrl: avatar("james.rodriguez@demo.com"),
  },
  {
    key: "customer-emily",
    name: "Emily Chen",
    email: "emily.chen@demo.com",
    role: "customer",
    avatarUrl: avatar("emily.chen@demo.com"),
  },
  {
    key: "customer-michael",
    name: "Michael Thompson",
    email: "michael.thompson@demo.com",
    role: "customer",
    avatarUrl: avatar("michael.thompson@demo.com"),
  },
  {
    key: "customer-jessica",
    name: "Jessica Williams",
    email: "jessica.williams@demo.com",
    role: "customer",
    avatarUrl: avatar("jessica.williams@demo.com"),
  },
  {
    key: "provider-marcus",
    name: "Marcus Reed",
    email: "marcus.reed@demo.com",
    role: "provider",
    avatarUrl: avatar("marcus.reed@demo.com"),
  },
  {
    key: "provider-nina",
    name: "Nina Patel",
    email: "nina.patel@demo.com",
    role: "provider",
    avatarUrl: avatar("nina.patel@demo.com"),
  },
  {
    key: "provider-david",
    name: "David O'Brien",
    email: "david.obrien@demo.com",
    role: "provider",
    avatarUrl: avatar("david.obrien@demo.com"),
  },
  {
    key: "provider-elena",
    name: "Elena Vasquez",
    email: "elena.vasquez@demo.com",
    role: "provider",
    avatarUrl: avatar("elena.vasquez@demo.com"),
  },
  {
    key: "provider-tom",
    name: "Tom Nguyen",
    email: "tom.nguyen@demo.com",
    role: "provider",
    avatarUrl: avatar("tom.nguyen@demo.com"),
  },
  {
    key: "provider-rachel",
    name: "Rachel Kim",
    email: "rachel.kim@demo.com",
    role: "provider",
    avatarUrl: avatar("rachel.kim@demo.com"),
  },
  {
    key: "provider-carlos",
    name: "Carlos Mendez",
    email: "carlos.mendez@demo.com",
    role: "provider",
    avatarUrl: avatar("carlos.mendez@demo.com"),
  },
  {
    key: "provider-amanda",
    name: "Amanda Foster",
    email: "amanda.foster@demo.com",
    role: "provider",
    avatarUrl: avatar("amanda.foster@demo.com"),
  },
  {
    key: "provider-james",
    name: "James Liu",
    email: "james.liu@demo.com",
    role: "provider",
    avatarUrl: avatar("james.liu@demo.com"),
  },
  {
    key: "provider-sophie",
    name: "Sophie Turner",
    email: "sophie.turner@demo.com",
    role: "provider",
    avatarUrl: avatar("sophie.turner@demo.com"),
  },
  {
    key: "provider-derek",
    name: "Derek Walsh",
    email: "derek.walsh@demo.com",
    role: "provider",
    avatarUrl: avatar("derek.walsh@demo.com"),
  },
  {
    key: "provider-priya",
    name: "Priya Sharma",
    email: "priya.sharma@demo.com",
    role: "provider",
    avatarUrl: avatar("priya.sharma@demo.com"),
  },
];

export const DEMO_PROVIDERS: DemoProviderSeed[] = [
  {
    userKey: "provider-marcus",
    services: ["Plumber", "Electrician"],
    hourlyRate: 45,
    location: "Brooklyn Heights, Brooklyn NY",
    description:
      "Licensed master plumber with 12 years of experience in residential repairs and installations. I specialize in leak detection, pipe replacement, and emergency call-outs. Clean work and honest quotes every time.",
    availability: "Mon-Fri: 8am-6pm, Sat: 9am-1pm",
    approved: true,
    distanceMiles: 1.8,
    jobsCompleted: 127,
    yearsExperience: 12,
    tags: ["Highly Rated", "Fast Responder"],
    availableToday: true,
    availableTomorrow: true,
  },
  {
    userKey: "provider-nina",
    services: ["House Cleaning", "Carpet Cleaning"],
    hourlyRate: 35,
    location: "South Congress, Austin TX",
    description:
      "Detail-oriented cleaning professional serving Austin homes for over 8 years. Eco-friendly products available on request. Deep cleans, move-in/move-out, and recurring weekly service.",
    availability: "Mon-Sat: 9am-5pm",
    approved: true,
    distanceMiles: 2.3,
    jobsCompleted: 89,
    yearsExperience: 8,
    tags: ["Affordable", "Highly Rated"],
    availableToday: true,
    availableTomorrow: true,
  },
  {
    userKey: "provider-david",
    services: ["Painting"],
    hourlyRate: 55,
    location: "Capitol Hill, Denver CO",
    description:
      "Interior and exterior painting specialist with an eye for color and finish. I handle prep, patching, and full room makeovers. Fully insured and references available upon request.",
    availability: "Tue-Sat: 7am-4pm",
    approved: true,
    distanceMiles: 3.1,
    jobsCompleted: 64,
    yearsExperience: 9,
    tags: ["Highly Rated"],
    availableToday: false,
    availableTomorrow: true,
  },
  {
    userKey: "provider-elena",
    services: ["Cooking"],
    hourlyRate: 65,
    location: "Coral Gables, Miami FL",
    description:
      "Personal chef offering meal prep, dinner parties, and special occasion catering. Trained in Mediterranean and Latin cuisine. I bring fresh ingredients and leave your kitchen spotless.",
    availability: "Wed-Sun: 10am-8pm",
    approved: true,
    distanceMiles: 4.2,
    jobsCompleted: 52,
    yearsExperience: 7,
    tags: ["Highly Rated"],
    availableToday: false,
    availableTomorrow: true,
  },
  {
    userKey: "provider-tom",
    services: ["Computer Repair", "Electrician"],
    hourlyRate: 50,
    location: "Fremont, Seattle WA",
    description:
      "IT technician and licensed electrician for home office setups and smart home wiring. Virus removal, data recovery, network troubleshooting, and outlet upgrades. Same-day appointments often available.",
    availability: "Mon-Fri: 9am-6pm",
    approved: true,
    distanceMiles: 1.2,
    jobsCompleted: 98,
    yearsExperience: 10,
    tags: ["Fast Responder", "Highly Rated"],
    availableToday: true,
    availableTomorrow: true,
  },
  {
    userKey: "provider-rachel",
    services: ["Lawn Mowing"],
    hourlyRate: 30,
    location: "Pearl District, Portland OR",
    description:
      "Reliable lawn care for Portland neighborhoods including mowing, edging, and seasonal cleanup. I treat every yard like my own and offer flexible weekly or bi-weekly schedules.",
    availability: "Mon-Sat: 7am-3pm",
    approved: true,
    distanceMiles: 5.6,
    jobsCompleted: 156,
    yearsExperience: 6,
    tags: ["Affordable"],
    availableToday: true,
    availableTomorrow: false,
  },
  {
    userKey: "provider-carlos",
    services: ["Car Mechanic"],
    hourlyRate: 75,
    location: "Arcadia, Phoenix AZ",
    description:
      "Mobile mechanic with dealership training on domestic and import vehicles. Oil changes, brake work, diagnostics, and pre-purchase inspections at your home or office.",
    availability: "Mon-Fri: 8am-5pm, Sat: 8am-12pm",
    approved: true,
    distanceMiles: 2.9,
    jobsCompleted: 112,
    yearsExperience: 11,
    tags: ["Highly Rated"],
    availableToday: false,
    availableTomorrow: true,
  },
  {
    userKey: "provider-amanda",
    services: ["House Cleaning"],
    hourlyRate: 28,
    location: "Lincoln Park, Chicago IL",
    description:
      "Affordable and thorough house cleaning for busy Chicago families. Kitchens, bathrooms, and whole-home refreshes. Pet-friendly and flexible scheduling with no long-term contracts required.",
    availability: "Mon-Fri: 9am-5pm, Sat: 10am-2pm",
    approved: true,
    distanceMiles: 3.7,
    jobsCompleted: 203,
    yearsExperience: 5,
    tags: ["Affordable", "Fast Responder"],
    availableToday: true,
    availableTomorrow: true,
  },
  {
    userKey: "provider-james",
    services: ["House Shifting"],
    hourlyRate: 90,
    location: "Midtown, Atlanta GA",
    description:
      "Full-service moving crew for local relocations and furniture delivery. Careful packing, loading, and unloading with dollies and blankets included. Free estimates for jobs over 3 hours.",
    availability: "Mon-Sat: 7am-7pm",
    approved: true,
    distanceMiles: 6.4,
    jobsCompleted: 78,
    yearsExperience: 8,
    tags: ["Highly Rated"],
    availableToday: false,
    availableTomorrow: true,
  },
  {
    userKey: "provider-sophie",
    services: ["Painting", "House Cleaning"],
    hourlyRate: 42,
    location: "East Nashville, Nashville TN",
    description:
      "Versatile home services pro combining painting and post-renovation cleaning. Perfect for landlords and homeowners refreshing a rental or listing. Fast turnaround and competitive rates.",
    availability: "Mon-Thu: 8am-5pm, Fri: 8am-2pm",
    approved: true,
    distanceMiles: 2.1,
    jobsCompleted: 71,
    yearsExperience: 6,
    tags: ["Affordable", "Fast Responder"],
    availableToday: true,
    availableTomorrow: true,
  },
  {
    userKey: "provider-derek",
    services: ["Plumber"],
    hourlyRate: 95,
    location: "Back Bay, Boston MA",
    description:
      "Emergency plumber available for burst pipes, water heater installs, and bathroom remodels. Premium service with 24-hour response for urgent jobs in the greater Boston area.",
    availability: "Mon-Sun: On call",
    approved: false,
    distanceMiles: 7.8,
    jobsCompleted: 45,
    yearsExperience: 15,
    tags: ["Highly Rated"],
    availableToday: true,
    availableTomorrow: true,
  },
  {
    userKey: "provider-priya",
    services: ["Carpet Cleaning", "House Cleaning"],
    hourlyRate: 38,
    location: "La Jolla, San Diego CA",
    description:
      "Steam cleaning and stain removal specialist for carpets, rugs, and upholstery. Uses truck-mounted equipment for deep extraction. Great for allergy sufferers and pet owners.",
    availability: "Tue-Sat: 9am-6pm",
    approved: false,
    distanceMiles: 4.5,
    jobsCompleted: 58,
    yearsExperience: 7,
    tags: ["Affordable"],
    availableToday: false,
    availableTomorrow: true,
  },
];

const REVIEW_COMMENTS = [
  "Very professional and on time!",
  "Did a great job fixing my sink.",
  "Affordable and friendly service.",
  "Exceeded my expectations — highly recommend.",
  "Quick response and quality work.",
  "Would hire again without hesitation.",
  "Friendly and knowledgeable.",
  "Left the place spotless.",
  "Fair pricing for excellent work.",
  "Communication was great throughout.",
  "Showed up prepared and finished ahead of schedule.",
  "Honest quote with no surprise fees.",
];

export const DEMO_REVIEWS: DemoReviewSeed[] = [
  // Marcus Reed — 6 reviews
  { customerKey: "customer-sarah", providerKey: "provider-marcus", rating: 5, comment: REVIEW_COMMENTS[0] },
  { customerKey: "customer-james", providerKey: "provider-marcus", rating: 5, comment: REVIEW_COMMENTS[1] },
  { customerKey: "customer-emily", providerKey: "provider-marcus", rating: 4, comment: REVIEW_COMMENTS[8] },
  { customerKey: "customer-michael", providerKey: "provider-marcus", rating: 5, comment: REVIEW_COMMENTS[4] },
  { customerKey: "customer-jessica", providerKey: "provider-marcus", rating: 4, comment: REVIEW_COMMENTS[6] },
  { customerKey: "customer-sarah", providerKey: "provider-marcus", rating: 5, comment: REVIEW_COMMENTS[11] },
  // Nina Patel — 7 reviews
  { customerKey: "customer-emily", providerKey: "provider-nina", rating: 5, comment: REVIEW_COMMENTS[7] },
  { customerKey: "customer-jessica", providerKey: "provider-nina", rating: 5, comment: REVIEW_COMMENTS[0] },
  { customerKey: "customer-sarah", providerKey: "provider-nina", rating: 4, comment: REVIEW_COMMENTS[2] },
  { customerKey: "customer-james", providerKey: "provider-nina", rating: 5, comment: REVIEW_COMMENTS[3] },
  { customerKey: "customer-michael", providerKey: "provider-nina", rating: 4, comment: REVIEW_COMMENTS[9] },
  { customerKey: "customer-emily", providerKey: "provider-nina", rating: 5, comment: REVIEW_COMMENTS[5] },
  { customerKey: "customer-jessica", providerKey: "provider-nina", rating: 3, comment: "Good job overall, arrived a bit late." },
  // David O'Brien — 5 reviews
  { customerKey: "customer-michael", providerKey: "provider-david", rating: 5, comment: REVIEW_COMMENTS[3] },
  { customerKey: "customer-sarah", providerKey: "provider-david", rating: 4, comment: REVIEW_COMMENTS[8] },
  { customerKey: "customer-james", providerKey: "provider-david", rating: 5, comment: "Beautiful finish on our living room walls." },
  { customerKey: "customer-emily", providerKey: "provider-david", rating: 4, comment: REVIEW_COMMENTS[10] },
  { customerKey: "customer-jessica", providerKey: "provider-david", rating: 5, comment: REVIEW_COMMENTS[0] },
  // Elena Vasquez — 4 reviews
  { customerKey: "customer-jessica", providerKey: "provider-elena", rating: 5, comment: "Amazing dinner party — guests loved it!" },
  { customerKey: "customer-sarah", providerKey: "provider-elena", rating: 5, comment: REVIEW_COMMENTS[5] },
  { customerKey: "customer-emily", providerKey: "provider-elena", rating: 4, comment: REVIEW_COMMENTS[2] },
  { customerKey: "customer-michael", providerKey: "provider-elena", rating: 5, comment: REVIEW_COMMENTS[7] },
  // Tom Nguyen — 6 reviews
  { customerKey: "customer-james", providerKey: "provider-tom", rating: 5, comment: "Fixed my laptop and wired my home office." },
  { customerKey: "customer-michael", providerKey: "provider-tom", rating: 4, comment: REVIEW_COMMENTS[6] },
  { customerKey: "customer-sarah", providerKey: "provider-tom", rating: 5, comment: REVIEW_COMMENTS[4] },
  { customerKey: "customer-emily", providerKey: "provider-tom", rating: 5, comment: REVIEW_COMMENTS[0] },
  { customerKey: "customer-jessica", providerKey: "provider-tom", rating: 3, comment: "Resolved the issue but took two visits." },
  { customerKey: "customer-james", providerKey: "provider-tom", rating: 5, comment: REVIEW_COMMENTS[11] },
  // Rachel Kim — 3 reviews
  { customerKey: "customer-emily", providerKey: "provider-rachel", rating: 4, comment: REVIEW_COMMENTS[2] },
  { customerKey: "customer-michael", providerKey: "provider-rachel", rating: 5, comment: "Yard looks fantastic every week." },
  { customerKey: "customer-sarah", providerKey: "provider-rachel", rating: 4, comment: REVIEW_COMMENTS[9] },
  // Carlos Mendez — 8 reviews
  { customerKey: "customer-james", providerKey: "provider-carlos", rating: 5, comment: REVIEW_COMMENTS[0] },
  { customerKey: "customer-michael", providerKey: "provider-carlos", rating: 5, comment: "Brakes feel brand new." },
  { customerKey: "customer-sarah", providerKey: "provider-carlos", rating: 4, comment: REVIEW_COMMENTS[8] },
  { customerKey: "customer-emily", providerKey: "provider-carlos", rating: 5, comment: REVIEW_COMMENTS[4] },
  { customerKey: "customer-jessica", providerKey: "provider-carlos", rating: 5, comment: REVIEW_COMMENTS[5] },
  { customerKey: "customer-james", providerKey: "provider-carlos", rating: 4, comment: REVIEW_COMMENTS[6] },
  { customerKey: "customer-michael", providerKey: "provider-carlos", rating: 5, comment: REVIEW_COMMENTS[3] },
  { customerKey: "customer-sarah", providerKey: "provider-carlos", rating: 4, comment: REVIEW_COMMENTS[10] },
  // Amanda Foster — 5 reviews
  { customerKey: "customer-jessica", providerKey: "provider-amanda", rating: 5, comment: REVIEW_COMMENTS[7] },
  { customerKey: "customer-emily", providerKey: "provider-amanda", rating: 4, comment: REVIEW_COMMENTS[2] },
  { customerKey: "customer-sarah", providerKey: "provider-amanda", rating: 5, comment: REVIEW_COMMENTS[0] },
  { customerKey: "customer-michael", providerKey: "provider-amanda", rating: 4, comment: REVIEW_COMMENTS[9] },
  { customerKey: "customer-james", providerKey: "provider-amanda", rating: 5, comment: REVIEW_COMMENTS[5] },
  // James Liu — 4 reviews
  { customerKey: "customer-michael", providerKey: "provider-james", rating: 5, comment: "Stress-free move — nothing damaged." },
  { customerKey: "customer-sarah", providerKey: "provider-james", rating: 4, comment: REVIEW_COMMENTS[8] },
  { customerKey: "customer-james", providerKey: "provider-james", rating: 5, comment: REVIEW_COMMENTS[0] },
  { customerKey: "customer-emily", providerKey: "provider-james", rating: 5, comment: REVIEW_COMMENTS[4] },
  // Sophie Turner — 6 reviews
  { customerKey: "customer-jessica", providerKey: "provider-sophie", rating: 5, comment: REVIEW_COMMENTS[3] },
  { customerKey: "customer-sarah", providerKey: "provider-sophie", rating: 4, comment: REVIEW_COMMENTS[2] },
  { customerKey: "customer-emily", providerKey: "provider-sophie", rating: 5, comment: REVIEW_COMMENTS[7] },
  { customerKey: "customer-michael", providerKey: "provider-sophie", rating: 4, comment: REVIEW_COMMENTS[6] },
  { customerKey: "customer-james", providerKey: "provider-sophie", rating: 5, comment: REVIEW_COMMENTS[0] },
  { customerKey: "customer-jessica", providerKey: "provider-sophie", rating: 4, comment: REVIEW_COMMENTS[9] },
  // Derek Walsh — 3 reviews (pending approval)
  { customerKey: "customer-michael", providerKey: "provider-derek", rating: 5, comment: REVIEW_COMMENTS[1] },
  { customerKey: "customer-james", providerKey: "provider-derek", rating: 4, comment: REVIEW_COMMENTS[8] },
  { customerKey: "customer-emily", providerKey: "provider-derek", rating: 5, comment: REVIEW_COMMENTS[0] },
  // Priya Sharma — 4 reviews (pending approval)
  { customerKey: "customer-sarah", providerKey: "provider-priya", rating: 5, comment: "Carpets look brand new again." },
  { customerKey: "customer-jessica", providerKey: "provider-priya", rating: 4, comment: REVIEW_COMMENTS[2] },
  { customerKey: "customer-emily", providerKey: "provider-priya", rating: 5, comment: REVIEW_COMMENTS[7] },
  { customerKey: "customer-michael", providerKey: "provider-priya", rating: 4, comment: REVIEW_COMMENTS[6] },
];

export const DEMO_BOOKINGS: DemoBookingSeed[] = [
  { customerKey: "customer-sarah", providerKey: "provider-marcus", service: "Plumber", date: "2026-06-15", status: "confirmed" },
  { customerKey: "customer-sarah", providerKey: "provider-nina", service: "House Cleaning", date: "2026-06-20", status: "confirmed" },
  { customerKey: "customer-sarah", providerKey: "provider-david", service: "Painting", date: "2026-07-02", status: "pending" },
  { customerKey: "customer-james", providerKey: "provider-carlos", service: "Car Mechanic", date: "2026-06-18", status: "confirmed" },
  { customerKey: "customer-james", providerKey: "provider-tom", service: "Computer Repair", date: "2026-06-25", status: "pending" },
  { customerKey: "customer-emily", providerKey: "provider-elena", service: "Cooking", date: "2026-06-22", status: "confirmed" },
  { customerKey: "customer-emily", providerKey: "provider-rachel", service: "Lawn Mowing", date: "2026-06-28", status: "pending" },
  { customerKey: "customer-michael", providerKey: "provider-james", service: "House Shifting", date: "2026-07-05", status: "confirmed" },
  { customerKey: "customer-michael", providerKey: "provider-sophie", service: "Painting", date: "2026-07-10", status: "pending" },
  { customerKey: "customer-jessica", providerKey: "provider-amanda", service: "House Cleaning", date: "2026-06-19", status: "confirmed" },
  { customerKey: "customer-jessica", providerKey: "provider-sophie", service: "House Cleaning", date: "2026-06-30", status: "pending" },
  { customerKey: "customer-jessica", providerKey: "provider-marcus", service: "Electrician", date: "2026-07-08", status: "confirmed" },
];

export function userId(key: string) {
  return demoId(`user:${key}`);
}

export function providerId(key: string) {
  return demoId(`provider:${key}`);
}

export function bookingId(index: number) {
  return demoId(`booking:${index}`);
}

export function reviewId(index: number) {
  return demoId(`review:${index}`);
}

export function getDemoUserByEmail(email: string) {
  return DEMO_USERS.find((u) => u.email === email);
}

export function getDemoUserByKey(key: string) {
  return DEMO_USERS.find((u) => u.key === key);
}
