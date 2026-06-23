import { AuthForm } from "@/components/AuthForm";
import { DemoLoginButtons } from "@/components/DemoSwitcher";

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to HomeServe</h1>
        <p className="mt-2 text-gray-600">
          Sign in or create an account to book local house services.
        </p>
        {params.error && (
          <p className="mt-2 text-sm text-red-600">
            Authentication failed. Please try again.
          </p>
        )}
      </div>
      <AuthForm redirectTo={params.redirect || "/customer/dashboard"} />
      <DemoLoginButtons redirectTo={params.redirect} />
    </div>
  );
}
