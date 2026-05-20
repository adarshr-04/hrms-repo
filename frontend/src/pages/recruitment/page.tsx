import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  MapPin, 
  Mail, 
  Phone, 
  Loader2,
  FileText,
  DollarSign,
  Layers,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { recruitmentService, JobPosting, Candidate, Application } from '@/services/recruitmentService';
import { toast } from 'sonner';

const STAGES = [
  { id: 'APPLIED', name: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: 'SCREENING', name: 'Screening', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { id: 'INTERVIEW', name: 'Interview', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { id: 'OFFER', name: 'Offer', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { id: 'HIRED', name: 'Hired', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: 'REJECTED', name: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-100' },
];

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'jobs'>('pipeline');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  
  // Modals / forms state
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_range: '',
    employment_type: 'FULL_TIME' as any,
    status: 'OPEN' as any
  });

  const [updatingAppId, setUpdatingAppId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedJobs = await recruitmentService.getJobs();
      const fetchedCandidates = await recruitmentService.getCandidates();
      const fetchedApps = await recruitmentService.getApplications();
      setJobs(fetchedJobs);
      setCandidates(fetchedCandidates);
      setApplications(fetchedApps);
    } catch (error) {
      console.error("Failed to load recruitment data", error);
      toast.error("Failed to sync recruitment dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStageChange = async (appId: number, newStatus: string) => {
    setUpdatingAppId(appId);
    try {
      await recruitmentService.updateApplicationStatus(appId, newStatus, "Status updated via HR Command Board");
      toast.success(`Applicant moved to ${newStatus}`);
      await loadData(); // Reload all states and jobs in case status change triggers job closure
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update candidate pipeline stage");
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.location) {
      toast.error("Please fill in all mandatory job details");
      return;
    }
    try {
      await recruitmentService.createJob(newJob);
      toast.success("New vacancy published successfully");
      setShowAddJobModal(false);
      setNewJob({
        title: '',
        description: '',
        requirements: '',
        location: '',
        salary_range: '',
        employment_type: 'FULL_TIME',
        status: 'OPEN'
      });
      loadData();
    } catch (error) {
      console.error("Failed to create job", error);
      toast.error("Failed to save job opening");
    }
  };

  // Helper to map candidate object to an application
  const getCandidateForApp = (candidateId: number) => {
    return candidates.find(c => c.id === candidateId);
  };

  return (
    <div className="space-y-8 pb-10 min-h-screen">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recruitment Control Center</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage corporate vacancies, review incoming applications, and audit talent acquisition pipelines.</p>
        </div>
        <button 
          onClick={() => setShowAddJobModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span>Post New Vacancy</span>
        </button>
      </div>

      {/* Numerical Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Briefcase className="w-6 h-6 text-indigo-600" />} 
          label="Active Vacancies" 
          value={jobs.filter(j => j.status === 'OPEN').length} 
          subtext="Accepting candidates" 
          color="indigo" 
        />
        <StatCard 
          icon={<Users className="w-6 h-6 text-amber-600" />} 
          label="Active Applicants" 
          value={applications.filter(a => a.status !== 'HIRED' && a.status !== 'REJECTED').length} 
          subtext="Under evaluation" 
          color="amber" 
        />
        <StatCard 
          icon={<UserCheck className="w-6 h-6 text-emerald-600" />} 
          label="Positions Filled" 
          value={applications.filter(a => a.status === 'HIRED').length} 
          subtext="Hired this quarter" 
          color="emerald" 
        />
      </div>

      {/* Tabs Menu Selection */}
      <div className="border-b border-slate-200 flex gap-6">
        <button 
          onClick={() => setActiveTab('pipeline')}
          className={cn(
            "pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all",
            activeTab === 'pipeline' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Candidate Pipeline ({applications.length})
        </button>
        <button 
          onClick={() => setActiveTab('jobs')}
          className={cn(
            "pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all",
            activeTab === 'jobs' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Job Openings ({jobs.length})
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="font-bold text-sm uppercase tracking-widest text-slate-400">Loading Pipeline Data...</p>
        </div>
      ) : activeTab === 'pipeline' ? (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start">
          {STAGES.map(stage => {
            const stageApps = applications.filter(a => a.status === stage.id);
            return (
              <div key={stage.id} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border", stage.color)}>
                    {stage.name}
                  </span>
                  <span className="text-xs font-black text-slate-400">{stageApps.length}</span>
                </div>

                <div className="space-y-3 flex-1">
                  {stageApps.length === 0 ? (
                    <div className="h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      Empty Stage
                    </div>
                  ) : (
                    stageApps.map(app => {
                      const cand = getCandidateForApp(app.candidate);
                      return (
                        <div 
                          key={app.id} 
                          className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all group relative"
                        >
                          <h4 className="font-bold text-xs text-slate-900 truncate pr-4">
                            {app.candidate_name || (cand ? `${cand.first_name} ${cand.last_name}` : 'Unknown Candidate')}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-500 truncate mt-1">{app.job_title}</p>
                          
                          {/* Candidate Detail Cards */}
                          {cand && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                              {cand.linkedin_profile && (
                                <a href={cand.linkedin_profile} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-all">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <a href={`mailto:${cand.email}`} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-all">
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                              <a href={`tel:${cand.phone_number}`} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-all">
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}

                          {/* Quick stage toggle dropdown */}
                          <div className="mt-3 flex gap-2">
                            <select 
                              disabled={updatingAppId === app.id}
                              value={app.status}
                              onChange={(e) => handleStageChange(app.id, e.target.value)}
                              className="w-full text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200 rounded px-1.5 py-1 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            >
                              {STAGES.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                            {updatingAppId === app.id && (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 self-center" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Job Openings Tab View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {jobs.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-900">No Jobs Listed</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Add a new position using the button above to begin hiring.</p>
            </div>
          ) : (
            jobs.map(job => (
              <div 
                key={job.id} 
                className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    job.status === 'OPEN' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    {job.status}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.employment_type?.replace('_', ' ')}</span>
                </div>

                <h3 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors mb-2">
                  {job.title}
                </h3>
                
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{job.location}</span>
                </div>

                <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-6 flex-1 leading-relaxed">
                  {job.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-slate-50 mt-auto">
                  {job.salary_range && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-tighter">Compensation</span>
                      <span className="font-black text-slate-700">{job.salary_range}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-tighter">Applications</span>
                    <span className="font-black text-indigo-600">{job.application_count || 0} applicants</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Job Modal Dialog */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 w-full max-w-xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Publish Job Opportunity</h2>
              <button 
                onClick={() => setShowAddJobModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position Title *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Lead Developer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Bangalore / Remote"
                    value={newJob.location}
                    onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employment Type</label>
                  <select 
                    value={newJob.employment_type}
                    onChange={(e) => setNewJob({...newJob, employment_type: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all font-semibold cursor-pointer text-slate-700"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compensation Details</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ₹12L - ₹18L per annum"
                    value={newJob.salary_range}
                    onChange={(e) => setNewJob({...newJob, salary_range: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role Description</label>
                <textarea 
                  rows={3}
                  placeholder="Summarize key details and work expectations..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate Requirements</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. 3 years node experience, AWS stack skills..."
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({...newJob, requirements: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="flex gap-4 pt-4 justify-end border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-all text-slate-600 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-150 text-sm"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-50/50 border-indigo-100 hover:border-indigo-300",
    amber: "bg-amber-50/50 border-amber-100 hover:border-amber-300",
    emerald: "bg-emerald-50/50 border-emerald-100 hover:border-emerald-300"
  };
  return (
    <div className={cn("bg-white p-6 rounded-3xl border shadow-sm transition-all group flex items-center justify-between", colors[color])}>
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{value}</h3>
        <span className="text-xs font-semibold text-slate-400 block mt-1">{subtext}</span>
      </div>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">{icon}</div>
    </div>
  );
}
