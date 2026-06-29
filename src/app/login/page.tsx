import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { BrandLockup } from "@/components/BrandName";
import { DemoLoginButtons } from "@/components/DemoSwitcher";

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isSignup = params.mode === "signup";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandLockup size="lg" align="center" />
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">
          {isSignup ? "Create your account" : "Sign in to your account"}
        </h1>
        <p className="mt-2 max-w-md text-gray-600">
          {isSignup
            ? "Real accounts with persistent bookings, reviews, and notifications — saved locally in your browser."
            : "Access your bookings, job requests, and account settings."}
        </p>
        {params.error && (
          <p className="mt-2 text-sm text-red-600">
            Authentication failed. Please try again.
          </p>
        )}
      </div>
      <Suspense fallback={<div className="mx-auto h-96 max-w-md animate-pulse rounded-2xl bg-gray-100" />}>
        <AuthForm
          redirectTo={params.redirect || "/customer/dashboard"}
          defaultMode={isSignup ? "signup" : "login"}
        />
      </Suspense>
      <DemoLoginButtons redirectTo={params.redirect} />
    </div>
  );
}
