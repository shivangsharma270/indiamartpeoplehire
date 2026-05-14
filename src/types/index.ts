export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  required_skills: string[];
  experience_required: string;
  status?: 'active' | 'filled';
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  current_company: string;
  portfolio_url: string;
  expected_salary: number;
  notice_period: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  resume_url: string;
  resume_text: string;
  created_at: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
}

export interface AIScore {
  id: string;
  application_id: string;
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_relevance: string;
  recommendation: 'Strong Match' | 'Moderate Match' | 'Weak Match';
  summary: string;
}
