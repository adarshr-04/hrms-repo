
import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Briefcase,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight,
  Loader2,
  Fingerprint,
  CheckCircle2,
  Wifi,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { employeeService } from '@/services/employeeService';
import { attendanceService } from '@/services/attendanceService';
import { payrollService } from '@/services/payrollService';
import { leaveService } from '@/services/leaveService';
import { projectService } from '@/services/projectService';
import { trainingService } from '@/services/trainingService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';


const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);

  // Interactive Daily Tap Terminal States
  const [tapStatus, setTapStatus] = useState<'OFFLINE' | 'TAPPED_IN' | 'COMPLETED'>('OFFLINE');
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

  // Fetch today's tap status from the database
  const checkTodayTapStatus = async () => {
    const empId = user?.employee_profile_id || 1; // Fallback to employee PK 1 for demo admins
    if (!empId) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const logs = await attendanceService.getAll({ employee: empId, attendance_date: todayStr });
      const todayRecord = Array.isArray(logs) ? logs[0] : (logs.results ? logs.results[0] : null);
      if (todayRecord) {
        setTapRecord(todayRecord);
        if (todayRecord.check_in && !todayRecord.check_out) {
          setTapStatus('TAPPED_IN');
        } else if (todayRecord.check_in && todayRecord.check_out) {
          setTapStatus('COMPLETED');
        }
      } else {
        setTapStatus('OFFLINE');
      }
    } catch (err) {
      console.error("Failed to fetch today's tap status", err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin || isManager) {
        // Fetch all core datasets in parallel
        const [employees, attendance, leaves, projects] = await Promise.all([
          employeeService.getAll(),
          attendanceService.getAll(),
          leaveService.getAll(),
          projectService.getProjects()
        ]);

        const empList = Array.isArray(employees) ? employees : (employees.results || []);
        const attendanceList = Array.isArray(attendance) ? attendance : (attendance.results || []);
        const leavesList = Array.isArray(leaves) ? leaves : (leaves.results || []);
        const projectsList = Array.isArray(projects) ? projects : (projects.results || []);

        // 1. Calculate stats values
        const totalEmployees = empList.length;
        
        // Find Present Today Count (Active logs for today's date)
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAttendance = attendanceList.filter((a: any) => a.attendance_date === todayStr && a.status !== 'ABSENT');
        const presentCount = todayAttendance.length;

        const pendingLeavesCount = leavesList.filter((l: any) => l.status === 'PENDING').length;
        const activeProjectsCount = projectsList.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length;

        setStats([
          { name: 'Total Employees', value: totalEmployees, change: `+${empList.filter((e: any) => e.status === 'ACTIVE').length}`, trend: 'up', icon: Users, color: 'bg-blue-500' },
          { name: 'Present Today', value: presentCount, change: `${totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0}% Rate`, trend: 'up', icon: Calendar, color: 'bg-emerald-500' },
          { name: 'Pending Leaves', value: pendingLeavesCount, change: `${leavesList.filter((l: any) => l.status === 'APPROVED').length} Approved`, trend: pendingLeavesCount > 0 ? 'up' : 'down', icon: Clock, color: 'bg-amber-500' },
          { name: 'Active Projects', value: activeProjectsCount, change: `${projectsList.filter((p: any) => p.status === 'COMPLETED').length} Done`, trend: 'up', icon: Briefcase, color: 'bg-indigo-500' },
        ]);

        // 2. Calculate Live Department Breakdown
        const depts = empList.reduce((acc: any, curr: any) => {
          const name = curr.department_name || 'Unassigned';
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});
        setDeptData(Object.keys(depts).map(name => ({ name, value: depts[name] })));

        // 3. Calculate Real Historical Attendance Trend (Last 5 days of activity)
        const uniqueDates = Array.from(new Set(attendanceList.map((a: any) => a.attendance_date)))
          .sort()
          .slice(-5);

        const trendData = uniqueDates.map(dateStr => {
          const dateObj = new Date(dateStr as string);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayLogs = attendanceList.filter((a: any) => a.attendance_date === dateStr);
          const presentLogs = dayLogs.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'HALF_DAY');
          const percentage = dayLogs.length > 0 ? Math.round((presentLogs.length / dayLogs.length) * 100) : 0;
          return { name: dayName, present: percentage };
        });

        const finalTrend = trendData.length >= 2 ? trendData : [
          { name: 'Mon', present: 92 },
          { name: 'Tue', present: 95 },
          { name: 'Wed', present: 98 },
          { name: 'Thu', present: 94 },
          { name: 'Fri', present: 96 },
        ];
        setAttendanceTrend(finalTrend);

      } else {
        // Personal Dashboard for Employee
        const empId = user?.employee_profile_id;
        if (empId) {
          const [attendance, leaves, projects, enrollments] = await Promise.all([
            attendanceService.getAll({ employee: empId }),
            leaveService.getAll({ employee: empId }),
            projectService.getProjects(),
            trainingService.getEnrollments({ employee: empId })
          ]);

          const attendanceList = Array.isArray(attendance) ? attendance : (attendance.results || []);
          const leavesList = Array.isArray(leaves) ? leaves : (leaves.results || []);
          const projectsList = Array.isArray(projects) ? projects : (projects.results || []);
          const enrollmentList = Array.isArray(enrollments) ? enrollments : (enrollments.results || []);

          // 1. Attendance Rate
          const presentLogs = attendanceList.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'HALF_DAY').length;
          const totalLogs = attendanceList.length;
          const attendanceRate = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 100;

          // 2. Leave Balance: 24 base days minus total days of approved leaves
          const approvedDays = leavesList
            .filter((l: any) => l.status === 'APPROVED')
            .reduce((sum: number, l: any) => sum + (parseInt(l.total_days) || 0), 0);
          const leaveBalance = Math.max(0, 24 - approvedDays);

          // 3. Active Projects count
          const activeProjectsCount = projectsList.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length;

          // 4. Training Progress rate: percentage of COMPLETED enrollments
          const completedEnrollments = enrollmentList.filter((e: any) => e.status === 'COMPLETED').length;
          const totalEnrollments = enrollmentList.length;
          const trainingRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

          setStats([
            { name: 'My Attendance', value: `${attendanceRate}%`, change: 'Live presence rate', trend: 'up', icon: Calendar, color: 'bg-emerald-500' },
            { name: 'Leave Balance', value: `${leaveBalance} Days`, change: `${leavesList.filter((l: any) => l.status === 'PENDING').length} Pending request(s)`, trend: 'up', icon: Clock, color: 'bg-amber-500' },
            { name: 'My Projects', value: `${activeProjectsCount} Active`, change: 'Assigned initiatives', trend: 'up', icon: Briefcase, color: 'bg-indigo-500' },
            { name: 'Training Progress', value: `${trainingRate}%`, change: `${completedEnrollments}/${totalEnrollments} Completed`, trend: 'up', icon: GraduationCap, color: 'bg-blue-500' },
          ]);

          // Real Attendance Trend (last 5 logs for this employee)
          const trendData = attendanceList
            .slice(-5)
            .map((log: any) => {
              const dayName = new Date(log.attendance_date).toLocaleDateString('en-US', { weekday: 'short' });
              return { name: dayName, present: log.status === 'PRESENT' || log.status === 'LATE' || log.status === 'HALF_DAY' ? 100 : 0 };
            });

          const finalTrend = trendData.length >= 2 ? trendData : [
            { name: 'Mon', present: 100 },
            { name: 'Tue', present: 100 },
            { name: 'Wed', present: 100 },
            { name: 'Thu', present: 100 },
            { name: 'Fri', present: 100 },
          ];
          setAttendanceTrend(finalTrend);
        }
      }
    } catch (error) {
      console.error("Dashboard fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    checkTodayTapStatus();
  }, [isAdmin, isManager, user?.employee_profile_id]);

  const handleTap = async () => {
    setIsTapping(true);
    const empId = user?.employee_profile_id || 1; // Fallback to employee PK 1 for demo admins
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false });

    try {
      if (tapStatus === 'OFFLINE') {
        // Tap In
        const checkInHour = currentTime.getHours();
        const checkInMinute = currentTime.getMinutes();
        const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15);
        const status = isLate ? 'LATE' : 'PRESENT';

        const record = await attendanceService.logAttendance({
          employee: empId,
          attendance_date: todayStr,
          check_in: timeStr,
          status: status,
          notes: `Tapped In via Enterprise Web Dashboard at ${currentTime.toLocaleTimeString()}`
        });

        setTapRecord(record);
        setTapStatus('TAPPED_IN');
        toast.success("Successfully Tapped In! Shift started.");
      } else if (tapStatus === 'TAPPED_IN') {
        // Tap Out
        if (!tapRecord || !tapRecord.id) {
          toast.error("Tap record is missing. Reloading status...");
          await checkTodayTapStatus();
          setIsTapping(false);
          return;
        }

        // Calculate hours worked (down to precision seconds to exactly match stopwatch)
        const checkInTime = tapRecord.check_in || "09:00:00";
        const [inH, inM, inS] = checkInTime.split(':').map(Number);
        const outH = currentTime.getHours();
        const outM = currentTime.getMinutes();
        const outS = currentTime.getSeconds();
        const diffMs = (outH * 3600 + outM * 60 + outS) - (inH * 3600 + inM * 60 + (inS || 0));
        const hours = Math.max(0.01, Number((diffMs / 3600).toFixed(4)));

        const record = await attendanceService.updateAttendance(tapRecord.id, {
          check_out: timeStr,
          work_hours: hours,
          notes: `Tapped Out via Enterprise Web Dashboard at ${currentTime.toLocaleTimeString()}. Logged ${hours.toFixed(2)}h.`
        });

        setTapRecord(record);
        setTapStatus('COMPLETED');
        toast.success(`Successfully Tapped Out! Shift ended. Total: ${hours.toFixed(2)}h`);
      }
      // Instantly update stats on dashboard
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to complete tap transaction", error);
      toast.error("Tap transaction failed. Please try again.");
    } finally {
      setIsTapping(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-slate-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="font-bold">Syncing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin ? 'Organizational Overview' : isManager ? 'Department Insights' : `Welcome Back, ${user?.first_name}`}
          </h1>
          <p className="text-slate-500">
            {isAdmin ? 'Real-time organizational analytics and workforce tracking.' : 'Here is what is happening with your schedule today.'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Quick Actions</span>
        </button>
      </div>

      {/* Main Grid: Stats & Shift Tap Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Stats Grid (takes 2 columns) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-fit">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right Side: Shift Tap Terminal (takes 1 column) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          {/* Card abstract hover gradient */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-indigo-600" />
                Shift Attendance
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-100">
                <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
                Online
              </div>
            </div>

            {/* Live Ticking Clock */}
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight mt-1 font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h2>
              <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400 mt-1.5">
                <MapPin className="w-3 h-3 text-slate-300" /> Web Terminal IP: 192.168.1.45
              </div>
            </div>

            {/* Status Messages */}
            <div className="text-center space-y-1">
              {tapStatus === 'OFFLINE' && (
                <>
                  <p className="text-xs font-black text-rose-500 uppercase tracking-widest">OFFLINE</p>
                  <p className="text-[11px] font-medium text-slate-500 px-4">Tap In below to log your check-in time and start today's shift.</p>
                </>
              )}
              {tapStatus === 'TAPPED_IN' && (
                <div className="space-y-3">
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest animate-pulse">ACTIVE & TAPPED IN</p>
                  <p className="text-[11px] font-medium text-slate-500 px-4">
                    Shift started at <span className="font-bold text-slate-800">{tapRecord?.check_in || '--:--'}</span>.
                  </p>
                  
                  {/* Live Shift Stopwatch */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-center mt-3 animate-pulse">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active Shift Stopwatch</p>
                    <h4 className="text-xl font-black text-indigo-900 font-mono tracking-wider mt-1">
                      {getRunningDuration()}
                    </h4>
                  </div>
                </div>
              )}
              {tapStatus === 'COMPLETED' && (
                <>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">SHIFT COMPLETED</p>
                  <p className="text-[11px] font-medium text-slate-500 px-4">
                    Logged <span className="font-bold text-slate-800">{tapRecord?.work_hours ? Number(tapRecord.work_hours).toFixed(2) : 0}h</span> of work today. See you tomorrow!
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 relative z-10">
            {tapStatus === 'OFFLINE' && (
              <button
                disabled={isTapping}
                onClick={handleTap}
                className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 group active:scale-[0.98]"
              >
                {isTapping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5 group-hover:scale-125 transition-transform" />
                    <span>Tap In</span>
                  </>
                )}
              </button>
            )}
            
            {tapStatus === 'TAPPED_IN' && (
              <button
                disabled={isTapping}
                onClick={handleTap}
                className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-200 group active:scale-[0.98]"
              >
                {isTapping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>Tap Out</span>
                  </>
                )}
              </button>
            )}

            {tapStatus === 'COMPLETED' && (
              <div className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Shift Logged Successfully</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Trend */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Weekly Attendance Flow
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Department Distribution
          </h3>
          <div className="h-[300px] w-full min-h-[300px] flex items-center justify-center">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm italic">No department data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
