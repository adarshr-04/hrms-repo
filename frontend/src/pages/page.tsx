
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
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { employeeService } from '@/services/employeeService';
import { attendanceService } from '@/services/attendanceService';
import { payrollService } from '@/services/payrollService';
import { useAuth } from '@/context/AuthContext';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin || isManager) {
        const employees = await employeeService.getAll();
        const empList = Array.isArray(employees) ? employees : (employees.results || []);

        // Calculate Stats
        setStats([
          { name: 'Total Employees', value: empList.length, change: '+12%', trend: 'up', icon: Users, color: 'bg-blue-500' },
          { name: 'Present Today', value: empList.filter((e: any) => e.status === 'ACTIVE').length, change: '+5%', trend: 'up', icon: Calendar, color: 'bg-emerald-500' },
          { name: 'Pending Leaves', value: '0', change: '-2', trend: 'down', icon: Clock, color: 'bg-amber-500' },
          { name: 'Active Projects', value: '0', change: '+0', trend: 'up', icon: Briefcase, color: 'bg-indigo-500' },
        ]);

        // Calculate Department Breakdown
        const depts = empList.reduce((acc: any, curr: any) => {
          const name = curr.department_name || 'Unassigned';
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});
        setDeptData(Object.keys(depts).map(name => ({ name, value: depts[name] })));
      } else {
        // Personal Dashboard for Employee
        setStats([
          { name: 'My Attendance', value: '98%', change: 'Steady', trend: 'up', icon: Calendar, color: 'bg-emerald-500' },
          { name: 'Leave Balance', value: '12 Days', change: 'Available', trend: 'up', icon: Clock, color: 'bg-amber-500' },
          { name: 'My Projects', value: '2 Active', change: 'On track', trend: 'up', icon: Briefcase, color: 'bg-indigo-500' },
          { name: 'Training Progress', value: '75%', change: '+5%', trend: 'up', icon: GraduationCap, color: 'bg-blue-500' },
        ]);
      }

      // Mock Attendance Trend
      setAttendanceTrend([
        { name: 'Mon', present: 85 },
        { name: 'Tue', present: 88 },
        { name: 'Wed', present: 92 },
        { name: 'Thu', present: 90 },
        { name: 'Fri', present: 95 },
      ]);

    } catch (error) {
      console.error("Dashboard fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAdmin, isManager]);

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm"
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
            <p className="text-sm font-medium text-slate-500">{stat.name}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
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
