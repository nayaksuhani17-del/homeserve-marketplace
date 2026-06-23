import type { PricingType } from "@/lib/pricing";
import type { ServicePackage } from "@/lib/quotes";

export type MockRole = "admin" | "customer" | "provider";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "completed"
  | "cancelled";

export type PaymentStatus = "none" | "authorized" | "released" | "refunded";
export type ResponseSpeed = "fast" | "medium" | "slow";
export type ReportStatus = "open" | "resolved";

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
  pricingType: PricingType;
  price: number;
  basePrice: number;
  hourlyRate: number;
  servicePackages: ServicePackage[];
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
  responseSpeed: ResponseSpeed;
  reviewCount: number;
  /** `${date}:${time}` slots the provider has blocked */
  blockedSlots: string[];
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
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  respondedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: "customer" | "provider" | "admin";
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

export type MockChatMessage = {
  id: string;
  bookingId: string;
  senderRole: "customer" | "provider";
  senderName: string;
  text: string;
  createdAt: string;
};

export type MockNotification = {
  id: string;
  userId: string;
  type: "booking" | "payment" | "message" | "system" | "report";
  title: string;
  message: string;
  read: boolean;
  href?: string;
  createdAt: string;
};

export type MockReport = {
  id: string;
  reporterId: string;
  reporterName: string;
  providerId: string;
  providerName: string;
  bookingId?: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
};

export type MockDatabase = {
  version: number;
  users: MockUser[];
  providers: MockProvider[];
  bookings: MockBooking[];
  reviews: MockReview[];
  chatMessages: MockChatMessage[];
  notifications: MockNotification[];
  reports: MockReport[];
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
export const MOCK_DB_VERSION = 5;

export type SystemEvent = {
  id: string;
  type:
    | "booking_accepted"
    | "booking_declined"
    | "booking_created"
    | "booking_cancelled"
    | "job_completed"
    | "payment"
    | "report";
  message: string;
  at: string;
};

export type MarketplaceAnalytics = {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  declinedBookings: number;
  acceptanceRate: number;
  completionRate: number;
  cancellationRate: number;
  estimatedGmv: number;
  avgBookingValue: number;
  openReports: number;
  bookingsLast7Days: number;
};
