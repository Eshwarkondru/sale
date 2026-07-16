import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'brand' | 'accent' | 'emerald' | 'amber' | 'rose' | 'violet';
  sub?: string;
}

const ACCENTS: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'from-brand-500 to-brand-600',
  accent: 'from-accent-400 to-accent-500',
  emerald: 'from-emerald-400 to-emerald-600',
  amber: 'from-amber-400 to-amber-600',
  rose: 'from-rose-400 to-rose-600',
  violet: 'from-violet-500 to-fuchsia-500',
};

export default function StatCard({ label, value, icon, accent = 'brand', sub }: StatCardProps) {
  return (
    <div className="glass-card p-5 relative overflow-hidden group animate-fade-in hover:-translate-y-1 transition-transform duration-300">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${ACCENTS[accent]} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-display font-bold text-slate-800 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br ${ACCENTS[accent]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
