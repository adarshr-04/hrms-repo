import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  Plus, 
  Loader2, 
  Calendar,
  Search,
  Filter,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { performanceService } from '@/services/performanceService';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding'
};

export default function PerformancePage() {
  const { user, isHR, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Modal states
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<string>('ALL');

  const [formData, setFormData] = useState({
    employee: '',
    rating: 5,
    comments: '',
    status: 'COMPLETED'
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await performanceService.getAll();
      setReviews(data.results || data);
    } catch (error) {
      console.error("Failed to fetch performance data", error);
      toast.error("Failed to fetch performance records");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      const empList = Array.isArray(data) ? data : (data.results || []);
      setEmployees(empList);
      
      // Select first employee by default if list is not empty
      if (empList.length > 0) {
        setFormData(prev => ({ ...prev, employee: String(empList[0].id) }));
      }
    } catch (err) {
      console.error("Failed to load employees for review selection", err);
    }
  };

  useEffect(() => {
    void fetchReviews();
    if (isHR || isManager) {
      void fetchEmployees();
    }
  }, [isHR, isManager]);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee) {
      toast.error("Please select an employee to review.");
      return;
    }
    if (!formData.comments.trim()) {
      toast.error("Please write some feedback comment details.");
      return;
    }
    if (!user?.employee_profile_id) {
      toast.error("Reviewer profile not found.");
      return;
    }

    setIsSubmitting(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      await performanceService.create({
        employee: Number(formData.employee),
        reviewer: user.employee_profile_id,
        review_date: todayStr,
        rating: formData.rating,
        comments: formData.comments,
        status: formData.status
      });

      toast.success("Performance review submitted successfully!");
      setShowAddReviewModal(false);
      setFormData({
        employee: employees[0]?.id ? String(employees[0].id) : '',
        rating: 5,
        comments: '',
        status: 'COMPLETED'
      });
      await fetchReviews();
    } catch (error: any) {
      console.error("Failed to submit review", error);
      const errMsg = error.response?.data?.detail || "Review submission failed. Check permissions.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const displayRating = interactive && ratingHover !== null ? ratingHover : rating;
          const isFilled = star <= displayRating;
          return (
            <button
              type="button"
              key={star}
              disabled={!interactive}
              onClick={() => onSelect?.(star)}
              onMouseEnter={() => interactive && setRatingHover(star)}
              onMouseLeave={() => interactive && setRatingHover(null)}
              className={cn(
                "transition-all focus:outline-none",
                interactive ? "hover:scale-110 p-0.5" : "cursor-default"
              )}
            >
              <Star 
                className={cn(
                  "w-5 h-5",
                  isFilled ? "fill-amber-400 text-amber-400" : "text-slate-200"
                )} 
              />
            </button>
          );
        })}
      </div>
    );
  };

  // Filter & Search logic
  const filteredReviews = reviews.filter(review => {
    const query = searchQuery.toLowerCase();
    const empName = (review.employee_name || '').toLowerCase();
    const revName = (review.reviewer_name || '').toLowerCase();
    const comments = (review.comments || '').toLowerCase();
    const matchesSearch = empName.includes(query) || revName.includes(query) || comments.includes(query);

    const matchesRating = filterRating === 'ALL' || String(review.rating) === filterRating;

    return matchesSearch && matchesRating;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Reviews</h1>
          <p className="text-slate-500">Track and manage employee growth and evaluations.</p>
        </div>
        {(isHR || isManager) && (
          <button 
            onClick={() => setShowAddReviewModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Review</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by employee or reviewer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars (Outstanding)</option>
              <option value="4">4 Stars (Exceeds)</option>
              <option value="3">3 Stars (Meets)</option>
              <option value="2">2 Stars (Below)</option>
              <option value="1">1 Star (Needs Improvement)</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p>Fetching review cycles...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-4 text-center">
              <Star className="w-12 h-12 text-slate-300" />
              <div>
                <p className="text-lg font-bold text-slate-900">No reviews found</p>
                <p className="text-sm max-w-xs text-slate-500 mt-1">Start a performance cycle to see employee evaluations here.</p>
              </div>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-4 w-full md:w-64">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                    {review.employee_name?.split(' ').map((n: any) => n[0]).join('') || '??'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{review.employee_name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        {review.review_date ? format(new Date(review.review_date), 'MMM d, yyyy') : 'N/A'}
                      </p>
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
                    <p className="text-sm text-slate-600 italic leading-relaxed pl-1">
                      &ldquo;{review.comments}&rdquo;
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

      {/* New Review Modal */}
      {showAddReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">New Performance Evaluation</h3>
              <button 
                onClick={() => setShowAddReviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Colleague</label>
                <select
                  value={formData.employee}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                >
                  <option value="" disabled>Choose an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.department_name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Evaluation Score</label>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
                  {renderStars(formData.rating, true, (r) => setFormData(prev => ({ ...prev, rating: r })))}
                  <span className="text-xs font-bold text-indigo-600">
                    {RATING_DESCRIPTIONS[formData.rating]}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Constructive Comments</label>
                <textarea
                  placeholder="Summarize key accomplishments, goals met, or areas of growth..."
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Review Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status"
                      value="COMPLETED"
                      checked={formData.status === 'COMPLETED'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'COMPLETED' }))}
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span className="text-sm font-medium text-slate-700">Completed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status"
                      value="PENDING"
                      checked={formData.status === 'PENDING'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'PENDING' }))}
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span className="text-sm font-medium text-slate-700">Pending Review</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Evaluation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

