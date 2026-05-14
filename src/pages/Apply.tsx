import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { extractTextFromPdf } from '../lib/pdf';
import { analyzeResume } from '../lib/gemini';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, Loader2, User, Phone, Linkedin, Calendar, Building, Clock, IndianRupee } from 'lucide-react';

export default function Apply() {
  const { id: jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    skills: '',
    experience: '',
    currentCompany: '',
    portfolioUrl: '',
    expectedSalary: '',
    noticePeriod: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !jobId) {
      toast.error('Please complete all requirements');
      return;
    }

    setLoading(true);
    setProgress(10); // Start

    try {
      // 1. Fetch Job Description for AI
      const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
      if (!job) throw new Error('Job details not found');
      
      setProgress(20);

      // 2. Upload Profile / Candidate Record
      const { error: profileError } = await supabase
        .from('candidates')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          email: user.email,
          phone: formData.phone,
          skills: formData.skills.split(',').map(s => s.trim()),
          experience: formData.experience,
          current_company: formData.currentCompany,
          portfolio_url: formData.portfolioUrl,
          expected_salary: parseFloat(formData.expectedSalary),
          notice_period: formData.noticePeriod,
        });

      if (profileError) throw profileError;
      setProgress(40);

      // 3. Upload Resume to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (storageError) throw storageError;
      setProgress(60);

      const resumeUrl = supabase.storage.from('resumes').getPublicUrl(fileName).data.publicUrl;

      // 4. Extract Text & Analyze with Gemini (via LLM Gateway)
      const resumeText = await extractTextFromPdf(file);
      setProgress(80);
      
      // Analyze during submission as well for instant feedback
      const aiResult = await analyzeResume(resumeText, job.description);
      setProgress(90);

      // 5. Save Application
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          candidate_id: user.id,
          resume_url: resumeUrl,
          resume_text: resumeText,
          status: 'pending'
        })
        .select()
        .single();

      if (appError) throw appError;

      // 6. Save AI Score
      const { error: scoreError } = await supabase
        .from('ai_scores')
        .insert({
          application_id: appData.id,
          score: aiResult.score,
          matched_skills: aiResult.matchedSkills,
          missing_skills: aiResult.missingSkills,
          experience_relevance: aiResult.experienceRelevance,
          recommendation: aiResult.recommendation,
          summary: aiResult.summary,
        });

      if (scoreError) throw scoreError;

      setProgress(100);
      toast.success('Application submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'An error occurred during application');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900">Final Step</h1>
        <p className="text-slate-500 text-lg">Tell us about yourself and upload your portfolio.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 md:p-12 space-y-12">
        {/* Personal Info Grid */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
            <User size={20} />
            Personal Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <InputField 
              label="Full Name" 
              icon={<User size={18} />} 
              placeholder="John Doe" 
              value={formData.fullName}
              onChange={(v: string) => setFormData({ ...formData, fullName: v })} 
            />
            <InputField 
              label="Phone Number" 
              icon={<Phone size={18} />} 
              placeholder="+1 (555) 000-0000" 
              value={formData.phone}
              onChange={(v: string) => setFormData({ ...formData, phone: v })}
            />
          </div>
        </section>

        {/* Experience & Skills */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
            <FileText size={20} />
            Professional Profile
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
             <InputField 
                label="Current Company" 
                icon={<Building size={18} />} 
                placeholder="Google, Inc." 
                value={formData.currentCompany}
                onChange={(v: string) => setFormData({ ...formData, currentCompany: v })}
              />
              <InputField 
                label="Total Experience" 
                icon={<Calendar size={18} />} 
                placeholder="e.g. 5 Years" 
                value={formData.experience}
                onChange={(v: string) => setFormData({ ...formData, experience: v })}
              />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Skills (Comma separated)</label>
            <textarea
              placeholder="React, TypeScript, Node.js, AWS..."
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none h-24 transition-all"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
             <InputField 
                label="Expected Salary (₹)" 
                icon={<IndianRupee size={18} />} 
                placeholder="8,00,000" 
                value={formData.expectedSalary}
                type="number"
                onChange={(v: string) => setFormData({ ...formData, expectedSalary: v })}
              />
              <InputField 
                label="Notice Period" 
                icon={<Clock size={18} />} 
                placeholder="e.g. 1 Month" 
                value={formData.noticePeriod}
                onChange={(v: string) => setFormData({ ...formData, noticePeriod: v })}
              />
          </div>
          <InputField 
            label="Portfolio / LinkedIn URL" 
            icon={<Linkedin size={18} />} 
            placeholder="https://linkedin.com/in/username" 
            value={formData.portfolioUrl}
            onChange={(v: string) => setFormData({ ...formData, portfolioUrl: v })}
          />
        </section>

        {/* Resume Upload */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
            <Upload size={20} />
            Resume Upload
          </h2>
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 cursor-pointer transition-all ${
                file ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-200 hover:border-red-400'
              }`}
            >
              {file ? (
                <div className="text-center space-y-2">
                  <CheckCircle className="mx-auto text-green-500" size={48} />
                  <p className="font-bold text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Upload className="mx-auto text-slate-400" size={48} />
                  <div>
                    <p className="font-bold text-slate-800">Drop your resume here</p>
                    <p className="text-sm text-slate-500">Only PDF files are accepted. Max 5MB.</p>
                  </div>
                  <span className="bg-white border border-slate-200 px-6 py-2 rounded-xl text-sm font-bold shadow-sm">
                    Choose File
                  </span>
                </div>
              )}
            </label>
          </div>
        </section>

        {/* Action / Progress */}
        <div className="pt-8 space-y-6">
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold text-red-600 px-1">
                <span>{progress < 40 ? 'Preparing profile...' : progress < 60 ? 'Uploading resume...' : progress < 90 ? 'AI Analyzing resume...' : 'Finalizing...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-red-600 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              'Submit Application'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({ label, icon, placeholder, value, onChange, type = 'text' }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-3.5 text-slate-400">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
        />
      </div>
    </div>
  );
}
