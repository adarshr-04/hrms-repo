"use client";

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  MapPin, 
  Search,
  Filter,
  Plus,
  Loader2,
  BookOpen,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trainingService } from '@/services/trainingService';
import { format } from 'date-fns';

export default function TrainingPage() {
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState<any[]>([]);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const data = await trainingService.getTrainings();
      setTrainings(data.results || data);
    } catch (error) {
      console.error("Failed to fetch trainings", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training & Development</h1>
          <p className="text-slate-500">Manage employee upskilling programs and certification tracks.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Program</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p>Loading curriculum...</p>
          </div>
        ) : trainings.length === 0 ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-500 gap-4 text-center bg-white rounded-xl border border-slate-200">
            <GraduationCap className="w-12 h-12 text-slate-300" />
            <div>
              <p className="text-lg font-bold text-slate-900">No training programs</p>
              <p className="text-sm max-w-xs mx-auto">Create your first training course to start building your team's expertise.</p>
            </div>
          </div>
        ) : (
          trainings.map((training) => (
            <div key={training.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col sm:flex-row">
              <div className="sm:w-48 bg-slate-50 flex flex-col items-center justify-center p-6 text-indigo-600 border-b sm:border-b-0 sm:border-r border-slate-100">
                <BookOpen className="w-12 h-12 mb-2" />
                <div className="px-3 py-1 bg-white border border-indigo-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Certification
                </div>
              </div>
              
              <div className="flex-1 p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{training.training_name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Lead: {training.trainer_name}</p>
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <Award className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 italic">
                  "{training.description}"
                </p>

                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{format(new Date(training.start_date), 'MMM d')} - {format(new Date(training.end_date), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{training.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold">
                    <Users className="w-4 h-4" />
                    <span>12 Enrolled</span>
                  </div>
                  <button className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                    Manage Roster
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
