import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Ticket, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../App';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

export default function HRChatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Namaste! I am IndiaMART's HR Assistant. How can I help you regarding company policies, benefits, or procedures today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticketForm, setTicketForm] = useState({
    category: '',
    subject: '',
    description: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, userId: user?.id })
      });
      const data = await resp.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error("Connectivity issue with AI system.");
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('employee_tickets').insert({
        user_id: user?.id,
        category: ticketForm.category,
        subject: ticketForm.subject,
        description: ticketForm.description,
        chatbot_context: messages.slice(-5) // Send last 5 messages for context
      });

      if (error) throw error;
      toast.success("Ticket raised successfully! HR Team will get back to you.");
      setShowTicketModal(false);
      setTicketForm({ category: '', subject: '', description: '' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const isNotFound = lastMessage?.sender === 'bot' && lastMessage.text.includes("I could not find relevant information");

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tight">HR Helper AI</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active & Ready</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowTicketModal(true)}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
        >
          <Ticket size={14} />
          Raise Ticket
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${msg.sender === 'bot' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {msg.sender === 'bot' ? <Sparkles size={16} /> : <User size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm border ${
                msg.sender === 'user' 
                  ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                  : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
              }`}>
                {msg.text}
                <div className={`text-[9px] mt-2 font-bold opacity-40 uppercase tracking-widest ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-red-600" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Footer for Not Found */}
      <AnimatePresence>
        {isNotFound && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="px-6 py-4 bg-amber-50 border-t border-amber-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600" size={20} />
              <p className="text-xs font-bold text-amber-900 uppercase tracking-tight">Need expert help? Raise a ticket and our HR team will respond.</p>
            </div>
            <button 
              onClick={() => setShowTicketModal(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-amber-700 shadow-lg shadow-amber-200"
            >
              Contact HR
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loading ? "Waiting for AI..." : "Ask about leave, payroll, rotation..."}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all disabled:opacity-50"
        />
        <button
          disabled={loading || !input.trim()}
          className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:grayscale"
        >
          <Send size={20} />
        </button>
      </form>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100">
                <Ticket size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Escalate to HR</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">We'll respond within 24-48 hours</p>
              </div>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Category</label>
                <select 
                  required
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Category</option>
                  <option value="Payroll">Payroll / Salary</option>
                  <option value="Leave">Leaves / Attendance</option>
                  <option value="IT">IT Support</option>
                  <option value="Policy">Policy Clarification</option>
                  <option value="Other">Other Issues</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Subject</label>
                <input 
                  required
                  placeholder="Summarize your concern..."
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Description</label>
                <textarea 
                  required
                  placeholder="Provide more details..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 transition-all font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
