import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';
import { ExitInterviewService } from '../../services/exitInterviewService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface ExitInterviewChatProps {
  requestId: string;
  userId: string;
  onComplete: () => void;
}

export default function ExitInterviewChat({ requestId, userId, onComplete }: ExitInterviewChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Using the IndiaMART LLM Gateway configured via environment variables
  const exitService = new ExitInterviewService();

  useEffect(() => {
    // Initial greeting
    const startInterview = async () => {
      setLoading(true);
      try {
        const history = [{ role: "user", parts: [{ text: "Hello, I am ready to start my exit interview." }] }];
        const response = await exitService.getChatResponse(history);
        setMessages([
          { role: 'model', content: response }
        ]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to start AI interview");
      } finally {
        setLoading(false);
      }
    };

    startInterview();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || completed) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Convert to Gemini format
      const geminiHistory = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await exitService.getChatResponse(geminiHistory);
      setMessages([...newMessages, { role: 'model', content: response }]);
      
      // Check if model wants to end (usually includes a goodbye or "thank you for your time")
      if (response.toLowerCase().includes("thank you") && newMessages.length > 3) {
        // We could add a button to explicit end, but for now we look for signs
      }
    } catch (err) {
      console.error(err);
      toast.error("AI disconnected");
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    setIsAnalyzing(true);
    try {
      const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const insights = await exitService.generateInsights(transcript);

      // Save to Supabase
      const { error: interviewError } = await supabase.from('exit_interviews').insert({
        request_id: requestId,
        user_id: userId,
        chat_history: messages,
        insights: insights,
        completed_at: new Date().toISOString()
      });

      if (interviewError) throw interviewError;

      // Update request status
      const { error: requestError } = await supabase
        .from('exit_requests')
        .update({ status: 'interview_completed' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      setCompleted(true);
      toast.success("Interview completed successfully");
      setTimeout(() => onComplete(), 3000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save interview insights");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-white rounded-3xl border border-slate-200">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Interview Finished</h2>
        <p className="text-slate-500 max-w-sm">Thank you for sharing your feedback. Your insights will help us make IndiaMART a better place for everyone.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <header className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">Exit AI Analyst</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Confidential Interview</p>
          </div>
        </div>
        <button 
          onClick={finishInterview}
          disabled={messages.length < 3 || isAnalyzing}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          {isAnalyzing ? "Analyzing..." : "End Session"}
          <LogOut size={12} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 relative">
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
            >
              <div className="relative w-24 h-24 mb-6">
                <svg className="animate-spin w-full h-full text-red-100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" stroke="currentColor" />
                </svg>
                <svg className="animate-spin w-full h-full text-red-600 absolute top-0 left-0" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" stroke="currentColor" strokeDasharray="283" strokeDashoffset="75" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot size={32} className="text-red-600 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight text-center">Submitting Your Interview............</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">AI is analyzing your feedback</p>
            </motion.div>
          )}
        </AnimatePresence>
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center animate-pulse">
                <Bot size={14} />
              </div>
              <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Share your feedback here..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="p-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-100"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
