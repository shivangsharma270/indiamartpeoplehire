import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Application, AIScore, Candidate } from '../types';
import { Plus, Users, Briefcase, Trash2, Edit3, Download, ExternalLink, TrendingUp, Search, MapPin, Filter, Sparkles, Loader2, CheckCircle, XCircle, LayoutDashboard, Settings, Layers, Box } from 'lucide-react';
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
  
  const [activeProduct, setActiveProduct] = useState('hirepilot');

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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: jobsData } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    const { data: appsData } = await supabase
      .from('applications')
      .select('*, job:jobs(*), candidate:candidates(*), ai_score:ai_scores(*)')
      .order('created_at', { ascending: false });
    
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

  const handleUpdateStatus = async (appId: string, status: 'accepted' | 'rejected' | 'reviewing') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', appId);
      
      if (error) throw error;
      toast.success(`Candidate ${status}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-20 text-center flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Centralized sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <img src="/imlogo.png" alt="IndiaMART" className="h-8 object-contain mb-4 brightness-0 invert" />
          <h1 className="text-xl font-black text-white tracking-tight">PeopleFlow AI</h1>
          <p className="text-xs text-slate-400 font-medium">Centralized Command</p>
        </div>
        
        <div className="p-4 flex-1 overflow-auto space-y-8">
          <div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">Products</div>
             <div className="space-y-1">
               <button 
                 onClick={() => setActiveProduct('hirepilot')}
                 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeProduct === 'hirepilot' ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}
               >
                 <Box size={16} className={activeProduct === 'hirepilot' ? 'text-white' : 'text-slate-400'} />
                 HirePilot AI
               </button>
               <button 
                 onClick={() => setActiveProduct('interviewpilot')}
                 className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeProduct === 'interviewpilot' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300 opacity-60'}`}
                 disabled
               >
                 <div className="flex items-center gap-3">
                   <Box size={16} className="text-slate-500" />
                   InterviewPilot
                 </div>
                 <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase">Soon</span>
               </button>
                <button 
                 onClick={() => setActiveProduct('onboardpilot')}
                 className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeProduct === 'onboardpilot' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300 opacity-60'}`}
                 disabled
               >
                 <div className="flex items-center gap-3">
                   <Box size={16} className="text-slate-500" />
                   OnboardPilot
                 </div>
                 <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase">Soon</span>
               </button>
             </div>
          </div>
          
          <div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">Global configuration</div>
             <div className="space-y-1">
               <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 text-slate-300 transition-colors">
                 <Users size={16} className="text-slate-400" />
                 User Roles & Access
               </button>
               <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 text-slate-300 transition-colors">
                 <Settings size={16} className="text-slate-400" />
                 Platform Settings
               </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeProduct === 'hirepilot' ? (
          <>
            <div className="p-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm z-10 w-full relative">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 shrink-0">
                    <Sparkles className="text-red-500" size={24} />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-slate-800">HirePilot AI Command</h2>
                   <p className="text-xs text-slate-500 font-medium">Manage talent pipeline and AI evaluation.</p>
                 </div>
              </div>
              <div className="flex gap-2">
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

              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                  <h3 className="text-sm font-bold text-slate-800">Applicants Area</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                      placeholder="Search..." 
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
                          {applications.filter(a => a.candidate?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{app.candidate?.full_name}</div>
                                <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{app.candidate?.experience} Exp • {app.candidate?.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-semibold text-slate-600">{app.job.title}</div>
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
                                   app.status === 'reviewing' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                   'bg-slate-50 text-slate-500 border-slate-100'
                                 }`}>
                                   {app.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
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
                          ))}
                        </tbody>
                      </motion.table>
                  </AnimatePresence>
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
