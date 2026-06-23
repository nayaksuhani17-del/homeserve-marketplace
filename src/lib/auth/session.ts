import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  readDemoSession,
  getDemoUserId,
  type DemoSession,
} from "@/lib/demo/session";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer" | "provider";
  source: "supabase" | "demo";
  demoSession?: DemoSession;
};

export async function getAppUser(): Promise<AppUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as AppUser["role"],
          source: "supabase",
        };
      }
    }
  }

  const demo = await readDemoSession();
  if (!demo) return null;

  return {
    id: getDemoUserId(demo),
    name: demo.user.name,
    email: demo.user.email,
    role: demo.user.role,
    source: "demo",
    demoSession: demo,
  };
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getAppUser()) !== null;
}
