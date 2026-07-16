import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, TrendingDown, TrendingUp, Download, BarChart3 } from 'lucide-react';
import Card from '../components/Card';
import { SeriesChart, PieChart } from '../components/Charts';
import { useData } from '../context/DataContext';
import { FullPageLoader } from '../components/Spinner';
import { SUBJECTS, SUBJECT_LABELS, type Subject } from '../lib/types';
import { generateStudentReport } from '../lib/pdf';

export default function FacultyPage() {
  const { students, loading } = useData();
  const [deptFilter, setDeptFilter] = useState('all');

  const filtered = useMemo(
    () => (deptFilter === 'all' ? students : students.filter((s) => s.department === deptFilter)),
    [students, deptFilter],
  );

  if (loading) return <FullPageLoader label="Loading faculty dashboard..." />;

  const sorted = [...filtered].sort((a, b) => b.final_marks - a.final_marks);
  const top = sorted.slice(0, 10);
  const weak = sorted.slice(-10).reverse();

  const avgAttendance = filtered.length ? filtered.reduce((a, s) => a + s.attendance, 0) / filtered.length : 0;
  const passRate = filtered.length ? (filtered.filter((s) => s.final_marks >= 40).length / filtered.length) * 100 : 0;
  const atRisk = filtered.filter((s) => s.final_marks < 50 || s.attendance < 65).length;

  const subjectAvg = SUBJECTS.map((sub) => {
    const avg = filtered.length ? filtered.reduce((a, s) => a + Number(s[sub] ?? 0), 0) / filtered.length : 0;
    return { sub: SUBJECT_LABELS[sub as Subject], avg: Math.round(avg * 10) / 10 };
  });

  const attendanceBuckets = ['<60%', '60-75%', '75-85%', '85-100%'];
  const attendanceCounts = [
    filtered.filter((s) => s.attendance < 60).length,
    filtered.filter((s) => s.attendance >= 60 && s.attendance < 75).length,
    filtered.filter((s) => s.attendance >= 75 && s.attendance < 85).length,
    filtered.filter((s) => s.attendance >= 85).length,
  ];

  const gradeDist: Record<string, number> = { 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0, F: 0 };
  for (const s of filtered) {
    const m = s.final_marks;
    if (m >= 90) gradeDist['A+']++;
    else if (m >= 80) gradeDist['A']++;
    else if (m >= 70) gradeDist['B+']++;
    else if (m >= 60) gradeDist['B']++;
    else if (m >= 50) gradeDist['C']++;
    else if (m >= 40) gradeDist['D']++;
    else gradeDist['F']++;
  }

  const departments = Array.from(new Set(students.map((s) => s.department)));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Faculty Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Monitor class performance, identify at-risk students, and download reports.</p>
          </div>
          <select className="input max-w-xs" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="all">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: filtered.length, icon: <Users size={20} />, color: 'from-brand-500 to-brand-600' },
          { label: 'Avg Attendance', value: `${avgAttendance.toFixed(1)}%`, icon: <BarChart3 size={20} />, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Pass Rate', value: `${passRate.toFixed(1)}%`, icon: <TrendingUp size={20} />, color: 'from-sky-500 to-sky-600' },
          { label: 'At-Risk Students', value: atRisk, icon: <TrendingDown size={20} />, color: 'from-rose-500 to-rose-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <div className="flex items-center gap-3">
                <div className={`grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} text-white`}>{s.icon}</div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Subject-wise Analysis" subtitle="Average marks per subject" action={<BookOpen size={18} className="text-brand-500" />}>
          <SeriesChart
            labels={subjectAvg.map((s) => s.sub)}
            datasets={[{ label: 'Average Marks', data: subjectAvg.map((s) => s.avg) }]}
            type="bar"
            height={300}
          />
        </Card>
        <Card title="Attendance Distribution" subtitle="Students grouped by attendance range">
          <SeriesChart labels={attendanceBuckets} datasets={[{ label: 'Students', data: attendanceCounts }]} type="bar" height={300} />
        </Card>
      </div>

      <Card title="Grade Distribution" subtitle="Number of students per grade">
        <PieChart labels={Object.keys(gradeDist)} data={Object.values(gradeDist)} height={300} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Students" subtitle="Top 10 by final marks" action={<TrendingUp size={18} className="text-emerald-500" />}>
          <StudentList students={top} accent="emerald" onDownload={(id) => generateStudentReport(students.find((s) => s.id === id)!)} />
        </Card>
        <Card title="Weak Students" subtitle="Bottom 10 by final marks" action={<TrendingDown size={18} className="text-rose-500" />}>
          <StudentList students={weak} accent="rose" onDownload={(id) => generateStudentReport(students.find((s) => s.id === id)!)} />
        </Card>
      </div>
    </div>
  );
}

function StudentList({ students, accent, onDownload }: {
  students: { id: string; student_id: string; name: string; department: string; final_marks: number }[];
  accent: 'emerald' | 'rose';
  onDownload: (id: string) => void;
}) {
  const dot = accent === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500';
  return (
    <ol className="space-y-2">
      {students.map((s, i) => (
        <li key={s.id} className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2">
          <span className={`grid place-items-center h-7 w-7 rounded-lg text-xs font-bold text-white ${dot}`}>{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
            <p className="text-xs text-slate-500">{s.student_id} · {s.department}</p>
          </div>
          <span className="font-bold text-slate-800 dark:text-white">{s.final_marks}</span>
          <button onClick={() => onDownload(s.id)} className="text-slate-400 hover:text-brand-500" title="Download report">
            <Download size={16} />
          </button>
        </li>
      ))}
    </ol>
  );
}
