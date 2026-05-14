import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Search, FileText, UserCircle, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const faqs = [
  {
    category: 'For Candidates',
    icon: <UserCircle className="w-5 h-5 text-blue-500" />,
    questions: [
      {
        question: 'How do I apply for a job?',
        answer: 'Navigate to the "Job Search" area in your dashboard. Browse the available positions, click on the one you are interested in, and click the "Apply Now" button. You will be asked to fill out your details and upload a resume before submitting.'
      },
      {
        question: 'Can I track the status of my application?',
        answer: 'Yes! Once you have applied for a job, you can track its progress in your "Candidate Dashboard". The status will update automatically as our recruitment team reviews your profile.'
      },
      {
        question: 'How do I update my profile information?',
        answer: 'Click on the "My Profile" tab in the sidebar. Here you can edit your personal details, update your resume, and manage your skills and experience.'
      }
    ]
  },
  {
    category: 'For Administrators',
    icon: <Briefcase className="w-5 h-5 text-red-500" />,
    questions: [
      {
        question: 'How do I mark a job as filled?',
        answer: 'Go to the "Active Jobs" tab on your Admin Dashboard. Find the job you want to update, and in the "Actions" column, click the checkmark icon to mark the job as filled. It will no longer accept new applications.'
      },
      {
        question: 'How does the AI Resume Analysis work?',
        answer: 'Our PeopleFlow AI automatically extracts skills and experience from candidate resumes and matches them against the job requirements. Click the "Generate AI Analysis" button on an applicant\'s detail page to see a compatibility score and detailed insights.'
      },
      {
        question: 'Can I reject a candidate directly from the dashboard?',
        answer: 'Yes. In the "Dashboard" area under "Applicants Area", you can click the red "X" icon in the Actions column to instantly decline an applicant. They will be notified of the status change.'
      }
    ]
  },
  {
    category: 'General & Technical',
    icon: <FileText className="w-5 h-5 text-emerald-500" />,
    questions: [
      {
        question: 'I forgot my password, how do I reset it?',
        answer: 'On the login screen, click the "Forgot Password" link. Enter your registered email address, and we will send you a secure link to reset your password.'
      },
      {
        question: 'What file formats are supported for resumes?',
        answer: 'Currently, the platform supports PDF formats for resumes to ensure the AI analysis engine can accurately parse information.'
      }
    ]
  }
];

export default function HelpCenter() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (question: string) => {
    setOpenFaq(openFaq === question ? null : question);
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="h-full bg-slate-50 overflow-auto relative">
      <div className="bg-[#0a2540] text-white pt-12 pb-20 px-6 shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
            <HelpCircle className="w-8 h-8 text-red-500" />
            How can we help you?
          </h1>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto text-sm">
            Search our knowledge base for answers to common questions about Indiamart's PeopleFlow AI platform.
          </p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for articles, questions, or keywords..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white/20 transition-all shadow-lg backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-12 relative z-20">
        <div className="max-w-3xl mx-auto -mt-8">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-slate-100">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">No results found</h3>
              <p className="text-slate-500 text-sm">We couldn't find any articles matching "{searchQuery}". Try different keywords.</p>
            </div>
          ) : (
            filteredFaqs.map((category, catIdx) => (
              <div key={catIdx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  {category.icon}
                  <h2 className="font-bold text-slate-800 tracking-tight">{category.category}</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {category.questions.map((faq, faqIdx) => {
                    const isOpen = openFaq === faq.question;
                    return (
                      <div key={faqIdx} className="bg-white">
                        <button 
                          className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 focus:outline-none hover:bg-slate-50 transition-colors"
                          onClick={() => toggleFaq(faq.question)}
                        >
                          <span className="font-medium text-slate-700 text-sm md:text-base pr-4">
                            {faq.question}
                          </span>
                          <span className="text-slate-400 mt-1 shrink-0">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5 pt-1 text-sm text-slate-500 leading-relaxed">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Still need help?</h3>
              <p className="text-blue-700 text-sm">Our support team is available 24/7 to assist you with any issues.</p>
            </div>
            <button className="whitespace-nowrap px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
