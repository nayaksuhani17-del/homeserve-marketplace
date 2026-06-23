type EmptyStateProps = {
  title: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, icon = "🔍", action }: EmptyStateProps) {
  return (
    <div className="card mx-auto max-w-lg border-dashed p-12 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-4 text-lg font-semibold text-gray-800">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
