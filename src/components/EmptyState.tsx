type EmptyStateProps = {
  title: string;
  description: string;
  icon?: string;
  suggestions?: string[];
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  icon = "🔍",
  suggestions,
  action,
}: EmptyStateProps) {
  return (
    <div className="card mx-auto max-w-lg animate-fade-in border-dashed p-12 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-4 text-lg font-semibold text-gray-800">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      {suggestions && suggestions.length > 0 && (
        <ul className="mt-4 space-y-1 text-left text-sm text-gray-600">
          {suggestions.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="text-green-600">→</span> {s}
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
