import { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Sparkles, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import { useData } from '../context/DataContext';
import { parseCsv, toCsv, downloadFile, type ParseResult } from '../lib/csv';
import Spinner from '../components/Spinner';
import { generateSampleStudents } from '../lib/seed';

export default function UploadPage() {
  const { bulkInsert, students } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setMsg(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    setResult(parsed);
    setBusy(false);
  };

  const handleImport = async () => {
    if (!result || result.students.length === 0) return;
    setBusy(true);
    const { error, inserted } = await bulkInsert(result.students);
    setBusy(false);
    if (error) setMsg({ type: 'error', text: error });
    else setMsg({ type: 'success', text: `Imported ${inserted} students successfully.` });
    setResult(null);
  };

  const handleSeed = async () => {
    setBusy(true);
    const sample = generateSampleStudents(1000);
    const { error, inserted } = await bulkInsert(sample);
    setBusy(false);
    if (error) setMsg({ type: 'error', text: error });
    else setMsg({ type: 'success', text: `Generated and imported ${inserted} sample students.` });
  };

  const handleExport = () => {
    const csv = toCsv(students.map((s) => ({
      student_id: s.student_id, name: s.name, age: s.age ?? 0, gender: s.gender, department: s.department,
      attendance: s.attendance, math: s.math, physics: s.physics, chemistry: s.chemistry, english: s.english,
      computer: s.computer, previous_gpa: s.previous_gpa, study_hours: s.study_hours,
      assignments_completed: s.assignments_completed, internal_marks: s.internal_marks, final_marks: s.final_marks,
    })));
    downloadFile('students_export.csv', csv);
  };

  const handleDownloadTemplate = () => {
    const template = 'student_id,name,age,gender,department,attendance,math,physics,chemistry,english,computer,previous_gpa,study_hours,assignments_completed,internal_marks,final_marks\nSTU0001,John Doe,19,Male,Computer Science,85,78,82,75,80,88,8.2,5,9,78,82';
    downloadFile('eduinsight_template.csv', template);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Upload Dataset</h1>
        <p className="text-slate-500 dark:text-slate-400">Import a CSV file with student records. Data is automatically cleaned.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className="border-2 border-dashed border-brand-300 dark:border-brand-500/40 rounded-2xl p-10 text-center hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {busy ? <Spinner size={32} /> : <UploadCloud size={40} className="mx-auto text-brand-500 mb-3" />}
            <p className="font-semibold text-slate-700 dark:text-slate-200">Drop CSV file here or click to browse</p>
            <p className="text-sm text-slate-500 mt-1">Expected columns: student_id, name, age, gender, department, attendance, math, physics, chemistry, english, computer, previous_gpa, study_hours, assignments_completed, internal_marks, final_marks</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-outline" onClick={handleDownloadTemplate}><FileSpreadsheet size={16} /> Download Template</button>
            <button className="btn-outline" onClick={handleSeed}><Sparkles size={16} /> Generate 1000 Sample Students</button>
            <button className="btn-outline" onClick={handleExport}><UploadCloud size={16} /> Export Current ({students.length})</button>
          </div>
        </Card>

        <Card title="Data Cleaning" subtitle="Automatic processing applied">
          <ul className="space-y-3 text-sm">
            <CleanItem label="Missing values filled" done />
            <CleanItem label="Duplicate rows removed" done />
            <CleanItem label="Categorical columns encoded" done />
            <CleanItem label="Numerical features normalized" done />
          </ul>
          {result && (
            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="flex justify-between"><span className="text-slate-500">Parsed rows</span><span className="font-semibold">{result.students.length}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Missing filled</span><span className="font-semibold">{result.cleaned.missingFilled}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Duplicates removed</span><span className="font-semibold">{result.cleaned.duplicatesRemoved}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Categorical encoded</span><span className="font-semibold">{result.cleaned.encoded}</span></p>
              {result.errors.length > 0 && <p className="text-rose-500 mt-1">{result.errors.length} warnings</p>}
            </div>
          )}
        </Card>
      </div>

      {msg && (
        <div className={`glass-card p-4 flex items-center gap-3 ${msg.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          {msg.text}
        </div>
      )}

      {result && result.students.length > 0 && (
        <Card title="Preview" subtitle={`${result.students.length} students ready to import`} action={
          <div className="flex gap-2">
            <button className="btn-ghost text-rose-500" onClick={() => setResult(null)}><Trash2 size={16} /> Discard</button>
            <button className="btn-primary" onClick={handleImport} disabled={busy}>{busy ? <Spinner size={16} /> : <UploadCloud size={16} />} Import</button>
          </div>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/10">
                  {['ID', 'Name', 'Dept', 'Attend', 'Math', 'Final'].map((h) => <th key={h} className="text-left py-2 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.students.slice(0, 8).map((s) => (
                  <tr key={s.student_id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-2 font-mono text-xs">{s.student_id}</td>
                    <td className="py-2 font-medium text-slate-800 dark:text-white">{s.name}</td>
                    <td className="py-2 text-slate-500">{s.department}</td>
                    <td className="py-2">{s.attendance}%</td>
                    <td className="py-2">{s.math}</td>
                    <td className="py-2 font-semibold">{s.final_marks}</td>
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

function CleanItem({ label, done }: { label: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {done ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
    </li>
  );
}
