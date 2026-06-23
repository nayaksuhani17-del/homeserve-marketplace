type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-5 w-5 border-2",
  md: "h-9 w-9 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <div
      className={`animate-spin rounded-full border-green-600 border-t-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = "Please wait…" }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-white/75 backdrop-blur-[2px]"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner />
      <p className="mt-3 text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
}
