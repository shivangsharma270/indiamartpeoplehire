
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Zap, Award, PlayCircle, FileText, 
  CheckCircle2, ChevronRight, X, AlertCircle, 
  BarChart3, Sparkles, User, Briefcase, Mail, Hash, Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { toast } from 'sonner';

export default function EmployeeLd() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
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
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Employee Profile to know their department
      const { data: profile, error: pError } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', user.id || user.uid)
        .maybeSingle();

      if (pError) throw pError;
      setUserProfile(profile);

      if (profile) {
        // 2. Get All Courses and filter in JS to handle JSONB array properly if needed, 
        // or use the correct supabase filter for JSONB arrays.
        // For simplicity and correctness with JSONB:
        const { data: coursesData, error: cError } = await supabase
          .from('courses')
          .select('*, employee_course_progress(*)');

        if (cError) throw cError;

        // Filter courses for this employee
        const filtered = (coursesData || []).filter(c => {
          const depts = Array.isArray(c.departments) ? c.departments : [c.departments];
          return depts.includes('All') || depts.includes(profile.department);
        });

        setCourses(filtered);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load learning portal");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle size={24} />;
      case 'pdf': return <FileText size={24} />;
      case 'ppt': return <BarChart3 size={24} />;
      default: return <BookOpen size={24} />;
    }
  };

  const handleStartCourse = async (course: any) => {
    setSelectedCourse(course);
    setQuizResult(null);
    setQuizAnswers(new Array(course.quiz_data.length).fill(-1));
    
    // Mark as in_progress if not already
    const progress = course.employee_course_progress?.[0];
    if (!progress || progress.status === 'not_started') {
      await supabase.from('employee_course_progress').upsert({
        user_id: user.id || user.uid,
        course_id: course.id,
        status: 'in_progress'
      }, { onConflict: 'user_id,course_id' });
    }
  };

  const handleQuizSubmit = async () => {
    if (quizAnswers.includes(-1)) {
      toast.error("Please answer all questions");
      return;
    }

    setSubmittingQuiz(true);
    try {
      let correctCount = 0;
      selectedCourse.quiz_data.forEach((q: any, i: number) => {
        if (q.correct === quizAnswers[i]) correctCount++;
      });

      const score = Math.round((correctCount / selectedCourse.quiz_data.length) * 100);
      const passed = score >= selectedCourse.passing_score;

      const { error } = await supabase.from('employee_course_progress').upsert({
        user_id: user.id || user.uid,
        course_id: selectedCourse.id,
        status: passed ? 'completed' : 'in_progress',
        quiz_score: score,
        attempts: (selectedCourse.employee_course_progress?.[0]?.attempts || 0) + 1,
        completed_at: passed ? new Date().toISOString() : null
      }, { onConflict: 'user_id,course_id' });

      if (error) throw error;
      
      setQuizResult({ score, passed });
      if (passed) toast.success("Congratulations! You passed the course.");
      else toast.error(`Score: ${score}%. Passing is ${selectedCourse.passing_score}%`);
      
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleCreateProfile = async () => {
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
      toast.success(userProfile ? "Profile updated successfully!" : "Profile created successfully!");
      setIsCompletingProfile(false);
      fetchData();
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome to L&D</h2>
            <p className="text-slate-500 font-medium mt-4 mb-10 leading-relaxed">
              We couldn't find your employee record. Complete your profile to unlock department-specific training modules.
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
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-500 focus:bg-white transition-all"
                       value={profileForm.employee_id}
                       onChange={(e) => setProfileForm({...profileForm, employee_id: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                     <input 
                       type="text" 
                       placeholder="e.g. Rahul Sharma"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-500 focus:bg-white transition-all"
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
                 onClick={handleCreateProfile}
                 className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3"
               >
                 Activate My L&D Account <Sparkles size={16} className="text-amber-400" />
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
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-6">
               <div className="px-3 py-1 bg-red-100 text-red-600 text-[10px] uppercase font-black tracking-widest rounded-full border border-red-200">
                  L&D Portal
               </div>
               <div className="h-4 w-[1px] bg-slate-200"></div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Team {userProfile.department}
               </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My <span className="text-red-600">Learning</span> Journey</h1>
            <p className="text-slate-500 font-medium mt-2 max-w-2xl">Upskill with department-specific courses and certifications designed for your growth.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => {
              const progress = course.employee_course_progress?.[0];
              const isCompleted = progress?.status === 'completed';
              
              return (
                <motion.div 
                  key={course.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col group relative overflow-hidden"
                >
                  {isCompleted && (
                    <div className="absolute top-6 right-6">
                       <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                          <CheckCircle2 size={16} />
                       </div>
                    </div>
                  )}

                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-red-50 group-hover:text-red-600 transition-all mb-6">
                    {getIcon(course.content_type)}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{course.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 flex-1">{course.description}</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">Score Needed: {course.passing_score}%</span>
                       {progress?.quiz_score !== undefined && (
                         <span className={progress.quiz_score >= course.passing_score ? 'text-emerald-500' : 'text-red-500'}>
                            Your Best: {progress.quiz_score}%
                         </span>
                       )}
                    </div>
                    {progress?.status === 'in_progress' && (
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-red-500" />
                       </div>
                    )}
                    <button 
                      onClick={() => handleStartCourse(course)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-2"
                    >
                      {isCompleted ? 'Review Course' : progress?.status === 'in_progress' ? 'Continue Learning' : 'Start Course'}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {courses.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                 <BookOpen size={48} className="text-slate-300 mb-4" />
                 <h3 className="text-xl font-black text-slate-400 tracking-tight">No courses assigned yet</h3>
                 <p className="text-slate-400 text-sm font-medium">Keep an eye out for training modules from HR Team.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Course Viewer Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => { setSelectedCourse(null); setShowQuiz(false); setQuizResult(null); }}
                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
                  >
                    <X size={20} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCourse.title}</h2>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded italic">Enterprise Training</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{selectedCourse.content_type}</span>
                    </div>
                  </div>
                </div>
                {!showQuiz && !quizResult && (
                  <button 
                    onClick={() => setShowQuiz(true)}
                    className="px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center gap-2"
                  >
                     Take Final Quiz <Zap size={14} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                {!showQuiz && !quizResult ? (
                  <div className="space-y-10">
                    <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden flex items-center justify-center relative shadow-2xl">
                       {selectedCourse.content_type === 'video' && selectedCourse.content_url ? (
                         <iframe 
                          src={selectedCourse.content_url.includes('youtube.com') || selectedCourse.content_url.includes('youtu.be') ? selectedCourse.content_url.replace("watch?v=", "embed/") : selectedCourse.content_url} 
                          className="w-full h-full border-none"
                          allowFullScreen
                         />
                       ) : (
                         <div className="flex flex-col items-center text-slate-100 max-w-lg text-center px-10">
                            <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-6">
                               {getIcon(selectedCourse.content_type)}
                            </div>
                            <h4 className="text-2xl font-black tracking-tight mb-4 uppercase">External Resource</h4>
                            <p className="text-slate-400 font-medium mb-8">This training module requires you to view content on an external platform.</p>
                            <a 
                              href={selectedCourse.content_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center gap-2"
                            >
                               Open Resource <BookOpen size={14} />
                            </a>
                         </div>
                       )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                       <div className="lg:col-span-2 space-y-6">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Course Context</h3>
                          <p className="text-slate-500 font-medium leading-relaxed">{selectedCourse.description}</p>
                       </div>
                       <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-slate-100 mb-4">
                             <Award size={32} />
                          </div>
                          <h4 className="font-black text-slate-900 text-lg mb-1">Certification</h4>
                          <p className="text-xs text-slate-500 font-medium mb-6">Pass with {selectedCourse.passing_score}% or more to gain this badge.</p>
                          <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                             <div className="h-full bg-red-600" style={{ width: `${selectedCourse.passing_score}%` }}></div>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : showQuiz && !quizResult ? (
                  <div className="max-w-3xl mx-auto space-y-12 py-10">
                    <div className="text-center">
                       <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Knowledge Check</h3>
                       <p className="text-slate-500 font-medium">Answer carefully. Your score will be recorded.</p>
                    </div>
                    {selectedCourse.quiz_data.map((q: any, qIndex: number) => (
                      <div key={qIndex} className="space-y-6">
                        <div className="flex gap-6">
                           <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-slate-200">
                              {qIndex + 1}
                           </div>
                           <h4 className="text-xl font-bold text-slate-900 pt-1">{q.question}</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 ml-16">
                          {q.options.map((opt: string, oIndex: number) => (
                            <button 
                              key={oIndex}
                              onClick={() => {
                                const newAns = [...quizAnswers];
                                newAns[qIndex] = oIndex;
                                setQuizAnswers(newAns);
                              }}
                              className={`p-6 rounded-[1.5rem] text-left text-sm font-bold border-2 transition-all ${quizAnswers[qIndex] === oIndex ? 'bg-red-50 border-red-500 text-red-700 shadow-md' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="pt-10 flex border-t border-slate-100">
                      <button 
                        onClick={handleQuizSubmit}
                        disabled={submittingQuiz}
                        className="w-full py-6 bg-red-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-2xl shadow-red-100"
                      >
                         {submittingQuiz ? 'Evaluating Answers...' : 'Submit Assessment'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`w-28 h-28 rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-2xl ${quizResult.passed ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-500 shadow-red-200'}`}
                    >
                       {quizResult.passed ? <Award size={48} /> : <AlertCircle size={48} />}
                    </motion.div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                       {quizResult.passed ? 'You Passed!' : 'Keep Trying!'}
                    </h3>
                    <div className="text-5xl font-black text-slate-900 mt-4 mb-2">{quizResult.score}%</div>
                    <p className="text-slate-500 font-medium mb-10 italic">
                       {quizResult.passed ? "Your skills are growing. The certification has been added to your profile." : `You need ${selectedCourse.passing_score}% to pass. Re-watch the content and try again.`}
                    </p>
                    <button 
                      onClick={() => { setSelectedCourse(null); setQuizResult(null); setShowQuiz(false); }}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                    >
                       Close Portal
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
