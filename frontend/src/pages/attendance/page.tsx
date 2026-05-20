
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  UserCheck, 
  UserX, 
  AlertCircle,
  Search,
  Filter,
  Plus,
  Loader2,
  Fingerprint,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { attendanceService } from '@/services/attendanceService';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function AttendancePage() {
  const { user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Interactive Daily Tap Terminal States
  const [tapStatus, setTapStatus] = useState<'OFFLINE' | 'TAPPED_IN' | 'TAPPED_OUT'>('OFFLINE');
  const [tapRecord, setTapRecord] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTapping, setIsTapping] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Running stopwatch duration calculator (HH:MM:SS)
  const getRunningDuration = () => {
    if (!tapRecord || !tapRecord.check_in) return "00:00:00";
    try {
      const [inH, inM, inS] = tapRecord.check_in.split(':').map(Number);
      const checkInDate = new Date(currentTime);
      checkInDate.setHours(inH, inM, inS || 0);
      
      const diffMs = currentTime.getTime() - checkInDate.getTime();
      if (diffMs < 0) return "00:00:00";
      
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    } catch (err) {
      return "00:00:00";
    }
  };

  const checkTodayTapStatus = async () => {
    const empId = user?.employee_profile_id || 1; // Fallback to employee PK 1 for demo admins
    if (!empId) return;
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const logs = await attendanceService.getAll({ employee: empId, attendance_date: todayStr });
      const todayRecord = Array.isArray(logs) ? logs[0] : (logs.results ? logs.results[0] : null);
      if (todayRecord) {
        setTapRecord(todayRecord);
        if (todayRecord.check_in && !todayRecord.check_out) {
          setTapStatus('TAPPED_IN');
        } else if (todayRecord.check_in && todayRecord.check_out) {
          setTapStatus('TAPPED_OUT');
        }
      } else {
        setTapStatus('OFFLINE');
      }
    } catch (err) {
      console.error("Failed to fetch today's tap status", err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const params: Record<string, string | number> = { attendance_date: dateStr };
      
      // If not admin/manager, only fetch current user's attendance
      if (!isAdmin && !isManager && user?.employee_profile_id) {
        params.employee = user.employee_profile_id;
      }
      
      const data = await attendanceService.getAll(params);
      setRecords(data.results || data);
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAttendance();
  }, [selectedDate, isAdmin, isManager, user?.employee_profile_id]);


  useEffect(() => {
    void checkTodayTapStatus();
  }, [user?.employee_profile_id]);

  const handleTap = async () => {
    setIsTapping(true);
    const empId = user?.employee_profile_id || 1; // Fallback to employee PK 1 for demo admins
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false });

    try {
      if (tapStatus === 'OFFLINE') {
        // Tap In (first time of day)
        const checkInHour = currentTime.getHours();
        const checkInMinute = currentTime.getMinutes();
        const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30);
        const status = isLate ? 'LATE' : 'PRESENT';

        const record = await attendanceService.logAttendance({
          employee: empId,
          attendance_date: todayStr,
          check_in: timeStr,
          status: status,
          notes: `Tapped In via Attendance Terminal at ${currentTime.toLocaleTimeString()}`
        });

        setTapRecord(record);
        setTapStatus('TAPPED_IN');
        toast.success("Successfully Tapped In! Shift started.");
      } else if (tapStatus === 'TAPPED_OUT') {
        // Resuming Shift / Tap In Again
        if (!tapRecord || !tapRecord.id) {
          toast.error("Tap record is missing. Synchronizing status...");
          await checkTodayTapStatus();
          setIsTapping(false);
          return;
        }

        const record = await attendanceService.updateAttendance(tapRecord.id, {
          check_in: timeStr,
          check_out: null as any,
          notes: `${tapRecord.notes || ''}\nResumed Shift (Tapped In) at ${currentTime.toLocaleTimeString()}`
        });

        setTapRecord(record);
        setTapStatus('TAPPED_IN');
        toast.success("Successfully Tapped In again! Shift resumed.");
      } else if (tapStatus === 'TAPPED_IN') {
        // Tap Out (pauses or ends session)
        if (!tapRecord || !tapRecord.id) {
          toast.error("Tap record is missing. Synchronizing status...");
          await checkTodayTapStatus();
          setIsTapping(false);
          return;
        }

        // Calculate hours worked in this session (precision seconds to match stopwatch)
        const checkInTime = tapRecord.check_in || "09:30:00";
        const [inH, inM, inS] = checkInTime.split(':').map(Number);
        const outH = currentTime.getHours();
        const outM = currentTime.getMinutes();
        const outS = currentTime.getSeconds();
        const diffMs = (outH * 3600 + outM * 60 + outS) - (inH * 3600 + inM * 60 + (inS || 0));
        const hoursThisSession = Math.max(0.0001, Number((diffMs / 3600).toFixed(4)));

        // Accumulate work hours
        const totalHours = Number(tapRecord.work_hours || 0) + hoursThisSession;

        const record = await attendanceService.updateAttendance(tapRecord.id, {
          check_out: timeStr,
          work_hours: totalHours,
          notes: `${tapRecord.notes || ''}\nTapped Out via Attendance Terminal at ${currentTime.toLocaleTimeString()}. Logged ${hoursThisSession.toFixed(2)}h for this session. (Total accumulated: ${totalHours.toFixed(2)}h)`
        });

        setTapRecord(record);
        setTapStatus('TAPPED_OUT');
        toast.success(`Successfully Tapped Out! Shift paused. Total: ${totalHours.toFixed(2)}h`);
      }
      // Instantly refresh list of records on page
      await fetchAttendance();
    } catch (error) {
      console.error("Failed to complete tap transaction", error);
      toast.error("Tap transaction failed. Please try again.");
    } finally {
      setIsTapping(false);
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'PRESENT': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'ABSENT': return 'bg-red-50 text-red-700 border-red-100';
      case 'LATE': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'HALF_DAY': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'PRESENT': return <UserCheck className="w-4 h-4" />;
      case 'ABSENT': return <UserX className="w-4 h-4" />;
      case 'LATE': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Tracking</h1>
          <p className="text-slate-500">Monitor and manage daily employee presence.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Log Attendance</span>
          </button>
        </div>
      </div>

      {/* Summary & Tap Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Daily Shift Terminal Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group min-h-[120px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-indigo-600" />
                Shift Tracker
              </p>
              <h3 className="text-sm font-bold text-slate-800 mt-2 font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h3>
            </div>
            {(tapStatus === 'OFFLINE' || tapStatus === 'TAPPED_OUT') && (
              <button
                disabled={isTapping}
                onClick={handleTap}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-all shadow-sm active:scale-95 animate-pulse"
              >
                {isTapping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tap In'}
              </button>
            )}
            {tapStatus === 'TAPPED_IN' && (
              <button
                disabled={isTapping}
                onClick={handleTap}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-black transition-all shadow-sm active:scale-95"
              >
                {isTapping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tap Out'}
              </button>
            )}
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 text-[10px] font-medium text-slate-400 flex flex-col gap-1">
            {tapStatus === 'OFFLINE' && 'Not checked in today.'}
            {tapStatus === 'TAPPED_IN' && (
              <>
                <span>Active session started at <strong className="text-slate-700">{tapRecord?.check_in || '--:--'}</strong></span>
                {Number(tapRecord?.work_hours || 0) > 0 && (
                  <span>Accumulated time: <strong className="text-slate-700">{Number(tapRecord.work_hours).toFixed(2)}h</strong></span>
                )}
                <span className="text-indigo-600 font-bold font-mono flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Active Session: {getRunningDuration()}
                </span>
              </>
            )}
            {tapStatus === 'TAPPED_OUT' && (
              <>
                <span>Currently Tapped Out.</span>
                <span className="font-semibold text-emerald-600">Total Work Hours Logged: {Number(tapRecord?.work_hours || 0).toFixed(2)}h</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Present Today</p>
            <h3 className="text-xl font-bold text-slate-900">{records.filter(r => r.status === 'PRESENT').length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Late Arrivals</p>
            <h3 className="text-xl font-bold text-slate-900">{records.filter(r => r.status === 'LATE').length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Absent</p>
            <h3 className="text-xl font-bold text-slate-900">{records.filter(r => r.status === 'ABSENT').length}</h3>
          </div>
        </div>

      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by employee name..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            <span>Filter by Status</span>
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p>Fetching records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-slate-300" />
              <div>
                <p className="text-lg font-bold text-slate-900">No records for this date</p>
                <p className="text-sm max-w-xs">There are no attendance records logged for {format(selectedDate, 'MMMM do, yyyy')}.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Work Hours</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                          {record.employee_name?.split(' ').map((n: any) => n[0]).join('') || '??'}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{record.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        getStatusColor(record.status)
                      )}>
                        {getStatusIcon(record.status)}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {record.check_in || '--:--'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {record.check_out || '--:--'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {record.work_hours ? `${record.work_hours}h` : '0h'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
