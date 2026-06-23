"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DemoSession() {
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return;
    if (attempted.current) return;
    attempted.current = true;

    async function autoLogin() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) return;

      try {
        const res = await fetch("/api/demo/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "customer" }),
        });

        if (res.ok) {
          router.refresh();
        }
      } catch {
        // Supabase may not be configured yet
      }
    }

    autoLogin();
  }, [router]);

  return null;
}
