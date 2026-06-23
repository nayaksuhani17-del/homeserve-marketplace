import { upsertProviderProfileAction } from "@/lib/actions";
import { SERVICE_CATEGORIES } from "@/lib/constants";

type ProviderProfileFormProps = {
  defaultValues?: {
    services: string[];
    hourly_rate: number;
    location: string;
    description: string;
    availability: string;
  };
};

export function ProviderProfileForm({ defaultValues }: ProviderProfileFormProps) {
  return (
    <form action={upsertProviderProfileAction} className="card space-y-5 bg-white p-6">
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
                name="services"
                value={service}
                defaultChecked={defaultValues?.services.includes(service)}
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
            name="hourly_rate"
            required
            min={1}
            defaultValue={defaultValues?.hourly_rate ?? 30}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            required
            defaultValue={defaultValues?.location ?? ""}
            placeholder="Neighborhood, City"
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Tell customers about your experience..."
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Availability</label>
        <input
          type="text"
          name="availability"
          defaultValue={defaultValues?.availability ?? ""}
          placeholder="Mon-Fri: 9am-5pm"
          className="input-field"
        />
      </div>

      <button type="submit" className="btn-primary">
        Save profile
      </button>
    </form>
  );
}
