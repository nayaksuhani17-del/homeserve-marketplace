import { Suspense } from "react";
import { UserProfilePageClient } from "@/components/UserProfilePageClient";

type UserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: UserPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-20">
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      }
    >
      <UserProfilePageClient userId={id} />
    </Suspense>
  );
}
