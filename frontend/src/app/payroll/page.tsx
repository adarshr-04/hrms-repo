"use client";

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download,
  Search,
  Filter,
  Plus,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { payrollService } from '@/services/payrollService';
import { format } from 'date-fns';

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalNetPay: 0, totalBonus: 0, count: 0 });

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getAll();
      const summary = await payrollService.getStats();
      setPayrollData(data.results || data);
      setStats(summary);
    } catch (error) {
      console.error("Failed to fetch payroll data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-tighter">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-tighter">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'VOID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-tighter">
            <XCircle className="w-3 h-3" />
            Void
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-100 uppercase tracking-tighter">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Command Center</h1>
          <p className="text-sm font-medium text-slate-500 font-medium">Real-time tracking of employee salaries and disbursements.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg font-medium transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm shadow-indigo-200">
            <Plus className="w-4 h-4" />
            <span>Generate Payroll</span>
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg uppercase tracking-[0.1em]">Net Pay</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider relative z-10">Total Disbursement</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10 tracking-tight">{formatCurrency(stats.totalNetPay)}</h3>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50/30 rounded-full blur-3xl group-hover:bg-indigo-100/40 transition-colors" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg uppercase tracking-[0.1em]">Bonuses</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider relative z-10">Total Incentives</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10 tracking-tight">{formatCurrency(stats.totalBonus)}</h3>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50/30 rounded-full blur-3xl group-hover:bg-emerald-100/40 transition-colors" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black px-2 py-1 bg-slate-50 text-slate-600 rounded-lg uppercase tracking-[0.1em]">Headcount</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider relative z-10">Records Processed</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10 tracking-tight">{stats.count} Staff</h3>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50/50 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/30">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by employee or pay period..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 px-4 py-2.5 outline-none hover:bg-slate-50 transition-all">
              <option>Current Cycle</option>
              <option>Previous Cycle</option>
            </select>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-indigo-200 transition-all">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="font-bold text-sm uppercase tracking-widest text-slate-400">Auditing Payroll Data...</p>
            </div>
          ) : payrollData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-6 p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-slate-300" />
              </div>
                <div>
                  <p className="text-xl font-black text-slate-900 tracking-tight">Ledger is Empty</p>
                  <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto mt-1">Initialize the current month&apos;s payroll cycle to see records and generate payslips.</p>
                </div>
              </div>
            ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Staff Member</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Cycle Period</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] text-right">Base Salary</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] text-right">Incentive</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] text-right">Total Net</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] text-center">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 uppercase border border-indigo-100/50">
                          {record.employee_name?.split(' ').map((n: any) => n[0]).join('') || '??'}
                        </div>
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{record.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                      {format(new Date(record.pay_period_start), 'MMM d')} - {format(new Date(record.pay_period_end), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right font-mono">
                      {formatCurrency(record.basic_salary)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right font-mono">
                      +{formatCurrency(record.bonus)}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 text-right font-mono">
                      {formatCurrency(record.net_pay)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-indigo-600 hover:bg-indigo-50 hover:scale-110 rounded-xl transition-all shadow-sm shadow-indigo-100/50" title="View Detailed Payslip">
                        <ExternalLink className="w-4 h-4" />
                      </button>
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
