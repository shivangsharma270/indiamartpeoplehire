import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { Job, Application } from '../types';
import { Search, MapPin, Briefcase, ChevronRight, Sparkles, Clock, CheckCircle, TrendingUp, Filter, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<(Application & { job: Job })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [filterLocation, setFilterLocation] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    const { data: appsData } = await supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .eq('candidate_id', user?.id)
      .order('created_at', { ascending: false });
    
    setJobs(jobsData || []);
    setMyApplications(appsData || []);
    setLoading(false);
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'all' || j.location === filterLocation;
    const matchesExperience = filterExperience === 'all' || j.experience_required === filterExperience;
    return matchesSearch && matchesLocation && matchesExperience;
  });

  if (loading) return <div className="p-20 text-center flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header Area */}
      <div className="p-4 md:p-8 bg-white border-b border-slate-200 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
        <div className="w-full md:w-1/2 space-y-1 text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Discover Opportunities</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Find your next big role with our intelligent matching.</p>
        </div>
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-3 md:top-3.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search roles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto md:overflow-hidden flex flex-col md:flex-row min-h-0 container mx-auto max-w-6xl">
        {/* Main Job List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-red-500" /> 
              Recommended Jobs
            </h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <select 
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="bg-white border border-slate-200 outline-none text-xs font-bold text-slate-600 px-3 py-1.5 rounded-lg shadow-sm focus:ring-1 focus:ring-red-500 appearance-none min-w-[120px]"
              >
                <option value="all">Any Location</option>
                {Array.from(new Set(jobs.map(j => j.location).filter(Boolean))).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <select 
                value={filterExperience}
                onChange={(e) => setFilterExperience(e.target.value)}
                className="bg-white border border-slate-200 outline-none text-xs font-bold text-slate-600 px-3 py-1.5 rounded-lg shadow-sm focus:ring-1 focus:ring-red-500 appearance-none min-w-[120px]"
              >
                <option value="all">Any Experience</option>
                {Array.from(new Set(jobs.map(j => j.experience_required).filter(Boolean))).map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredJobs.length > 0 ? filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} applied={myApplications.some(a => a.job_id === job.id)} />
            )) : (
              <div className="col-span-full p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                 <Briefcase size={32} className="mx-auto text-slate-300 mb-3" />
                 <p className="text-sm text-slate-500 font-medium">No positions matching your search criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Applications Status */}
        <aside className="w-full md:w-96 bg-white border-l border-slate-200 overflow-auto flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
               Application Status
            </h3>
          </div>
          
          <div className="p-6 space-y-4 flex-1">
            {myApplications.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 border border-slate-100">
                  <Briefcase size={24} className="text-slate-300" />
                </div>
                <h4 className="text-slate-700 font-bold mb-1">No Applications</h4>
                <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto">You haven't applied to any positions yet.</p>
              </div>
            ) : (
              myApplications.map((app) => {
                const isRejected = app.status === 'rejected';
                const isAccepted = app.status === 'accepted';
                const isShortlisted = app.status === 'shortlisted';
                const displayStatus = isShortlisted ? 'Shortlisted' : (app.status === 'pending' || app.status === 'reviewing') ? 'In Process' : app.status;
                const jobCode = `ID-${app.job.id.split('-')[0].toUpperCase()}`;

                return (
                  <div key={app.id} className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{app.job.title}</p>
                        <p className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 inline-block">{jobCode}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isRejected ? 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-50' :
                        isAccepted ? 'bg-green-50 text-green-600 border-green-100 shadow-sm shadow-green-50' :
                        isShortlisted ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50' :
                        'bg-slate-50 text-slate-600 border-slate-200 shadow-sm shadow-slate-50'
                      }`}>
                        {displayStatus}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                       <span className="text-xs font-semibold text-slate-500 pl-1">
                          {app.job.company}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-300" />
                          {new Date(app.created_at).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="p-6 mt-auto shrink-0 border-t border-slate-100 bg-slate-50/50">
            <div className="p-5 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl text-white shadow-xl shadow-red-100 relative overflow-hidden">
               <div className="relative z-10">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Sparkles size={16} /> Enhance Profile
                  </h4>
                  <p className="text-xs text-red-100 leading-relaxed font-medium mb-4">Add your latest skills to improve job match accuracy across algorithms.</p>
                  <Link to="/profile" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white text-red-700 px-4 py-2 rounded-xl hover:bg-red-50 transition-all shadow-sm">
                    Update Profile <ChevronRight size={12} />
                  </Link>
               </div>
               <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function JobCard({ job, applied }: { job: Job, applied: boolean, key?: any }) {
  const jobCode = `ID-${job.id.split('-')[0].toUpperCase()}`;

  return (
    <Link 
      to={`/jobs/${job.id}`}
      className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-red-400 hover:shadow-lg hover:shadow-red-50 transition-all flex flex-col group relative overflow-hidden h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-xl border border-red-100 shadow-sm shrink-0">
          {job.company?.[0] || 'C'}
        </div>
        {applied && (
           <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 shadow-sm">
             <CheckCircle size={10} /> Applied
           </span>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">{job.title}</h3>
        <p className="text-sm text-slate-500 font-medium">{job.company}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 border border-slate-100">
          <MapPin size={12} className="text-slate-400" />
          {job.location}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 border border-slate-100">
          <Briefcase size={12} className="text-slate-400" />
          {job.experience_required}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-[10px] font-mono font-bold text-slate-400">{jobCode}</span>
        <div className="text-red-600 font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 group-hover:transition-all">
          View details <ChevronRight size={16} />
        </div>
      </div>
    </Link>
  );
}
