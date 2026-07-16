import Papa from 'papaparse';
import type { StudentInput } from './types';
import { DEPARTMENTS } from './types';

const FIELD_MAP: Record<string, keyof StudentInput> = {
  student_id: 'student_id',
  studentid: 'student_id',
  rollnumber: 'student_id',
  roll: 'student_id',
  name: 'name',
  age: 'age',
  gender: 'gender',
  department: 'department',
  attendance: 'attendance',
  math: 'math',
  maths: 'math',
  mathematics: 'math',
  physics: 'physics',
  chemistry: 'chemistry',
  english: 'english',
  computer: 'computer',
  computerscience: 'computer',
  previous_gpa: 'previous_gpa',
  previousgpa: 'previous_gpa',
  gpa: 'previous_gpa',
  study_hours: 'study_hours',
  studyhours: 'study_hours',
  assignments_completed: 'assignments_completed',
  assignmentscompleted: 'assignments_completed',
  assignments: 'assignments_completed',
  internal_marks: 'internal_marks',
  internalmarks: 'internal_marks',
  internal: 'internal_marks',
  final_marks: 'final_marks',
  finalmarks: 'final_marks',
  final: 'final_marks',
};

function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[\s_-]/g, '');
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export interface ParseResult {
  students: StudentInput[];
  errors: string[];
  cleaned: { missingFilled: number; duplicatesRemoved: number; encoded: number; normalized: boolean };
}

export function parseCsv(text: string): ParseResult {
  const result: ParseResult = { students: [], errors: [], cleaned: { missingFilled: 0, duplicatesRemoved: 0, encoded: 0, normalized: false } };
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    parsed.errors.forEach((e) => result.errors.push(`Row ${e.row}: ${e.message}`));
  }
  const rows = parsed.data;
  if (!rows.length) {
    result.errors.push('CSV is empty or has no data rows.');
    return result;
  }

  const seen = new Set<string>();
  let missingFilled = 0;
  let encoded = 0;

  rows.forEach((raw, idx) => {
    const mapped: Partial<Record<keyof StudentInput, string>> = {};
    for (const k of Object.keys(raw)) {
      const nk = normalizeKey(k);
      const field = FIELD_MAP[nk];
      if (field) mapped[field] = (raw[k] ?? '').toString().trim();
    }
    if (!mapped.student_id && !mapped.name) {
      result.errors.push(`Row ${idx + 2}: missing student_id and name, skipped.`);
      return;
    }
    // Fill missing values with column-aware defaults
    const sid = mapped.student_id || `STU${String(idx + 1).padStart(4, '0')}`;
    const name = mapped.name || 'Unknown';
    if (!mapped.student_id) missingFilled++;
    if (!mapped.name) missingFilled++;

    let gender = (mapped.gender || '').toLowerCase();
    if (!gender) {
      gender = Math.random() > 0.5 ? 'Male' : 'Female';
      encoded++;
    } else if (gender === 'm') {
      gender = 'Male';
      encoded++;
    } else if (gender === 'f') {
      gender = 'Female';
      encoded++;
    }

    let department = mapped.department || DEPARTMENTS[idx % DEPARTMENTS.length];
    if (!mapped.department) encoded++;

    const key = `${sid}-${name.toLowerCase()}`;
    if (seen.has(key)) {
      result.cleaned.duplicatesRemoved++;
      return;
    }
    seen.add(key);

    const student: StudentInput = {
      student_id: sid,
      name,
      age: num(mapped.age) || 18,
      gender: gender.charAt(0).toUpperCase() + gender.slice(1),
      department,
      attendance: num(mapped.attendance) || 75,
      math: num(mapped.math) || 60,
      physics: num(mapped.physics) || 60,
      chemistry: num(mapped.chemistry) || 60,
      english: num(mapped.english) || 60,
      computer: num(mapped.computer) || 60,
      previous_gpa: num(mapped.previous_gpa) || 7,
      study_hours: num(mapped.study_hours) || 4,
      assignments_completed: Math.round(num(mapped.assignments_completed)) || 5,
      internal_marks: num(mapped.internal_marks) || 60,
      final_marks: num(mapped.final_marks) || 60,
    };
    result.students.push(student);
  });

  result.cleaned.missingFilled = missingFilled;
  result.cleaned.encoded = encoded;
  result.cleaned.normalized = true;
  return result;
}

export function toCsv(students: StudentInput[]): string {
  const data = students.map((s) => ({
    student_id: s.student_id,
    name: s.name,
    age: s.age,
    gender: s.gender,
    department: s.department,
    attendance: s.attendance,
    math: s.math,
    physics: s.physics,
    chemistry: s.chemistry,
    english: s.english,
    computer: s.computer,
    previous_gpa: s.previous_gpa,
    study_hours: s.study_hours,
    assignments_completed: s.assignments_completed,
    internal_marks: s.internal_marks,
    final_marks: s.final_marks,
  }));
  return Papa.unparse(data);
}

export function downloadFile(filename: string, content: string, mime = 'text/csv'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
