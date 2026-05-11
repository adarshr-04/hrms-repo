"use client";

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  User, 
  Search,
  Filter,
  Plus,
  Loader2,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { performanceService } from '@/services/performanceService';
import { format } from 'date-fns';

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await performanceService.getAll();
      setReviews(data.results || data);
    } catch (error) {
      console.error("Failed to fetch performance data", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: any) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={cn(
              "w-4 h-4",
              star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
            )} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Reviews</h1>
          <p className="text-slate-500">Track and manage employee growth and evaluations.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Review</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by employee or reviewer..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            <span>Filter Rating</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p>Fetching review cycles...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-4 text-center">
              <Star className="w-12 h-12 text-slate-300" />
              <div>
                <p className="text-lg font-bold text-slate-900">No reviews found</p>
                <p className="text-sm max-w-xs">Start a performance cycle to see employee evaluations here.</p>
              </div>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-4 w-full md:w-64">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                    {review.employee_name?.split(' ').map((n: any) => n[0]).join('') || '??'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{review.employee_name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{format(new Date(review.review_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    {renderStars(review.rating)}
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                      review.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {review.status}
                    </span>
                  </div>
                  <div className="relative">
                    <MessageSquare className="absolute -left-6 top-1 w-4 h-4 text-slate-200" />
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "{review.comments}"
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-48 text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Reviewer</p>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-semibold text-slate-700">{review.reviewer_name}</span>
                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      {review.reviewer_name?.split(' ').map((n: any) => n[0]).join('') || '??'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
