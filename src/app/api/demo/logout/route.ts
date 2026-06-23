import { NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/demo/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
