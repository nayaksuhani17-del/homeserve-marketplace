"use client";

import { useState, useTransition, useEffect } from "react";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { useToast } from "./Toast";
import { useMockApp } from "@/context/MockAppContext";

type ProviderProfileFormProps = {
  defaultValues?: {
    services: string[];
    hourly_rate: number;
    location: string;
    description: string;
    availability: string;
    availableToday?: boolean;
    availableTomorrow?: boolean;
  };
};

export function ProviderProfileForm({ defaultValues }: ProviderProfileFormProps) {
  const { updateProvider } = useMockApp();
  const { toast } = useToast();
  const [services, setServices] = useState<string[]>(defaultValues?.services ?? []);
  const [hourlyRate, setHourlyRate] = useState(defaultValues?.hourly_rate ?? 30);
  const [location, setLocation] = useState(defaultValues?.location ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [availability, setAvailability] = useState(defaultValues?.availability ?? "Mon-Fri: 9am-5pm");
  const [availableToday, setAvailableToday] = useState(defaultValues?.availableToday ?? true);
  const [availableTomorrow, setAvailableTomorrow] = useState(defaultValues?.availableTomorrow ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!defaultValues) return;
    setServices(defaultValues.services ?? []);
    setHourlyRate(defaultValues.hourly_rate ?? 30);
    setLocation(defaultValues.location ?? "");
    setDescription(defaultValues.description ?? "");
    setAvailability(defaultValues.availability ?? "Mon-Fri: 9am-5pm");
    setAvailableToday(defaultValues.availableToday ?? true);
    setAvailableTomorrow(defaultValues.availableTomorrow ?? true);
  }, [defaultValues]);

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (services.length === 0) {
      setError("Please select at least one service.");
      return;
    }
    if (!location.trim() || !description.trim()) {
      setError("Please fill all fields.");
      return;
    }

    startTransition(async () => {
      const result = await updateProvider({
        services,
        hourlyRate,
        location,
        description,
        availability,
        availableToday,
        availableTomorrow,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast("Profile updated successfully!", "success");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900">Your Provider Profile</h2>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Services</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SERVICE_CATEGORIES.map((service) => (
            <label
              key={service}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors duration-200 hover:border-green-200 hover:bg-green-50"
            >
              <input
                type="checkbox"
                checked={services.includes(service)}
                onChange={() => toggleService(service)}
                className="rounded border-gray-300 text-green-600 accent-green-600"
              />
              {service}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Hourly rate ($)
          </label>
          <input
            type="number"
            required
            min={1}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Neighborhood, City"
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell customers about your experience and specialties..."
          className="input-field resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Availability schedule</label>
        <input
          type="text"
          required
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          placeholder="e.g. Mon-Fri: 9am-6pm, Sat: 10am-2pm"
          className="input-field"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={availableToday}
            onChange={(e) => setAvailableToday(e.target.checked)}
            className="accent-green-600"
          />
          Available today
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={availableTomorrow}
            onChange={(e) => setAvailableTomorrow(e.target.checked)}
            className="accent-green-600"
          />
          Available tomorrow
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
