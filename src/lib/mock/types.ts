export type MockRole = "admin" | "customer" | "provider";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: MockRole;
  banned: boolean;
  avatarUrl?: string;
  createdAt: string;
};

export type MockProvider = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  services: string[];
  hourlyRate: number;
  location: string;
  description: string;
  availability: string;
  ratingAvg: number;
  approved: boolean;
  distanceMiles: number;
  jobsCompleted: number;
  yearsExperience: number;
  tags: string[];
  availableToday: boolean;
  availableTomorrow: boolean;
  responseTimeMins: number;
  reviewCount: number;
};

export type MockBooking = {
  id: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  service: string;
  date: string;
  time?: string | null;
  hours: number;
  estimatedCost: number;
  status: "pending" | "confirmed";
  createdAt: string;
};

export type MockReview = {
  id: string;
  customerId: string;
  customerName: string;
  providerId: string;
  bookingId?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

export type MockDatabase = {
  version: number;
  users: MockUser[];
  providers: MockProvider[];
  bookings: MockBooking[];
  reviews: MockReview[];
};

export type MockSession = {
  userId: string;
};

export type ProviderFilters = {
  service?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  maxDistance?: string;
  availability?: string;
  sort?: string;
  status?: string;
  page?: string;
};

export const MOCK_DB_KEY = "homeserve-mock-db";
export const MOCK_SESSION_KEY = "homeserve-mock-session";
export const MOCK_DB_VERSION = 1;
