
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, Briefcase, Mail, Hash, CheckCircle2, 
  Sparkles, Award, Target, ChevronRight, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { toast } from 'sonner';

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    user_name: '',
    employee_id: '',
    department: 'NSD',
    role: '',
    skills: [] as string[],
    experience_years: 1,
    career_goals: ''
  });
  const [courseStats, setCourseStats] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: profile, error: pError } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', user.id || user.uid)
        .maybeSingle();

      if (pError) throw pError;
      
      if (profile) {
        setUserProfile(profile);
        setProfileForm({
          user_name: profile.user_name || '',
          employee_id: profile.employee_id || '',
          department: profile.department || 'NSD',
          role: profile.role || '',
          skills: profile.skills || [],
          experience_years: profile.experience_years || 0,
          career_goals: profile.career_goals || ''
        });

        // Fetch course stats
        const { data: courses, error: cError } = await supabase
          .from('courses')
          .select('id, departments, employee_course_progress(status)');

        if (!cError && courses) {
          const filtered = courses.filter(c => {
            const depts = Array.isArray(c.departments) ? c.departments : [c.departments];
            return depts.includes('All') || depts.includes(profile.department);
          });
          const completed = filtered.filter(c => c.employee_course_progress?.[0]?.status === 'completed').length;
          setCourseStats({ completed, total: filtered.length });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.user_name || !profileForm.role || !profileForm.employee_id) {
      toast.error("Please fill in your name, employee ID, and current role");
      return;
    }

    try {
      const { error } = await supabase.from('employee_profiles').upsert({
        user_id: user.id || user.uid,
        user_email: user.email,
        ...profileForm,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[#F8FAFC] text-center">
        {!isCompletingProfile ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-[3rem] p-12 border border-slate-200 shadow-2xl shadow-slate-200/50"
          >
            <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-600 mb-8 mx-auto shadow-inner">
               <Sparkles size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Activate Your Profile</h2>
            <p className="text-slate-500 font-medium mt-4 mb-10 leading-relaxed">
              We couldn't find your employee record. Complete your profile to unlock all enterprise features.
            </p>
            <button 
              onClick={() => {
                setProfileForm(prev => ({ ...prev, user_name: user.email?.split('@')[0] || '' }));
                setIsCompletingProfile(true);
              }}
              className="w-full py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2 group"
            >
              Complete My Profile <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full bg-white rounded-[3rem] p-12 border border-slate-200 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Profile Setup</h2>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">IndiaMART Employee Portal</p>
               </div>
               <button onClick={() => setIsCompletingProfile(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={24} />
               </button>
            </div>

            <div className="space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Employee ID</label>
                     <input 
                       type="text" 
                       placeholder="e.g. IM12345"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-500 focus:bg-white transition-all font-bold"
                       value={profileForm.employee_id}
                       onChange={(e) => setProfileForm({...profileForm, employee_id: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                     <input 
                       type="text" 
                       placeholder="e.g. Rahul Sharma"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-500 focus:bg-white transition-all font-bold"
                       value={profileForm.user_name}
                       onChange={(e) => setProfileForm({...profileForm, user_name: e.target.value})}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Department</label>
                     <select 
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-500 focus:bg-white transition-all appearance-none"
                       value={profileForm.department}
                       onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                     >
                        {['NSD', 'Tele Monthly', 'Marketplace', 'Business Intelligence', 'HR Department', 'SOA', 'Technical', 'Sales', 'Management', 'HR'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Current Designation</label>
                     <input 
                       type="text" 
                       placeholder="e.g. Senior Executive"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-500 focus:bg-white transition-all"
                       value={profileForm.role}
                       onChange={(e) => setProfileForm({...profileForm, role: e.target.value})}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Years of Experience</label>
                     <input 
                       type="number" 
                       min="0"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-500 focus:bg-white transition-all"
                       value={profileForm.experience_years}
                       onChange={(e) => setProfileForm({...profileForm, experience_years: parseInt(e.target.value) || 0})}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Career Goals & Aspirations</label>
                  <textarea 
                    rows={3}
                    placeholder="Where do you see yourself in 2 years?"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-red-500 focus:bg-white transition-all"
                    value={profileForm.career_goals}
                    onChange={(e) => setProfileForm({...profileForm, career_goals: e.target.value})}
                  />
               </div>

               <button 
                 onClick={handleUpdateProfile}
                 className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3"
               >
                 Activate My Account <Sparkles size={16} className="text-amber-400" />
               </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto no-scrollbar">
      <header className="px-10 py-12 bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-50 rounded-full -mr-48 -mt-48 opacity-50"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="px-3 py-1 bg-red-100 text-red-600 text-[10px] uppercase font-black tracking-widest rounded-full border border-red-200">
                Employee Profile
             </div>
             <div className="h-4 w-[1px] bg-slate-200"></div>
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Member ID: {userProfile.employee_id}
             </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Manage <span className="text-red-600">My Profile</span></h1>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl">Keep your identification and career aspirations up to date for personalized growth.</p>
        </div>
      </header>

      <main className="flex-1 p-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-8"
             >
                <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm text-center">
                   <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner group overflow-hidden relative">
                      <User size={64} className="text-slate-200 group-hover:text-red-100 transition-colors" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">{userProfile.user_name}</h3>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">{userProfile.role}</p>
                   
                   <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
                      <div className="text-center">
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Emp ID</div>
                         <div className="text-sm font-black text-slate-900">{userProfile.employee_id || 'N/A'}</div>
                      </div>
                      <div className="text-center border-l border-slate-50">
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Dept</div>
                         <div className="text-sm font-black text-slate-900">{userProfile.department}</div>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                   <Award size={32} className="mb-6 text-amber-400" />
                   <h4 className="text-xl font-black tracking-tight mb-2">Enterprise Ready</h4>
                   <p className="text-slate-400 text-sm font-medium mb-6">You have completed {courseStats.completed} training modules.</p>
                   <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${Math.min(100, (courseStats.completed / (courseStats.total || 1)) * 100)}%` }}></div>
                   </div>
                </div>
             </motion.div>

             <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm"
             >
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-10 flex items-center gap-3">
                   <Sparkles size={24} className="text-red-600" /> My Profile Details
                </h3>
                
                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Employee ID</label>
                         <div className="relative">
                            <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                               type="text" 
                               className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none cursor-not-allowed"
                               value={profileForm.employee_id}
                               disabled
                            />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                         <div className="relative">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                               type="text" 
                               className="w-full pl-14 pr-6 py-5 bg-slate-100 border border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none focus:border-red-500 transition-all font-bold"
                               value={profileForm.user_name}
                               onChange={(e) => setProfileForm({...profileForm, user_name: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Designation</label>
                         <div className="relative">
                            <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                               type="text" 
                               className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none focus:border-red-500 transition-all"
                               value={profileForm.role}
                               onChange={(e) => setProfileForm({...profileForm, role: e.target.value})}
                            />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                         <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                               type="text" 
                               className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none cursor-not-allowed"
                               value={userProfile.user_email}
                               disabled
                            />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Career Goals & Aspirations</label>
                      <textarea 
                         rows={4}
                         className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-medium outline-none focus:border-red-500 transition-all"
                         value={profileForm.career_goals}
                         onChange={(e) => setProfileForm({...profileForm, career_goals: e.target.value})}
                      />
                   </div>

                   <button 
                      onClick={handleUpdateProfile}
                      className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98]"
                   >
                      Update My Profile <CheckCircle2 size={16} className="text-emerald-400" />
                   </button>
                </div>
             </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
