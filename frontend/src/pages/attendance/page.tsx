import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
  Fingerprint,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  FileEdit,
  Inbox,
  Shield,
  Radio,
  TrendingUp,
  Briefcase,
  Filter,
  Search,
  Users,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { attendanceService } from '@/services/attendanceService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, subMonths, addMonths, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AttendanceRecord {
  id: number;
  employee: number;
  employee_name?: string;
  attendance_date: string;
  check_in?: string;
  check_out?: string | null;
  work_hours?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
  notes?: string;
}

interface AttendanceRequest {
  id: number;
  employee: number;
  employee_name?: string;
  attendance_date: string;
  request_type: 'CORRECTION' | 'MISSING_OUT';
  check_in?: string;
  check_out?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: number;
  reviewed_by_name?: string;
  review_notes?: string;
  created_at: string;
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  PRESENT:  'bg-emerald-500',
  LATE:     'bg-amber-500',
  ABSENT:   'bg-rose-500',
  HALF_DAY: 'bg-blue-500',
  ON_LEAVE: 'bg-purple-500',
};

const STATUS_BG: Record<string, string> = {
  PRESENT:  'bg-emerald-50 text-emerald-700 border-emerald-100',
  ABSENT:   'bg-rose-50   text-rose-700   border-rose-100',
  LATE:     'bg-amber-50  text-amber-700  border-amber-100',
  HALF_DAY: 'bg-blue-50   text-blue-700   border-blue-100',
  ON_LEAVE: 'bg-purple-50 text-purple-700 border-purple-100',
};

