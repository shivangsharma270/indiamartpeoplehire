import React, { useState } from 'react';
import { auth as firebaseAuth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'sonner';
import { Shield, Mail, Lock, Chrome, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login({ type = 'candidate' }: { type?: 'candidate' | 'admin' }) {
  const isAdminMode = type === 'admin';
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
      toast.success('Successfully authenticated');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      toast.success('Welcome back, Admin');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-red-100 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row relative z-10 my-8">
        {/* Left Side - Info Panel */}
        <div className="w-full md:w-5/12 bg-slate-900 text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
          
          <div className="relative z-10">
            <div className="mb-12">
              <img src="/imlogo.png" alt="IndiaMART" className="h-10 object-contain mb-6 bg-white/10 p-2 rounded-lg backdrop-blur-sm" />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-200 text-[10px] font-bold uppercase tracking-wider border border-red-500/30 mb-4">
                <Sparkles size={12} />
                {isAdminMode ? 'Enterprise Control' : 'Now Active'}
              </div>
              {isAdminMode ? (
                <>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
                    IndiaMART's<br/>
                    <span className="text-red-500">PeopleFlow AI</span>
                  </h1>
                  <p className="text-slate-300 text-lg font-medium leading-relaxed">
                    Centralized Admin Panel to manage all recruitment products and platform settings.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
                    HirePilot <span className="text-red-500">AI</span>
                  </h1>
                  <p className="text-slate-300 text-lg font-medium leading-relaxed">
                    IndiaMART's elegant AI recruitment automation platform.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-6 mt-8 hidden md:block">
              {isAdminMode ? (
                <>
                  <div className="flex items-center gap-4 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    </div>
                    <span className="font-medium text-sm">Centralized Products Management</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                      <CheckCircle2 size={16} className="text-blue-400" />
                    </div>
                    <span className="font-medium text-sm">Global Analytics & Reporting</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                      <CheckCircle2 size={16} className="text-purple-400" />
                    </div>
                    <span className="font-medium text-sm">Role-Based Access Control</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    </div>
                    <span className="font-medium text-sm">10x faster candidate screening</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                      <CheckCircle2 size={16} className="text-blue-400" />
                    </div>
                    <span className="font-medium text-sm">AI-driven resume parsing</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="relative z-10 mt-12 md:mt-0 text-sm text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} IndiaMART Intermesh Ltd.
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-10 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-md w-full mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="text-center mb-10">
                <Shield className="mx-auto mb-4 text-red-600" size={48} />
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  {isAdminMode ? 'Admin Portal' : 'Welcome'}
                </h2>
                <p className="text-slate-500 mt-2 font-medium">
                  {isAdminMode ? 'Login to manage jobs and candidates.' : 'Login to apply and track your application.'}
                </p>
              </div>

              {isAdminMode ? (
                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-[14px] text-slate-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@indiamart.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none font-medium placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-[14px] text-slate-400" size={18} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none font-medium placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      disabled={loading}
                      className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
                    >
                      {loading ? 'Authenticating...' : 'Sign In Securely'}
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white text-slate-700 border-2 border-slate-200 py-3.5 rounded-xl font-bold text-base hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    <Chrome className="text-red-500" size={20} />
                    {loading ? 'Please wait...' : 'Candidate Login'}
                  </button>
                  <p className="text-center text-slate-500 text-xs font-medium px-4">
                    By continuing, you agree to IndiaMART's Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}
              {(!isAdminMode) && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">IndiaMART Employees</p>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-base hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200"
                  >
                    <Shield className="text-red-500" size={20} />
                    {loading ? 'Verifying...' : 'Employee Portal Login'}
                  </button>
                  <p className="text-center text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-widest leading-relaxed">
                    Access internal FAQ bot & resources.<br/>Use your @indiamart.com account.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
