"use client";

import { useState } from "react";
import {
  DEFAULT_DISTANCE_RADIUS,
  DISTANCE_RANGE_OPTIONS,
  locationDisplayLabel,
  type DistanceRadius,
} from "@/lib/location";

type SearchLocationControlsProps = {
  location: string;
  radius: DistanceRadius;
  onLocationChange: (value: string) => void;
  onRadiusChange: (value: DistanceRadius) => void;
  onLocationCommit?: (value: string) => void;
  compact?: boolean;
  className?: string;
};

export function SearchLocationControls({
  location,
  radius,
  onLocationChange,
  onRadiusChange,
  onLocationCommit,
  compact = false,
  className = "",
}: SearchLocationControlsProps) {
  const [editing, setEditing] = useState(!compact);
  const hasLocation = Boolean(location.trim());
  const showPrompt = !hasLocation;
  const showSummary = compact && hasLocation && !editing;

  if (showSummary) {
    return (
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 ${className}`}
      >
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-green-800">
          <span aria-hidden>📍</span>
          {locationDisplayLabel(location)}
        </span>
        <span className="hidden text-gray-300 sm:inline" aria-hidden>
          ·
        </span>
        <span className="text-sm text-gray-500">{radius} mi</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-auto shrink-0 text-sm font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 ${compact ? "" : "shadow-sm"} ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label
          htmlFor="search-location"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-gray-700"
        >
          <span aria-hidden>📍</span>
          Your Location
        </label>

        <input
          id="search-location"
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          onBlur={() => {
            onLocationCommit?.(location);
            if (compact && hasLocation) setEditing(false);
          }}
          placeholder="City, State or ZIP"
          autoComplete="postal-code"
          className="min-w-[10rem] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />

        <label
          htmlFor="search-radius"
          className="shrink-0 text-sm font-medium text-gray-700"
        >
          Search Radius
        </label>

        <select
          id="search-radius"
          value={radius}
          onChange={(e) => {
            const next = Number(e.target.value) as DistanceRadius;
            onRadiusChange(next);
          }}
          className="w-auto shrink-0 rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        >
          {DISTANCE_RANGE_OPTIONS.map((miles) => (
            <option key={miles} value={miles}>
              {miles} miles{miles === DEFAULT_DISTANCE_RADIUS ? " (default)" : ""}
            </option>
          ))}
        </select>
      </div>

      {showPrompt ? (
        <p className="mt-2 text-xs text-amber-700">
          Set your location to see nearby providers
        </p>
      ) : (
        !compact && (
          <p className="mt-2 text-xs text-gray-500">
            e.g. New York, NY · 10001 · Brooklyn, NY 11201
          </p>
        )
      )}
    </div>
  );
}
