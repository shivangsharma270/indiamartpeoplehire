import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Application, AIScore, Candidate } from '../types';
import { Plus, Users, Briefcase, Trash2, Edit3, Download, ExternalLink, TrendingUp, Search, MapPin, Filter, Sparkles, Loader2, CheckCircle, XCircle, LayoutDashboard, Settings, Layers, Box, Star, Menu, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Link, useLocation } from 'react-router-dom';

import { analyzeResume } from '../lib/gemini';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<(Application & { job: Job, candidate: Candidate, ai_score: AIScore | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'shortlisted'>('all');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeProduct, setActiveProduct] = useState('hirepilot');
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  const [jobForm, setJobForm] = useState({
    title: '',
    company: "Indiamart's PeopleFlow",
    location: '',
    description: '',
    required_skills: '',
    experience_required: '',
  });

  useEffect(() => {
    fetchData();

    const handleMessage = (event: MessageEvent) => {
      // Validate origin if needed, but for simplicity:
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        toast.success("Calendar connected successfully!");
        fetchData();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all necessary tables separately since PostgREST can't find some FK relationships
      const [
        { data: jobsData, error: jobsError },
        { data: appsData, error: appsError },
        { data: candidatesData, error: candError },
        { data: scoresData, error: scoresError }
      ] = await Promise.all([
        supabase.from('jobs').select('*').order('created_at', { ascending: false }),
        supabase.from('applications').select('*').order('created_at', { ascending: false }),
        supabase.from('candidates').select('*'),
        supabase.from('ai_scores').select('*')
      ]);

      if (jobsError) console.error('Jobs Error:', jobsError);
      if (appsError) console.error('Apps Error:', appsError);
      if (candError) console.error('Candidates Error:', candError);
      if (scoresError) console.error('Scores Error:', scoresError);

      const jobsMap = new Map((jobsData || []).map(j => [j.id, j]));
      const candidatesMap = new Map((candidatesData || []).map(c => [c.id, c]));
      const scoresMap = new Map((scoresData || []).map(s => [s.application_id, s]));

      const enrichedApps = (appsData || []).map(app => ({
        ...app,
        job: jobsMap.get(app.job_id),
        candidate: candidatesMap.get(app.candidate_id),
        ai_score: scoresMap.get(app.id) || null
      })).filter(app => app.job && app.candidate); // Filter out orphans if any

      // Check calendar connection
      const { count } = await supabase.from('interviewer_tokens').select('*', { count: 'exact', head: true });
      setIsCalendarConnected((count || 0) > 0);

      setJobs(jobsData || []);
      const sortedApps = enrichedApps.sort((a, b) => (b.ai_score?.score || 0) - (a.ai_score?.score || 0));
      setApplications(sortedApps as any);
    } catch (err) {
      console.error('Fetch Data Error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (app: Application & { job: Job }) => {
    if (!app.resume_text) {
      toast.error("No resume text extracted for this applicant.");
      return;
    }
    
    setAnalyzingId(app.id);
    try {
      toast.info(`Analyzing ${app.candidate_id}...`);
      const result = await analyzeResume(app.resume_text, app.job.description);
      
      const { error } = await supabase
        .from('ai_scores')
        .upsert({
          application_id: app.id,
          score: result.score,
          matched_skills: result.matchedSkills,
          missing_skills: result.missingSkills,
          experience_relevance: result.experienceRelevance,
          recommendation: result.recommendation,
          summary: result.summary,
        });

      if (error) throw error;
      toast.success("Analysis complete!");
      fetchData();
    } catch (error: any) {
      toast.error(`AI Error: ${error.message}`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('jobs').insert({
      ...jobForm,
      required_skills: jobForm.required_skills.split(',').map(s => s.trim()),
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Job posted successfully');
      setShowJobModal(false);
      setJobForm({
        title: '',
        company: "Indiamart's PeopleFlow",
        location: '',
        description: '',
        required_skills: '',
        experience_required: '',
      });
      fetchData();
    }
  };

  const handleUpdateStatus = async (appId: string, status: 'accepted' | 'rejected' | 'reviewing' | 'shortlisted') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', appId);
      
      if (error) throw error;
      
      if (status === 'shortlisted') {
        const portalUrl = `${window.location.origin}/schedule/${appId}`;
        toast.info(`Shortlisted! Invitation link generated: ${portalUrl}`, {
          duration: 10000,
          action: {
            label: 'Copy Link',
            onClick: () => navigator.clipboard.writeText(portalUrl)
          }
        });
        console.log(`[SIMULATED EMAIL SENT] to candidate. Portal Link: ${portalUrl}`);
      } else {
        toast.success(`Candidate ${status}`);
      }
      
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const resp = await fetch('/api/auth/google/url');
      const { url } = await resp.json();
      window.open(url, '_blank');
    } catch (error) {
      toast.error("Failed to get auth URL");
    }
  };

  if (loading) return <div className="p-20 text-center flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeProduct === 'hirepilot' ? (
          <>
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10 w-full relative">
              <div className="flex items-center gap-3 md:gap-5">
                 <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl md:rounded-2xl flex items-center justify-center border border-red-100/50 shadow-sm shrink-0">
                    <Sparkles className="text-red-500" size={24} />
                 </div>
                 <div>
                   <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">HirePilot AI <span className="text-slate-300 font-light mx-1 md:mx-2">/</span> Command</h2>
                 </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={handleConnectCalendar}
                  className={`flex-1 md:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 border ${isCalendarConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  <Calendar size={16} />
                  {isCalendarConnected ? 'Ready' : 'Calendar'}
                </button>
                <button
                  onClick={() => setShowJobModal(true)}
                  className="flex-1 md:flex-none px-4 md:px-5 py-2 md:py-2.5 bg-red-600 text-white rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                  <Plus size={16} />
                  Post Position
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
                <CompactStatsCard icon={<Briefcase size={18} />} label="Open Roles" value={jobs.filter(j => j.status !== 'filled').length} color="red" />
                <CompactStatsCard icon={<Users size={18} />} label="Applicants" value={applications.length} color="blue" />
              </section>

              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row min-h-0 overflow-hidden">
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50">
                  <div className="p-4 border-b border-slate-100 shrink-0 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">Job Filters</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest md:hidden">Scroll for more</span>
                  </div>
                  <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 gap-1 no-scrollbar">
                    <button 
                      onClick={() => setSelectedJobId('all')} 
                      className={`whitespace-nowrap shrink-0 md:w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${selectedJobId === 'all' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      All ({applications.length})
                    </button>
                    {jobs.map(job => (
                      <button 
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)} 
                        className={`whitespace-nowrap shrink-0 md:w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${selectedJobId === job.id ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <div className="truncate max-w-[120px] md:max-w-none">{job.title}</div>
                        <div className="text-[10px] font-medium opacity-70 mt-0.5">{applications.filter(a => a.job_id === job.id).length}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border-b border-slate-100 gap-3 shrink-0">
                    <div className="flex gap-2">
                       <button onClick={() => setViewMode('all')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
                       <button onClick={() => setViewMode('shortlisted')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'shortlisted' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>Shortlisted</button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input 
                        placeholder="Search candidates..." 
                        className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                  <AnimatePresence mode="wait">
                      <motion.table 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full text-left border-collapse min-w-[700px]"
                      >
                        <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200 z-10">
                          <tr>
                            <th className="px-6 py-3">Candidate</th>
                            <th className="px-6 py-3">Position</th>
                            <th className="px-6 py-3">AI Match</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {applications
                             .filter(a => selectedJobId === 'all' || a.job_id === selectedJobId)
                             .filter(a => viewMode === 'all' || a.status === 'shortlisted')
                             .filter(a => a.candidate?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
                             .sort((a, b) => (b.ai_score?.score || 0) - (a.ai_score?.score || 0))
                             .map((app) => {
                               const priorCount = applications.filter(a => a.candidate_id === app.candidate_id && a.id !== app.id).length;
                               return (
                            <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  {app.candidate?.full_name}
                                  {priorCount > 0 && (
                                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-amber-200" title="Previous Applications">
                                      {priorCount} prior {priorCount === 1 ? 'app' : 'apps'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono tracking-tighter mt-1">{app.candidate?.experience} Exp • {app.candidate?.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-semibold text-slate-600">{app.job.title}</div>
                                <div className="text-[10px] font-mono font-bold text-slate-400 mt-1">ID-{app.job.id.split('-')[0].toUpperCase()}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1 h-1 bg-slate-100 rounded-full w-20 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        (app.ai_score?.score || 0) >= 80 ? 'bg-green-500' :
                                        (app.ai_score?.score || 0) >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                      }`}
                                      style={{ width: `${app.ai_score?.score || 0}%` }}
                                    />
                                  </div>
                                  <span className={`font-black text-xs min-w-[24px] ${
                                    (app.ai_score?.score || 0) >= 80 ? 'text-green-600' : 'text-slate-500'
                                  }`}>{app.ai_score?.score || 0}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                   app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                   app.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-100' :
                                   app.status === 'shortlisted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                   app.status === 'reviewing' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                   'bg-slate-50 text-slate-500 border-slate-100'
                                 }`}>
                                   {app.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {app.status !== 'shortlisted' && app.status !== 'accepted' && app.status !== 'rejected' && (
                                      <button onClick={() => handleUpdateStatus(app.id, 'shortlisted')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Shortlist"><Star size={16} /></button>
                                  )}
                                  {app.status !== 'accepted' && (
                                      <button onClick={() => handleUpdateStatus(app.id, 'accepted')} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-all" title="Accept"><CheckCircle size={16} /></button>
                                  )}
                                  {app.status !== 'rejected' && (
                                      <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Reject"><XCircle size={16} /></button>
                                  )}
                                  <a href={app.resume_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                                    <Download size={16} />
                                  </a>
                                  <Link to={`/admin/applicant/${app.id}`} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                                    <ExternalLink size={16} />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                      </motion.table>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Box size={48} className="text-slate-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Select a Product</h2>
            <p className="text-slate-500">Choose a product from the sidebar to manage.</p>
          </div>
        )}
      </main>

      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-slate-200">
             <h3 className="text-xl font-bold mb-6 text-slate-900 tracking-tight">New Position Descriptor</h3>
             <form onSubmit={handleCreateJob} className="space-y-4">
                <input placeholder="Job Title" value={jobForm.title} onChange={(e) => setJobForm({...jobForm, title: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" required />
                <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({...jobForm, location: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" required />
                    <input placeholder="Experience (e.g. 3-5 yrs)" value={jobForm.experience_required} onChange={(e) => setJobForm({...jobForm, experience_required: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" required />
                </div>
                <textarea placeholder="Job Description" value={jobForm.description} onChange={(e) => setJobForm({...jobForm, description: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none h-32 resize-none focus:ring-2 focus:ring-red-500" required />
                <input placeholder="Required Skills (comma separated)" value={jobForm.required_skills} onChange={(e) => setJobForm({...jobForm, required_skills: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" required />
                <div className="flex gap-3 pt-4">
                   <button type="button" onClick={() => setShowJobModal(false)} className="flex-1 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                   <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all">Publish Job</button>
                </div>
             </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function CompactStatsCard({ icon, label, value, suffix = '', color }: any) {
  const colors = {
    red: 'text-red-500 bg-red-50 border-red-100',
    blue: 'text-blue-500 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  }[color as 'red' | 'blue' | 'emerald'];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`p-3.5 rounded-xl ${colors} border`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{value}{suffix}</p>
      </div>
    </div>
  );
}
