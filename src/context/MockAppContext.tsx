"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildInitialDatabase, newGuestProvider, newGuestUser, newId } from "@/lib/mock/seed";
import {
  addReviewRecord,
  approveProviderRecord,
  banUserRecord,
  createBookingRecord,
  filterMockProviders,
  getTopRankedProviders,
  getReviewsForProvider,
  getStats,
  mockProviderToLegacy,
  registerUserRecord,
  simulateDelay,
  updateProviderRecord,
} from "@/lib/mock/operations";
import type {
  MockDatabase,
  MockProvider,
  MockSession,
  MockUser,
  ProviderFilters,
} from "@/lib/mock/types";
import {
  MOCK_DB_KEY,
  MOCK_DB_VERSION,
  MOCK_SESSION_KEY,
} from "@/lib/mock/types";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import { assignRecommendationLabels } from "@/lib/recommendations";
import { toProviderCardData } from "@/lib/providers";
import { parseSearchFallback } from "@/lib/ai/parse-search";
import { parseAssistantContext } from "@/lib/ai/parse-intent";
import { resolveIntentFast } from "@/lib/ai/intent-fast";

type MockAppContextValue = {
  ready: boolean;
  db: MockDatabase | null;
  session: MockSession | null;
  user: MockUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; redirect?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "customer" | "provider"
  ) => Promise<{ error?: string; redirect?: string }>;
  demoLogin: (role: "customer" | "provider" | "admin") => Promise<{ error?: string; redirect?: string }>;
  logout: () => void;
  createBooking: (input: {
    providerId: string;
    service: string;
    date: string;
    time?: string | null;
    hours: number;
  }) => Promise<{ error?: string; booking?: MockDatabase["bookings"][0] }>;
  addReview: (input: {
    providerId: string;
    bookingId?: string;
    rating: number;
    comment: string;
  }) => Promise<{ error?: string }>;
  updateProvider: (patch: {
    services?: string[];
    hourlyRate?: number;
    location?: string;
    description?: string;
    availability?: string;
    availableToday?: boolean;
    availableTomorrow?: boolean;
  }) => Promise<{ error?: string }>;
  approveProvider: (providerId: string, approved: boolean) => Promise<void>;
  banUser: (userId: string, banned: boolean) => Promise<void>;
  filterProviders: (filters: ProviderFilters) => ReturnType<typeof filterMockProviders> & {
    topRanked: MockProvider[];
    topRankMap: Record<string, number>;
  };
  getProvider: (id: string) => MockProvider | undefined;
  getProviderReviews: (providerId: string) => ReturnType<typeof getReviewsForProvider>;
  getProviderForUser: (userId: string) => MockProvider | undefined;
  getBookingsForCustomer: (customerId: string) => MockDatabase["bookings"];
  getBookingsForProvider: (providerId: string) => MockDatabase["bookings"];
  getStats: () => ReturnType<typeof getStats>;
  assist: (message: string) => {
    message: string;
    service?: string;
    chips: string[];
    providers: ReturnType<typeof toProviderCardData>[];
  };
  parseSearch: (query: string) => ProviderFilters & { redirectParams: URLSearchParams };
};

const MockAppContext = createContext<MockAppContextValue | null>(null);

function loadDb(): MockDatabase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDatabase;
    if (parsed.version !== MOCK_DB_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDb(db: MockDatabase) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

function loadSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: MockSession | null) {
  if (session) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(MOCK_SESSION_KEY);
  }
}

const DEMO_ROLE_EMAIL: Record<"customer" | "provider" | "admin", string> = {
  customer: "sarah.mitchell@demo.com",
  provider: "marcus.reed@demo.com",
  admin: "admin@test.com",
};

