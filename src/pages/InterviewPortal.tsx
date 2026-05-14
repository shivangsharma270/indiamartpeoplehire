import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Application, Job, Candidate } from '../types';
import { Calendar, Clock, CheckCircle, Sparkles, Loader2, ArrowRight, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function InterviewPortal() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<(Application & { job: Job, candidate: Candidate }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestedSlots, setSuggestedSlots] = useState<{ start: string, end: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string, end: string } | null>(null);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [appId]);

  const fetchData = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, job:jobs(*), candidate:candidates(*)')
        .eq('id', appId)
        .single();

      if (error) throw error;
      setApplication(data);

      // Fetch AI Suggested slots from backend
      const resp = await fetch('/api/interviews/suggest-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, candidateId: data.candidate_id })
      });
      const { slots } = await resp.json();
      setSuggestedSlots(slots || []);
    } catch (error: any) {
      toast.error("Failed to load application details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !application) return;
    setBooking(true);
    try {
      const resp = await fetch('/api/interviews/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          candidateId: application.candidate_id,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end
        })
      });
      const result = await resp.json();
      if (result.success) {
        setSuccess(true);
        toast.success("Interview booked successfully!");
      } else {
        throw new Error(result.error || "Booking failed");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">AI is analyzing schedules and suggesting best slots...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">It's a Date!</h1>
          <p className="text-slate-500 mb-8">Your interview has been scheduled. Check your email for the Google Calendar invite and Meet link.</p>
          <button 
            onClick={() => window.close()} 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
          >
            Close Portal
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8">
        {/* Left Column: Job & Candidate Info */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
                <Sparkles className="text-red-500" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">HirePilot AI</h2>
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Interview Portal</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position</label>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase size={16} className="text-slate-400" />
                  <p className="text-lg font-bold text-slate-800">{application?.job.title}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate</label>
                <p className="text-lg font-bold text-slate-800 mt-1">{application?.candidate.full_name}</p>
                <p className="text-sm text-slate-500">{application?.candidate.email}</p>
              </div>
            </div>
          </motion.div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
            <h3 className="text-lg font-black mb-4">Why this matters</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our AI scheduling engine analyzes multiple interviewers' availability to find potential conflicts and suggests the most optimal timings for a seamless experience.
            </p>
          </div>
        </div>

        {/* Right Column: Slot Selection */}
        <div className="lg:col-span-3">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Select a Slot</h3>
                <p className="text-sm text-slate-500 font-medium">AI recommended timings based on availability.</p>
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 animate-pulse">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Real-time Sync
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[500px]">
              {suggestedSlots.map((slot, index) => {
                const startDate = new Date(slot.start);
                const endDate = new Date(slot.end);
                const isSelected = selectedSlot?.start === slot.start;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full p-6 h-22 rounded-2xl border-2 flex items-center justify-between transition-all group relative overflow-hidden ${
                      isSelected 
                        ? 'border-red-600 bg-red-50/50 shadow-lg shadow-red-100' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600"></div>}
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-xl transition-colors ${isSelected ? 'bg-red-600 text-white' : 'bg-white text-slate-400 group-hover:text-slate-600 shadow-sm border border-slate-100'}`}>
                        <Calendar size={20} />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-black ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                          {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={14} className="text-slate-400" />
                          <p className={`text-xs font-bold ${isSelected ? 'text-red-600' : 'text-slate-400'}`}>
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={20} className={`transition-transform duration-300 ${isSelected ? 'text-red-600 translate-x-1' : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <button
                disabled={!selectedSlot || booking}
                onClick={handleBook}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {booking ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Confirming Reservation...
                  </>
                ) : (
                  <>
                    Confirm Interview
                    <ArrowRight size={24} />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
                By confirming, you agree to receive calendar notifications.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
