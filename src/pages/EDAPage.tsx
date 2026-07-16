import { useMemo, useState } from 'react';
import Card from '../components/Card';
import { SeriesChart, PieChart, ScatterPlot } from '../components/Charts';
import { useData } from '../context/DataContext';
import { SUBJECTS, SUBJECT_LABELS, type Subject } from '../lib/types';
import { correlationMatrix } from '../lib/stats';
import { FullPageLoader } from '../components/Spinner';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

export default function EDAPage() {
  const { students, loading } = useData();
  const [histSubject, setHistSubject] = useState<Subject>('math');

  if (loading) return <FullPageLoader label="Running exploratory analysis..." />;

  const corr = useMemo(() => correlationMatrix(students), [students]);

  const buckets = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  const histData = buckets.map((_, i) => {
    const min = i * 20;
    const max = (i + 1) * 20;
    return students.filter((s) => Number(s[histSubject] ?? 0) >= min && Number(s[histSubject] ?? 0) < max).length;
  });

  const boxStats = SUBJECTS.map((sub) => {
    const vals = students.map((s) => Number(s[sub] ?? 0)).sort((a, b) => a - b);
    const q = (p: number) => vals[Math.floor(vals.length * p)] ?? 0;
    return { sub, min: vals[0] ?? 0, q1: q(0.25), median: q(0.5), q3: q(0.75), max: vals[vals.length - 1] ?? 0 };
  });

  const genderGroups = new Map<string, number[]>();
  for (const s of students) {
    if (!genderGroups.has(s.gender)) genderGroups.set(s.gender, []);
    genderGroups.get(s.gender)!.push(s.final_marks);
  }
  const genderLabels = Array.from(genderGroups.keys());
  const genderAvgs = genderLabels.map((g) => Math.round((genderGroups.get(g)!.reduce((a, b) => a + b, 0) / genderGroups.get(g)!.length) * 10) / 10);

  const sorted = [...students].sort((a, b) => b.final_marks - a.final_marks);
  const top = sorted.slice(0, 10);
  const weak = sorted.slice(-10).reverse();

  const scatterPoints = students.slice(0, 400).map((s) => ({ x: s.attendance, y: s.final_marks }));

  const deptCounts: Record<string, number> = {};
  for (const s of students) deptCounts[s.department] = (deptCounts[s.department] ?? 0) + 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Exploratory Data Analysis</h1>
        <p className="text-slate-500 dark:text-slate-400">Statistical insights across {students.length} student records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Histogram" subtitle="Distribution of marks for a selected subject">
          <div className="mb-3">
            <select className="input max-w-xs" value={histSubject} onChange={(e) => setHistSubject(e.target.value as Subject)}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>)}
            </select>
          </div>
          <SeriesChart labels={buckets} datasets={[{ label: SUBJECT_LABELS[histSubject], data: histData }]} type="bar" height={280} />
        </Card>

        <Card title="Boxplot Summary" subtitle="Min, Q1, Median, Q3, Max per subject">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/10">
                  <th className="text-left py-2 font-medium">Subject</th>
                  <th className="text-right py-2 font-medium">Min</th>
                  <th className="text-right py-2 font-medium">Q1</th>
                  <th className="text-right py-2 font-medium">Median</th>
                  <th className="text-right py-2 font-medium">Q3</th>
                  <th className="text-right py-2 font-medium">Max</th>
                </tr>
              </thead>
              <tbody>
                {boxStats.map((b) => (
                  <tr key={b.sub} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-2 font-medium text-slate-700 dark:text-slate-200">{SUBJECT_LABELS[b.sub as Subject]}</td>
                    <td className="text-right py-2 text-rose-500">{b.min}</td>
                    <td className="text-right py-2 text-amber-500">{b.q1}</td>
                    <td className="text-right py-2 text-brand-600 dark:text-brand-400 font-semibold">{b.median}</td>
                    <td className="text-right py-2 text-amber-500">{b.q3}</td>
                    <td className="text-right py-2 text-emerald-500">{b.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Correlation Heatmap" subtitle="Pearson correlation between features and final marks">
        <Heatmap labels={corr.labels} matrix={corr.matrix} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Gender Comparison" subtitle="Average final marks by gender">
          <SeriesChart labels={genderLabels} datasets={[{ label: 'Avg Final Marks', data: genderAvgs }]} type="bar" height={280} />
        </Card>
        <Card title="Attendance vs Final Marks" subtitle="Scatter plot (sample of 400 students)">
          <ScatterPlot points={scatterPoints} label="Students" xLabel="Attendance (%)" yLabel="Final Marks" height={280} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Performers" subtitle="Top 10 by final marks" action={<TrendingUp size={18} className="text-emerald-500" />}>
          <PerformerList students={top} accent="emerald" />
        </Card>
        <Card title="Weak Students" subtitle="Bottom 10 by final marks" action={<TrendingDown size={18} className="text-rose-500" />}>
          <PerformerList students={weak} accent="rose" />
        </Card>
      </div>

      <Card title="Department Distribution" subtitle="Students per department" action={<Users size={18} className="text-brand-500" />}>
        <PieChart labels={Object.keys(deptCounts)} data={Object.values(deptCounts)} height={300} />
      </Card>
    </div>
  );
}

function PerformerList({ students, accent }: { students: { student_id: string; name: string; department: string; final_marks: number }[]; accent: 'emerald' | 'rose' }) {
  const dot = accent === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500';
  return (
    <ol className="space-y-2">
      {students.map((s, i) => (
        <li key={s.student_id} className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2">
          <span className={`grid place-items-center h-7 w-7 rounded-lg text-xs font-bold text-white ${dot}`}>{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
            <p className="text-xs text-slate-500">{s.student_id} · {s.department}</p>
          </div>
          <span className="font-bold text-slate-800 dark:text-white">{s.final_marks}</span>
        </li>
      ))}
    </ol>
  );
}

function Heatmap({ labels, matrix }: { labels: string[]; matrix: number[][] }) {
  const color = (v: number) => {
    const t = (v + 1) / 2;
    if (v >= 0) return `rgba(99,102,241,${0.15 + t * 0.7})`;
    return `rgba(244,63,94,${0.15 + (1 - t) * 0.7})`;
  };
  const short: Record<string, string> = { attendance: 'att', study_hours: 'study', internal_marks: 'internal', final_marks: 'final', previous_gpa: 'gpa', assignments_completed: 'assign', math: 'math', physics: 'phy', chemistry: 'chem', english: 'eng', computer: 'cs' };
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th></th>
            {labels.map((l) => <th key={l} className="px-1.5 py-1 text-slate-500 font-medium">{short[l] ?? l}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="pr-2 text-right text-slate-500 font-medium whitespace-nowrap">{short[labels[i]] ?? labels[i]}</td>
              {row.map((v, j) => (
                <td key={j} className="p-0.5">
                  <div className="grid place-items-center h-9 w-9 rounded-md font-semibold text-white" style={{ backgroundColor: color(v) }} title={`${labels[i]} ↔ ${labels[j]}: ${v}`}>
                    {v}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
