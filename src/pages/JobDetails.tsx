import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { Job, Application } from '../types';
import { MapPin, Briefcase, Calendar, Building, ChevronLeft, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [userApp, setUserApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobAndApp();
  }, [id, user?.id]);

  const fetchJobAndApp = async () => {
    if (!id) return;
    
    // Fetch job details
    const { data: jobData } = await supabase.from('jobs').select('*').eq('id', id).single();
    setJob(jobData);

    // If user is logged in, check if they already applied
    if (user?.id) {
      const { data: appData } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', id)
        .eq('candidate_id', user.id)
        .maybeSingle();
      
      setUserApp(appData);
    }
    
    setLoading(false);
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading...</div>;
  }

  if (!job) {
    return <div className="text-center p-20">Job not found</div>;
  }

  const jobCode = `ID-${job.id.split('-')[0].toUpperCase()}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors group">
        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
        Back to listings
      </Link>

      <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-50" />
        
        <header className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-red-100">
                {job.company?.[0]}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-extrabold text-slate-900">{job.title}</h1>
                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-xs font-mono font-bold">{jobCode}</span>
                </div>
                <div className="flex items-center gap-2 text-xl text-slate-600 font-medium">
                  <Building size={20} className="text-slate-400" />
                  {job.company}
                </div>
              </div>
            </div>
            
            {userApp ? (
              <div className="bg-slate-100 text-slate-500 px-6 py-4 rounded-xl font-bold text-lg border border-slate-200 flex items-center gap-2 self-start shrink-0 cursor-not-allowed">
                <CheckCircle size={20} className="text-green-500" />
                Already Applied
              </div>
            ) : job.status === 'filled' ? (
              <div className="bg-amber-50 text-amber-600 px-6 py-4 rounded-xl font-bold text-lg border border-amber-200 flex items-center gap-2 self-start shrink-0 cursor-not-allowed shadow-sm shadow-amber-50">
                <Briefcase size={20} />
                Position Filled
              </div>
            ) : (
              <Link
                to={`/apply/${job.id}`}
                className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2 active:scale-95 self-start shrink-0"
              >
                Apply Now
                <ArrowRight size={20} />
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
              <MapPin size={18} />
              <span className="font-semibold">{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
              <Calendar size={18} />
              <span className="font-semibold">{job.experience_required} Exp</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
              <Clock size={18} />
              <span className="font-semibold">Posted {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        <section className="mt-12 grid md:grid-cols-3 gap-12 relative z-10">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Job Description</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                {job.description}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, i) => (
                  <span key={i} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
               <h3 className="font-bold text-red-900 mb-2">Hiring Process</h3>
               <ul className="space-y-3 text-red-700 text-sm font-medium">
                 <li className="flex items-center gap-2.5">
                   <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                   AI Resume Screening
                 </li>
                 <li className="flex items-center gap-2.5">
                   <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                   Technical Interview
                 </li>
                 <li className="flex items-center gap-2.5">
                   <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                   HR Culture Fit
                 </li>
               </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
