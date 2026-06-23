"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/constants";

type AuthFormProps = {
  redirectTo?: string;
};

export function AuthForm({ redirectTo = "/" }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("customer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role },
          },
        });
        if (error) throw error;
        setMessage("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const { data: profile } = await supabase
          .from("users")
          .select("role, banned")
          .eq("id", data.user.id)
          .single();

        if (profile?.banned) {
          await supabase.auth.signOut();
          throw new Error("Your account has been banned.");
        }

        const dest =
          profile?.role === "admin"
            ? "/admin"
            : profile?.role === "provider"
              ? "/provider/dashboard"
              : redirectTo || "/customer/dashboard";

        router.push(dest);
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mx-auto w-full max-w-md bg-white p-8">
      <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
            mode === "login" ? "bg-white text-gray-900 shadow" : "text-gray-500"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
            mode === "signup" ? "bg-white text-gray-900 shadow" : "text-gray-500"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["customer", "provider"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-xl border px-4 py-2.5 text-sm capitalize transition-all duration-200 ${
                      role === r
                        ? "border-green-600 bg-green-100 text-green-800"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {r === "customer" ? "Customer" : "Service Provider"}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.includes("created") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
