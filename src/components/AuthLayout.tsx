import { type ReactNode } from 'react';
import { GraduationCap, BrainCircuit, BarChart3, Trophy } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="grid place-items-center h-12 w-12 rounded-2xl bg-white/15 backdrop-blur">
              <GraduationCap size={26} />
            </div>
            <span className="font-display font-bold text-2xl">EduInsight AI</span>
          </div>
          <h2 className="font-display font-bold text-4xl leading-tight mb-4">
            Student Performance Analysis, powered by Machine Learning.
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Upload data, train models, predict grades, and generate AI recommendations for every student.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: <BrainCircuit size={20} />, t: 'ML Predictions', d: 'Train 3 models, auto-pick best' },
              { icon: <BarChart3 size={20} />, t: 'Rich EDA', d: 'Histograms, heatmaps, correlations' },
              { icon: <Trophy size={20} />, t: 'Leaderboard', d: 'Top performers & improvers' },
              { icon: <GraduationCap size={20} />, t: 'PDF Reports', d: 'Download per-student reports' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/15">
                <div className="mb-2">{f.icon}</div>
                <p className="font-semibold">{f.t}</p>
                <p className="text-sm text-white/70">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0b1020]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow">
              <GraduationCap size={22} />
            </div>
            <span className="font-display font-bold text-xl text-slate-800 dark:text-white">EduInsight AI</span>
          </div>
          <div className="glass-card p-8 animate-fade-in">
            <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">{title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6">{subtitle}</p>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
