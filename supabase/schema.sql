-- Supabase Schema for IndiaMART PeopleFlow (Firebase Auth + Supabase DB)
-- Fixes: operator does not exist: text = uuid and invalid input syntax for type uuid

-- Note: User IDs are stored as TEXT because they come from Firebase Auth (e.g. "GjI5QaTefmR9Fxp1LfG1AOXmaNB2")
-- Note: auth.uid() in Supabase returned as UUID, so we must cast to TEXT (::text)

-- 1. Enable UUID extension for table primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  experience_required TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Candidates Table (Profile info for candidates)
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY, -- Firebase UID (TEXT)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  skills TEXT[] DEFAULT '{}',
  experience TEXT,
  current_company TEXT,
  portfolio_url TEXT,
  expected_salary NUMERIC,
  notice_period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id), -- Firebase UID (TEXT) with FK added
  resume_url TEXT NOT NULL,
  resume_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'shortlisted')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AI Scores Table
CREATE TABLE IF NOT EXISTS ai_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  experience_relevance TEXT,
  recommendation TEXT CHECK (recommendation IN ('Strong Match', 'Moderate Match', 'Weak Match')),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL, -- Firebase UID (TEXT)
  interviewer_id TEXT NOT NULL, -- Firebase UID or Email (TEXT)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  meet_link TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Interviewer Availability
CREATE TABLE IF NOT EXISTS interviewer_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  interviewer_id TEXT NOT NULL, -- Firebase UID (TEXT)
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE(interviewer_id, day_of_week, start_time, end_time)
);

-- 8. Interviewer Tokens Table
CREATE TABLE IF NOT EXISTS interviewer_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES candidates(id), -- Match the candidate/admin record (TEXT)
  email TEXT UNIQUE NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Chatbot Conversations (Note: user_id is TEXT)
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Firebase UID (TEXT)
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Employee Tickets (Note: user_id is TEXT)
CREATE TABLE IF NOT EXISTS employee_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Firebase UID (TEXT)
  user_name TEXT,
  user_email TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  chatbot_context JSONB,
  resolution TEXT,
  resolved_by TEXT, -- Admin Email or UID
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for recruitment tables to ensure operations work
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviewer_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviewer_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE exit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE exit_interviews DISABLE ROW LEVEL SECURITY;

-- Grants for app roles (Essential for anon/authenticated access to tables)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- POLICIES (With auth.uid()::text casting)

-- Jobs
CREATE POLICY "Anyone can view jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Admins can manage jobs" ON jobs FOR ALL USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');

-- Candidates
CREATE POLICY "Users can manage their own profile" ON candidates FOR ALL USING (auth.uid()::text = id);
CREATE POLICY "Admins can view all profiles" ON candidates FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');

-- Applications
CREATE POLICY "Users can view their applications" ON applications FOR SELECT USING (auth.uid()::text = candidate_id);
CREATE POLICY "Users can submit applications" ON applications FOR INSERT WITH CHECK (auth.uid()::text = candidate_id);
CREATE POLICY "Admins can view all applications" ON applications FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');
CREATE POLICY "Admins can update application status" ON applications FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');

-- AI Scores
CREATE POLICY "Users can view their scores" ON ai_scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = ai_scores.application_id 
    AND applications.candidate_id = auth.uid()::text
  )
);
CREATE POLICY "Admins can manage all scores" ON ai_scores FOR ALL USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');

-- Interviews
CREATE POLICY "Users can view their interviews" ON interviews FOR SELECT USING (
  auth.uid()::text = candidate_id OR auth.uid()::text = interviewer_id OR auth.jwt() ->> 'email' = 'admin@teamstellarx.com'
);
CREATE POLICY "Admins can manage interviews" ON interviews FOR ALL USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');

-- Chatbot
CREATE POLICY "Users can manage their conversations" ON chatbot_conversations FOR ALL USING (auth.uid()::text = user_id);

-- Tickets
CREATE POLICY "Users can manage their tickets" ON employee_tickets FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can manage tickets" ON employee_tickets FOR ALL USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');

-- Tokens
CREATE POLICY "Admins can manage tokens" ON interviewer_tokens FOR ALL USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');

-- 11. Exit Requests
CREATE TABLE IF NOT EXISTS exit_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'interview_completed', 'rejected')),
  reason_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Exit Interviews
CREATE TABLE IF NOT EXISTS exit_interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES exit_requests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  chat_history JSONB DEFAULT '[]',
  insights JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fix for 42501 Permission Denied and ensuring access for app roles
GRANT ALL ON TABLE exit_requests TO anon, authenticated, service_role;
GRANT ALL ON TABLE exit_interviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE employee_tickets TO anon, authenticated, service_role;
GRANT ALL ON TABLE jobs TO anon, authenticated, service_role;
GRANT ALL ON TABLE candidates TO anon, authenticated, service_role;
GRANT ALL ON TABLE applications TO anon, authenticated, service_role;
GRANT ALL ON TABLE ai_scores TO anon, authenticated, service_role;
GRANT ALL ON TABLE interviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE interviewer_availability TO anon, authenticated, service_role;
GRANT ALL ON TABLE interviewer_tokens TO anon, authenticated, service_role;
GRANT ALL ON TABLE chatbot_conversations TO anon, authenticated, service_role;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 13. L&D Module
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  user_name TEXT,
  user_email TEXT,
  employee_id TEXT,
  department TEXT CHECK (department IN ('NSD', 'Tele Monthly', 'Marketplace', 'Business Intelligence', 'HR Department', 'SOA', 'Technical', 'Sales', 'Management', 'HR')),
  role TEXT,
  skills JSONB DEFAULT '[]',
  experience_years INTEGER,
  career_goals TEXT,
  performance_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Course Management
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  departments JSONB DEFAULT '[]', -- Array of departments
  content_url TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'pdf', 'ppt', 'link')),
  quiz_data JSONB DEFAULT '[]', -- [ { question: '', options: [], correct: 0 } ]
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_course_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES employee_profiles(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  quiz_score INTEGER,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Grants
GRANT ALL ON TABLE courses TO anon, authenticated, service_role;
GRANT ALL ON TABLE employee_course_progress TO anon, authenticated, service_role;
GRANT ALL ON TABLE employee_profiles TO anon, authenticated, service_role;

-- Disable RLS
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_course_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES employee_profiles(user_id) ON DELETE CASCADE,
  roadmap JSONB, -- AI generated steps
  recommendations JSONB, -- [ { type: 'certification' | 'training', title: '', url: '' } ]
  gap_analysis TEXT,
  market_trends TEXT, -- AI context on outside market
  readiness_score INTEGER, -- 0-100 for next role
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES employee_profiles(user_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grants
GRANT ALL ON TABLE employee_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE learning_paths TO anon, authenticated, service_role;
GRANT ALL ON TABLE learning_progress TO anon, authenticated, service_role;

-- Disable RLS for now to match project pattern
ALTER TABLE employee_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their exit requests" ON exit_requests FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can manage all exit requests" ON exit_requests FOR ALL USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');

CREATE POLICY "Users can view their exit interviews" ON exit_interviews FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create their exit interviews" ON exit_interviews FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own interview" ON exit_interviews FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can view all exit interviews" ON exit_interviews FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@teamstellarx.com');
