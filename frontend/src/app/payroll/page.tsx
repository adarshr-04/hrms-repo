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
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { payrollService } from '@/services/payrollService';
import { format } from 'date-fns';

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState([]);
  const [stats, setStats] = useState({ totalNetPay: 0, totalBonus: 0, count: 0 });

  useEffect(() => {
    fetchPayroll();
  }, []);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500">Manage employee salaries, bonuses, and disbursements.</p>
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-wider">Monthly</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Total Net Disbursement</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats.totalNetPay)}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-wider">Incentives</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Total Bonuses Paid</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats.totalBonus)}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 text-slate-600 rounded-full uppercase tracking-wider">Headcount</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Employees Processed</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.count}</h3>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by employee name or period..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none">
              <option>Current Month</option>
              <option>Previous Month</option>
            </select>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p>Calculating payroll data...</p>
            </div>
          ) : payrollData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-12 text-center">
              <CreditCard className="w-12 h-12 text-slate-300" />
              <div>
                <p className="text-lg font-bold text-slate-900">No payroll records</p>
                <p className="text-sm max-w-xs">Generate payroll for the current month to see records here.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Basic Salary</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Bonus</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Net Pay</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                          {record.employee_name?.split(' ').map(n => n[0]).join('') || '??'}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{record.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {format(new Date(record.pay_period_start), 'MMM d')} - {format(new Date(record.pay_period_end), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">
                      {formatCurrency(record.basic_salary)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-right">
                      +{formatCurrency(record.bonus)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                      {formatCurrency(record.net_pay)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Payslip">
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
