import { motion } from 'motion/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Cpu, Zap, Target, Building2, Users, Database } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="relative pt-8 px-6 pb-24 md:pt-12 md:pb-32 text-center bg-white border-b border-slate-200 overflow-hidden flex flex-col items-center justify-center">
        {/* Abstract Background Design */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white opacity-80 pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-red-100 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-100 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full"
          >
            <div className="mb-6 md:mb-8">
              <img src="/imlogo.png" alt="IndiaMART Logo" className="h-[40px] md:h-[50px] object-contain mx-auto" />
            </div>

            <div className="mb-8 md:mb-12 text-center">
              <p className="text-lg md:text-xl text-slate-900 font-black uppercase tracking-[0.3em] mb-3">Team StellarX Presents</p>
            </div>

            <div className="w-full flex flex-col items-center gap-16 mt-4">
              <div className="text-center w-full max-w-4xl">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[1] md:leading-[1] lg:leading-[1.1] drop-shadow-sm">
                  IndiaMART's <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">PeopleFlow AI</span>
                </h1>
                <p className="text-lg md:text-xl font-bold tracking-tight text-slate-500 mt-6">
                  People Intelligence Reimagined...
                </p>
              </div>
              
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
                {[
                  { title: "AI Resume Screening", icon: <Target className="text-red-600" />, desc: "Autonomous parsing and matching technology." },
                  { title: "Autonomous Interview Scheduling", icon: <Zap className="text-blue-600" />, desc: "Smart coordination without human intervention." },
                  { title: "AI HR Support Assistant", icon: <Cpu className="text-purple-600" />, desc: "Instant resolution for employee queries." },
                  { title: "Attrition Intelligence Engine", icon: <Target className="text-emerald-600" />, desc: "Predictive analysis and pattern recognition." },
                  { title: "Personalized L&D Pathways", icon: <Sparkles className="text-amber-600" />, desc: "Tailored learning journeys for every employee." },
                  { title: "Workforce Automation Platform", icon: <Database className="text-slate-600" />, desc: "End-to-end digital ecosystem for operations." }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    whileHover={{ 
                      rotateY: 5, 
                      rotateX: 5, 
                      z: 20,
                      scale: 1.05,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
                    }}
                    className="p-8 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-slate-200 text-left cursor-default transition-all duration-300 preserve-3d"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{feature.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex justify-center w-full">
                <Link 
                  to="/admin-login"
                  className="bg-red-600 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-2xl shadow-red-600/30 active:scale-95 inline-flex items-center gap-3 border-4 border-white transform hover:-translate-y-1"
                >
                  Admin Login to Access All Products
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="container mx-auto px-8 py-20 border-t border-slate-200 bg-white">
        <div className="text-center mb-16">
          <span className="text-red-600 font-bold tracking-widest uppercase text-xs mb-3 block">Solutions</span>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4">Solutions Presented</h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">Explore our suite of intelligent recruitment solutions designed to transform your hiring workflow.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 transition-all flex flex-col gap-8 group relative overflow-hidden hover:border-red-200">
            {/* Background pattern */}
            <div className="absolute right-0 top-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-50 to-transparent opacity-60"></div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 shrink-0 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-105 transition-transform z-10">
                <div className="p-2.5 bg-red-50 rounded-xl">
                   <Building2 className="text-red-600" size={28} />
                </div>
              </div>
              <div className="z-10">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">HirePilot AI</h3>
                  <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Featured</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  HirePilot AI is an AI-powered recruitment automation platform that simplifies resume screening and candidate shortlisting.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckIcon /></div>
                Resume Parsing
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckIcon /></div>
                Skill Matching
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckIcon /></div>
                Candidate Ranking
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckIcon /></div>
                Automated Workflow
              </div>
            </div>

            <div className="mt-auto">
              <Link to="/hire-pilot" className="inline-flex items-center justify-center bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors w-full shadow-md">
                Launch HirePilot AI <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 transition-all flex flex-col gap-8 group relative overflow-hidden hover:border-blue-200">
            <div className="absolute right-0 top-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 to-transparent opacity-60"></div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 shrink-0 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-105 transition-transform z-10">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                   <Cpu className="text-blue-600" size={28} />
                </div>
              </div>
              <div className="z-10">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 font-sans">EmployeeOrbit AI</h3>
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm font-sans">Internal</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium font-sans">
                  A unified employee portal designed for IndiaMART workforce. From instant query resolution to career growth.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-sans mt-0.5"><CheckIcon /></div>
                <span>AI HR FAQ Chatbot</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-sans mt-0.5"><CheckIcon /></div>
                <span>Turning Exit Feedback into Insights using AI</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-sans mt-0.5"><CheckIcon /></div>
                <span>Learning and Development Courses</span>
              </div>
            </div>

            <div className="mt-auto">
              <Link to="/portal" className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors w-full shadow-md shadow-blue-100 font-sans">
                Access Employee Hub <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA padding */}
      <div className="pb-20"></div>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const colors = {
  blue: 'bg-blue-50 border-blue-100',
  red: 'bg-red-50 border-red-100',
  emerald: 'bg-emerald-50 border-emerald-100',
  amber: 'bg-amber-50 border-amber-100',
};

function FeatureCard({ icon, title, description, color = 'red' }: { icon: React.ReactNode, title: string, description: string, color?: keyof typeof colors }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
    >
      <div className={`w-14 h-14 ${colors[color]} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-3 tracking-tight text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}
