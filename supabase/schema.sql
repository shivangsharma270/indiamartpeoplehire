-- Create tables for Indiamart PeopleFlow AI Platform

-- 1. Jobs Table
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  experience_required TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Candidates Table (Profile info for candidates)
CREATE TABLE candidates (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
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

-- 3. Applications Table
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_url TEXT NOT NULL,
  resume_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AI Scores Table
CREATE TABLE ai_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  experience_relevance TEXT,
  recommendation TEXT CHECK (recommendation IN ('Strong Match', 'Moderate Match', 'Weak Match')),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) - Basic setup
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;

-- Job policies: anyone can read active jobs
CREATE POLICY "Anyone can view jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Admins can manage jobs" ON jobs FOR ALL USING (auth.jwt() ->> 'email' = 'admin@company.com');

-- Candidate policies: users can manage their own profile
CREATE POLICY "Users can manage their own profile" ON candidates FOR ALL USING (auth.uid() = id);

-- Application policies: users can see their own, admins can see all
CREATE POLICY "Users can view their applications" ON applications FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Users can submit applications" ON applications FOR INSERT WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "Admins can view all applications" ON applications FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@company.com');
CREATE POLICY "Admins can update application status" ON applications FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@company.com');

-- AI scores policies: users can see scores for their applications, admins can see all
CREATE POLICY "Users can view their scores" ON ai_scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = ai_scores.application_id 
    AND applications.candidate_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all scores" ON ai_scores FOR ALL USING (auth.jwt() ->> 'email' = 'admin@company.com');

-- NOTE: Set up Storage Bucket named 'resumes' manually in Supabase dashboard
-- Policy for 'resumes' bucket:
-- Authenticated users can upload to their own folder, admins can read all.
