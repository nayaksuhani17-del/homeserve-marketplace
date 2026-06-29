"use client";

import { useCallback, useEffect, useState } from "react";
import { useMockApp } from "@/context/MockAppContext";
import {
  demoAddressForEmail,
  enrichCustomerLocation,
  loadCustomerLocation,
  loadDistanceRadius,
  saveCustomerLocation,
  saveDistanceRadius,
  type CustomerLocation,
  type DistanceRadius,
} from "@/lib/location";

function resolveInitialLocation(user: ReturnType<typeof useMockApp>["user"]): string {
  if (user?.location?.raw.trim()) return user.location.raw.trim();
  if (user?.address?.trim()) return user.address.trim();

  const stored = loadCustomerLocation();
  if (stored?.raw.trim()) return stored.raw.trim();

  const demo = user?.email ? demoAddressForEmail(user.email) : undefined;
  return demo ?? "";
}

export function useSearchLocation() {
  const { user, updateCustomerAddress } = useMockApp();
  const [location, setLocation] = useState(() => resolveInitialLocation(user));
  const [parsedLocation, setParsedLocation] = useState<CustomerLocation | null>(
    () => {
      const initial = resolveInitialLocation(user);
      return initial ? enrichCustomerLocation(initial) : null;
    }
  );
  const [radius, setRadius] = useState<DistanceRadius>(() => loadDistanceRadius());

  useEffect(() => {
    setRadius(loadDistanceRadius());
    const initial = resolveInitialLocation(user);
    setLocation(initial);
    setParsedLocation(initial ? enrichCustomerLocation(initial) : null);
  }, [user?.id, user?.address, user?.location?.raw, user?.email]);

  const commitLocation = useCallback(
    async (value?: string) => {
      const raw = (value ?? location).trim();
      if (!raw) return;
      const loc = enrichCustomerLocation(raw);
      setLocation(loc.raw);
      setParsedLocation(loc);
      saveCustomerLocation(loc);
      await updateCustomerAddress(loc.raw);
    },
    [location, updateCustomerAddress]
  );

  const changeRadius = useCallback((miles: DistanceRadius) => {
    setRadius(miles);
    saveDistanceRadius(miles);
  }, []);

  return {
    location,
    setLocation,
    parsedLocation,
    radius,
    setRadius: changeRadius,
    commitLocation,
    hasLocation: Boolean(location.trim()),
    ready: true,
  };
}
