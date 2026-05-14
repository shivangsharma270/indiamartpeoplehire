import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Info, Ticket, CheckSquare, Sparkles, LayoutGrid, MessageSquare, ArrowRight, ShieldCheck, Heart, Coffee, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import HRChatbot from '../components/chatbot/HRChatbot';
import { useAuth } from '../App';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function EmployeePortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chatbot' | 'tickets' | 'directory' | 'benefits'>('chatbot');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (activeTab === 'tickets' && user) {
      fetchTickets();
    }
  }, [activeTab, user]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('employee_tickets')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load ticket history');
    } finally {
      setLoadingTickets(false);
    }
  };

  // Strict check for indiamart.com email
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.email?.toLowerCase().endsWith('@indiamart.com')) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-full bg-slate-50/50 flex flex-col">
      {/* Hero Welcome */}
      <div className="px-4 md:px-8 py-8 md:py-10 bg-slate-900 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-3 mb-4 md:mb-6">
              <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-red-900/40">
                Internal Portal
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none mb-3">
              Hi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">{user.displayName || user.email.split('@')[0]}</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-xl text-base md:text-lg">
              Internal resources & AI support.
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl flex items-center gap-4 md:gap-6 divide-x divide-white/10 w-full md:w-auto">
            <div className="flex flex-col flex-1 md:flex-none">
              <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Milestone</span>
              <span className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                <Coffee size={14} className="text-amber-400" />
                Lunch • 2PM
              </span>
            </div>
            <div className="flex flex-col pl-4 md:pl-6 flex-1 md:flex-none">
              <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Health</span>
              <span className="text-xs md:text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Heart size={14} />
                Covered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Side Navigation & Dashboard Cards */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <NavButton 
                active={activeTab === 'chatbot'} 
                icon={<MessageSquare size={18} />} 
                title="HR Assistant" 
                subtitle="Policy & procedure AI bot"
                onClick={() => setActiveTab('chatbot')} 
              />
              <NavButton 
                active={activeTab === 'tickets'} 
                icon={<Ticket size={18} />} 
                title="My Support Cases" 
                subtitle="Track your HR requests"
                onClick={() => setActiveTab('tickets')} 
              />
              <NavButton 
                active={false} 
                icon={<LayoutGrid size={18} />} 
                title="Resource Hub" 
                subtitle="Docs, logos & proposals"
                onClick={() => {}} 
                disabled
              />
              <NavButton 
                active={false} 
                icon={<CheckSquare size={18} />} 
                title="Appraisal Tracker" 
                subtitle="View your growth cycles"
                onClick={() => {}} 
                disabled
              />
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                   <ShieldCheck size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">Security</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VPN & Keys</p>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                   <Sparkles size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">Perks</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IM Rewards</p>
             </div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-rose-600 p-6 rounded-3xl text-white shadow-xl shadow-red-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-xl font-black tracking-tight mb-2 relative z-10">Employee Directory</h3>
            <p className="text-white/80 text-sm font-medium mb-4 relative z-10">Connect with teammates across all offices and departments.</p>
            <button className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-colors relative z-10">
              Browse Directory
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Content */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === 'chatbot' ? (
              <motion.div 
                key="chatbot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col gap-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Enterprise Support</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Info size={12} />
                    Context-aware FAQ system powered by Gemini
                  </div>
                </div>
                <HRChatbot />
              </motion.div>
            ) : activeTab === 'tickets' ? (
              <motion.div 
                key="tickets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Support History</h3>
                    <p className="text-slate-500 text-sm font-medium">Tracking your raised concerns and resolutions</p>
                  </div>
                  <button 
                    onClick={fetchTickets}
                    disabled={loadingTickets}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Clock size={20} className={loadingTickets ? 'animate-spin' : ''} />
                  </button>
                </div>

                {loadingTickets ? (
                  <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                      <Ticket size={32} className="text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">No tickets found</h4>
                    <p className="text-slate-500 text-sm font-medium italic">Your support history will appear here once you raise a request.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                ticket.status === 'resolved' || ticket.status === 'closed'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : ticket.status === 'in_progress'
                                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                                  : 'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(ticket.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">{ticket.subject}</h4>
                            <p className="text-slate-600 text-sm font-medium">{ticket.description}</p>
                          </div>
                          
                          <div className="md:text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                             <p className="text-sm font-bold text-slate-900">{ticket.category}</p>
                          </div>
                        </div>

                        {ticket.resolution && (
                          <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                              <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">HR Resolution</span>
                              </div>
                              <p className="text-slate-700 text-sm font-medium leading-relaxed italic">"{ticket.resolution}"</p>
                              <div className="mt-4 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-black">HR</div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Resolved on {new Date(ticket.resolved_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!ticket.resolution && ticket.status !== 'resolved' && (
                          <div className="mt-4 flex items-center gap-2 py-2 px-3 bg-amber-50/50 rounded-xl border border-amber-100 w-fit">
                            <AlertCircle size={14} className="text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Awaiting HR Review</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, icon, title, subtitle, onClick, disabled = false }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all ${
        active 
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02]' 
          : 'text-slate-600 hover:bg-slate-50 ' + (disabled ? 'opacity-40 grayscale cursor-not-allowed' : '')
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
        active ? 'bg-white/10 border-white/10' : 'bg-slate-100 border-slate-200'
      }`}>
        {icon}
      </div>
      <div>
        <h4 className="font-black text-sm uppercase tracking-tight">{title}</h4>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-slate-400' : 'text-slate-400'}`}>
          {subtitle}
        </p>
      </div>
      {active && (
        <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
      )}
    </button>
  );
}
