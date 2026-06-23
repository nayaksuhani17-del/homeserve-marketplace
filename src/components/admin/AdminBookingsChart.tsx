type ChartBar = { label: string; count: number };

export function AdminBookingsChart({ data }: { data: ChartBar[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        Bookings per day (7 days)
      </p>
      <div className="flex h-40 items-end justify-between gap-2">
        {data.map((bar) => {
          const height = Math.max(8, Math.round((bar.count / max) * 100));
          return (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-medium text-green-700">
                {bar.count > 0 ? bar.count : ""}
              </span>
              <div
                className="w-full max-w-[2.5rem] rounded-t-lg bg-gradient-to-t from-green-600 to-green-400 transition-all duration-500"
                style={{ height: `${height}%` }}
                title={`${bar.label}: ${bar.count}`}
              />
              <span className="text-[10px] text-gray-500">{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
