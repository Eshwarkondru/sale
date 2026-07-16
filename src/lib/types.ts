export type Role = 'student' | 'faculty' | 'admin';

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
  semester: number;
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
  quiz_marks: number;
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
export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk';

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

export interface WeeklyProgress {
  id: string;
  student_id: string;
  week_number: number;
  study_hours: number;
  revision_hours: number;
  sleep_hours: number;
  mock_test_score: number | null;
  learning_difficulty: string | null;
  created_at: string;
}

export type WeeklyProgressInput = Omit<WeeklyProgress, 'id' | 'created_at'>;

export interface ChatMessage {
  id?: string;
  user_id?: string;
  role: 'user' | 'assistant';
  message: string;
  created_at?: string;
}

export interface StudentPrediction {
  predictedMarks: number;
  predictedGPA: number;
  grade: string;
  passProbability: number;
  backlogRisk: boolean;
  category: PerformanceCategory;
  riskLevel: RiskLevel;
}
