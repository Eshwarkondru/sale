import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, TrendingDown, Target, CheckCircle2, CalendarClock, AlertTriangle, GraduationCap } from 'lucide-react';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import { SeriesChart, PieChart, RadarChart } from '../components/Charts';
import { useData } from '../context/DataContext';
import { computeStats } from '../lib/stats';
import { SUBJECTS, SUBJECT_LABELS } from '../lib/types';
import { FullPageLoader } from '../components/Spinner';

export default function DashboardPage() {
  const { students, loading, seedIfEmpty } = useData();
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!loading && students.length === 0) {
      setSeeding(true);
      seedIfEmpty().finally(() => setSeeding(false));
    }
  }, [loading, students.length, seedIfEmpty]);

  const stats = useMemo(() => computeStats(students), [students]);

  if (loading || seeding) return <FullPageLoader label={seeding ? 'Generating sample dataset of 1000 students...' : 'Loading dashboard...'} />;

  const atRiskCount = students.filter((s) => s.final_marks < 50 || s.attendance < 65).length;
  const avgGPA = students.length ? (students.reduce((a, s) => a + s.previous_gpa, 0) / students.length).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of student performance across the dataset.</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: <Users size={18} />, accent: 'brand' as const },
          { label: 'Avg Attendance', value: `${stats.attendancePercentage}%`, icon: <CalendarClock size={18} />, accent: 'amber' as const },
          { label: 'Average GPA', value: avgGPA, icon: <GraduationCap size={18} />, accent: 'accent' as const },
          { label: 'Pass %', value: `${stats.passPercentage}%`, icon: <CheckCircle2 size={18} />, accent: 'emerald' as const },
          { label: 'At Risk', value: atRiskCount, icon: <AlertTriangle size={18} />, accent: 'rose' as const },
          { label: 'Avg Marks', value: stats.averageMarks, icon: <Award size={18} />, accent: 'brand' as const },
          { label: 'Highest', value: stats.highestScore, icon: <Target size={18} />, accent: 'emerald' as const },
          { label: 'Lowest', value: stats.lowestScore, icon: <TrendingDown size={18} />, accent: 'rose' as const },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Subject-wise Average" subtitle="Average marks across all subjects" className="lg:col-span-2">
          <SeriesChart
            labels={SUBJECTS.map((s) => SUBJECT_LABELS[s])}
            datasets={[{ label: 'Average Marks', data: SUBJECTS.map((s) => Math.round(stats.subjectAverages[s] * 10) / 10) }]}
            type="bar"
            height={300}
          />
        </Card>
        <Card title="Performance Categories" subtitle="Distribution of student performance">
          <PieChart
            labels={['Excellent', 'Good', 'Average', 'Poor']}
            data={[stats.categoryCounts.Excellent, stats.categoryCounts.Good, stats.categoryCounts.Average, stats.categoryCounts.Poor]}
            doughnut
            height={300}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Attendance Distribution" subtitle="Number of students per attendance band" className="lg:col-span-2">
          <SeriesChart
            labels={stats.attendanceBuckets.map((b) => b.label)}
            datasets={[{ label: 'Students', data: stats.attendanceBuckets.map((b) => b.count) }]}
            type="bar"
            height={280}
          />
        </Card>
        <Card title="Gender Comparison" subtitle="Students by gender">
          <PieChart
            labels={Object.keys(stats.genderCounts)}
            data={Object.values(stats.genderCounts)}
            height={280}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Subject Radar" subtitle="Average performance per subject" className="lg:col-span-2">
          <RadarChart
            labels={SUBJECTS.map((s) => SUBJECT_LABELS[s])}
            datasets={[{ label: 'Average', data: SUBJECTS.map((s) => Math.round(stats.subjectAverages[s])) }]}
            height={320}
          />
        </Card>
        <Card title="Marks Trend by Age" subtitle="Average final marks per age group">
          <SeriesChart
            labels={stats.marksTrend.map((m) => m.label)}
            datasets={[{ label: 'Avg Final Marks', data: stats.marksTrend.map((m) => Math.round(m.avg)) }]}
            type="line"
            height={320}
          />
        </Card>
      </div>
    </div>
  );
}
