"use client";

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  Clock, 
  Search,
  Filter,
  Plus,
  Loader2,
  ChevronRight,
  FolderDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/projectService';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getProjects();
      setProjects(data.results || data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'ON_HOLD': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Management</h1>
          <p className="text-slate-500">Track initiatives and team allocations across the organization.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Launch Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p>Loading active initiatives...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-500 gap-4 text-center bg-white rounded-xl border border-slate-200">
            <FolderDot className="w-12 h-12 text-slate-300" />
            <div>
              <p className="text-lg font-bold text-slate-900">No projects found</p>
              <p className="text-sm max-w-xs mx-auto">Click 'Launch Project' to start tracking your first organizational initiative.</p>
            </div>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border",
                    getStatusColor(project.status)
                  )}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.project_name}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(project.start_date), 'MMM d, yyyy')}</span>
                  </div>
                  {project.end_date && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{format(new Date(project.end_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-auto p-4 bg-slate-50 rounded-b-xl border-t border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                      U{i}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[8px] font-bold text-indigo-600">
                    +2
                  </div>
                </div>
                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
