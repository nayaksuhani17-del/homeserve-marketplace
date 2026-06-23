import type { BookingStatus, ServiceCategory, UserRole } from "./constants";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  banned: boolean;
  avatar_url?: string | null;
  created_at?: string;
};

export type Provider = {
  id: string;
  user_id: string;
  services: string[];
  hourly_rate: number;
  location: string;
  description: string;
  availability: string;
  rating_avg: number;
  approved: boolean;
  distance_miles?: number | null;
  jobs_completed?: number | null;
  years_experience?: number | null;
  tags?: string[] | null;
  available_today?: boolean | null;
  available_tomorrow?: boolean | null;
  created_at?: string;
  users?: Pick<User, "name" | "email" | "avatar_url">;
};

export type Booking = {
  id: string;
  customer_id: string;
  provider_id: string;
  service: string;
  date: string;
  time?: string | null;
  status: BookingStatus;
  created_at?: string;
  providers?: Provider & { users?: Pick<User, "name"> };
};

export type Review = {
  id: string;
  customer_id: string;
  provider_id: string;
  booking_id?: string | null;
  rating: number;
  comment: string;
  created_at?: string;
};

export type ProviderWithUser = Provider & {
  users: Pick<User, "name" | "email" | "avatar_url">;
};

export type SearchParams = {
  service?: ServiceCategory | string;
  sort?: "rating" | "price";
  q?: string;
};
