import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { Job, Application, AIScore } from '../types';
import { Search, MapPin, Briefcase, ChevronRight, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<(Application & { job: Job, ai_score: AIScore | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: jobsData } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    const { data: appsData } = await supabase
      .from('applications')
      .select('*, job:jobs(*), ai_score:ai_scores(*)')
      .eq('candidate_id', user?.id);
    
    setJobs(jobsData || []);
    setMyApplications(appsData || []);
    setLoading(false);
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header Area */}
      <div className="p-6 bg-white border-b border-slate-200 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search roles (e.g. Design, Frontend...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-red-500 outline-none transition-all"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
           <div className="px-4 py-1.5 bg-white text-red-600 text-[11px] font-bold uppercase tracking-wider rounded-md shadow-sm">Feed</div>
           <div className="px-4 py-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">Remote</div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Main Job List */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Available Opportunities</h2>
          <div className="grid grid-cols-1 gap-3">
            {filteredJobs.length > 0 ? filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} applied={myApplications.some(a => a.job_id === job.id)} />
            )) : (
              <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-xl">
                 <p className="text-xs text-slate-400 font-medium tracking-tight">No positions matching your current filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Applications Status */}
        <aside className="w-full md:w-80 bg-white border-l border-slate-200 overflow-auto p-6 space-y-6">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Application History</h3>
            <div className="space-y-3">
              {myApplications.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                  <Briefcase size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No applications yet</p>
                </div>
              ) : (
                myApplications.map((app) => (
                  <div key={app.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 group">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{app.job.title}</p>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                        app.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                        app.status === 'reviewing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                          <Clock size={10} /> {new Date(app.created_at).toLocaleDateString()}
                       </span>
                       <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-red-600">{app.ai_score?.score}%</span>
                          <Sparkles size={10} className="text-red-500" />
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-5 bg-red-600 rounded-2xl text-white shadow-xl shadow-red-100 relative overflow-hidden">
             <div className="relative z-10">
                <h4 className="text-sm font-bold mb-2">Enhance your Profile</h4>
                <p className="text-[10px] text-red-100 leading-relaxed font-medium">Add more skills to your professional identity to improve AI match scores across all positions.</p>
                <Link to="/profile" className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all">
                  Go to Profile <ChevronRight size={12} />
                </Link>
             </div>
             <Sparkles className="absolute -bottom-2 -right-2 text-white/10" size={80} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function JobCard({ job, applied }: { job: Job, applied: boolean, key?: any }) {
  return (
    <Link 
      to={`/jobs/${job.id}`}
      className="bg-white p-5 rounded-xl border border-slate-200 hover:border-red-400 shadow-sm transition-all flex items-start justify-between group"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">{job.title}</h3>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            <MapPin size={12} className="text-slate-400" />
            {job.location}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            <Briefcase size={12} className="text-slate-400" />
            {job.experience_required}
          </div>
        </div>
      </div>
      <div className="shrink-0 pt-1">
        {applied ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-green-100">
            <CheckCircle size={10} /> Applied
          </span>
        ) : (
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
            <ChevronRight size={18} />
          </div>
        )}
      </div>
    </Link>
  );
}
