
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { leaveService } from '@/services/leaveService';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

export default function LeavesPage() {
  const { user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('PENDING');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params: any = { status: activeTab === 'ALL' ? undefined : activeTab };
      
      // If not admin/manager, only fetch current user's leaves
      if (!isAdmin && !isManager && user?.employee_id) {
        params.employee = user.employee_id;
      }
      
      const data = await leaveService.getAll(params);
      setLeaves(data.results || data);
    } catch (error) {
      console.error("Failed to fetch leaves", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeTab, isAdmin, isManager]);

  const handleStatusUpdate = async (id: any, status: any) => {
    try {
      await leaveService.updateStatus(id, status);
      fetchLeaves(); // Refresh list
    } catch (error) {
      console.error("Failed to update leave status", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin || isManager ? 'Leave Management' : 'My Leave Requests'}
          </h1>
          <p className="text-slate-500">
            {isAdmin || isManager ? 'Approve or manage employee time-off requests.' : 'Track and manage your time-off applications.'}
          </p>
        </div>
        {!isAdmin && !isManager && (
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm">
            <FileText className="w-4 h-4" />
            <span>Request Leave</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === tab 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            {tab === 'ALL' ? 'History' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Requests Grid/List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium">Syncing requests...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">No {activeTab.toLowerCase()} requests</p>
              <p className="text-sm text-slate-500">Everything is up to date! There are no records to show here.</p>
            </div>
          </div>
        ) : (
          leaves.map((leave) => (
            <div 
              key={leave.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold uppercase">
                  {leave.employee_name?.split(' ').map((n: any) => n[0]).join('') || '??'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{leave.employee_name}</h4>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{leave.leave_type} LEAVE</p>
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{format(new Date(leave.start_date), 'MMM d')}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className="font-medium">{format(new Date(leave.end_date), 'MMM d, yyyy')}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{leave.total_days} day(s) requested</p>
              </div>

              <div className="flex-1 max-w-md">
                <p className="text-sm text-slate-600 line-clamp-2 italic">
                  &ldquo;{leave.reason}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {leave.status === 'PENDING' && (isAdmin || isManager) ? (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                      className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-emerald-200"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                  </>
                ) : (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    leave.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                    leave.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-100" :
                    "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {leave.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
