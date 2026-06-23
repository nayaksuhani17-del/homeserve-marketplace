import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createGuestDemoSession,
  DEMO_SESSION_COOKIE,
  demoRedirectForRole,
} from "@/lib/demo/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    role?: "customer" | "provider";
  };

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  const role = body.role ?? "customer";

  if (!email || !name) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Real accounts use Supabase auth. Use the login form — your project is connected to a database.",
      },
      { status: 400 }
    );
  }

  const session = createGuestDemoSession({ name, email, role });
  const redirect = demoRedirectForRole(role);

  const response = NextResponse.json({
    ok: true,
    user: { name, email, role },
    redirect,
    mode: "cookie",
  });

  response.cookies.set(DEMO_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
