/*
# Create profiles and students tables for EduInsight AI

1. New Tables
- `profiles`: extends auth.users with a role (student/admin) and display name.
  - `id` (uuid, PK, references auth.users)
  - `email` (text, unique)
  - `full_name` (text)
  - `role` (text: 'student' | 'admin', default 'student')
  - `created_at` (timestamptz)
- `students`: per-student academic record. Owner-scoped to the admin who uploaded it,
  but admins can share/see all student data, so we scope SELECT to authenticated users.
  - `id` (uuid, PK)
  - `student_id` (text, roll number, e.g. STU001)
  - `name` (text)
  - `age` (int)
  - `gender` (text: 'Male' | 'Female' | 'Other')
  - `department` (text)
  - `attendance` (numeric, percentage)
  - `math` (numeric, marks)
  - `physics` (numeric)
  - `chemistry` (numeric)
  - `english` (numeric)
  - `computer` (numeric)
  - `previous_gpa` (numeric)
  - `study_hours` (numeric)
  - `assignments_completed` (int)
  - `internal_marks` (numeric)
  - `final_marks` (numeric)
  - `user_id` (uuid, references auth.users, the admin who uploaded)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- profiles: users can read/update their own profile row.
- students: any authenticated user can SELECT (admins + students both need read access
  for dashboards/reports). Only the owner admin can INSERT/UPDATE/DELETE their uploaded rows.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  name text NOT NULL,
  age int,
  gender text,
  department text,
  attendance numeric,
  math numeric,
  physics numeric,
  chemistry numeric,
  english numeric,
  computer numeric,
  previous_gpa numeric,
  study_hours numeric,
  assignments_completed int,
  internal_marks numeric,
  final_marks numeric,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_all" ON students;
CREATE POLICY "students_select_all" ON students FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "students_insert_own" ON students;
CREATE POLICY "students_insert_own" ON students FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "students_update_own" ON students;
CREATE POLICY "students_update_own" ON students FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "students_delete_own" ON students;
CREATE POLICY "students_delete_own" ON students FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
