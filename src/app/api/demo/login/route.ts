import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { runDemoSeed } from "@/lib/demo/seed";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import { getDemoUserByEmail, getDemoUserByKey } from "@/lib/demo/seed-data";

export async function POST(request: Request) {
  await runDemoSeed();

  const body = (await request.json().catch(() => ({}))) as {
    role?: "customer" | "provider" | "admin";
    email?: string;
  };

  let email: string | undefined = body.email;

  if (!email) {
    const role = body.role ?? "customer";
    if (role === "admin") email = "admin@test.com";
    else if (role === "provider") email = "marcus.reed@demo.com";
    else email = "sarah.mitchell@demo.com";
  }

  const demoUser = getDemoUserByEmail(email);
  if (!demoUser) {
    return NextResponse.json({ error: "Unknown demo user" }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    user: { name: demoUser.name, email: demoUser.email, role: demoUser.role },
    redirect:
      demoUser.role === "admin"
        ? "/admin"
        : demoUser.role === "provider"
          ? "/provider/dashboard"
          : "/customer/dashboard",
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email: demoUser.email,
    password: DEMO_PASSWORD,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") as "customer" | "provider" | "admin" | null;
  const key = searchParams.get("key");

  let email: string | undefined;
  if (key) {
    email = getDemoUserByKey(key)?.email;
  } else if (role === "admin") {
    email = "admin@test.com";
  } else if (role === "provider") {
    email = "marcus.reed@demo.com";
  } else {
    email = "sarah.mitchell@demo.com";
  }

  const fakeRequest = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return POST(fakeRequest);
}
