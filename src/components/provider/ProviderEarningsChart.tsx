type ChartBar = { label: string; amount: number };

export function ProviderEarningsChart({ data }: { data: ChartBar[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        Last 7 days
      </p>
      <div className="flex h-36 items-end justify-between gap-2">
        {data.map((bar) => {
          const height = Math.max(8, Math.round((bar.amount / max) * 100));
          return (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-medium text-green-700">
                {bar.amount > 0 ? `$${bar.amount}` : ""}
              </span>
              <div
                className="w-full max-w-[2.5rem] rounded-t-lg bg-gradient-to-t from-green-600 to-green-400 transition-all duration-500 hover:from-green-700 hover:to-green-500"
                style={{ height: `${height}%` }}
                title={`${bar.label}: $${bar.amount}`}
              />
              <span className="text-[10px] text-gray-500">{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