export function MockAppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState<MockDatabase | null>(null);
  const [session, setSession] = useState<MockSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let stored = loadDb();
    if (!stored) {
      stored = buildInitialDatabase();
      saveDb(stored);
    }
    setDb(stored);
    setSession(loadSession());
    setReady(true);
  }, []);

  const persist = useCallback((next: MockDatabase) => {
    setDb(next);
    saveDb(next);
  }, []);

  const user = useMemo(() => {
    if (!db || !session) return null;
    return db.users.find((u) => u.id === session.userId) ?? null;
  }, [db, session]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!db) return { error: "App not ready" };
      setLoading(true);
      await simulateDelay();
      const found = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!found) {
        setLoading(false);
        return { error: "No account found with that email." };
      }
      if (found.banned) {
        setLoading(false);
        return { error: "Your account has been banned." };
      }
      if (found.password !== password) {
        setLoading(false);
        return { error: "Incorrect password." };
      }
      const sess = { userId: found.id };
      setSession(sess);
      saveSession(sess);
      setLoading(false);
      const redirect =
        found.role === "admin"
          ? "/admin"
          : found.role === "provider"
            ? "/provider/dashboard"
            : "/customer/dashboard";
      return { redirect };
    },
    [db]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: "customer" | "provider"
    ) => {
      if (!db) return { error: "App not ready" };
      if (!name.trim() || !email.trim() || !password.trim()) {
        return { error: "Please fill all fields." };
      }
      if (password.length < 6) {
        return { error: "Password must be at least 6 characters." };
      }
      setLoading(true);
      await simulateDelay();
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        setLoading(false);
        return { error: "An account with this email already exists." };
      }
      const guest = newGuestUser({ name, email, password, role });
      const provider = role === "provider" ? newGuestProvider(guest) : undefined;
      const next = registerUserRecord(db, guest, provider);
      persist(next);
      const sess = { userId: guest.id };
      setSession(sess);
      saveSession(sess);
      setLoading(false);
      const redirect =
        role === "provider" ? "/provider/dashboard" : "/customer/dashboard";
      return { redirect };
    },
    [db, persist]
  );

  const demoLogin = useCallback(
    async (role: "customer" | "provider" | "admin") => {
      if (!db) return { error: "App not ready" };
      setLoading(true);
      await simulateDelay(400);
      const email = DEMO_ROLE_EMAIL[role];
      const found = db.users.find((u) => u.email === email);
      if (!found) {
        setLoading(false);
        return { error: "Demo user not found." };
      }
      const sess = { userId: found.id };
      setSession(sess);
      saveSession(sess);
      setLoading(false);
      const redirect =
        role === "admin"
          ? "/admin"
          : role === "provider"
            ? "/provider/dashboard"
            : "/customer/dashboard";
      return { redirect };
    },
    [db]
  );

  const logout = useCallback(() => {
    setSession(null);
    saveSession(null);
  }, []);

  const createBooking = useCallback(
    async (input: {
      providerId: string;
      service: string;
      date: string;
      time?: string | null;
      hours: number;
    }) => {
      if (!db || !user) return { error: "You must be logged in to book." };
      if (!input.service.trim() || !input.date.trim()) {
        return { error: "Please fill all fields." };
      }
      setLoading(true);
      await simulateDelay();
      const provider = db.providers.find((p) => p.id === input.providerId);
      if (!provider) {
        setLoading(false);
        return { error: "Provider not found." };
      }
      if (!provider.approved) {
        setLoading(false);
        return { error: "This provider is not approved yet." };
      }
      const id = newId("booking");
      const next = createBookingRecord(
        db,
        { ...input, customerId: user.id },
        id
      );
      persist(next);
      setLoading(false);
      return { booking: next.bookings.find((b) => b.id === id) };
    },
    [db, user, persist]
  );

  const addReview = useCallback(
    async (input: {
      providerId: string;
      bookingId?: string;
      rating: number;
      comment: string;
    }) => {
      if (!db || !user) return { error: "You must be logged in." };
      if (!input.rating) return { error: "Please select a rating." };
      setLoading(true);
      await simulateDelay();
      const id = newId("review");
      const next = addReviewRecord(
        db,
        { ...input, customerId: user.id },
        id
      );
      persist(next);
      setLoading(false);
      return {};
    },
    [db, user, persist]
  );

  const updateProvider = useCallback(
    async (patch: {
      services?: string[];
      hourlyRate?: number;
      location?: string;
      description?: string;
      availability?: string;
      availableToday?: boolean;
      availableTomorrow?: boolean;
    }) => {
      if (!db || !user) return { error: "You must be logged in." };
      setLoading(true);
      await simulateDelay();
      const next = updateProviderRecord(db, user.id, patch);
      persist(next);
      setLoading(false);
      return {};
    },
    [db, user, persist]
  );

  const approveProvider = useCallback(
    async (providerId: string, approved: boolean) => {
      if (!db) return;
      setLoading(true);
      await simulateDelay(400);
      persist(approveProviderRecord(db, providerId, approved));
      setLoading(false);
    },
    [db, persist]
  );

  const banUser = useCallback(
    async (userId: string, banned: boolean) => {
      if (!db) return;
      setLoading(true);
      await simulateDelay(400);
      persist(banUserRecord(db, userId, banned));
      setLoading(false);
    },
    [db, persist]
  );

  const filterProviders = useCallback(
    (filters: ProviderFilters) => {
      if (!db) {
        return {
          list: [],
          total: 0,
          page: 1,
          pageSize: 24,
          totalPages: 1,
          topRanked: [],
          topRankMap: {},
        };
      }
      const effectiveStatus =
        filters.status === "all" ? "all" : filters.status ?? "verified";
      const result = filterMockProviders(db, {
        ...filters,
        status: effectiveStatus,
      });
      const topRanked = getTopRankedProviders(db, {
        ...filters,
        status: "verified",
      });
      return {
        ...result,
        topRanked,
        topRankMap: Object.fromEntries(topRanked.map((p, i) => [p.id, i + 1])),
      };
    },
    [db]
  );

  const getProvider = useCallback(
    (id: string) => db?.providers.find((p) => p.id === id),
    [db]
  );

  const getProviderReviews = useCallback(
    (providerId: string) => (db ? getReviewsForProvider(db, providerId) : []),
    [db]
  );

  const getProviderForUser = useCallback(
    (userId: string) => db?.providers.find((p) => p.userId === userId),
    [db]
  );

  const getBookingsForCustomer = useCallback(
    (customerId: string) =>
      db?.bookings.filter((b) => b.customerId === customerId) ?? [],
    [db]
  );

  const getBookingsForProvider = useCallback(
    (providerId: string) =>
      db?.bookings.filter((b) => b.providerId === providerId) ?? [],
    [db]
  );

  const getStatsFn = useCallback(() => {
    if (!db) {
      return {
        totalUsers: 0,
        totalProviders: 0,
        verifiedProviders: 0,
        pendingProviders: 0,
        totalBookings: 0,
      };
    }
    return getStats(db);
  }, [db]);

  const assist = useCallback(
    (message: string) => {
      const context = parseAssistantContext(message);
      const intent = resolveIntentFast(message);
      if (!db) {
        return { message: intent.reply, chips: [], providers: [] };
      }
      const matched = filterMockProviders(db, {
        service: context.service ?? intent.service,
        status: "verified",
        availability:
          context.urgency === "today"
            ? "today"
            : context.urgency === "tomorrow"
              ? "tomorrow"
              : undefined,
        maxPrice: context.maxPrice ? String(context.maxPrice) : undefined,
        sort: context.sort,
      });
      const top = matched.list.slice(0, 3);
      const labels = assignRecommendationLabels(top.map(mockProviderToLegacy));
      const chips: string[] = [];
      if (context.service) chips.push(context.service);
      if (context.maxPrice) chips.push(`Under $${context.maxPrice}/hr`);
      if (context.urgency === "today") chips.push("Available today");
      if (context.sort === "price") chips.push("Budget-friendly");
      let reply = intent.reply;
      if (chips.length) reply += `\n\nLooking for: ${chips.join(" · ")}`;
      return {
        message: reply,
        service: context.service ?? intent.service,
        chips,
        providers: top.map((p) =>
          toProviderCardData(mockProviderToLegacy(p), {
            recommendationLabel: labels.get(p.id),
          })
        ),
      };
    },
    [db]
  );

  const parseSearch = useCallback((query: string) => {
    const filters = parseSearchFallback(query);
    const params = new URLSearchParams();
    if (filters.service) params.set("service", filters.service);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.minRating) params.set("minRating", String(filters.minRating));
    if (filters.maxDistance) params.set("maxDistance", String(filters.maxDistance));
    if (filters.availability) params.set("availability", filters.availability);
    if (query.trim()) params.set("q", query.trim());
    return {
      service: filters.service,
      sort: filters.sort,
      minPrice: filters.minPrice ? String(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? String(filters.maxPrice) : undefined,
      minRating: filters.minRating ? String(filters.minRating) : undefined,
      maxDistance: filters.maxDistance ? String(filters.maxDistance) : undefined,
      availability: filters.availability,
      q: query.trim() || undefined,
      redirectParams: params,
    };
  }, []);

  const value: MockAppContextValue = {
    ready,
    db,
    session,
    user,
    loading,
    login,
    register,
    demoLogin,
    logout,
    createBooking,
    addReview,
    updateProvider,
    approveProvider,
    banUser,
    filterProviders,
    getProvider,
    getProviderReviews,
    getProviderForUser,
    getBookingsForCustomer,
    getBookingsForProvider,
    getStats: getStatsFn,
    assist,
    parseSearch,
  };

  return (
    <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>
  );
}

export function useMockApp() {
  const ctx = useContext(MockAppContext);
  if (!ctx) {
    throw new Error("useMockApp must be used within MockAppProvider");
  }
  return ctx;
}

export { DEMO_PASSWORD as DEFAULT_DEMO_PASSWORD };
