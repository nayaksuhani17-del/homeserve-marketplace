"use client";

import { useState, useTransition } from "react";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { PRICING_TYPE_LABELS } from "@/lib/pricing";
import type { PricingType } from "@/lib/pricing";
import { useToast } from "./Toast";
import { useMockApp } from "@/context/MockAppContext";

type ProviderProfileFormProps = {
  defaultValues?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    services: string[];
    pricing_type: PricingType;
    price: number;
    base_price?: number;
    hourly_rate?: number;
    location: string;
    description: string;
  };
};

export function ProviderProfileForm({ defaultValues }: ProviderProfileFormProps) {
  const formKey = defaultValues
    ? `${defaultValues.email}-${defaultValues.location}-${defaultValues.services.join(",")}`
    : "empty";

  return <ProviderProfileFormInner key={formKey} defaultValues={defaultValues} />;
}

function ProviderProfileFormInner({ defaultValues }: ProviderProfileFormProps) {
  const { updateProvider, updateUserProfile } = useMockApp();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(defaultValues?.firstName ?? "");
  const [lastName, setLastName] = useState(defaultValues?.lastName ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(defaultValues?.phoneNumber ?? "");
  const [address, setAddress] = useState(defaultValues?.address ?? "");

  const [services, setServices] = useState<string[]>(defaultValues?.services ?? []);
  const [pricingType, setPricingType] = useState<PricingType>(
    defaultValues?.pricing_type ?? "hourly"
  );
  const [price, setPrice] = useState(defaultValues?.price ?? 30);
  const [basePrice, setBasePrice] = useState(defaultValues?.base_price ?? 35);
  const [hourlyRate, setHourlyRate] = useState(defaultValues?.hourly_rate ?? 30);
  const [serviceArea, setServiceArea] = useState(defaultValues?.location ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    if (!serviceArea.trim() || !description.trim()) {
      setError("Please fill all business profile fields.");
      return;
    }

    startTransition(async () => {
      const profileResult = await updateUserProfile({
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
      });
      if (profileResult.error) {
        setError(profileResult.error);
        return;
      }

      const displayPrice =
        pricingType === "hourly" ? hourlyRate : pricingType === "fixed" ? price : price;

      const businessResult = await updateProvider({
        services,
        pricingType,
        price: displayPrice,
        basePrice: pricingType === "fixed" ? price : basePrice,
        hourlyRate: pricingType === "fixed" ? 0 : hourlyRate,
        location: serviceArea,
        description,
      });
      if (businessResult.error) {
        setError(businessResult.error);
        return;
      }

      toast("Profile updated successfully!", "success");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 bg-white p-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Your provider profile</h2>
        <p className="mt-1 text-sm text-gray-500">
          Personal and business details customers see on your public profile.
        </p>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">Personal information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">First name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Last name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input-field"
            />
          </div>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone number</label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, State"
              className="input-field"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">Services & pricing</legend>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Services offered</label>
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Pricing type</label>
            <select
              value={pricingType}
              onChange={(e) => setPricingType(e.target.value as PricingType)}
              className="input-field"
            >
              {(Object.keys(PRICING_TYPE_LABELS) as PricingType[]).map((type) => (
                <option key={type} value={type}>
                  {PRICING_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {pricingType === "fixed"
                ? "Job price ($)"
                : pricingType === "estimate"
                  ? "Starting price ($)"
                  : "Listed rate ($)"}
            </label>
            <input
              type="number"
              required
              min={1}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="input-field"
            />
          </div>
          {pricingType !== "fixed" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Base / call-out fee ($)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="input-field"
                />
              </div>
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
            </>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Service area</label>
          <input
            type="text"
            required
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="Neighborhood, City"
            className="input-field"
          />
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
      </fieldset>

      <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Manage your weekly schedule, time slots, and availability status from your{" "}
        <strong>dashboard sidebar</strong>.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
