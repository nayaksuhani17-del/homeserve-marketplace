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
export type ReportStatus = "open" | "resolved" | "dismissed";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: MockRole;
  /** Can browse, book, and review as a customer. */
  customerRole: boolean;
  /** Can manage jobs and earnings as a provider. */
  providerRole: boolean;
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
  /** Admin rejected application — distinct from pending (never reviewed). */
  rejected?: boolean;
  distanceMiles: number;
  jobsCompleted: number;
  yearsExperience: number;
  tags: string[];
  availableToday: boolean;
  availableTomorrow: boolean;
  responseTimeMins: number;
  responseSpeed: ResponseSpeed;
  reviewCount: number;
  /** Mon–Sun availability flags (index 0 = Monday). */
  weekAvailability?: boolean[];
  /** `${date}:${time}` slots the provider has blocked */
  blockedSlots: string[];
  /** When true, send templated auto-replies to customers who message while you're away. */
  autoReplyEnabled?: boolean;
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

export type MockDirectMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
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
  /** User who triggered the notification (e.g. message sender). */
  senderId?: string;
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
  directMessages: MockDirectMessage[];
  notifications: MockNotification[];
  reports: MockReport[];
};

export type AppMode = "customer" | "provider";

export type MockSession = {
  userId: string;
  /** Active hat when the account has customer and/or provider capabilities. */
  activeMode?: AppMode;
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
/** Cookie flag so middleware allows mock-authenticated demo routes. */
export const MOCK_SESSION_COOKIE = "homeserve-mock-auth";
export const MOCK_DB_VERSION = 14;

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
  activeJobs: number;
  popularServices: { service: string; count: number }[];
  topProviders: { id: string; name: string; rating: number; jobsCompleted: number }[];
  bookingsPerDay: { label: string; count: number }[];
};
