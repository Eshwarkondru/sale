import { useMemo, useState } from 'react';
import { Trophy, Medal, TrendingUp, CalendarCheck } from 'lucide-react';
import Card from '../components/Card';
import { useData } from '../context/DataContext';
import { FullPageLoader } from '../components/Spinner';
import type { Student } from '../lib/types';

type Tab = 'gpa' | 'attendance' | 'improvement';

interface RankedStudent extends Student {
  improvement?: number;
}

export default function LeaderboardPage() {
  const { students, loading } = useData();
  const [tab, setTab] = useState<Tab>('gpa');

  const ranked = useMemo<RankedStudent[]>(() => {
    if (tab === 'gpa') return [...students].sort((a, b) => b.final_marks - a.final_marks).slice(0, 10);
    if (tab === 'attendance') return [...students].sort((a, b) => b.attendance - a.attendance).slice(0, 10);
    return [...students]
      .map((s) => ({ ...s, improvement: s.final_marks - s.internal_marks }))
      .sort((a, b) => (b.improvement ?? 0) - (a.improvement ?? 0))
      .slice(0, 10);
  }, [students, tab]);

  if (loading) return <FullPageLoader label="Building leaderboard..." />;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'gpa', label: 'Highest Final Marks', icon: <Trophy size={16} /> },
    { id: 'attendance', label: 'Highest Attendance', icon: <CalendarCheck size={16} /> },
    { id: 'improvement', label: 'Best Improvement', icon: <TrendingUp size={16} /> },
  ];

  const medal = ['#facc15', '#cbd5e1', '#d97706'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Top 10 students across different metrics.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow' : 'glass text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="space-y-2">
          {ranked.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 rounded-xl bg-slate-50 dark:bg-white/5 p-3 hover:bg-slate-100 dark:hover:bg-white/10 transition">
              <div className="grid place-items-center h-9 w-9 rounded-lg font-bold text-white shrink-0" style={{ backgroundColor: i < 3 ? medal[i] : '#6366f1' }}>
                {i < 3 ? <Medal size={16} /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 dark:text-white truncate">{s.name}</p>
                <p className="text-xs text-slate-500">{s.student_id} · {s.department}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800 dark:text-white">
                  {tab === 'gpa' && `${s.final_marks}`}
                  {tab === 'attendance' && `${s.attendance}%`}
                  {tab === 'improvement' && `+${s.improvement ?? 0}`}
                </p>
                <p className="text-xs text-slate-500">
                  {tab === 'gpa' && 'final marks'}
                  {tab === 'attendance' && 'attendance'}
                  {tab === 'improvement' && 'improvement'}
                </p>
              </div>
            </div>
          ))}
          {ranked.length === 0 && <p className="text-center text-slate-400 py-8">No data available.</p>}
        </div>
      </Card>
    </div>
  );
}
