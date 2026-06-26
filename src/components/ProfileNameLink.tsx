"use client";

import Link from "next/link";
import { useMockApp } from "@/context/MockAppContext";
import { profileHrefForUser } from "@/lib/profile-links";

type ProfileNameLinkProps = {
  userId: string;
  name: string;
  returnTo?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export const profileNameLinkClass =
  "font-medium text-gray-900 transition hover:text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-sm";

export function ProfileNameLink({
  userId,
  name,
  returnTo,
  className = "",
  onClick,
}: ProfileNameLinkProps) {
  const { getProviderForUser } = useMockApp();
  const href = profileHrefForUser(userId, getProviderForUser, { returnTo });

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${profileNameLinkClass} ${className}`}
    >
      {name}
    </Link>
  );
}
