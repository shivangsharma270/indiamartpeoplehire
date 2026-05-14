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
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* Left Column: Results List (Simulated back navigation in context) */}
      <div className="w-[60%] border-r border-slate-200 bg-white flex flex-col min-w-0">
        <header className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
               <ChevronLeft size={20} />
             </Link>
             <div>
               <h1 className="text-lg font-bold text-slate-900">{data.candidate?.full_name}</h1>
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{data.job.title}</p>
             </div>
          </div>
          <a 
            href={data.resume_url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Resume PDF
          </a>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-10">
          <section className="space-y-4">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Briefcase size={14} /> Professional Background
             </h3>
             <div className="grid grid-cols-2 gap-6">
                <DetailItem label="Current Company" value={data.candidate?.current_company} />
                <DetailItem label="Total Experience" value={data.candidate?.experience} />
                <DetailItem label="Expected Salary" value={`₹${data.candidate?.expected_salary?.toLocaleString()}`} />
                <DetailItem label="Notice Period" value={data.candidate?.notice_period} />
             </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
               <Sparkles size={14} /> AI Analysis Summary
             </h3>
             <div className="bg-red-50/50 p-6 rounded-xl border border-red-100 shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed italic font-medium">
                  "{data.ai_score?.summary}"
                </p>
             </div>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={14} /> Matched Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.ai_score?.matched_skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-100 uppercase tracking-tight">
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
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md border border-slate-200 uppercase tracking-tight">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience Relevance</h3>
            <div className="text-xs text-slate-600 leading-relaxed bg-white p-4 rounded-lg border border-slate-100">
              {data.ai_score?.experience_relevance}
            </div>
          </section>
        </div>
      </div>

      {/* Right Column: AI Score Visualization */}
      <div className="w-[40%] bg-[#FDFDFD] p-10 overflow-auto flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-12">
          <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
            <span className="flex h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>AI Analysis Engine</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">v1.4.2_FL</div>
        </div>

        <div className="mb-10 text-center">
          <div className="relative inline-block mb-6">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle 
                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={552.9}
                strokeDashoffset={552.9 * (1 - (data.ai_score?.score || 0) / 100)}
                className={`transition-all duration-1000 ${
                  (data.ai_score?.score || 0) >= 80 ? 'text-green-500' :
                  (data.ai_score?.score || 0) >= 50 ? 'text-red-500' : 'text-red-700'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black text-slate-900 leading-none">{data.ai_score?.score}</span>
              <span className="text-xl font-bold text-slate-400 mt-1">%</span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{data.ai_score?.recommendation}</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Overall Compatibility</p>
        </div>

        <div className="w-full space-y-6">
          <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Contact Gateway</h4>
            <div className="space-y-3">
              <ContactRow icon={<Mail size={14} />} text={data.candidate?.email} />
              <ContactRow icon={<Phone size={14} />} text={data.candidate?.phone || 'Not Provided'} />
            </div>
            <div className="flex gap-2 mt-8">
              {data.status !== 'shortlisted' && data.status !== 'accepted' && data.status !== 'rejected' && (
                <button 
                  onClick={() => handleUpdateStatus('shortlisted')}
                  className="flex-1 py-3 bg-blue-600 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all text-white"
                >
                  Shortlist
                </button>
              )}
              {data.status !== 'accepted' && (
                <button 
                  onClick={() => handleUpdateStatus('accepted')}
                  className="flex-1 py-3 bg-green-600 rounded-lg text-xs font-bold hover:bg-green-700 transition-all text-white"
                >
                  Approve
                </button>
              )}
              {data.status !== 'rejected' && (
                <button 
                  onClick={() => handleUpdateStatus('rejected')}
                  className="px-4 py-3 bg-red-600 rounded-lg text-xs font-bold hover:bg-red-700 transition-all text-white"
                >
                  Decline
                </button>
              )}
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
