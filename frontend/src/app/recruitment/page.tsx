"use client";

import React, { useEffect, useState } from 'react';
import { recruitmentService } from '@/services/recruitmentService';
import { Briefcase, Users, FileText, Plus, Search, MapPin, Clock } from 'lucide-react';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await recruitmentService.getJobs();
        setJobs(data.results || data);
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruitment & Hiring</h1>
          <p className="text-slate-500">Manage job postings, candidates, and hiring pipeline.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md shadow-indigo-100">
          <Plus className="w-4 h-4" />
          Create Job Posting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Open Positions</p>
            <p className="text-2xl font-bold text-slate-900">{jobs.filter(j => j.status === 'OPEN').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Candidates</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Applications</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </div>
      </div>

      {/* Search & Filters Placeholder */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search job postings..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          Recent Job Postings
        </h3>
        
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500">Loading job postings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <p className="text-lg font-bold text-slate-900">No job postings found</p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">Start by creating your first job posting to attract candidates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.employment_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                  {job.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-xs font-semibold text-indigo-600">
                    {job.application_count || 0} Applications
                  </span>
                  <button className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
