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
    const { data: jobsData } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    const { data: appsData } = await supabase
      .from('applications')
      .select('*, job:jobs(*), candidate:candidates(*), ai_score:ai_scores(*)')
      .order('created_at', { ascending: false });
    
    // Check calendar connection
    const { count } = await supabase.from('interviewer_tokens').select('*', { count: 'exact', head: true });
    setIsCalendarConnected((count || 0) > 0);

    setJobs(jobsData || []);
    const sortedApps = (appsData || []).sort((a, b) => (b.ai_score?.score || 0) - (a.ai_score?.score || 0));
    setApplications(sortedApps);
    setLoading(false);
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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Centralized sidebar */}
      <aside className={`${isSidebarOpen ? 'w-44' : 'w-0'} bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all duration-300 overflow-hidden relative border-r border-white/5`}>
        <div className="p-4 border-b border-slate-800 min-w-[176px] relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>
          <div className="flex items-center gap-2.5 mb-2 relative z-10">
            <div className="p-1 bg-white/10 rounded border border-white/10 backdrop-blur-md">
              <img src="/imlogo.png" alt="IndiaMART" className="h-4 object-contain brightness-0 invert" />
            </div>
          </div>
          <h1 className="text-base font-black text-white tracking-tight flex items-start flex-col gap-0.5 mt-2 relative z-10">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">IndiaMART</span>
            <span className="leading-tight">PeopleFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">AI</span></span>
          </h1>
        </div>
        
        <div className="p-2.5 flex-1 overflow-auto space-y-5 text-xs">
          <div>
             <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2.5 px-2">Ecosystem</div>
             <div className="space-y-0.5">
               <button 
                 onClick={() => setActiveProduct('hirepilot')}
                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all duration-200 ${activeProduct === 'hirepilot' ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-900/40 translate-x-0.5' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
               >
                 <Box size={14} className={activeProduct === 'hirepilot' ? 'text-white' : 'text-slate-500'} />
                 <span>HirePilot</span>
               </button>
               <button 
                 className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold hover:bg-white/5 text-slate-500 transition-colors opacity-50 cursor-not-allowed"
                 disabled
               >
                 <div className="flex items-center gap-2.5">
                   <Box size={14} />
                   <span>Interview</span>
                 </div>
                 <span className="text-[7px] font-black bg-white/5 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase">Soon</span>
               </button>
                <button 
                 className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold hover:bg-white/5 text-slate-500 transition-colors opacity-50 cursor-not-allowed"
                 disabled
               >
                 <div className="flex items-center gap-2.5">
                   <Box size={14} />
                   <span>Onboard</span>
                 </div>
                 <span className="text-[7px] font-black bg-white/5 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase">Soon</span>
               </button>
             </div>
          </div>
          
          <div>
             <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2.5 px-2">Governance</div>
             <div className="space-y-0.5">
               <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                 <Users size={14} className="text-slate-500" />
                 <span>IAM & Roles</span>
               </button>
               <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                 <Settings size={14} className="text-slate-500" />
                 <span>Environment</span>
               </button>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
             <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2.5 px-2">Knowledge</div>
             <div className="space-y-0.5">
               <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                 <Box size={14} className="text-slate-500" />
                 <span>Help Center</span>
               </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeProduct === 'hirepilot' ? (
          <>
            <div className="px-8 py-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10 w-full relative">
              <div className="flex items-center gap-5">
                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100 shadow-sm">
                    <Menu size={18} />
                 </button>
                 <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl flex items-center justify-center border border-red-100/50 shadow-sm shrink-0">
                    <Sparkles className="text-red-500" size={28} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">HirePilot AI <span className="text-slate-300 font-light mx-2">/</span> Command</h2>
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-0.5">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     Live Talent Intake
                   </div>
                 </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConnectCalendar}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 border ${isCalendarConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  <Calendar size={18} />
                  {isCalendarConnected ? 'Calendar Ready' : 'Connect Calendar'}
                </button>
                <button
                  onClick={() => setShowJobModal(true)}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                  <Plus size={18} />
                  Post Position
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
              <section className="grid md:grid-cols-3 gap-4 shrink-0">
                <CompactStatsCard icon={<Briefcase size={18} />} label="Open Roles" value={jobs.length} color="red" />
                <CompactStatsCard icon={<Users size={18} />} label="Applicants" value={applications.length} color="blue" />
                <CompactStatsCard icon={<TrendingUp size={18} />} label="Avg Score" value={
                  applications.length > 0 
                  ? Math.round(applications.reduce((acc, app) => acc + (app.ai_score?.score || 0), 0) / applications.length)
                  : 0
                } suffix="%" color="emerald" />
              </section>

              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-row min-h-0 overflow-hidden">
                <div className="w-64 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50">
                  <div className="p-4 border-b border-slate-100 shrink-0">
                    <h3 className="text-sm font-bold text-slate-800">Positions</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button 
                      onClick={() => setSelectedJobId('all')} 
                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${selectedJobId === 'all' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      All Positions ({applications.length})
                    </button>
                    {jobs.map(job => (
                      <button 
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)} 
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${selectedJobId === job.id ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <div className="truncate">{job.title}</div>
                        <div className="text-[10px] font-medium opacity-70 mt-0.5">{applications.filter(a => a.job_id === job.id).length} applicants</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                    <div className="flex gap-2">
                       <button onClick={() => setViewMode('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All Applicants</button>
                       <button onClick={() => setViewMode('shortlisted')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'shortlisted' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>Shortlisted</button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input 
                        placeholder="Search candidates..." 
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-500 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto">
                  <AnimatePresence mode="wait">
                      <motion.table 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full text-left border-collapse"
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
