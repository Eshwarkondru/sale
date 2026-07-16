import { useEffect, useMemo, useState } from 'react';
import { Users, Award, TrendingDown, Target, CheckCircle2, CalendarClock } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of student performance across the dataset.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Students" value={stats.totalStudents} icon={<Users size={20} />} accent="brand" />
        <StatCard label="Average Marks" value={stats.averageMarks} icon={<Award size={20} />} accent="accent" />
        <StatCard label="Highest Score" value={stats.highestScore} icon={<Target size={20} />} accent="emerald" />
        <StatCard label="Lowest Score" value={stats.lowestScore} icon={<TrendingDown size={20} />} accent="rose" />
        <StatCard label="Pass %" value={`${stats.passPercentage}%`} icon={<CheckCircle2 size={20} />} accent="violet" />
        <StatCard label="Attendance %" value={`${stats.attendancePercentage}%`} icon={<CalendarClock size={20} />} accent="amber" />
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
