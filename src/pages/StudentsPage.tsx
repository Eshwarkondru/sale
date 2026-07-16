import { useMemo, useState } from 'react';
import { Search, Filter, FileBarChart, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { DEPARTMENTS, type Student } from '../lib/types';
import { categoryFromMarks, gradeFromMarks } from '../lib/ml';
import { FullPageLoader } from '../components/Spinner';

const PAGE_SIZE = 12;

export default function StudentsPage() {
  const { students, loading } = useData();
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [grade, setGrade] = useState('');
  const [attendanceMin, setAttendanceMin] = useState(0);
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = query.trim().toLowerCase();
      if (q && !s.name.toLowerCase().includes(q) && !s.student_id.toLowerCase().includes(q) && !s.department.toLowerCase().includes(q)) return false;
      if (dept && s.department !== dept) return false;
      if (gender && s.gender !== gender) return false;
      if (category && categoryFromMarks(s.final_marks) !== category) return false;
      if (grade && gradeFromMarks(s.final_marks) !== grade) return false;
      if (s.attendance < attendanceMin) return false;
      return true;
    });
  }, [students, query, dept, gender, category, grade, attendanceMin]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <FullPageLoader label="Loading students..." />;

  const resetFilters = () => {
    setDept(''); setGender(''); setCategory(''); setGrade(''); setAttendanceMin(0); setQuery(''); setPage(0);
  };
  const activeFilters = [dept, gender, category, grade].filter(Boolean).length + (attendanceMin > 0 ? 1 : 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Students</h1>
          <p className="text-slate-500 dark:text-slate-400">{filtered.length} of {students.length} students</p>
        </div>
        <button className="btn-outline" onClick={() => setShowFilters((v) => !v)}>
          <Filter size={16} /> Filters {activeFilters > 0 && <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{activeFilters}</span>}
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by name, roll number, or department..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
        </div>
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in">
            <div>
              <label className="label">Department</label>
              <select className="input" value={dept} onChange={(e) => { setDept(e.target.value); setPage(0); }}>
                <option value="">All</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={gender} onChange={(e) => { setGender(e.target.value); setPage(0); }}>
                <option value="">All</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }}>
                <option value="">All</option>
                <option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option>
              </select>
            </div>
            <div>
              <label className="label">Grade</label>
              <select className="input" value={grade} onChange={(e) => { setGrade(e.target.value); setPage(0); }}>
                <option value="">All</option>
                {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Min Attendance: {attendanceMin}%</label>
              <input type="range" min={0} max={100} value={attendanceMin} onChange={(e) => { setAttendanceMin(Number(e.target.value)); setPage(0); }} className="w-full accent-brand-600" />
            </div>
            {activeFilters > 0 && (
              <button onClick={resetFilters} className="btn-ghost text-rose-500 justify-self-start col-span-full sm:col-span-1">
                <X size={16} /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pageItems.map((s) => <StudentCard key={s.id} s={s} />)}
        {pageItems.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            No students match your filters.
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-sm text-slate-500">Page {page + 1} of {pageCount}</span>
          <button className="btn-outline" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

function StudentCard({ s }: { s: Student }) {
  const cat = categoryFromMarks(s.final_marks);
  const grade = gradeFromMarks(s.final_marks);
  const catColor: Record<string, string> = {
    Excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    Good: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
    Average: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    Poor: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  };
  return (
    <div className="glass-card p-5 hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start gap-3">
        <div className="grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white font-semibold shrink-0">
          {s.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 dark:text-white truncate">{s.name}</p>
          <p className="text-xs text-slate-500">{s.student_id} · {s.department}</p>
        </div>
        <span className={`badge ${catColor[cat]}`}>{cat}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 dark:bg-white/5 py-2">
          <p className="text-xs text-slate-500">Final</p>
          <p className="font-bold text-slate-800 dark:text-white">{s.final_marks}</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-white/5 py-2">
          <p className="text-xs text-slate-500">Grade</p>
          <p className="font-bold text-slate-800 dark:text-white">{grade}</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-white/5 py-2">
          <p className="text-xs text-slate-500">Attend.</p>
          <p className="font-bold text-slate-800 dark:text-white">{s.attendance}%</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={`/students/${s.id}`} className="btn-outline flex-1 !py-2 text-sm">
          <Eye size={15} /> View
        </Link>
        <Link to={`/report/${s.id}`} className="btn-primary flex-1 !py-2 text-sm">
          <FileBarChart size={15} /> Report
        </Link>
      </div>
    </div>
  );
}
