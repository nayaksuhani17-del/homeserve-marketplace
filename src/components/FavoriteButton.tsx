"use client";

import { useMockApp } from "@/context/MockAppContext";
import { useToast } from "./Toast";

export function FavoriteButton({
  providerId,
  providerName,
  className = "",
}: {
  providerId: string;
  providerName: string;
  className?: string;
}) {
  const { user, isFavorite, toggleFavorite } = useMockApp();
  const { toast } = useToast();
  const saved = isFavorite(providerId);

  if (!user || user.role !== "customer") return null;

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save provider"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowSaved = toggleFavorite(providerId);
        toast(
          nowSaved ? `${providerName} saved to favorites` : "Removed from saved providers",
          nowSaved ? "success" : "info"
        );
      }}
      className={`rounded-full p-1.5 transition-all duration-200 hover:scale-110 hover:bg-red-50 ${
        saved ? "text-red-500" : "text-gray-400 hover:text-red-400"
      } ${className}`}
    >
      <span className="text-lg">{saved ? "♥" : "♡"}</span>
    </button>
  );
}
