import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, FileDown } from 'lucide-react';
import Card from '../components/Card';
import { RadarChart, SeriesChart } from '../components/Charts';
import { useData } from '../context/DataContext';
import { SUBJECTS, SUBJECT_LABELS } from '../lib/types';
import { predictStudent } from '../lib/ml';
import { generateRecommendations } from '../lib/recommendations';
import { generateStudentReport } from '../lib/pdf';
import { FullPageLoader } from '../components/Spinner';

export default function ReportPage() {
  const { id } = useParams();
  const { students, loading } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    const s = students.find((x) => x.id === id);
    if (!loading && s) {
      // Auto-generate PDF on visit
      generateStudentReport(s);
      navigate(`/students/${s.id}`, { replace: true });
    }
  }, [students, loading, id, navigate]);

  if (loading) return <FullPageLoader label="Preparing report..." />;
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={18} /> Back</button>
        <button onClick={() => generateStudentReport(s)} className="btn-primary"><FileDown size={18} /> Download PDF</button>
      </div>

      <Card title="Report Preview" subtitle={`${s.name} (${s.student_id})`}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Stat label="Final Marks" value={String(s.final_marks)} />
            <Stat label="Grade" value={pred.grade} />
            <Stat label="Pass Prob." value={`${Math.round(pred.passProbability * 100)}%`} />
            <Stat label="Risk Level" value={pred.riskLevel} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Stat label="Pred. Marks" value={String(pred.predictedMarks)} />
            <Stat label="Pred. GPA" value={String(pred.predictedGPA)} />
            <Stat label="Backlog Risk" value={pred.backlogRisk ? 'Yes' : 'No'} />
            <Stat label="Category" value={pred.category} />
          </div>

          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Subject Performance</p>
            <SeriesChart labels={SUBJECTS.map((sub) => SUBJECT_LABELS[sub])} datasets={[{ label: 'Marks', data: SUBJECTS.map((sub) => Number(s[sub] ?? 0)) }]} type="bar" height={240} />
          </div>

          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Radar Profile</p>
            <RadarChart labels={SUBJECTS.map((sub) => SUBJECT_LABELS[sub])} datasets={[{ label: s.name, data: SUBJECTS.map((sub) => Number(s[sub] ?? 0)) }]} height={260} />
          </div>

          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Recommendations</p>
            <ul className="space-y-2">
              {recs.map((r, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                  <span className="text-brand-500">•</span>
                  <span><strong>{r.title}:</strong> {r.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}
