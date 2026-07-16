import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Download, Upload, Users as UsersIcon } from 'lucide-react';
import Card from '../components/Card';
import { useData } from '../context/DataContext';
import { DEPARTMENTS, type Student, type StudentInput } from '../lib/types';
import { toCsv, downloadFile, parseCsv } from '../lib/csv';
import Spinner, { FullPageLoader } from '../components/Spinner';
import { supabase } from '../lib/supabase';

const EMPTY: StudentInput = {
  student_id: '', name: '', age: 18, gender: 'Male', department: DEPARTMENTS[0],
  attendance: 75, math: 60, physics: 60, chemistry: 60, english: 60, computer: 60,
  previous_gpa: 7, study_hours: 4, assignments_completed: 5, internal_marks: 60, final_marks: 60,
};

export default function AdminPage() {
  const { students, loading, addStudent, updateStudent, deleteStudent, bulkInsert } = useData();
  const [editing, setEditing] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StudentInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; email: string; full_name: string; role: string }[] | null>(null);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      student_id: s.student_id, name: s.name, age: s.age ?? 18, gender: s.gender, department: s.department,
      attendance: s.attendance, math: s.math, physics: s.physics, chemistry: s.chemistry, english: s.english,
      computer: s.computer, previous_gpa: s.previous_gpa, study_hours: s.study_hours,
      assignments_completed: s.assignments_completed, internal_marks: s.internal_marks, final_marks: s.final_marks,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = editing ? await updateStudent(editing.id, form) : await addStudent(form);
    setBusy(false);
    if (error) setError(error);
    else { setShowForm(false); setForm(EMPTY); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student? This cannot be undone.')) return;
    setBusy(true);
    await deleteStudent(id);
    setBusy(false);
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

  const handleImport = async (file: File) => {
    setBusy(true); setError(null);
    const text = await file.text();
    const { students: parsed, errors } = parseCsv(text);
    if (errors.length && parsed.length === 0) { setError(errors.join(' ')); setBusy(false); return; }
    const { error } = await bulkInsert(parsed);
    setBusy(false);
    if (error) setError(error);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('id, email, full_name, role');
    if (error) setError(error.message);
    else setUsers(data as { id: string; email: string; full_name: string; role: string }[]);
  };

  if (loading) return <FullPageLoader label="Loading admin panel..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Admin Panel</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage student records and users.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={openAdd}><Plus size={16} /> Add Student</button>
          <button className="btn-outline" onClick={handleExport}><Download size={16} /> Export CSV</button>
          <label className="btn-outline cursor-pointer">
            <Upload size={16} /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} />
          </label>
          <button className="btn-outline" onClick={loadUsers}><UsersIcon size={16} /> Manage Users</button>
        </div>
      </div>

      {error && <div className="glass-card p-3 text-rose-500 text-sm">{error}</div>}

      {showForm && (
        <Card title={editing ? 'Edit Student' : 'Add Student'} action={<button onClick={() => setShowForm(false)} className="text-slate-400"><X size={18} /></button>}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Student ID"><input className="input" required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} /></Field>
            <Field label="Name"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Age"><input type="number" className="input" value={form.age ?? 0} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /></Field>
            <Field label="Gender"><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select></Field>
            <Field label="Department"><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Attendance (%)"><input type="number" className="input" value={form.attendance} onChange={(e) => setForm({ ...form, attendance: Number(e.target.value) })} /></Field>
            <Field label="Math"><input type="number" className="input" value={form.math} onChange={(e) => setForm({ ...form, math: Number(e.target.value) })} /></Field>
            <Field label="Physics"><input type="number" className="input" value={form.physics} onChange={(e) => setForm({ ...form, physics: Number(e.target.value) })} /></Field>
            <Field label="Chemistry"><input type="number" className="input" value={form.chemistry} onChange={(e) => setForm({ ...form, chemistry: Number(e.target.value) })} /></Field>
            <Field label="English"><input type="number" className="input" value={form.english} onChange={(e) => setForm({ ...form, english: Number(e.target.value) })} /></Field>
            <Field label="Computer"><input type="number" className="input" value={form.computer} onChange={(e) => setForm({ ...form, computer: Number(e.target.value) })} /></Field>
            <Field label="Previous GPA"><input type="number" step="0.1" className="input" value={form.previous_gpa} onChange={(e) => setForm({ ...form, previous_gpa: Number(e.target.value) })} /></Field>
            <Field label="Study Hours"><input type="number" step="0.1" className="input" value={form.study_hours} onChange={(e) => setForm({ ...form, study_hours: Number(e.target.value) })} /></Field>
            <Field label="Assignments"><input type="number" className="input" value={form.assignments_completed} onChange={(e) => setForm({ ...form, assignments_completed: Number(e.target.value) })} /></Field>
            <Field label="Internal Marks"><input type="number" className="input" value={form.internal_marks} onChange={(e) => setForm({ ...form, internal_marks: Number(e.target.value) })} /></Field>
            <Field label="Final Marks"><input type="number" className="input" value={form.final_marks} onChange={(e) => setForm({ ...form, final_marks: Number(e.target.value) })} /></Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <button className="btn-primary" disabled={busy}>{busy ? <Spinner size={16} /> : <Plus size={16} />} {editing ? 'Save Changes' : 'Add Student'}</button>
            </div>
          </form>
        </Card>
      )}

      {users && (
        <Card title="Manage Users" subtitle={`${users.length} registered users`} action={<button onClick={() => setUsers(null)} className="text-slate-400"><X size={18} /></button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-slate-500 border-b border-slate-200 dark:border-white/10"><th className="text-left py-2 font-medium">Name</th><th className="text-left py-2 font-medium">Email</th><th className="text-left py-2 font-medium">Role</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-2 font-medium text-slate-800 dark:text-white">{u.full_name ?? '-'}</td>
                    <td className="py-2 text-slate-500">{u.email}</td>
                    <td className="py-2"><span className={`badge ${u.role === 'admin' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title={`All Students (${students.length})`} subtitle="Edit or remove records">
        {busy && <div className="mb-3"><Spinner size={20} /></div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200 dark:border-white/10">
                {['ID', 'Name', 'Dept', 'Attend', 'Final', 'Actions'].map((h) => <th key={h} className="text-left py-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 50).map((s) => (
                <tr key={s.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="py-2 font-mono text-xs">{s.student_id}</td>
                  <td className="py-2 font-medium text-slate-800 dark:text-white">{s.name}</td>
                  <td className="py-2 text-slate-500">{s.department}</td>
                  <td className="py-2">{s.attendance}%</td>
                  <td className="py-2 font-semibold">{s.final_marks}</td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length > 50 && <p className="text-xs text-slate-400 mt-2">Showing first 50 of {students.length}. Use Export for full data.</p>}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
