import { motion } from 'motion/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Cpu, Zap, Target, Building2, Users, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="relative pt-24 px-6 pb-24 md:pt-32 md:pb-32 text-center bg-white border-b border-slate-200 overflow-hidden flex flex-col items-center justify-center">
        {/* Abstract Background Design */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white opacity-80 pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-red-100 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-100 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full"
          >
            <div className="mb-6 md:mb-8">
              <img src="/imlogo.png" alt="IndiaMART Logo" className="h-[48px] md:h-[64px] object-contain mx-auto" />
            </div>

            <div className="mb-8 md:mb-10 text-center">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-800 mb-2">
                Team StellarX
              </h2>
              <p className="text-lg md:text-xl text-slate-500 font-bold uppercase tracking-[0.2em] opacity-80">Presents</p>
            </div>

            <div className="w-full">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.1] md:leading-[1.1] lg:leading-[1.1] drop-shadow-sm px-2">
                IndiaMART's <br className="hidden sm:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">PeopleFlow AI</span>
              </h1>
              <p className="text-lg md:text-2xl text-slate-600 mt-8 mb-10 max-w-3xl mx-auto font-medium leading-relaxed px-4">
                IndiaMART's high-density platform for automated resume parsing, AI-driven skill matching, and accelerated candidate ranking.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <Link
              to="/admin-login"
              className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-red-600/20"
            >
              Admin Login
              <ArrowRight size={20} />
            </Link>
            <a
              href="#products"
              className="bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Explore Products
            </a>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="container mx-auto px-8 py-20 border-t border-slate-200 bg-white">
        <div className="text-center mb-16">
          <span className="text-red-600 font-bold tracking-widest uppercase text-xs mb-3 block">Solutions</span>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4">Our Products</h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">Explore our suite of intelligent recruitment solutions designed to transform your hiring workflow.</p>
        </div>

        <div className="grid md:grid-cols-1 gap-8 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 transition-all flex flex-col md:flex-row gap-10 items-center md:items-start group relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-50 to-transparent opacity-60"></div>
            
            <div className="w-20 h-20 shrink-0 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-105 transition-transform z-10">
              <div className="p-3 bg-red-50 rounded-xl">
                 <Building2 className="text-red-600" size={32} />
              </div>
            </div>
            <div className="z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-black tracking-tight text-slate-900">HirePilot AI</h3>
                  <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Featured</span>
                </div>
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-medium mb-8">
                HirePilot AI is an AI-powered recruitment automation platform that simplifies resume screening and candidate shortlisting. It intelligently analyzes resumes, matches candidates with job requirements, and helps HR teams identify the best talent faster while reducing manual effort and hiring delays.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckIcon /></div>
                  Resume Parsing
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckIcon /></div>
                  Skill Matching
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckIcon /></div>
                  Candidate Ranking
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckIcon /></div>
                  Automated Workflow
                </div>
              </div>

              <Link to="/hire-pilot" className="inline-flex items-center justify-center bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors w-full sm:w-auto shadow-md">
                Launch HirePilot AI <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50 p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 transition-all flex flex-col md:flex-row gap-10 items-center md:items-start group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 to-transparent opacity-60"></div>
            
            <div className="w-20 h-20 shrink-0 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-105 transition-transform z-10">
              <div className="p-3 bg-blue-50 rounded-xl">
                 <Cpu className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-black tracking-tight text-slate-900 font-sans">HR FAQ Assistant</h3>
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm font-sans">Internal</span>
                </div>
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-medium mb-8 font-sans">
                An intelligent chatbot designed for IndiaMART employees to get instant answers to HR queries ranging from leave policies to payroll. Powered by Gemini, it provides accurate, source-verified information from the official knowledge base.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-sans"><CheckIcon /></div>
                  Policy FAQ
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-sans"><CheckIcon /></div>
                  Ticket Escalation
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-sans"><CheckIcon /></div>
                  Personalized Context
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-sans"><CheckIcon /></div>
                  Zero Hallucination
                </div>
              </div>

              <Link to="/portal" className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors w-full sm:w-auto shadow-md shadow-blue-100 font-sans">
                Access Employee Hub <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
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
