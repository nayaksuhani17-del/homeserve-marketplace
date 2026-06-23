import type { ReactNode } from "react";

type ProviderSummaryCardProps = {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  detail?: ReactNode;
  pulse?: boolean;
};

export function ProviderSummaryCard({
  icon,
  label,
  value,
  sub,
  detail,
  pulse,
}: ProviderSummaryCardProps) {
  return (
    <div
      className={`card overflow-hidden bg-white p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-100/50 ${
        pulse ? "ring-2 ring-green-400 ring-offset-2" : ""
      }`}
    >
      <div className="h-1 bg-gradient-to-r from-green-600 to-green-400" />
      <div className="flex items-start gap-3 p-5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl"
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p
            className={`mt-0.5 text-2xl font-bold tracking-tight text-gray-900 transition-all duration-500 ${
              pulse ? "scale-105 text-green-700" : ""
            }`}
          >
            {value}
          </p>
          {detail && <div className="mt-1.5">{detail}</div>}
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
