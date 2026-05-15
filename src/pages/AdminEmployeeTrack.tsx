import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Search, Filter, Clock, CheckCircle2, AlertCircle, MessageSquare, ShieldCheck, User, ArrowRight, X, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEmployeeTrack() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [adminReply, setAdminReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
      
      if (selectedTicket) {
        const updated = data?.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (error: any) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleSendAdminReply = async () => {
    if (!adminReply.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      const { error } = await supabase.from('ticket_replies').insert({
        ticket_id: selectedTicket.id,
        user_id: 'admin',
        user_name: 'HR Admin',
        message: adminReply,
        sender_type: 'admin'
      });

      if (error) throw error;

      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await supabase
          .from('employee_tickets')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
      } else {
        await supabase
          .from('employee_tickets')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
      }

      setAdminReply('');
      fetchReplies(selectedTicket.id);
      fetchTickets();
      toast.success("Reply sent to employee");
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionText.trim()) {
      toast.error('Resolution text is required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('employee_tickets')
        .update({
          resolution: resolutionText,
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: 'Admin' // In a real app, this would be the admin's email or ID
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast.success('Ticket resolved successfully');
      setSelectedTicket(null);
      setResolutionText('');
      fetchTickets();
    } catch (error: any) {
      toast.error('Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTermLower) || 
      ticket.category.toLowerCase().includes(searchTermLower) ||
      (ticket.user_name || '').toLowerCase().includes(searchTermLower) ||
      (ticket.user_email || '').toLowerCase().includes(searchTermLower);
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="text-center md:text-left w-full lg:w-auto">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 mb-1">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Support Track</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Employee Support Hub</h1>
          <p className="text-sm md:text-slate-500 font-medium">Manage and resolve internal IndiaMART support requests</p>
        </div>

        <div className="flex items-center gap-2 md:gap-4 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar justify-center">
          {(['all', 'open', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterStatus === status 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                   : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search subject or employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium placeholder:text-slate-400 text-xs md:text-sm shadow-sm"
            />
          </div>

          <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
             <div className="relative z-10">
                <Ticket className="text-red-500 mb-4" size={32} />
                <h3 className="text-xl font-black tracking-tight mb-1">Queue Health</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Real-time Metrics</p>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Cases</span>
                      <span className="text-lg font-black">{tickets.length}</span>
                   </div>
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Resolved</span>
                      <span className="text-lg font-black">{tickets.filter(t => t.status === 'resolved').length}</span>
                   </div>
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-red-500/20">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Pending</span>
                      <span className="text-lg font-black">{tickets.filter(t => t.status === 'open').length}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="h-96 flex items-center justify-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                <AlertCircle size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No tickets found</h3>
              <p className="text-slate-500 font-medium">All employees are currently supported or no tickets match your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  onClick={() => {
                    setSelectedTicket(ticket);
                    fetchReplies(ticket.id);
                  }}
                  className={`bg-white p-6 rounded-[2rem] border transition-all cursor-pointer group ${
                    selectedTicket?.id === ticket.id ? 'border-slate-900 shadow-xl scale-[1.01]' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          ticket.status === 'resolved' || ticket.status === 'closed'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : ticket.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {ticket.status === 'in_progress' ? 'In Process' : ticket.status === 'open' ? 'Awaiting Review' : ticket.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ticket.category}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors">{ticket.subject}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1 justify-end">
                         <Clock size={10} /> {new Date(ticket.created_at).toLocaleDateString()}
                       </p>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 text-sm font-medium line-clamp-2 mb-4 italic">"{ticket.description}"</p>
                  
                  <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="flex flex-col gap-0.5">
                       <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                             <User size={14} className="text-slate-400" />
                          </div>
                          <span className="text-xs font-black text-slate-900 truncate max-w-[150px]">{ticket.user_name || 'Anonymous Employee'}</span>
                       </div>
                       <span className="text-[10px] font-medium text-slate-400 ml-9">{ticket.user_email}</span>
                    </div>
                    {ticket.status === 'open' && (
                      <button className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        Resolve Case <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setSelectedTicket(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Clock size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Case ID: {selectedTicket.id.split('-')[0]}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-xs font-bold text-red-600">{selectedTicket.user_name}</span>
                       <span className="text-slate-300">•</span>
                       <a href={`mailto:${selectedTicket.user_email}`} className="text-xs font-bold text-slate-500 hover:text-red-600 underline">
                         {selectedTicket.user_email}
                       </a>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare size={12} /> Employee Message
                    </p>
                    <p className="text-slate-700 font-medium leading-relaxed italic">"{selectedTicket.description}"</p>
                  </div>

                  {selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? (
                    <div className="space-y-4">
                       <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <CheckCircle2 size={12} /> Actual Resolution
                         </p>
                         <p className="text-emerald-900 font-bold leading-relaxed">"{selectedTicket.resolution}"</p>
                         <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-4">
                           {selectedTicket.status === 'closed' ? 'Closed' : 'Resolved'} on {new Date(selectedTicket.resolved_at || selectedTicket.closed_at).toLocaleString()}
                         </p>
                       </div>
                       
                       {selectedTicket.feedback && (
                         <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Heart size={12} /> Employee Feedback
                            </p>
                            <p className="text-blue-900 font-medium italic">"{selectedTicket.feedback}"</p>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Replies List */}
                      <div className="space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                        {replies.length > 0 ? (
                          replies.map((reply) => (
                            <div key={reply.id} className={`flex ${reply.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${reply.sender_type === 'admin' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                     <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{reply.user_name}</span>
                                  </div>
                                  <p className="font-medium">{reply.message}</p>
                                  <p className="text-[8px] mt-1 opacity-40">{new Date(reply.created_at).toLocaleTimeString()}</p>
                               </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-2xl">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No conversation history yet</p>
                          </div>
                        )}
                      </div>

                      {/* Admin Reply Form */}
                      <div className="flex gap-2">
                        <textarea 
                          rows={2}
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          placeholder="Reply to employee..."
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium resize-none text-sm"
                        />
                        <button 
                          onClick={handleSendAdminReply}
                          disabled={sendingReply || !adminReply.trim()}
                          className="px-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 disabled:opacity-50 flex items-center justify-center shrink-0"
                        >
                          {sendingReply ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={20} />}
                        </button>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <form onSubmit={handleResolve} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Final Resolution (This will resolve the case)</label>
                            <textarea 
                              rows={3}
                              value={resolutionText}
                              onChange={(e) => setResolutionText(e.target.value)}
                              placeholder="Type the final resolution summary..."
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-2 focus:ring-slate-900 transition-all outline-none font-medium resize-none text-sm"
                            />
                          </div>
                          <button 
                            disabled={submitting}
                            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98] disabled:opacity-50"
                          >
                            {submitting ? 'Updating System...' : 'Resolve & Complete Ticket'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-900 p-4 text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IndiaMART Enterprise Internal Support System</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
