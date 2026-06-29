"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMockApp } from "@/context/MockAppContext";
import { chatHrefForUser } from "@/lib/notification-links";
import { resolveProfileBackLink } from "@/lib/profile-links";
import {
  canRevealContact,
  getRevealedContact,
  publicDisplayName,
  publicInitial,
} from "@/lib/user-profile";

export function UserProfilePageClient({ userId }: { userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: sessionUser, ready, db, getBookingsForCustomer, getProviderForUser } =
    useMockApp();

  const from = searchParams.get("from");
  const back = resolveProfileBackLink(from);

  useEffect(() => {
    if (!ready) return;
    const provider = getProviderForUser(userId);
    if (!provider) return;
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    const qs = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/provider/${provider.id}${qs}`);
  }, [ready, userId, from, getProviderForUser, router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  const profileUser = db?.users.find((u) => u.id === userId);

  if (!profileUser || profileUser.banned) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
        <Link href={back.href} className="link-brand mt-4 inline-block">
          {back.label}
        </Link>
      </div>
    );
  }

  const isOwnProfile = sessionUser?.id === userId;
  const revealContact =
    sessionUser && db
      ? canRevealContact(db, sessionUser.id, userId)
      : false;
  const contactInfo = revealContact ? getRevealedContact(profileUser) : null;
  const displayName = isOwnProfile ? profileUser.name : publicDisplayName(profileUser);
  const bookings = getBookingsForCustomer(userId);
  const completedJobs = bookings.filter((b) => b.status === "completed").length;
  const messageHref = sessionUser
    ? chatHrefForUser(sessionUser, userId)
    : `/login?redirect=${encodeURIComponent(`/user/${userId}`)}`;
  const memberSince = new Date(profileUser.createdAt).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={back.href} className="link-brand text-sm">
        {back.label}
      </Link>

      <article className="card mt-6 overflow-hidden bg-white">
        <div className="bg-gradient-to-br from-slate-700 to-slate-500 px-6 py-10">
          <div className="flex items-end gap-4">
            {profileUser.avatarUrl ? (
              <Image
                src={profileUser.avatarUrl}
                alt=""
                width={80}
                height={80}
                className="h-20 w-20 rounded-2xl border-2 border-white object-cover shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white bg-white/20 text-2xl font-bold text-white shadow-md">
                {publicInitial(profileUser)}
              </div>
            )}
            <div className="min-w-0 pb-1 text-white">
              <p className="text-sm font-medium text-white/80">Customer</p>
              <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              <p className="text-xs text-gray-500">total bookings</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
              <p className="text-2xl font-bold text-gray-900">{completedJobs}</p>
              <p className="text-xs text-gray-500">jobs completed</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
              <p className="text-sm font-semibold text-gray-900">{memberSince}</p>
              <p className="text-xs text-gray-500">member since</p>
            </div>
          </div>

          {isOwnProfile && (
            <div className="mt-6 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900">Contact</h2>
                <p className="mt-2 text-sm text-gray-600">{profileUser.email}</p>
                <p className="mt-1 text-sm text-gray-600">{profileUser.phoneNumber}</p>
                <p className="mt-1 text-sm text-gray-600">{profileUser.address}</p>
              </div>
            </div>
          )}

          {!isOwnProfile && contactInfo && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900">Contact</h2>
              <p className="mt-2 text-sm text-gray-600">
                {contactInfo.phoneNumber} · {contactInfo.city}
              </p>
            </div>
          )}

          {sessionUser && sessionUser.id !== userId && (
            <div className="mt-8">
              <Link href={messageHref} className="btn-primary px-8 py-3 text-base">
                Message
              </Link>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
