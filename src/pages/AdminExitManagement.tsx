import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { LogOut, CheckCircle2, XCircle, Search, MessageSquare, TrendingDown, Clock, Shield, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export default function AdminExitManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'insights'>('requests');
  const [selectedInterview, setSelectedInterview] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqData, intData] = await Promise.all([
        supabase.from('exit_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('exit_interviews').select('*').order('created_at', { ascending: false })
      ]);

      setRequests(reqData.data || []);
      setInterviews(intData.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load exit data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exit_requests')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      toast.success("Resignation approved. Employee notified to start interview.");
      fetchData();
    } catch (err) {
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exit_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      toast.success("Request archived");
      fetchData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader /></div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
       <header className="px-8 py-6 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exit Analysis <span className="text-red-600">& Attrition</span></h1>
                <p className="text-sm font-medium text-slate-500">Managing the final chapter of employee journeys</p>
             </div>
             <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Requests
                </button>
                <button 
                  onClick={() => setActiveTab('insights')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'insights' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  AI Insights
                </button>
             </div>
          </div>
       </header>

       <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto w-full">
             <AnimatePresence mode="wait">
                {activeTab === 'requests' ? (
                   <motion.div 
                    key="reqs"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                   >
                      <div className="grid grid-cols-3 gap-6">
                         <StatCard label="Pending Approval" value={requests.filter(r => r.status === 'pending').length} icon={<Clock />} color="amber" />
                         <StatCard label="In Progress" value={requests.filter(r => r.status === 'approved').length} icon={<TrendingDown />} color="blue" />
                         <StatCard label="Completed" value={requests.filter(r => r.status === 'interview_completed').length} icon={<CheckCircle2 />} color="emerald" />
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                               <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <th className="px-6 py-4">Employee</th>
                                  <th className="px-6 py-4">Submission Date</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Actions</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {requests.length === 0 && (
                                 <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium italic">No exit requests found</td></tr>
                               )}
                               {requests.map(req => (
                                 <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                       <div className="font-bold text-slate-900">{req.user_name}</div>
                                       <div className="text-xs text-slate-500">{req.user_email}</div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                                       {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5">
                                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                          req.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                          req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                          req.status === 'interview_completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                          'bg-slate-50 text-slate-500 border-slate-100'
                                       }`}>
                                          {req.status.replace('_', ' ')}
                                       </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                       {req.status === 'pending' && (
                                          <div className="flex justify-end gap-2">
                                             <button onClick={() => handleApprove(req.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Approve Resignation">
                                                <CheckCircle2 size={16} />
                                             </button>
                                             <button onClick={() => handleReject(req.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Reject/Archive">
                                                <XCircle size={16} />
                                             </button>
                                          </div>
                                       )}
                                       {req.status === 'interview_completed' && (
                                         <button 
                                          onClick={() => {
                                            setActiveTab('insights');
                                            // Handle selecting specific one...
                                          }} 
                                          className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1 justify-end"
                                         >
                                            View Insights <ArrowRight size={12} />
                                         </button>
                                       )}
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </motion.div>
                ) : (
                   <motion.div 
                    key="insights"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                   >
                      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                         <div className="bg-red-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between h-40">
                            <AlertTriangle size={24} className="text-red-400" />
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1">Key Attrition Driver</p>
                               <h3 className="text-xl font-black">Growth Stagnation</h3>
                            </div>
                         </div>
                         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-40">
                            <Shield size={24} className="text-slate-300" />
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Retention Risk</p>
                               <h3 className="text-xl font-black text-slate-900 italic">High</h3>
                            </div>
                         </div>
                         <div className="col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
                            <div className="flex-1">
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Strategic Advice</p>
                               <p className="text-sm font-medium text-slate-600 italic">"Focus on internal mobility and salary benchmarking for mid-level developers to reduce churn by estimated 20%."</p>
                            </div>
                            <Sparkles className="text-red-600" size={32} />
                         </div>
                      </div>

                      <div className="lg:col-span-5 space-y-4">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Recent Interviews</h3>
                         <div className="space-y-3">
                            {interviews.length === 0 && <div className="p-8 text-center text-slate-400 italic bg-white rounded-3xl border border-slate-200">No completed interviews yet</div>}
                            {interviews.map(int => (
                               <button 
                                onClick={() => setSelectedInterview(int)}
                                key={int.id} 
                                className={`w-full text-left p-5 rounded-3xl border transition-all ${selectedInterview?.id === int.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl h-24' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 h-24'}`}
                               >
                                  <div className="flex justify-between items-start mb-2">
                                     <span className="font-bold text-sm truncate max-w-[150px]">{requests.find(r => r.id === int.request_id)?.user_name || 'Alumnus'}</span>
                                     <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${selectedInterview?.id === int.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                                        {int.insights?.sentiment || 'Neutral'}
                                     </span>
                                  </div>
                                  <p className={`text-[10px] font-medium line-clamp-1 ${selectedInterview?.id === int.id ? 'text-slate-400' : 'text-slate-500'}`}>
                                     {int.insights?.summary || 'No summary available'}
                                  </p>
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="lg:col-span-7">
                         {selectedInterview ? (
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
                               <div className="p-8 bg-slate-50 border-b border-slate-100">
                                  <div className="flex items-center gap-4 mb-6">
                                     <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                                        {requests.find(r => r.id === selectedInterview.request_id)?.user_name?.charAt(0) || 'A'}
                                     </div>
                                     <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{requests.find(r => r.id === selectedInterview.request_id)?.user_name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                           <MessageSquare size={12} className="text-slate-400" />
                                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedInterview.chat_history.length} Messages Exchanged</span>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-6">
                                     <div className="space-y-4">
                                        <div>
                                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Primary Reason</h4>
                                           <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                                              {selectedInterview.insights?.primary_reason || 'N/A'}
                                           </div>
                                        </div>
                                        <div>
                                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Root Causes</h4>
                                           <div className="flex flex-wrap gap-1.5">
                                              {selectedInterview.insights?.root_causes?.map((rc: string, i: number) => (
                                                 <span key={i} className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold uppercase">{rc}</span>
                                              ))}
                                           </div>
                                        </div>
                                     </div>
                                     <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">HR Recommendations</h4>
                                        <ul className="space-y-2">
                                           {selectedInterview.insights?.recommendations?.map((rec: string, i: number) => (
                                              <li key={i} className="flex gap-2 items-start text-xs font-medium text-slate-600">
                                                 <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                                                 {rec}
                                              </li>
                                           ))}
                                        </ul>
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="p-8">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Chat Transcript</h4>
                                  <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-4">
                                     {selectedInterview.chat_history.map((msg: any, i: number) => (
                                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                           <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium ${msg.role === 'user' ? 'bg-slate-100 text-slate-700 rounded-tr-none' : 'bg-red-50 text-red-700 rounded-tl-none'}`}>
                                              {msg.content}
                                           </div>
                                           <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-1 mx-2">{msg.role === 'user' ? 'Employee' : 'AI Assistant'}</span>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         ) : (
                            <div className="h-full bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center opacity-50">
                               <MessageSquare size={48} className="text-slate-300 mb-4" />
                               <h3 className="text-xl font-bold text-slate-400">Select an interview to view AI analysis</h3>
                            </div>
                         )}
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
       </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colors = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
  }[color as 'emerald' | 'amber' | 'blue'];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
       <div className={`p-4 rounded-2xl ${colors} border`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <h4 className="text-3xl font-black text-slate-900">{value}</h4>
       </div>
    </div>
  );
}

function Loader() {
  return <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>;
}
