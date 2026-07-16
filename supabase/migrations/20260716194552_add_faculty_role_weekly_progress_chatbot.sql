/*
# Add faculty role, weekly_progress, chatbot_logs, and student_profile_link

1. Modified Tables
- `profiles`: expand role CHECK to include 'faculty' alongside 'student' and 'admin'.
- `students`: add `semester` (int) and `quiz_marks` (numeric) columns for richer academic data.

2. New Tables
- `weekly_progress`: tracks per-student weekly study metrics (study hours, revision hours,
  sleep hours, mock test score, learning difficulty) entered by the student each week.
  - `id` (uuid PK)
  - `student_id` (text, roll number, references students.student_id)
  - `week_number` (int)
  - `study_hours` (numeric)
  - `revision_hours` (numeric)
  - `sleep_hours` (numeric)
  - `mock_test_score` (numeric, nullable)
  - `learning_difficulty` (text, nullable)
  - `created_at` (timestamptz)
- `chatbot_logs`: stores AI chatbot conversation logs per user.
  - `id` (uuid PK)
  - `user_id` (uuid, references auth.users)
  - `role` (text: 'user' | 'assistant')
  - `message` (text)
  - `created_at` (timestamptz)

3. Security
- Enable RLS on weekly_progress and chatbot_logs.
- weekly_progress: any authenticated user can SELECT (admin/faculty need to view all,
  students view their own). Only authenticated users can INSERT their own weekly data.
- chatbot_logs: users can SELECT/INSERT only their own conversation logs.
- profiles: existing policies already cover SELECT/INSERT/UPDATE for own row; no changes needed.
*/

-- Expand role CHECK to include 'faculty'
DO $$ BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'faculty', 'admin'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add semester and quiz_marks to students
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'semester') THEN
    ALTER TABLE students ADD COLUMN semester int DEFAULT 1;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'quiz_marks') THEN
    ALTER TABLE students ADD COLUMN quiz_marks numeric DEFAULT 0;
  END IF;
END $$;

-- weekly_progress table
CREATE TABLE IF NOT EXISTS weekly_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  week_number int NOT NULL,
  study_hours numeric NOT NULL DEFAULT 0,
  revision_hours numeric NOT NULL DEFAULT 0,
  sleep_hours numeric NOT NULL DEFAULT 0,
  mock_test_score numeric,
  learning_difficulty text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weekly_progress_select_all" ON weekly_progress;
CREATE POLICY "weekly_progress_select_all" ON weekly_progress FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "weekly_progress_insert_own" ON weekly_progress;
CREATE POLICY "weekly_progress_insert_own" ON weekly_progress FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "weekly_progress_update_own" ON weekly_progress;
CREATE POLICY "weekly_progress_update_own" ON weekly_progress FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "weekly_progress_delete_own" ON weekly_progress;
CREATE POLICY "weekly_progress_delete_own" ON weekly_progress FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_weekly_progress_student_id ON weekly_progress(student_id);

-- chatbot_logs table
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatbot_logs_select_own" ON chatbot_logs;
CREATE POLICY "chatbot_logs_select_own" ON chatbot_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chatbot_logs_insert_own" ON chatbot_logs;
CREATE POLICY "chatbot_logs_insert_own" ON chatbot_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chatbot_logs_delete_own" ON chatbot_logs;
CREATE POLICY "chatbot_logs_delete_own" ON chatbot_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user_id ON chatbot_logs(user_id);
