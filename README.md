# Local House Services Marketplace (HomeServe)

A full-stack MVP connecting customers with local house service providers — plumbers, cleaners, electricians, and more.

**Location:** `C:\Users\nayak\projects\local-house-services` (separate from your other projects)

## Tech Stack

- **Next.js 16** (App Router)
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL)
- **OpenAI API** (homepage service suggestion chatbot)

## Quick Start

### 1. Install dependencies

```bash
cd C:\Users\nayak\projects\local-house-services
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Authentication → Providers** and enable Email auth
4. Copy your project URL and anon key from **Settings → API**

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_DEMO_MODE=true
OPENAI_API_KEY=sk-your-openai-key
```

> **Demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`) auto-seeds 18 fake users, 12 providers, reviews, and bookings on server start, and auto-logs you in as **Sarah Mitchell** (customer). Get the service role key from **Supabase → Settings → API**.

> The AI chatbot works without OpenAI — it falls back to keyword matching.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Data (auto-seeded)

When `SUPABASE_SERVICE_ROLE_KEY` is set, the app seeds realistic demo data on startup:

| Type | Count | Examples |
|------|-------|----------|
| Admin | 1 | admin@test.com |
| Customers | 5 | sarah.mitchell@demo.com, james.rodriguez@demo.com |
| Providers | 12 | marcus.reed@demo.com (plumber), nina.patel@demo.com (cleaning) |

**All demo passwords:** `DemoHomeServe2024!`

- 10 of 12 providers are **approved** (visible in search)
- 2 pending providers for admin approval demo (Derek Walsh, Priya Sharma)
- 3–8 reviews per provider with star ratings
- 12 sample bookings (pending & confirmed)
- Profile avatars and fake distance (e.g. "2.3 miles away")

**Quick demo login:** Use the navbar "Switch account" dropdown or buttons on `/login`.

Manual re-seed: `GET /api/demo/seed`

## User Roles

| Role | Sign up | Access |
|------|---------|--------|
| **Customer** | Select during signup | Search & book providers, leave reviews |
| **Provider** | Select during signup | Create profile, receive bookings |
| **Admin** | Set manually in DB | Approve providers, ban users |

### Make yourself admin

After signing up, run in Supabase SQL Editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — search, categories, AI chatbot |
| `/login` | Login & signup with role selection |
| `/customer/dashboard` | Browse providers, filter, sort, book |
| `/provider/[id]` | Provider profile & hire form |
| `/provider/dashboard` | Provider profile editor |
| `/admin` | Approve/reject providers, ban users |

## Demo Flow

1. Start dev server — demo data seeds automatically
2. You're auto-logged in as **Sarah Mitchell** (customer) with existing bookings
3. Browse `/customer/dashboard` — 10 verified providers with ratings
4. Switch to **Admin** via navbar → approve Derek Walsh & Priya Sharma at `/admin`
5. Switch to **Marcus Reed** (provider) → view provider dashboard

## Database Tables

- `users` — profiles linked to Supabase Auth
- `providers` — service listings (approved flag controls visibility)
- `bookings` — customer → provider requests
- `reviews` — ratings (auto-updates `rating_avg` on providers)

## Service Categories

Painting, Cooking, House Cleaning, Carpet Cleaning, Electrician, Plumber, Car Mechanic, Computer Repair, Lawn Mowing, House Shifting
