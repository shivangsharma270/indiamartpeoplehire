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
  candidate_id TEXT NOT NULL, -- Firebase UID (TEXT)
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

-- ENABLE RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewer_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tickets ENABLE ROW LEVEL SECURITY;

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
