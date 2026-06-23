type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "primary" | "medium" | "dark" | "light";
};

const accents = {
  primary: "from-green-600 to-green-500",
  medium: "from-green-500 to-green-400",
  dark: "from-green-800 to-green-700",
  light: "from-green-400 to-green-300",
};

export function StatCard({ label, value, sub, accent = "primary" }: StatCardProps) {
  return (
    <div className="card overflow-hidden bg-gray-50 p-0">
      <div className={`h-1 bg-gradient-to-r ${accents[accent]}`} />
      <div className="p-5">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}
