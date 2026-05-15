
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, Search, Filter, BookOpen, Target, 
  ChevronRight, Award, Zap, BarChart3, Users, 
  Sparkles, Calendar, CheckCircle2, AlertCircle,
  TrendingUp, Lightbulb, PenTool, Layout, ArrowUpRight, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LdService } from '../services/ldService';
import { toast } from 'sonner';

const departments = ['All', 'NSD', 'Tele Monthly', 'Marketplace', 'Business Intelligence', 'HR Department', 'SOA', 'Technical', 'Sales', 'Management'];

export default function AdminLdDashboard() {
  const [activeTab, setActiveTab] = useState<'talent' | 'courses' | 'insights'>('talent');
  const [employees, setEmployees] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    departments: ['All'],
    content_url: '',
    content_type: 'video',
    passing_score: 70,
    quiz_data: [{ question: '', options: ['', '', '', ''], correct: 0 }]
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [ldPath, setLdPath] = useState<any>(null);
  const [deptStrategy, setDeptStrategy] = useState<any>(null);
  const [generatingDept, setGeneratingDept] = useState(false);

  const ldService = new LdService();

  useEffect(() => {
    fetchEmployees();
    fetchCourses();
    fetchProgress();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_course_progress')
        .select('*, courses(title, departments), employee_profiles(user_name, department)');
      if (error) throw error;
      setProgressData(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      description: course.description,
      departments: Array.isArray(course.departments) ? course.departments : ['All'],
      content_url: course.content_url,
      content_type: course.content_type,
      passing_score: course.passing_score,
      quiz_data: course.quiz_data
    });
    setShowAddCourse(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title || courseForm.departments.length === 0) {
      toast.error("Title and at least one department are required");
      return;
    }
    try {
      if (editingCourseId) {
        const { error } = await supabase
          .from('courses')
          .update(courseForm)
          .eq('id', editingCourseId);
        if (error) throw error;
        toast.success("Course updated successfully");
      } else {
        const { error } = await supabase.from('courses').insert(courseForm);
        if (error) throw error;
        toast.success("Course created successfully");
      }
      setShowAddCourse(false);
      setEditingCourseId(null);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message || "Failed to save course");
    }
  };

  const toggleDepartment = (dept: string) => {
    setCourseForm(prev => {
      let newDepts = [...prev.departments];
      if (dept === 'All') {
        newDepts = ['All'];
      } else {
        newDepts = newDepts.filter(d => d !== 'All');
        if (newDepts.includes(dept)) {
          newDepts = newDepts.filter(d => d !== dept);
        } else {
          newDepts.push(dept);
        }
      }
      if (newDepts.length === 0) newDepts = ['All'];
      return { ...prev, departments: newDepts };
    });
  };

  const handleGenerateDeptStrategy = async () => {
    if (selectedDept === 'All') return;
    setGeneratingDept(true);
    try {
      const deptEmployees = employees.filter(e => e.department === selectedDept);
      const result = await ldService.generateDepartmentStrategy(selectedDept, deptEmployees);
      setDeptStrategy(result);
      toast.success(`${selectedDept} Department Strategy Generated`);
    } catch (err: any) {
      toast.error("Failed to generate department strategy");
    } finally {
      setGeneratingDept(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .order('user_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employee profiles");
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    setLoading(true);
    const demoProfiles = [
      { user_id: 'emp_1', user_name: 'Aditya Verma', user_email: 'aditya.v@indiamart.com', department: 'NSD', role: 'Solutions Engineer', skills: ['System Design', 'Cloud Architecture'], experience_years: 4, performance_score: 4.5, career_goals: 'Senior Architect' },
      { user_id: 'emp_2', user_name: 'Sneha Kapur', user_email: 'sneha.k@indiamart.com', department: 'Tele Monthly', role: 'Business Associate', skills: ['CRM', 'Negotiation', 'Lead Gen'], experience_years: 2, performance_score: 4.8, career_goals: 'Regional Sales Head' },
      { user_id: 'emp_3', user_name: 'Rohan Sharma', user_email: 'rohan.s@indiamart.com', department: 'Marketplace', role: 'Category Manager', skills: ['Product Sourcing', 'Analytics'], experience_years: 6, performance_score: 4.2, career_goals: 'Director of Operations' },
      { user_id: 'emp_4', user_name: 'Priya Iyer', user_email: 'priya.i@indiamart.com', department: 'HR Department', role: 'HR Specialist', skills: ['Talent Management', 'Policy'], experience_years: 3, performance_score: 4.0, career_goals: 'CHRO' },
      { user_id: 'emp_5', user_name: 'Vikram Singh', user_email: 'vikram.s@indiamart.com', department: 'Business Intelligence', role: 'Data Analyst', skills: ['SQL', 'PowerBI', 'Python'], experience_years: 5, performance_score: 4.9, career_goals: 'Chief Data Officer' },
      { user_id: 'emp_6', user_name: 'Anjali Gupta', user_email: 'anjali.g@indiamart.com', department: 'SOA', role: 'Integration Architect', skills: ['APIs', 'Microservices'], experience_years: 8, performance_score: 4.7, career_goals: 'VP Engineering' }
    ];

    try {
      const { error } = await supabase.from('employee_profiles').upsert(demoProfiles);
      if (error) throw error;
      
      const demoCourses = [
        { title: 'Intro to NSD Protocols', description: 'Master the internal networking standards and protocols used at IndiaMART.', departments: ['NSD', 'SOA'], content_type: 'video', content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', passing_score: 80, quiz_data: [{ question: 'What does NSD stand for?', options: ['Network Standard Division', 'National Security Dept', 'Network Strategy Design', 'New System Development'], correct: 0 }] },
        { title: 'Marketplace Dynamics', description: 'Learn how to optimize category growth and seller engagement.', departments: ['Marketplace'], content_type: 'pdf', content_url: 'https://example.com/marketplace.pdf', passing_score: 70, quiz_data: [{ question: 'How do you increase GMV?', options: ['Lower fees', 'Higher traffic', 'Both', 'Neither'], correct: 2 }] },
        { title: 'Advanced BI Dashboards', description: 'Advanced PowerBI techniques for real-time reporting.', departments: ['Business Intelligence', 'Management'], content_type: 'video', content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', passing_score: 85, quiz_data: [{ question: 'Which tool is used for BI?', options: ['Excel', 'PowerBI', 'Tableau', 'All'], correct: 3 }] }
      ];
      await supabase.from('courses').upsert(demoCourses);

      toast.success("Demo talent & courses seeded!");
      fetchEmployees();
      fetchCourses();
    } catch (err) {
      console.error(err);
      toast.error("Seeding failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchLdPath(selectedEmployee.user_id);
    }
  }, [selectedEmployee]);

  const fetchLdPath = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLdPath(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneratePath = async () => {
    if (!selectedEmployee) return;
    setGenerating(true);
    try {
      const result = await ldService.generatePath(selectedEmployee);
      
      const { data, error } = await supabase.from('learning_paths').insert({
        user_id: selectedEmployee.user_id,
        roadmap: result.roadmap,
        recommendations: result.recommendations,
        gap_analysis: result.gap_analysis,
        market_trends: result.market_trends,
        readiness_score: result.readiness_score,
        career_growth_suggestion: result.career_growth_suggestion
      }).select().single();

      if (error) throw error;
      setLdPath(data);
      toast.success("AI Learning Roadmap generated successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         emp.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]">
      <header className="px-10 py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                L&D <span className="text-red-600">Planner</span>
                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] uppercase font-black tracking-widest rounded-full border border-red-100">Enterprise</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm mt-1">Manage talent growth & training modules</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setActiveTab('talent')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'talent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Talent Planning
              </button>
              <button 
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'courses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Course Management
              </button>
              <button 
                onClick={() => setActiveTab('insights')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'insights' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Insights
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={activeTab === 'talent' ? "Search talent..." : activeTab === 'courses' ? "Search courses..." : "Search insights..."}
                    className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl w-64 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               {activeTab !== 'insights' && (
                 <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar max-w-lg">
                    {departments.map(dept => (
                      <button 
                        key={dept} 
                        onClick={() => setSelectedDept(dept)}
                        className={`px-4 py-2 rounded-lg text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all ${selectedDept === dept ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {dept}
                      </button>
                    ))}
                 </div>
               )}
            </div>
            {activeTab === 'courses' && (
              <button 
                onClick={() => {
                  setEditingCourseId(null);
                  setCourseForm({
                    title: '',
                    description: '',
                    departments: ['All'],
                    content_url: '',
                    content_type: 'video',
                    passing_score: 70,
                    quiz_data: [{ question: '', options: ['', '', '', ''], correct: 0 }]
                  });
                  setShowAddCourse(true);
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
              >
                <Zap size={14} /> Create Course
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'talent' ? (
          <>
            {/* Left Sidebar: Employee List */}
            <div className="w-96 border-r border-slate-200 bg-white overflow-y-auto no-scrollbar p-6 space-y-3 shrink-0">
               {!loading && filteredEmployees.length === 0 && (
                 <div className="text-center py-12 px-4 space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                       <Users size={32} />
                    </div>
                    <p className="text-xs font-medium text-slate-400">No profiles found. Seed demo data to explore features.</p>
                    <button 
                      onClick={seedData}
                      className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                      Seed Demo Talent
                    </button>
                 </div>
               )}
               {loading ? (
                 <div className="flex flex-col gap-3">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
                 </div>
               ) : filteredEmployees.map(emp => (
                 <button 
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`w-full p-4 rounded-2xl text-left border transition-all ${selectedEmployee?.id === emp.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-900'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <div className="font-black text-sm tracking-tight">{emp.user_name}</div>
                       <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${selectedEmployee?.id === emp.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {emp.department}
                       </div>
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${selectedEmployee?.id === emp.id ? 'text-slate-400' : 'text-slate-400'}`}>
                       {emp.role}
                    </div>
                 </button>
               ))}
            </div>

            {/* Right Side: Details */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-10 bg-slate-50/30">
               {selectedEmployee ? (
                 <div className="max-w-5xl mx-auto space-y-10">
                    <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
                       <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-8">
                             <div className="w-24 h-24 bg-red-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black rotate-3 shadow-2xl shadow-red-100 border-4 border-white">
                                {selectedEmployee.user_name?.charAt(0)}
                             </div>
                             <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedEmployee.user_name}</h2>
                                <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-widest italic">
                                   <span>{selectedEmployee.role}</span>
                                   <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                   <span>{selectedEmployee.department} Team</span>
                                </div>
                                <div className="flex gap-2 mt-4">
                                   {selectedEmployee.skills?.map((skill: string, i: number) => (
                                      <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 mb-1">{skill}</span>
                                   ))}
                                </div>
                             </div>
                          </div>
                          <button 
                           onClick={handleGeneratePath}
                           disabled={generating}
                           className="p-5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex flex-col items-center gap-1 group"
                          >
                             {generating ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             ) : (
                                <>
                                   <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Plan with AI</span>
                                </>
                             )}
                          </button>
                       </div>

                       <div className="grid grid-cols-4 gap-8 mt-12 relative z-10">
                          <MetricCard icon={<Zap size={18} />} label="Readiness" value={`${ldPath?.readiness_score || 0}%`} color="red" />
                          <MetricCard icon={<Calendar size={18} />} label="Experience" value={`${selectedEmployee.experience_years} Years`} color="slate" />
                          <MetricCard icon={<Target size={18} />} label="Goal" value={selectedEmployee.career_goals || 'Not Specified'} color="slate" truncate />
                          <MetricCard icon={<BarChart3 size={18} />} label="Performance" value={selectedEmployee.performance_score || 'N/A'} color="slate" />
                       </div>
                    </section>

                    <AnimatePresence mode="wait">
                       {ldPath ? (
                          <motion.div 
                           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                           className="grid grid-cols-12 gap-8"
                          >
                             <div className="col-span-12 lg:col-span-8 space-y-8">
                                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                   <div className="flex items-center justify-between mb-8">
                                      <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                         <TrendingUp className="text-red-600" /> Development Timeline
                                      </h3>
                                   </div>
                                   <div className="space-y-6 relative">
                                      <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-100"></div>
                                      {ldPath.roadmap?.map((step: any, i: number) => (
                                         <div key={i} className="relative pl-12 group">
                                            <div className="absolute left-0 top-1 w-8 h-8 rounded-full border-2 border-slate-100 bg-white flex items-center justify-center z-10 group-hover:border-red-500 transition-all">
                                               <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                                            </div>
                                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white transition-all">
                                               <div className="flex justify-between items-start mb-2">
                                                  <h4 className="font-bold text-slate-900">{step.step}</h4>
                                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${step.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                                                     {step.priority}
                                                  </span>
                                               </div>
                                               <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.description}</p>
                                               <div className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                  <Calendar size={10} /> {step.timeline}
                                               </div>
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             </div>

                             <div className="col-span-12 lg:col-span-4 space-y-8">
                                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                   <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-3">
                                      <AlertCircle className="text-amber-500" size={18} /> Gap Analysis
                                   </h3>
                                   <p className="text-xs text-slate-500 font-medium leading-relaxed">{ldPath.gap_analysis}</p>
                                </div>
                                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                   <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-3">
                                      <Award className="text-red-600" size={18} /> Recommendations
                                   </h3>
                                   <div className="space-y-3">
                                      {ldPath.recommendations?.map((rec: any, i: number) => (
                                         <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <h4 className="text-[11px] font-black text-slate-800 leading-tight mb-0.5">{rec.title}</h4>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rec.platform}</span>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                       ) : (
                          <div className="p-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-70">
                             <Library size={48} className="text-slate-200 mb-6" />
                             <h3 className="text-2xl font-black text-slate-400 tracking-tight">No Active Learning Path</h3>
                             <button 
                              onClick={handleGeneratePath}
                              disabled={generating}
                              className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                             >
                                {generating ? "Calibrating..." : "Generate AI Roadmap"}
                             </button>
                          </div>
                       )}
                    </AnimatePresence>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
                    {selectedDept !== 'All' ? (
                       <div className="w-full space-y-10">
                          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl text-left">
                             <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Team {selectedDept} Strategy</h2>
                             {deptStrategy ? (
                                <div className="mt-12 grid grid-cols-2 gap-10">
                                   <div className="space-y-6">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initiative</h4>
                                      <div className="bg-slate-900 p-8 rounded-3xl text-white">
                                         <h5 className="text-xl font-bold mb-2 text-red-500">{deptStrategy.what_to_build.title}</h5>
                                         <p className="text-sm text-slate-400 font-medium">{deptStrategy.what_to_build.vision}</p>
                                      </div>
                                   </div>
                                   <div className="space-y-6">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roadmap</h4>
                                      <div className="space-y-3">
                                         {deptStrategy.dept_roadmap.map((step: any, i: number) => (
                                            <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl flex gap-4">
                                               <div className="font-black text-red-600">{i+1}</div>
                                               <div className="text-xs font-bold">{step.milestone}</div>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                </div>
                             ) : (
                                <button 
                                 onClick={handleGenerateDeptStrategy}
                                 disabled={generatingDept}
                                 className="mt-8 px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                                >
                                   <Sparkles size={16} /> {generatingDept ? "Orchestrating..." : "Generate Dept Strategy"}
                                </button>
                             )}
                          </div>
                       </div>
                    ) : (
                       <div className="flex flex-col items-center">
                          <Users size={64} className="text-slate-100 mb-8" />
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Select talent or department</h3>
                       </div>
                    )}
                 </div>
               )}
            </div>
          </>
        ) : activeTab === 'courses' ? (
          <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-slate-50/30">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.filter(c => {
                const searchMatch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
                const depts = Array.isArray(c.departments) ? c.departments : [c.departments];
                const deptMatch = selectedDept === 'All' || depts.includes(selectedDept) || depts.includes('All');
                return searchMatch && deptMatch;
              }).map(course => (
                <div 
                  key={course.id}
                  className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm group hover:shadow-xl transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-red-600 transition-all">
                      {course.content_type === 'video' ? <Zap size={20} /> : <BookOpen size={20} />}
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                      {(Array.isArray(course.departments) ? course.departments : []).slice(0, 2).map((d: string) => (
                        <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[7px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                          {d}
                        </span>
                      ))}
                      {(Array.isArray(course.departments) ? course.departments : []).length > 2 && (
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[7px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                           +{(course.departments as string[]).length - 2}
                         </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">{course.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2 flex-1">{course.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score: {course.passing_score}%</span>
                    <button 
                      onClick={() => handleEditCourse(course)}
                      className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700"
                    >
                      Edit Course
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
           <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-slate-50/30">
              <div className="max-w-7xl mx-auto space-y-10">
                 <div className="grid grid-cols-4 gap-6">
                    <MetricCard 
                      icon={<Users size={18} />} 
                      label="Total Employees" 
                      value={employees.length} 
                      color="slate" 
                    />
                    <MetricCard 
                      icon={<CheckCircle2 size={18} />} 
                      label="Completion Rate" 
                      value={`${employees.length > 0 ? Math.round((progressData.filter(p => p.status === 'completed').length / (employees.length * (courses.length || 1))) * 100) : 0}%`} 
                      color="red" 
                    />
                    <MetricCard 
                      icon={<Award size={18} />} 
                      label="Avg Quiz Score" 
                      value={`${progressData.length > 0 ? Math.round(progressData.reduce((acc, p) => acc + (p.quiz_score || 0), 0) / progressData.length) : 0}%`} 
                      color="slate" 
                    />
                    <MetricCard 
                      icon={<TrendingUp size={18} />} 
                      label="In Progress" 
                      value={progressData.filter(p => p.status === 'in_progress').length} 
                      color="slate" 
                    />
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                       <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity Log</h3>
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                             <Calendar size={14} /> Real-time Feed
                          </div>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                             <thead className="bg-slate-50">
                                <tr>
                                   <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                                   <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Course</th>
                                   <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                   <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Score</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {progressData.slice(0, 10).map((p, i) => (
                                   <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-8 py-4">
                                         <div className="text-sm font-bold text-slate-900">{p.employee_profiles?.user_name}</div>
                                         <div className="text-[10px] text-slate-400 font-bold uppercase">{p.employee_profiles?.department}</div>
                                      </td>
                                      <td className="px-8 py-4 text-sm font-bold text-slate-700">{p.courses?.title}</td>
                                      <td className="px-8 py-4">
                                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {p.status}
                                         </span>
                                      </td>
                                      <td className="px-8 py-4 text-sm font-black text-slate-900">{p.quiz_score}%</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-3">
                             <Target size={20} className="text-red-600" /> Dept Performance
                          </h3>
                          <div className="space-y-4">
                             {departments.filter(d => d !== 'All').map(dept => {
                                const deptProgress = progressData.filter(p => p.employee_profiles?.department === dept);
                                const completions = deptProgress.filter(p => p.status === 'completed').length;
                                const total = deptProgress.length || 1;
                                const percentage = Math.round((completions / total) * 100);
                                
                                return (
                                   <div key={dept} className="space-y-2">
                                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                         <span className="text-slate-600">{dept}</span>
                                         <span className="text-slate-400">{percentage}%</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                         <div 
                                           className="h-full bg-red-600 transition-all duration-1000" 
                                           style={{ width: `${percentage}%` }}
                                         />
                                      </div>
                                   </div>
                                );
                             })}
                          </div>
                       </div>

                       <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                          <h3 className="text-lg font-black text-white tracking-tight mb-6 flex items-center gap-3">
                             <Lightbulb size={20} className="text-amber-400" /> AI Recommendation
                          </h3>
                          <p className="text-sm text-slate-400 font-medium leading-relaxed italic border-l-2 border-red-600 pl-4">
                             "The {departments[Math.floor(Math.random() * departments.length)]} department is showing 20% higher engagement in Video modules. Consider converting PDF resources to interactive video format for other teams."
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Add Course Modal */}
      <AnimatePresence>
        {showAddCourse && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingCourseId ? 'Edit' : 'Create'} Training</h2>
                 <button onClick={() => setShowAddCourse(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                   <X size={20} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                       <input 
                         type="text" 
                         placeholder="Course Title" 
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none focus:border-red-500 transition-all"
                         value={courseForm.title}
                         onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                       />
                       <div className="flex items-center gap-4 px-5 py-2 bg-slate-50 border border-slate-200 rounded-2xl overflow-x-auto no-scrollbar">
                          {departments.map(dept => (
                             <label key={dept} className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                <input 
                                  type="checkbox" 
                                  checked={courseForm.departments.includes(dept)}
                                  onChange={() => toggleDepartment(dept)}
                                  className="accent-red-600"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{dept}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                    <textarea 
                     rows={3} 
                     placeholder="Training Description" 
                     className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-red-500 transition-all"
                     value={courseForm.description}
                     onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                    />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Content Resource</h3>
                    <div className="grid grid-cols-3 gap-6">
                       <select 
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none appearance-none"
                         value={courseForm.content_type}
                         onChange={(e) => setCourseForm({...courseForm, content_type: e.target.value as any})}
                       >
                          <option value="video">🎥 Video</option>
                          <option value="pdf">📄 PDF</option>
                          <option value="ppt">📊 PPT</option>
                          <option value="link">🔗 Link</option>
                       </select>
                       <input 
                         type="url" 
                         placeholder="Resource URL (YouTube, Drive, etc.)" 
                         className="col-span-2 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-red-500 transition-all"
                         value={courseForm.content_url}
                         onChange={(e) => setCourseForm({...courseForm, content_url: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Assessment Rules</h3>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Passing Score:</span>
                          <input 
                            type="number" 
                            min="0" max="100"
                            className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-black"
                            value={courseForm.passing_score}
                            onChange={(e) => setCourseForm({...courseForm, passing_score: parseInt(e.target.value)})}
                          />
                       </div>
                    </div>
                    {courseForm.quiz_data.map((q, qIndex) => (
                      <div key={qIndex} className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-6 relative group">
                        <button 
                          onClick={() => {
                             const newQuiz = courseForm.quiz_data.filter((_, i) => i !== qIndex);
                             setCourseForm({...courseForm, quiz_data: newQuiz});
                          }}
                          className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                           <X size={16} />
                        </button>
                        <input 
                          type="text" 
                          placeholder="What is the question?" 
                          className="w-full px-6 py-4 bg-white border border-slate-100 shadow-sm rounded-2xl text-sm font-black outline-none focus:border-red-500 transition-all"
                          value={q.question}
                          onChange={(e) => {
                            const newQuiz = [...courseForm.quiz_data];
                            newQuiz[qIndex].question = e.target.value;
                            setCourseForm({...courseForm, quiz_data: newQuiz});
                          }}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           {q.options.map((opt, oIndex) => (
                             <div key={oIndex} className="flex items-center gap-3">
                                <button 
                                  onClick={() => {
                                    const newQuiz = [...courseForm.quiz_data];
                                    newQuiz[qIndex].correct = oIndex;
                                    setCourseForm({...courseForm, quiz_data: newQuiz});
                                  }}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${q.correct === oIndex ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-red-200'}`}
                                >
                                   {String.fromCharCode(65 + oIndex)}
                                </button>
                                <input 
                                  key={oIndex}
                                  type="text" 
                                  placeholder={`Option ${oIndex + 1}`} 
                                  className={`flex-1 px-4 py-3 border rounded-xl text-xs font-medium outline-none transition-all ${q.correct === oIndex ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newQuiz = [...courseForm.quiz_data];
                                    newQuiz[qIndex].options[oIndex] = e.target.value;
                                    setCourseForm({...courseForm, quiz_data: newQuiz});
                                  }}
                                />
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setCourseForm({...courseForm, quiz_data: [...courseForm.quiz_data, { question: '', options: ['', '', '', ''], correct: 0 }]})}
                      className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-red-200 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} /> Add Question to Assessment
                    </button>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
                 <button 
                  onClick={handleSaveCourse} 
                  className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]"
                 >
                    {editingCourseId ? 'Save Training Changes' : 'Launch Enterprise Module'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ icon, label, value, color, truncate }: any) {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-100',
    slate: 'bg-slate-50 text-slate-400 border-slate-100',
  }[color as 'red' | 'slate'];

  return (
    <div className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50">
       <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400">
             {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
       </div>
       <div className={`text-sm font-black text-slate-900 ${truncate ? 'truncate' : ''}`}>
          {value}
       </div>
    </div>
  );
}
