export const SERVICE_CATEGORIES = [
  "Painting",
  "Cooking",
  "House Cleaning",
  "Carpet Cleaning",
  "Electrician",
  "Plumber",
  "Car Mechanic",
  "Computer Repair",
  "Lawn Mowing",
  "House Shifting",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const USER_ROLES = ["admin", "customer", "provider"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BOOKING_STATUSES = ["pending", "confirmed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
