import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Application } from '../types';
import { Briefcase, Trash2, Search, MapPin, Eye, ExternalLink, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function ActiveJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: appsData, error: appsError } = await supabase
      .from('applications')
      .select('*');
    
    if (jobsError) toast.error(jobsError.message);
    if (appsError) toast.error(appsError.message);

    setJobs(jobsData || []);
    setApplications(appsData || []);
    setLoading(false);
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
      toast.success("Job deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: 'active' | 'filled') => {
    try {
      const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId);
      if (error) {
        if (error.message.includes('Could not find the column')) {
          toast.error("Database schema update required. Please ask an admin to run: ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled'));", { duration: 8000 });
        } else {
            toast.error(error.message);
        }
        return;
      }
      toast.success(`Job marked as ${status}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-20 text-center flex justify-center h-full items-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="p-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase size={20} className="text-red-600" />
                Active Positions
              </h2>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Manage all recruitment openings.</p>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-2 text-slate-400" size={14} />
              <input 
                placeholder="Search jobs..." 
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-500 md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

      <div className="flex-1 overflow-x-auto p-4 md:p-6 pb-20">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-[800px] lg:min-w-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Position</th>
                <th className="px-6 py-4 text-center">Location</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Candidates Applied</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <AnimatePresence>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No jobs found.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const candidateCount = applications.filter(a => a.job_id === job.id).length;
                    return (
                      <motion.tr 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        key={job.id} 
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className="font-bold text-slate-900">{job.title}</div>
                             <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-slate-200">
                               ID-{job.id.split('-')[0].toUpperCase()}
                             </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{job.company}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                            <MapPin size={12} className="text-slate-400" />
                            {job.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border shadow-sm ${
                            job.status === 'filled' 
                              ? 'bg-slate-50 text-slate-600 border-slate-200' 
                              : 'bg-green-50 text-green-600 border-green-200'
                          }`}>
                            {job.status === 'filled' ? 'Filled' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm inline-block border border-blue-100">
                            {candidateCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {job.status !== 'filled' && (
                              <button 
                                onClick={() => handleUpdateJobStatus(job.id, 'filled')}
                                className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Mark as Filled"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <Link 
                              to={`/jobs/${job.id}`} 
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Preview"
                            >
                              <ExternalLink size={16} />
                            </Link>
                            <button 
                              onClick={() => handleDelete(job.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Job"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
