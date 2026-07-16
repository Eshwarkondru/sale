import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileBarChart, GraduationCap, Clock, BookOpen, CheckSquare, AlertTriangle, Target, Percent } from 'lucide-react';
import Card from '../components/Card';
import { RadarChart, SeriesChart } from '../components/Charts';
import { useData } from '../context/DataContext';
import { SUBJECTS, SUBJECT_LABELS } from '../lib/types';
import { predictStudent } from '../lib/ml';
import { generateRecommendations } from '../lib/recommendations';
import { FullPageLoader } from '../components/Spinner';

export default function StudentDetailPage() {
  const { id } = useParams();
  const { students, loading } = useData();
  const navigate = useNavigate();

  if (loading) return <FullPageLoader />;
  const s = students.find((x) => x.id === id);
  if (!s) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Student not found.</p>
        <Link to="/students" className="btn-primary mt-4 inline-flex">Back to Students</Link>
      </div>
    );
  }

  const pred = predictStudent(s);
  const recs = generateRecommendations(s);

  const priorityColor: Record<string, string> = {
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={18} /> Back</button>
        <Link to={`/report/${s.id}`} className="btn-primary"><FileBarChart size={18} /> Download PDF Report</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="grid place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white text-2xl font-bold shadow-glow">
              {s.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white">{s.name}</h2>
              <p className="text-sm text-slate-500">{s.student_id} · {s.department}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <Row icon={<GraduationCap size={15} />} label="Age / Gender" value={`${s.age ?? '-'} · ${s.gender}`} />
            <Row icon={<Clock size={15} />} label="Attendance" value={`${s.attendance}%`} />
            <Row icon={<BookOpen size={15} />} label="Study Hours/day" value={`${s.study_hours} hrs`} />
            <Row icon={<CheckSquare size={15} />} label="Assignments" value={`${s.assignments_completed}/10`} />
            <Row icon={<BookOpen size={15} />} label="Previous GPA" value={`${s.previous_gpa}`} />
            <Row icon={<BookOpen size={15} />} label="Internal Marks" value={`${s.internal_marks}`} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
              <p className="text-xs text-slate-500">Final</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{s.final_marks}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
              <p className="text-xs text-slate-500">Grade</p>
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{pred.grade}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
              <p className="text-xs text-slate-500">Status</p>
              <p className={`text-xl font-bold ${pred.passProbability > 0.5 ? 'text-emerald-600' : 'text-rose-600'}`}>{pred.passProbability > 0.5 ? 'Pass' : 'Fail'}</p>
            </div>
          </div>
        </Card>

        <Card title="ML Predictions" subtitle="AI-powered academic forecast" className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <PredBox icon={<Target size={16} />} label="Predicted Marks" value={String(pred.predictedMarks)} />
            <PredBox icon={<GraduationCap size={16} />} label="Predicted GPA" value={String(pred.predictedGPA)} />
            <PredBox icon={<Percent size={16} />} label="Pass Probability" value={`${Math.round(pred.passProbability * 100)}%`} good={pred.passProbability > 0.6} />
            <PredBox icon={<AlertTriangle size={16} />} label="Backlog Risk" value={pred.backlogRisk ? 'Yes' : 'No'} good={!pred.backlogRisk} />
            <PredBox icon={<BookOpen size={16} />} label="Category" value={pred.category} good={pred.category === 'Excellent' || pred.category === 'Good'} />
            <PredBox icon={<AlertTriangle size={16} />} label="Risk Level" value={pred.riskLevel} good={pred.riskLevel === 'Low Risk'} />
          </motion.div>
        </Card>

        <Card title="Subject Performance" subtitle="Marks across all subjects" className="lg:col-span-2">
          <RadarChart
            labels={SUBJECTS.map((sub) => SUBJECT_LABELS[sub])}
            datasets={[{ label: s.name, data: SUBJECTS.map((sub) => Number(s[sub] ?? 0)) }]}
            height={320}
          />
        </Card>
      </div>

      <Card title="Subject Marks Breakdown" subtitle="Bar chart of subject scores">
        <SeriesChart
          labels={SUBJECTS.map((sub) => SUBJECT_LABELS[sub])}
          datasets={[{ label: 'Marks', data: SUBJECTS.map((sub) => Number(s[sub] ?? 0)) }]}
          type="bar"
          height={260}
        />
      </Card>

      <Card title="AI Recommendations" subtitle={`Personalized suggestions for ${s.name}`}>
        <div className="space-y-3">
          {recs.map((r, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-slate-50 dark:bg-white/5 p-4">
              <span className={`badge ${priorityColor[r.priority]} h-fit shrink-0`}>{r.priority}</span>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{r.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PredBox({ icon, label, value, good }: { icon: React.ReactNode; label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">{icon} {label}</div>
      <p className={`text-lg font-bold ${good === undefined ? 'text-slate-800 dark:text-white' : good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{value}</p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">{icon} {label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}
