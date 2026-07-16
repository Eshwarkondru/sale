export type Role = 'student' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  name: string;
  age: number | null;
  gender: string;
  department: string;
  attendance: number;
  math: number;
  physics: number;
  chemistry: number;
  english: number;
  computer: number;
  previous_gpa: number;
  study_hours: number;
  assignments_completed: number;
  internal_marks: number;
  final_marks: number;
  user_id: string;
  created_at: string;
}

export type StudentInput = Omit<Student, 'id' | 'user_id' | 'created_at'>;

export const SUBJECTS = ['math', 'physics', 'chemistry', 'english', 'computer'] as const;
export type Subject = (typeof SUBJECTS)[number];

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  english: 'English',
  computer: 'Computer Science',
};

export const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Information Technology',
  'Electrical',
] as const;

export type PerformanceCategory = 'Excellent' | 'Good' | 'Average' | 'Poor';

export interface ModelResult {
  name: string;
  r2: number;
  rmse: number;
  mae: number;
  predictions: number[];
  featureImportance?: Record<string, number>;
}

export interface TrainingResult {
  models: ModelResult[];
  best: ModelResult;
  features: string[];
  yTest: number[];
  yActual: number[];
}
