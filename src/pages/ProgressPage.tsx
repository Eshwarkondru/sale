import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Plus, Clock, BookOpen, FileCheck, Target } from 'lucide-react';
import Card from '../components/Card';
import { SeriesChart } from '../components/Charts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { predictStudent } from '../lib/ml';
import type { WeeklyProgress } from '../lib/types';

export default function ProgressPage() {
  const { user } = useAuth();
  const { students } = useData();
  const [entries, setEntries] = useState<WeeklyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    week_number: 1,
    study_hours: 3,
    revision_hours: 1,
    sleep_hours: 7,
    mock_test_score: '',
    learning_difficulty: '',
  });

  const loadEntries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('weekly_progress')
      .select('*')
      .order('week_number', { ascending: true });
    setEntries((data as WeeklyProgress[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const student = students[0];
    if (!student) { setSubmitting(false); return; }
    const { error } = await supabase.from('weekly_progress').insert({
      student_id: student.student_id,
      week_number: form.week_number,
      study_hours: Number(form.study_hours),
      revision_hours: Number(form.revision_hours),
      sleep_hours: Number(form.sleep_hours),
      mock_test_score: form.mock_test_score ? Number(form.mock_test_score) : null,
      learning_difficulty: form.learning_difficulty || null,
    });
    if (!error) {
      setForm({ ...form, mock_test_score: '', learning_difficulty: '' });
      await loadEntries();
    }
    setSubmitting(false);
  };

  const student = students[0];
  const prediction = student ? predictStudent(student) : null;

  const weeks = entries.map((e) => `Week ${e.week_number}`);
  const studyData = entries.map((e) => Number(e.study_hours));
  const revisionData = entries.map((e) => Number(e.revision_hours));
  const sleepData = entries.map((e) => Number(e.sleep_hours));
  const mockData = entries.map((e) => Number(e.mock_test_score ?? 0));

  const avgStudy = entries.length ? (studyData.reduce((a, b) => a + b, 0) / entries.length).toFixed(1) : '0';
  const avgSleep = entries.length ? (sleepData.reduce((a, b) => a + b, 0) / entries.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Weekly Progress Tracker</h1>
        <p className="text-slate-500 dark:text-slate-400">Log your weekly study habits and track your academic progress.</p>
      </motion.div>

      {prediction && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Predicted Marks', value: prediction.predictedMarks, icon: <Target size={18} />, color: 'from-brand-500 to-brand-600' },
            { label: 'Pass Probability', value: `${Math.round(prediction.passProbability * 100)}%`, icon: <FileCheck size={18} />, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Risk Level', value: prediction.riskLevel, icon: <TrendingUp size={18} />, color: prediction.riskLevel === 'High Risk' ? 'from-rose-500 to-rose-600' : prediction.riskLevel === 'Medium Risk' ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600' },
            { label: 'Performance', value: prediction.category, icon: <BookOpen size={18} />, color: 'from-sky-500 to-sky-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
              <Card>
                <div className="flex items-center gap-3">
                  <div className={`grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} text-white`}>{s.icon}</div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Log This Week" subtitle="Enter your weekly study data" className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Week Number">
              <input type="number" className="input" min={1} max={20} value={form.week_number} onChange={(e) => setForm({ ...form, week_number: Number(e.target.value) })} />
            </Field>
            <Field label="Study Hours / Day">
              <input type="number" className="input" step={0.5} min={0} max={16} value={form.study_hours} onChange={(e) => setForm({ ...form, study_hours: Number(e.target.value) })} />
            </Field>
            <Field label="Revision Hours / Day">
              <input type="number" className="input" step={0.5} min={0} max={8} value={form.revision_hours} onChange={(e) => setForm({ ...form, revision_hours: Number(e.target.value) })} />
            </Field>
            <Field label="Sleep Hours / Night">
              <input type="number" className="input" step={0.5} min={0} max={12} value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: Number(e.target.value) })} />
            </Field>
            <Field label="Mock Test Score (optional)">
              <input type="number" className="input" min={0} max={100} placeholder="e.g. 75" value={form.mock_test_score} onChange={(e) => setForm({ ...form, mock_test_score: e.target.value })} />
            </Field>
            <Field label="Learning Difficulty (optional)">
              <select className="input" value={form.learning_difficulty} onChange={(e) => setForm({ ...form, learning_difficulty: e.target.value })}>
                <option value="">None</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
                <option value="Very Hard">Very Hard</option>
              </select>
            </Field>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              <Plus size={18} /> {submitting ? 'Saving...' : 'Add Entry'}
            </button>
          </form>
        </Card>

        <Card title="Progress Trends" subtitle="Weekly study, revision, and sleep hours" className="lg:col-span-2">
          {entries.length === 0 && !loading ? (
            <div className="text-center py-12 text-slate-500">
              <Clock size={40} className="mx-auto mb-3 opacity-50" />
              <p>No entries yet. Log your first week to see trends.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <SeriesChart
                labels={weeks}
                datasets={[
                  { label: 'Study Hours', data: studyData },
                  { label: 'Revision Hours', data: revisionData },
                  { label: 'Sleep Hours', data: sleepData },
                ]}
                type="line"
                height={250}
              />
              {mockData.some((d) => d > 0) && (
                <SeriesChart
                  labels={weeks}
                  datasets={[{ label: 'Mock Test Score', data: mockData }]}
                  type="bar"
                  height={200}
                />
              )}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4">
                  <p className="text-xs text-slate-500">Avg Study Hours</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{avgStudy} hrs/day</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4">
                  <p className="text-xs text-slate-500">Avg Sleep Hours</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{avgSleep} hrs/night</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {entries.length > 0 && (
        <Card title="Entry History" subtitle="All logged weekly entries">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/10">
                  <th className="text-left py-2 font-medium">Week</th>
                  <th className="text-right py-2 font-medium">Study</th>
                  <th className="text-right py-2 font-medium">Revision</th>
                  <th className="text-right py-2 font-medium">Sleep</th>
                  <th className="text-right py-2 font-medium">Mock Test</th>
                  <th className="text-right py-2 font-medium">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-2 font-medium text-slate-700 dark:text-slate-200">Week {e.week_number}</td>
                    <td className="text-right py-2">{e.study_hours}h</td>
                    <td className="text-right py-2">{e.revision_hours}h</td>
                    <td className="text-right py-2">{e.sleep_hours}h</td>
                    <td className="text-right py-2">{e.mock_test_score ?? '—'}</td>
                    <td className="text-right py-2">{e.learning_difficulty ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