// ═════════════════════════════════════════════════════════════════════════════
export default function AttendancePage() {
  const { user, isAdmin, isManager } = useAuth();
  const isHRAdmin = isAdmin;
  const canReview   = isHRAdmin || isManager;

  // ── state ──
  const [loading,       setLoading]       = useState(true);
  const [records,       setRecords]       = useState<AttendanceRecord[]>([]);
  const [myRecords,     setMyRecords]     = useState<AttendanceRecord[]>([]);
  const [requests,      setRequests]      = useState<AttendanceRequest[]>([]);
  const [selectedDate,  setSelectedDate]  = useState(new Date());
  const [calMonth,      setCalMonth]      = useState(new Date());
  const [activeTab,     setActiveTab]     = useState<'dashboard' | 'calendar' | 'requests'>('dashboard');

  // tap terminal
  const [tapStatus,  setTapStatus]  = useState<'OFFLINE' | 'TAPPED_IN' | 'TAPPED_OUT'>('OFFLINE');
  const [tapRecord,  setTapRecord]  = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTapping,  setIsTapping]  = useState(false);
  const [gpsLocked,  setGpsLocked]  = useState(false);
  const [userLat,    setUserLat]    = useState<number | null>(null);
  const [userLng,    setUserLng]    = useState<number | null>(null);
  const [insideZone, setInsideZone] = useState<boolean | null>(null); // null = unknown
  const [gpsError,   setGpsError]   = useState<string | null>(null);
  const isBefore6PM = currentTime.getHours() < 18;

  // ── Office zone config (change to your actual office coordinates) ──
  const OFFICE_LAT    = 12.906245151822224;   // Office latitude
  const OFFICE_LNG    = 77.57907788025564;    // Office longitude
  const OFFICE_RADIUS = 300;                  // Radius in metres

  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth radius in metres
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // correction request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    attendance_date: format(new Date(), 'yyyy-MM-dd'),
    request_type: 'CORRECTION' as 'CORRECTION' | 'MISSING_OUT',
    check_in: '',
    check_out: '',
    reason: ''
  });
  const [submittingReq, setSubmittingReq] = useState(false);

  // review modal (manager/HR)
  const [reviewingReq, setReviewingReq]   = useState<AttendanceRequest | null>(null);
  const [reviewNotes,  setReviewNotes]    = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // search / filter (dashboard table)
  const [searchQ,    setSearchQ]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── live clock + GPS animation ──
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Real GPS geofencing using browser Geolocation API ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported');
      setGpsLocked(false);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        setGpsLocked(true);
        setGpsError(null);
        const dist = haversineDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
        setInsideZone(dist <= OFFICE_RADIUS);
      },
      (err) => {
        setGpsError(err.message);
        setGpsLocked(false);
        setInsideZone(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── running stopwatch ──
  const getRunningDuration = () => {
    if (!tapRecord?.check_in) return '00:00:00';
    try {
      const [h, m, s] = tapRecord.check_in.split(':').map(Number);
      const base = new Date(currentTime);
      base.setHours(h, m, s || 0);
      let diff = currentTime.getTime() - base.getTime();
      if (diff < 0) diff = 0;

      // Add previously logged work hours (for resumed shifts)
      const previousMs = Number(tapRecord.work_hours || 0) * 3600000;
      const totalMs = diff + previousMs;

      const pad = (n: number) => String(n).padStart(2, '0');
      const hrs = Math.floor(totalMs / 3600000);
      const mins = Math.floor((totalMs % 3600000) / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    } catch { return '00:00:00'; }
  };

  // ── data loaders ──
  const checkTodayTapStatus = useCallback(async () => {
    const empId = user?.employee_profile_id;
    if (!empId) return;
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const logs = await attendanceService.getAll({ employee: empId, attendance_date: todayStr });
      const rec: AttendanceRecord | undefined = (Array.isArray(logs) ? logs : (logs.results ?? []))[0];
      if (rec) {
        setTapRecord(rec);
        setTapStatus(rec.check_in && !rec.check_out ? 'TAPPED_IN' : rec.check_in ? 'TAPPED_OUT' : 'OFFLINE');
      } else {
        setTapStatus('OFFLINE');
      }
    } catch (err) { console.error(err); }
  }, [user?.employee_profile_id]);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const params: Record<string, any> = { attendance_date: dateStr };
      if (!isHRAdmin && !isManager && user?.employee_profile_id) {
        params.employee = user.employee_profile_id;
      }
      const data = await attendanceService.getAll(params);
      setRecords(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedDate, isHRAdmin, isManager, user?.employee_profile_id]);

  const fetchMyMonthRecords = useCallback(async () => {
    const empId = user?.employee_profile_id;
    if (!empId) return;
    try {
      const from = format(startOfMonth(calMonth), 'yyyy-MM-dd');
      const to   = format(endOfMonth(calMonth),   'yyyy-MM-dd');
      // Fetch all for the range (filtered by employee from backend)
      const all = await attendanceService.getAll({ employee: empId });
      const arr: AttendanceRecord[] = Array.isArray(all) ? all : (all.results ?? []);
      setMyRecords(arr.filter(r => r.attendance_date >= from && r.attendance_date <= to));
    } catch (err) { console.error(err); }
  }, [calMonth, user?.employee_profile_id]);

  const fetchRequests = useCallback(async () => {
    try {
      const data: any = await attendanceService.getRequests();
      setRequests(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { void fetchAttendance(); }, [fetchAttendance]);
  useEffect(() => { void checkTodayTapStatus(); }, [checkTodayTapStatus]);
  useEffect(() => { void fetchMyMonthRecords(); }, [fetchMyMonthRecords]);
  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  // ── tap handler ──
  const handleTap = async () => {
    const empId = user?.employee_profile_id;
    if (!empId) { toast.error('Employee profile not found.'); return; }
    setIsTapping(true);
    const todayStr  = format(new Date(), 'yyyy-MM-dd');
    const timeStr   = currentTime.toLocaleTimeString('en-US', { hour12: false });

    try {
      if (tapStatus === 'OFFLINE') {
        // Tap In — check if inside zone (warn if not, but allow)
        if (insideZone === false) {
          toast.warning('⚠️ You are outside the office zone. Tap-In recorded anyway.', { duration: 5000 });
        }
        const isLate = currentTime.getHours() > 9 || (currentTime.getHours() === 9 && currentTime.getMinutes() > 30);
        const rec = await attendanceService.logAttendance({
          employee: empId, attendance_date: todayStr, check_in: timeStr,
          status: isLate ? 'LATE' : 'PRESENT',
          notes: `Tapped In at ${currentTime.toLocaleTimeString()}${insideZone === false ? ' [Outside Office Zone]' : ''}`
        });
        setTapRecord(rec); setTapStatus('TAPPED_IN');
        if (insideZone !== false) toast.success('Tapped In! Shift started.');
      } else if (tapStatus === 'TAPPED_OUT') {
        // Resume Shift — only before 6 PM
        if (!isBefore6PM) {
          toast.error('Resuming shifts is only allowed before 6:00 PM.');
          setIsTapping(false);
          return;
        }
        if (insideZone === false) {
          toast.warning('⚠️ You are outside the office zone. Resuming shift anyway.', { duration: 5000 });
        }
        const rec = await attendanceService.updateAttendance(tapRecord!.id, {
          check_in: timeStr, check_out: null,
          notes: `${tapRecord?.notes || ''}\nResumed shift at ${currentTime.toLocaleTimeString()}${insideZone === false ? ' [Outside Office Zone]' : ''}`
        });
        setTapRecord(rec); setTapStatus('TAPPED_IN');
        if (insideZone !== false) toast.success('Tapped In again! Shift resumed.');
      } else {
        // Tap Out — warn if outside zone but always allow
        if (insideZone === false) {
          toast.warning('⚠️ You are outside the office zone. Tap-Out recorded anyway.', { duration: 5000 });
        }
        const [h, m, s] = (tapRecord!.check_in || '09:30:00').split(':').map(Number);
        const diffMs = (currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds()) -
                       (h * 3600 + m * 60 + (s || 0));
        const sessionHours = Math.max(0.0001, Number((diffMs / 3600).toFixed(4)));
        const total = Number((Number(tapRecord!.work_hours || 0) + sessionHours).toFixed(2));
        const rec = await attendanceService.updateAttendance(tapRecord!.id, {
          check_out: timeStr, work_hours: total,
          notes: `${tapRecord?.notes || ''}\nTapped Out at ${currentTime.toLocaleTimeString()}. Session: ${sessionHours.toFixed(2)}h | Total: ${total.toFixed(2)}h${insideZone === false ? ' [Outside Office Zone]' : ''}`
        });
        setTapRecord(rec); setTapStatus('TAPPED_OUT');
        if (insideZone !== false) toast.success(`Tapped Out! Total: ${total.toFixed(2)}h`);
        else toast.success(`Tapped Out! Total: ${total.toFixed(2)}h (outside office zone)`);
      }
      await Promise.all([fetchAttendance(), checkTodayTapStatus()]);
    } catch (err) { toast.error('Tap failed. Please try again.'); }
    finally { setIsTapping(false); }
  };

  // ── correction request submit ──
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const empId = user?.employee_profile_id;
    if (!empId) { toast.error('No employee profile found.'); return; }
    if (!requestForm.reason.trim()) { toast.error('Please provide a reason.'); return; }
    setSubmittingReq(true);
    try {
      await attendanceService.createRequest({
        employee: empId,
        ...requestForm,
        check_in:  requestForm.check_in  || undefined,
        check_out: requestForm.check_out || undefined,
      });
      toast.success('Correction request submitted!');
      setShowRequestModal(false);
      setRequestForm({ attendance_date: format(new Date(), 'yyyy-MM-dd'), request_type: 'CORRECTION', check_in: '', check_out: '', reason: '' });
      void fetchRequests();
    } catch { toast.error('Failed to submit request.'); }
    finally { setSubmittingReq(false); }
  };

  // ── review submit ──
  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingReq) return;
    setSubmittingReview(true);
    try {
      await attendanceService.updateRequest(reviewingReq.id, { status, review_notes: reviewNotes });
      toast.success(`Request ${status.toLowerCase()}.`);
      setReviewingReq(null);
      setReviewNotes('');
      void fetchRequests();
      void fetchAttendance();
    } catch { toast.error('Failed to review request.'); }
    finally { setSubmittingReview(false); }
  };

  // ── calendar helpers ──
  const calDays = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) });
  const firstDow = getDay(startOfMonth(calMonth));

  const getRecordForDay = (day: Date) => {
    const str = format(day, 'yyyy-MM-dd');
    return myRecords.find(r => r.attendance_date === str);
  };

  // stats for dashboard table area
  const filtered = records.filter(r => {
    const matchSearch = !searchQ || (r.employee_name || '').toLowerCase().includes(searchQ.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // month stats for calendar
  const monthPresent  = myRecords.filter(r => r.status === 'PRESENT').length;
  const monthLate     = myRecords.filter(r => r.status === 'LATE').length;
  const monthAbsent   = myRecords.filter(r => r.status === 'ABSENT').length;
  const monthHours    = myRecords.reduce((acc, r) => acc + Number(r.work_hours || 0), 0);

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const myRequests      = requests.filter(r => r.employee === user?.employee_profile_id);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Tracking</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Monitor shifts, log time, and manage correction requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            {(['dashboard', 'calendar', 'requests'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize relative',
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab}
                {tab === 'requests' && pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {!canReview && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 text-sm"
            >
              <FileEdit className="w-4 h-4" />
              <span>Request Correction</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           TAB: DASHBOARD
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* ── Top row: tap terminal + geofencing + stats ── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* Shift Tap Terminal */}
            <div className={cn(
              'relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between min-h-[160px] border transition-all',
              tapStatus === 'TAPPED_IN'
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500 shadow-xl shadow-emerald-200'
                : tapStatus === 'TAPPED_OUT'
                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 shadow-xl'
                : 'bg-gradient-to-br from-indigo-600 to-purple-700 border-indigo-500 shadow-xl shadow-indigo-200'
            )}>
              {/* Animated rings */}
              {tapStatus === 'TAPPED_IN' && (
                <>
                  <div className="absolute inset-0 rounded-2xl border-4 border-white/10 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-0 rounded-2xl border-2 border-white/5 animate-ping" style={{ animationDuration: '2s' }} />
                </>
              )}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-white/80" />
                    <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Shift Terminal</span>
                  </div>
                  {tapStatus === 'TAPPED_IN' && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-200 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping" />
                      LIVE
                    </span>
                  )}
                </div>
                <div className="font-mono text-2xl font-black text-white">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                {tapStatus === 'TAPPED_IN' && (
                  <div className="text-emerald-200 font-mono text-sm font-bold mt-1">{getRunningDuration()}</div>
                )}
                {tapStatus === 'TAPPED_OUT' && (
                  <div className="text-slate-300 text-xs font-semibold mt-1">Total: {Number(tapRecord?.work_hours || 0).toFixed(2)}h</div>
                )}
                {tapStatus === 'OFFLINE' && (
                  <div className="text-indigo-200 text-xs font-semibold mt-1">Not checked in today</div>
                )}
              </div>
              {/* After 6 PM: TAPPED_OUT => hide Resume Shift, show disabled label */}
              {tapStatus === 'TAPPED_OUT' && !isBefore6PM ? (
                <div className="mt-4 w-full py-2.5 rounded-xl font-black text-xs text-center bg-white/10 text-white/50 border border-white/10 select-none">
                  Shift Closed (After 6:00 PM)
                </div>
              ) : tapStatus === 'TAPPED_IN' && !isBefore6PM ? (
                // After 6 PM and still tapped in → show Tap Out prominently
                <button
                  onClick={handleTap}
                  disabled={isTapping}
                  className="mt-4 w-full py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-900/30"
                >
                  {isTapping
                    ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    : 'Tap Out ⏹'}
                </button>
              ) : (
                <button
                  onClick={handleTap}
                  disabled={isTapping}
                  className={cn(
                    'mt-4 w-full py-2.5 rounded-xl font-black text-sm transition-all active:scale-95',
                    tapStatus === 'TAPPED_IN'
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-900/30'
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                  )}
                >
                  {isTapping
                    ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    : tapStatus === 'TAPPED_IN' ? 'Tap Out ⏹' : tapStatus === 'TAPPED_OUT' ? 'Resume Shift ▶' : 'Tap In ▶'}
                </button>
              )}
            </div>

            {/* GPS Geofencing Card */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 p-6 flex flex-col justify-between min-h-[160px]">
              {/* Radar rings */}
              <div className="absolute right-4 bottom-4 w-28 h-28 opacity-20">
                {[28, 20, 12].map((s, i) => (
                  <div key={i} className={cn(
                    'absolute rounded-full border',
                    gpsError ? 'border-rose-400 opacity-20' :
                    insideZone === false ? 'border-amber-400' :
                    insideZone === true  ? 'border-emerald-400' : 'border-slate-400',
                    gpsLocked ? 'animate-ping' : 'opacity-30'
                  )} style={{
                    width: s * 4, height: s * 4,
                    top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    animationDuration: `${2 + i * 0.7}s`,
                    animationDelay: `${i * 0.3}s`
                  }} />
                ))}
                <div className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full',
                  gpsError ? 'bg-rose-500' :
                  insideZone === false ? 'bg-amber-400' :
                  insideZone === true  ? 'bg-emerald-400' : 'bg-slate-500'
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Radio className={cn('w-4 h-4',
                    gpsError ? 'text-rose-400' :
                    insideZone === false ? 'text-amber-400' :
                    insideZone === true  ? 'text-emerald-400' : 'text-slate-500'
                  )} />
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Geofencing</span>
                </div>
                <div className={cn(
                  'text-sm font-black',
                  gpsError ? 'text-rose-400' :
                  insideZone === false ? 'text-amber-400' :
                  insideZone === true  ? 'text-emerald-400' : 'text-slate-500'
                )}>
                  {gpsError
                    ? '✕ GPS Unavailable'
                    : !gpsLocked
                    ? 'Acquiring GPS...'
                    : insideZone === true
                    ? '✓ Inside Office Zone'
                    : insideZone === false
                    ? '⚠ Outside Office Zone'
                    : 'Checking zone...'}
                </div>
                <div className="text-slate-500 text-[10px] font-semibold mt-1 font-mono">
                  {userLat !== null && userLng !== null
                    ? `${userLat.toFixed(4)}° N, ${userLng.toFixed(4)}° E`
                    : '--- ° N, --- ° E'}
                </div>
                {insideZone === false && (
                  <div className="mt-1.5 text-[9px] font-black text-amber-400 uppercase tracking-wider">
                    ⚠ You are outside the office zone
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className={cn('w-3.5 h-3.5',
                    gpsLocked ? (insideZone === false ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-600'
                  )} />
                  <span className="text-[10px] font-bold text-slate-400">Office Radius</span>
                  <span className="text-[9px] font-black text-slate-500 ml-auto">{OFFICE_RADIUS}m</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className={cn('w-3.5 h-3.5',
                    gpsError ? 'text-rose-400' : gpsLocked ? 'text-emerald-400' : 'text-slate-600'
                  )} />
                  <span className="text-[10px] font-bold text-slate-400">GPS Status</span>
                  {gpsLocked && !gpsError && (
                    <span className={cn(
                      'text-[9px] font-black ml-auto',
                      insideZone === false ? 'text-amber-500' : 'text-emerald-500'
                    )}>
                      {insideZone === false ? 'OUT OF ZONE' : 'VERIFIED'}
                    </span>
                  )}
                  {gpsError && <span className="text-[9px] font-black text-rose-500 ml-auto">ERROR</span>}
                </div>
              </div>
            </div>

            {/* Present */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner">
                <UserCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Present Today</p>
                <h3 className="text-3xl font-black text-slate-900 mt-0.5">{records.filter(r => r.status === 'PRESENT').length}</h3>
                <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">{records.filter(r => r.status === 'LATE').length} late</p>
              </div>
            </div>

            {/* Absent */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shadow-inner">
                <UserX className="w-7 h-7 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Absent</p>
                <h3 className="text-3xl font-black text-slate-900 mt-0.5">{records.filter(r => r.status === 'ABSENT').length}</h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{format(selectedDate, 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* ── Attendance Table ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 flex-1 w-full">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={e => setSelectedDate(new Date(e.target.value))}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
              >
                <option value="">All Statuses</option>
                {['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto min-h-[240px] flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center gap-3 text-slate-400 p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="font-semibold">Loading records…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
                  <CalendarIcon className="w-12 h-12 text-slate-200" />
                  <div>
                    <p className="text-lg font-black text-slate-900">No records found</p>
                    <p className="text-sm text-slate-400 max-w-xs mt-1">No attendance records for {format(selectedDate, 'MMMM d, yyyy')}.</p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Employee', 'Status', 'Check In', 'Check Out', 'Work Hours', 'Notes'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-black text-indigo-700 uppercase">
                              {(rec.employee_name || '??').split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{rec.employee_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border',
                            STATUS_BG[rec.status] || 'bg-slate-50 text-slate-700 border-slate-100'
                          )}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_COLOR[rec.status] || 'bg-slate-400')} />
                            {rec.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-700">{rec.check_in || '—'}</td>
                        <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-700">{rec.check_out || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-slate-900">{rec.work_hours ? `${Number(rec.work_hours).toFixed(2)}h` : '—'}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 italic max-w-xs truncate">{rec.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           TAB: CALENDAR (Monthly Heatmap)
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Month stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Days Present', value: monthPresent, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Late Arrivals', value: monthLate,   icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50'  },
              { label: 'Absent Days',  value: monthAbsent,  icon: XCircle,      color: 'text-rose-600',   bg: 'bg-rose-50'   },
              { label: 'Hours Logged', value: `${monthHours.toFixed(1)}h`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
                  <Icon className={cn('w-6 h-6', color)} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
              <button onClick={() => setCalMonth(m => subMonths(m, 1))}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <h2 className="text-lg font-black text-slate-900">{format(calMonth, 'MMMM yyyy')}</h2>
              <button onClick={() => setCalMonth(m => addMonths(m, 1))}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {/* offset blank cells */}
                {Array.from({ length: firstDow }).map((_, i) => <div key={`blank-${i}`} />)}

                {calDays.map(day => {
                  const rec = getRecordForDay(day);
                  const todayFlag = isToday(day);
                  const weekend = getDay(day) === 0 || getDay(day) === 6;
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'relative rounded-xl p-2 min-h-[68px] flex flex-col transition-all cursor-default',
                        todayFlag ? 'ring-2 ring-indigo-400 ring-offset-1' : '',
                        rec
                          ? rec.status === 'PRESENT'  ? 'bg-emerald-50 border border-emerald-100 hover:shadow-md'
                          : rec.status === 'LATE'     ? 'bg-amber-50  border border-amber-100  hover:shadow-md'
                          : rec.status === 'ABSENT'   ? 'bg-rose-50   border border-rose-100   hover:shadow-md'
                          : rec.status === 'HALF_DAY' ? 'bg-blue-50   border border-blue-100   hover:shadow-md'
                          : rec.status === 'ON_LEAVE' ? 'bg-purple-50 border border-purple-100 hover:shadow-md'
                          : 'bg-slate-50 border border-slate-100'
                          : weekend ? 'bg-slate-50/50 border border-slate-50' : 'bg-white border border-slate-100'
                      )}
                    >
                      <span className={cn(
                        'text-xs font-black',
                        todayFlag ? 'text-indigo-600' : weekend ? 'text-slate-300' : 'text-slate-600'
                      )}>
                        {format(day, 'd')}
                      </span>
                      {rec && (
                        <>
                          <span className={cn(
                            'mt-auto text-[9px] font-black uppercase tracking-widest',
                            rec.status === 'PRESENT'  ? 'text-emerald-600'
                            : rec.status === 'LATE'   ? 'text-amber-600'
                            : rec.status === 'ABSENT' ? 'text-rose-600'
                            : rec.status === 'HALF_DAY' ? 'text-blue-600'
                            : 'text-purple-600'
                          )}>
                            {rec.status.replace('_', ' ')}
                          </span>
                          {rec.work_hours ? (
                            <span className="text-[9px] font-semibold text-slate-400">{Number(rec.work_hours).toFixed(1)}h</span>
                          ) : null}
                        </>
                      )}
                      {!rec && !weekend && (
                        <span className="mt-auto text-[9px] text-slate-200 font-semibold">—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-50">
                {[
                  { label: 'Present',  cls: 'bg-emerald-500' },
                  { label: 'Late',     cls: 'bg-amber-500'   },
                  { label: 'Absent',   cls: 'bg-rose-500'    },
                  { label: 'Half Day', cls: 'bg-blue-500'    },
                  { label: 'On Leave', cls: 'bg-purple-500'  },
                ].map(({ label, cls }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-md', cls)} />
                    <span className="text-[10px] font-bold text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           TAB: REQUESTS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Manager / HR pending inbox */}
          {canReview && pendingRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-100">
                <Inbox className="w-5 h-5 text-amber-600" />
                <h2 className="font-black text-amber-900">Pending Review Requests ({pendingRequests.length})</h2>
              </div>
              <div className="divide-y divide-amber-100">
                {pendingRequests.map(req => (
                  <div key={req.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-800 text-sm">{req.employee_name || `Employee #${req.employee}`}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest border border-amber-200">
                          {req.request_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{req.attendance_date}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 italic">"{req.reason}"</p>
                      <div className="flex gap-4 mt-1 text-[10px] text-slate-400 font-semibold font-mono">
                        {req.check_in  && <span>Check-in: {req.check_in}</span>}
                        {req.check_out && <span>Check-out: {req.check_out}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => { setReviewingReq(req); setReviewNotes(''); }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All requests list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
              <FileEdit className="w-5 h-5 text-slate-400" />
              <h2 className="font-black text-slate-900">{canReview ? 'All Correction Requests' : 'My Correction Requests'}</h2>
              {!canReview && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Request
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-50">
              {(canReview ? requests : myRequests).length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <Inbox className="w-12 h-12 text-slate-200" />
                  <div>
                    <p className="font-black text-slate-700">No requests yet</p>
                    <p className="text-sm text-slate-400 mt-1">Correction requests will appear here.</p>
                  </div>
                </div>
              ) : (
                (canReview ? requests : myRequests).map(req => (
                  <div key={req.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {canReview && <span className="font-bold text-slate-800 text-sm">{req.employee_name}</span>}
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                          req.status === 'PENDING'  ? 'bg-amber-50  text-amber-700  border-amber-200'
                          : req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                        )}>
                          {req.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest">
                          {req.request_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600">{req.attendance_date}</p>
                      <p className="text-xs text-slate-400 italic">"{req.reason}"</p>
                      <div className="flex gap-4 text-[10px] text-slate-400 font-semibold font-mono">
                        {req.check_in  && <span>In: {req.check_in}</span>}
                        {req.check_out && <span>Out: {req.check_out}</span>}
                      </div>
                      {req.review_notes && (
                        <p className="text-xs text-indigo-600 font-semibold mt-1">
                          Review note: "{req.review_notes}"
                        </p>
                      )}
                    </div>
                    {canReview && req.status === 'PENDING' && (
                      <button
                        onClick={() => { setReviewingReq(req); setReviewNotes(''); }}
                        className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-bold text-xs transition-all"
                      >
                        Review
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           MODAL: Correction Request
      ═══════════════════════════════════════════════════════════ */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] border border-slate-100 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white relative">
              <button onClick={() => setShowRequestModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <FileEdit className="w-5 h-5 text-white/80" />
                <span className="text-xs font-black text-white/80 uppercase tracking-widest">Attendance Correction</span>
              </div>
              <h2 className="text-xl font-black">Request Correction</h2>
              <p className="text-sm text-white/70 mt-1">Submit a request to correct your attendance record.</p>
            </div>
            <form onSubmit={handleSubmitRequest} className="px-8 py-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
                <input
                  type="date"
                  value={requestForm.attendance_date}
                  onChange={e => setRequestForm(f => ({ ...f, attendance_date: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Request Type</label>
                <select
                  value={requestForm.request_type}
                  onChange={e => setRequestForm(f => ({ ...f, request_type: e.target.value as any }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="CORRECTION">Time Correction</option>
                  <option value="MISSING_OUT">Missing Check-Out</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Corrected Check-In</label>
                  <input
                    type="time"
                    value={requestForm.check_in}
                    onChange={e => setRequestForm(f => ({ ...f, check_in: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Corrected Check-Out</label>
                  <input
                    type="time"
                    value={requestForm.check_out}
                    onChange={e => setRequestForm(f => ({ ...f, check_out: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reason *</label>
                <textarea
                  rows={3}
                  value={requestForm.reason}
                  onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))}
                  required
                  placeholder="Explain why you need this correction..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-600 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
                >
                  {submittingReq ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           MODAL: Review Request (Manager / HR)
      ═══════════════════════════════════════════════════════════ */}
      {reviewingReq && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] border border-slate-100 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6 text-white relative">
              <button onClick={() => setReviewingReq(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <Inbox className="w-5 h-5 text-white/80" />
                <span className="text-xs font-black text-white/80 uppercase tracking-widest">Review Request</span>
              </div>
              <h2 className="text-xl font-black">{reviewingReq.employee_name}</h2>
              <p className="text-sm text-white/70 mt-1">{reviewingReq.request_type.replace('_', ' ')} — {reviewingReq.attendance_date}</p>
            </div>
            <div className="px-8 py-6 space-y-4">
              {/* Request details */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee's Reason</p>
                <p className="text-sm text-slate-700 italic">"{reviewingReq.reason}"</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {reviewingReq.check_in && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requested Check-In</p>
                    <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{reviewingReq.check_in}</p>
                  </div>
                )}
                {reviewingReq.check_out && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requested Check-Out</p>
                    <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{reviewingReq.check_out}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Review Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add a note for the employee..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleReview('REJECTED')}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl font-black text-sm transition-all disabled:opacity-50"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '✕ Reject'}
                </button>
                <button
                  onClick={() => handleReview('APPROVED')}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '✓ Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
