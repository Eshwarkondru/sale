interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-brand-200 border-t-brand-600 dark:border-white/10 dark:border-t-brand-400 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={40} />
        <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
      </div>
    </div>
  );
}
