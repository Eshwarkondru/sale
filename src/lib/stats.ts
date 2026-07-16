import type { Student, PerformanceCategory } from './types';
import { SUBJECTS } from './types';
import { categoryFromMarks, gradeFromMarks } from './ml';

export interface DashboardStats {
  totalStudents: number;
  averageMarks: number;
  highestScore: number;
  lowestScore: number;
  passPercentage: number;
  attendancePercentage: number;
  categoryCounts: Record<PerformanceCategory, number>;
  gradeCounts: Record<string, number>;
  genderCounts: Record<string, number>;
  departmentCounts: Record<string, number>;
  subjectAverages: Record<string, number>;
  attendanceBuckets: { label: string; count: number }[];
  marksTrend: { label: string; avg: number }[];
}

export function computeStats(students: Student[]): DashboardStats {
  const n = students.length;
  if (n === 0) {
    return {
      totalStudents: 0,
      averageMarks: 0,
      highestScore: 0,
      lowestScore: 0,
      passPercentage: 0,
      attendancePercentage: 0,
      categoryCounts: { Excellent: 0, Good: 0, Average: 0, Poor: 0 },
      gradeCounts: {},
      genderCounts: {},
      departmentCounts: {},
      subjectAverages: {},
      attendanceBuckets: [],
      marksTrend: [],
    };
  }

  const finals = students.map((s) => s.final_marks);
  const avg = finals.reduce((a, b) => a + b, 0) / n;
  const high = Math.max(...finals);
  const low = Math.min(...finals);
  const passCount = finals.filter((m) => m >= 40).length;
  const attendanceAvg = students.reduce((a, s) => a + s.attendance, 0) / n;

  const categoryCounts: Record<PerformanceCategory, number> = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
  const gradeCounts: Record<string, number> = {};
  const genderCounts: Record<string, number> = {};
  const departmentCounts: Record<string, number> = {};

  for (const s of students) {
    const cat = categoryFromMarks(s.final_marks);
    categoryCounts[cat]++;
    const g = gradeFromMarks(s.final_marks);
    gradeCounts[g] = (gradeCounts[g] ?? 0) + 1;
    genderCounts[s.gender] = (genderCounts[s.gender] ?? 0) + 1;
    departmentCounts[s.department] = (departmentCounts[s.department] ?? 0) + 1;
  }

  const subjectAverages: Record<string, number> = {};
  for (const sub of SUBJECTS) {
    subjectAverages[sub] = students.reduce((a, s) => a + Number(s[sub] ?? 0), 0) / n;
  }

  const attendanceBuckets = [
    { label: '<60', min: 0, max: 59 },
    { label: '60-70', min: 60, max: 69 },
    { label: '70-80', min: 70, max: 79 },
    { label: '80-90', min: 80, max: 89 },
    { label: '90+', min: 90, max: 200 },
  ].map((b) => ({ label: b.label, count: students.filter((s) => s.attendance >= b.min && s.attendance <= b.max).length }));

  // Marks trend by age (proxy for semester progression)
  const byAge = new Map<number, number[]>();
  for (const s of students) {
    const a = s.age ?? 18;
    if (!byAge.has(a)) byAge.set(a, []);
    byAge.get(a)!.push(s.final_marks);
  }
  const marksTrend = Array.from(byAge.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([age, arr]) => ({ label: `Age ${age}`, avg: arr.reduce((x, y) => x + y, 0) / arr.length }));

  return {
    totalStudents: n,
    averageMarks: Math.round(avg * 10) / 10,
    highestScore: Math.round(high),
    lowestScore: Math.round(low),
    passPercentage: Math.round((passCount / n) * 1000) / 10,
    attendancePercentage: Math.round(attendanceAvg * 10) / 10,
    categoryCounts,
    gradeCounts,
    genderCounts,
    departmentCounts,
    subjectAverages,
    attendanceBuckets,
    marksTrend,
  };
}

export function correlationMatrix(students: Student[]): { labels: string[]; matrix: number[][] } {
  const cols = [...SUBJECTS, 'attendance', 'study_hours', 'internal_marks', 'final_marks'] as const;
  const labels = cols.map((c) => c);
  const data = students.map((s) => cols.map((c) => Number(s[c] ?? 0)));
  const n = data.length;
  const d = cols.length;
  const means = labels.map((_, j) => data.reduce((a, row) => a + row[j], 0) / n);
  const stds = labels.map((_, j) => Math.sqrt(data.reduce((a, row) => a + (row[j] - means[j]) ** 2, 0) / n) || 1);
  const matrix: number[][] = [];
  for (let i = 0; i < d; i++) {
    const row: number[] = [];
    for (let j = 0; j < d; j++) {
      let cov = 0;
      for (let k = 0; k < n; k++) cov += (data[k][i] - means[i]) * (data[k][j] - means[j]);
      cov /= n;
      row.push(Math.round((cov / (stds[i] * stds[j])) * 100) / 100);
    }
    matrix.push(row);
  }
  return { labels, matrix };
}
