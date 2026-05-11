"use client";

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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { attendanceService } from '@/services/attendanceService';
import { format } from 'date-fns';

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await attendanceService.getAll({ attendance_date: dateStr });
      setRecords(data.results || data);
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    } finally {
      setLoading(false);
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
