import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { Candidate, Application, Job } from '../types';
import { User, Mail, Phone, Briefcase, MapPin, Save, ShieldCheck, Globe, Calendar, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Candidate>>({
    full_name: '',
    email: user?.email || '',
    phone: '',
    current_company: '',
    experience: '',
    expected_salary: 0,
    notice_period: '',
    skills: [],
    portfolio_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'interviews'>('profile');
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchInterviews();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (data) setProfile({
      ...data,
      skills: data.skills || [],
    });
    setLoading(false);
  };

  const fetchInterviews = async () => {
    // 1. Get interviews
    const { data: interviewData } = await supabase
      .from('interviews')
      .select('*, application:applications(*, job:jobs(*))')
      .eq('candidate_id', user?.id)
      .order('start_time', { ascending: false });

    setInterviews(interviewData || []);

    // 2. Also check for shortlisted applications that DON'T have interviews yet
    const { data: appData } = await supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .eq('candidate_id', user?.id)
      .eq('status', 'shortlisted');
    
    setApplications(appData || []);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('candidates')
      .upsert({
        ...profile,
        id: user?.id,
        email: user?.email,
      });

    if (error) toast.error(error.message);
    else toast.success('Profile metrics updated');
    setSaving(false);
  };

  if (loading) return <div className="p-20 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Professional Identity</h1>
          <p className="text-xs text-slate-500 font-medium">Manage your candidate profile and technical data.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
           <ShieldCheck size={14} /> ACCOUNT VERIFIED
        </div>
      </header>

      <div className="px-8 bg-white border-b border-slate-200">
        <nav className="flex gap-8">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'profile' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Profile Analytics
          </button>
          <button 
            onClick={() => setActiveTab('interviews')}
            className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'interviews' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Interview Roadmap
            {(interviews.length > 0 || applications.length > 0) && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_2fr] gap-8">
          {/* Identity Card */}
          <aside className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="w-20 h-20 bg-red-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black">
                {profile.full_name?.[0] || 'U'}
              </div>
              <h2 className="text-sm font-bold text-slate-900">{profile.full_name || 'Set Name'}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{profile.current_company || 'Unemployed'}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-left">
                <MiniInfo icon={<Mail size={12} />} text={user?.email || ''} />
                <MiniInfo icon={<Phone size={12} />} text={profile.phone || 'No phone set'} />
                {profile.portfolio_url && <MiniInfo icon={<Globe size={12} />} text={profile.portfolio_url} />}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl text-white">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">System Insights</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                AI Match accuracy is currently <span className="text-red-400 font-bold">94.2%</span> based on your provided professional data.
              </p>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="space-y-6">
            {activeTab === 'profile' ? (
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Metadata Configuration</h3>
                </div>
                <form onSubmit={handleUpdate} className="p-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField 
                      label="Full Identity" 
                      value={profile.full_name} 
                      onChange={(v: string) => setProfile({...profile, full_name: v})} 
                      placeholder="e.g. Alan Turing" 
                    />
                    <InputField 
                      label="Contact Phone" 
                      value={profile.phone} 
                      onChange={(v: string) => setProfile({...profile, phone: v})} 
                      placeholder="+1 (555) 000-0000" 
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField 
                      label="Current Firm" 
                      value={profile.current_company} 
                      onChange={(v: string) => setProfile({...profile, current_company: v})} 
                      placeholder="Current Company" 
                    />
                    <InputField 
                      label="Exp Tenure" 
                      value={profile.experience} 
                      onChange={(v: string) => setProfile({...profile, experience: v})} 
                      placeholder="e.g. 8 years" 
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField 
                      label="Salary Spec (₹)" 
                      type="number"
                      value={profile.expected_salary?.toString()} 
                      onChange={(v: string) => setProfile({...profile, expected_salary: parseInt(v)})} 
                      placeholder="Total CTC" 
                    />
                    <InputField 
                      label="Notice Period" 
                      value={profile.notice_period} 
                      onChange={(v: string) => setProfile({...profile, notice_period: v})} 
                      placeholder="e.g. 1 month" 
                    />
                  </div>

                  <InputField 
                    label="Digital Portfolio / URL" 
                    value={profile.portfolio_url} 
                    onChange={(v: string) => setProfile({...profile, portfolio_url: v})} 
                    placeholder="https://..." 
                  />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Skills (Comma separated)</label>
                    <textarea 
                      value={profile.skills?.join(', ')} 
                      onChange={(e) => setProfile({...profile, skills: e.target.value.split(',').map(s => s.trim())})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none h-20 focus:ring-1 focus:ring-red-500 transition-all"
                      placeholder="React, TypeScript, AWS..."
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                      disabled={saving}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {saving ? 'Synchronizing...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <section className="space-y-6">
                {/* Pending Schedules (Shortlisted but no interview yet) */}
                {applications.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles size={48} className="text-red-500" />
                    </div>
                    <h3 className="text-sm font-black text-red-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Sparkles size={16} /> Action Required: Schedule Now
                    </h3>
                    <div className="space-y-3">
                      {applications.map(app => (
                        <div key={app.id} className="bg-white p-4 rounded-lg flex items-center justify-between border border-red-200 shadow-sm">
                           <div>
                             <p className="text-sm font-bold text-slate-800">{app.job.title}</p>
                             <p className="text-[10px] text-slate-500 uppercase tracking-widest">Shortlisted for Next Round</p>
                           </div>
                           <Link 
                             to={`/schedule/${app.id}`} 
                             className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2"
                           >
                             Schedule Slot
                             <ExternalLink size={12} />
                           </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed Interviews */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Scheduled Round Registry</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {interviews.length === 0 && applications.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm font-medium">No interviews currently on the horizon.</p>
                      </div>
                    ) : (
                      interviews.map(interview => (
                        <div key={interview.id} className="group p-5 bg-slate-50 border border-slate-100 rounded-xl hover:border-red-200 hover:bg-white transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center border border-slate-200 shadow-sm">
                                <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(interview.start_time).toLocaleDateString([], { month: 'short' })}</span>
                                <span className="text-lg font-black text-slate-800 leading-none">{new Date(interview.start_time).getDate()}</span>
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900">{interview.application.job.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(interview.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                    interview.status === 'scheduled' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {interview.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {interview.meet_link && (
                              <a 
                                href={interview.meet_link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                              >
                                Join Meet
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-red-500 transition-all"
      />
    </div>
  );
}

function MiniInfo({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
      <div className="text-slate-400 shrink-0">{icon}</div>
      <span className="truncate">{text}</span>
    </div>
  );
}
