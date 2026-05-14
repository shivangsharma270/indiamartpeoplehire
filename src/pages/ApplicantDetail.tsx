import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Application, Job, Candidate, AIScore } from '../types';
import { ChevronLeft, CheckCircle, XCircle, FileText, Download, Mail, Phone, Calendar, Briefcase, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function ApplicantDetail() {
  const { id } = useParams();
  const [data, setData] = useState<(Application & { job: Job, candidate: Candidate, ai_score: AIScore }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    const { data: app } = await supabase
      .from('applications')
      .select('*, job:jobs(*), candidate:candidates(*), ai_score:ai_scores(*)')
      .eq('id', id)
      .single();
    
    setData(app);
    setLoading(false);
  };

  const handleUpdateStatus = async (status: 'accepted' | 'rejected' | 'reviewing' | 'shortlisted') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      if (status === 'shortlisted') {
        const portalUrl = `${window.location.origin}/schedule/${id}`;
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
      
      fetchDetail();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-20 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  if (!data) return <div className="p-20 text-center text-slate-500 font-medium">Applicant not found</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50">
      {/* Left Column: Results List */}
      <div className="w-full lg:w-[60%] border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col min-w-0 overflow-y-auto">
        <header className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
               <ChevronLeft size={20} />
             </Link>
             <div>
               <h1 className="text-base md:text-lg font-bold text-slate-900 truncate max-w-[150px] md:max-w-none">{data.candidate?.full_name}</h1>
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest truncate max-w-[120px] md:max-w-none">{data.job.title}</p>
             </div>
          </div>
          <a 
            href={data.resume_url}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] md:text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download size={12} /> <span className="hidden sm:inline">Resume PDF</span><span className="sm:hidden">CV</span>
          </a>
        </header>

        <div className="flex-1 p-4 md:p-8 space-y-8 md:space-y-10">
          <section className="space-y-4">
             <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Briefcase size={14} /> Professional Background
             </h3>
             <div className="grid grid-cols-2 gap-4 md:gap-6">
                <DetailItem label="Current Company" value={data.candidate?.current_company} />
                <DetailItem label="Experience" value={data.candidate?.experience} />
                <DetailItem label="Salary Expected" value={`₹${data.candidate?.expected_salary?.toLocaleString()}`} />
                <DetailItem label="Notice" value={data.candidate?.notice_period} />
             </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-[10px] md:text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
               <Sparkles size={14} /> AI Analysis Summary
             </h3>
             <div className="bg-red-50/50 p-4 md:p-6 rounded-xl border border-red-100 shadow-sm">
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed italic font-medium">
                  "{data.ai_score?.summary}"
                </p>
             </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={14} /> Matched Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.ai_score?.matched_skills.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 md:px-2.5 md:py-1 bg-green-50 text-green-700 text-[9px] md:text-[10px] font-bold rounded-md border border-green-100 uppercase tracking-tight">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                <XCircle size={14} /> Missing Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.ai_score?.missing_skills.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 md:px-2.5 md:py-1 bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-bold rounded-md border border-slate-200 uppercase tracking-tight">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Right Column: AI Score Visualization */}
      <div className="w-full lg:w-[40%] bg-[#FDFDFD] p-6 md:p-10 overflow-y-auto flex flex-col items-center shrink-0">
        <div className="flex items-center justify-between w-full mb-8 md:mb-12">
          <div className="flex items-center space-x-2 text-[10px] md:text-[10px] uppercase font-bold tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
            <span className="flex h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>AI Analysis Engine</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">v1.4.2_FL</div>
        </div>

        <div className="mb-8 md:mb-10 text-center flex flex-col items-center">
          <div className="relative inline-block mb-6">
            <svg className="w-40 h-40 md:w-48 md:h-48 transform -rotate-90">
              <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 lg:hidden" />
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 hidden lg:block" />
              
              <circle 
                cx={window.innerWidth < 1024 ? 80 : 96} 
                cy={window.innerWidth < 1024 ? 80 : 96} 
                r={window.innerWidth < 1024 ? 72 : 88} 
                stroke="currentColor" 
                strokeWidth={window.innerWidth < 1024 ? 10 : 12} 
                fill="transparent" 
                strokeDasharray={window.innerWidth < 1024 ? 452.3 : 552.9}
                strokeDashoffset={(window.innerWidth < 1024 ? 452.3 : 552.9) * (1 - (data.ai_score?.score || 0) / 100)}
                className={`transition-all duration-1000 ${
                  (data.ai_score?.score || 0) >= 80 ? 'text-green-500' :
                  (data.ai_score?.score || 0) >= 50 ? 'text-red-500' : 'text-red-700'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl md:text-6xl font-black text-slate-900 leading-none">{data.ai_score?.score}</span>
              <span className="text-lg md:text-xl font-bold text-slate-400 mt-1">%</span>
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{data.ai_score?.recommendation}</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Overall Compatibility</p>
        </div>

        <div className="w-full space-y-6">
          <div className="p-5 md:p-6 bg-slate-900 rounded-2xl md:rounded-3xl text-white shadow-xl shadow-slate-200">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Contact Gateway</h4>
            <div className="space-y-3">
              <ContactRow icon={<Mail size={14} />} text={data.candidate?.email} />
              <ContactRow icon={<Phone size={14} />} text={data.candidate?.phone || 'Not Provided'} />
            </div>
            <div className="flex flex-wrap md:flex-nowrap gap-2 mt-8">
              {data.status !== 'shortlisted' && data.status !== 'accepted' && data.status !== 'rejected' && (
                <button 
                  onClick={() => handleUpdateStatus('shortlisted')}
                  className="flex-1 py-3 bg-blue-600 rounded-lg text-[10px] md:text-xs font-bold hover:bg-blue-700 transition-all text-white whitespace-nowrap"
                >
                  Shortlist
                </button>
              )}
              {data.status !== 'accepted' && (
                <button 
                  onClick={() => handleUpdateStatus('accepted')}
                  className="flex-1 py-3 bg-emerald-600 rounded-lg text-[10px] md:text-xs font-bold hover:bg-emerald-700 transition-all text-white whitespace-nowrap"
                >
                  Hire
                </button>
              )}
              <button 
                onClick={() => handleUpdateStatus('rejected')}
                className="flex-1 lg:flex-none px-4 py-3 bg-red-600 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-700 transition-all text-white whitespace-nowrap"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value || 'N/A'}</p>
    </div>
  );
}

function ContactRow({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
       <div className="text-red-400 shrink-0">{icon}</div>
       <span className="text-xs font-medium truncate">{text}</span>
    </div>
  );
}
