
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
  XCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { payrollService } from '@/services/payrollService';
import { employeeService } from '@/services/employeeService';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalNetPay: 0, totalBonus: 0, count: 0 });

  // Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employee: '',
    pay_period_start: '',
    pay_period_end: '',
    basic_salary: '',
    allowances: '0',
    deductions: '0',
    tax: '0',
    bonus: '0',
    payment_mode: 'BANK_TRANSFER',
    pay_date: new Date().toISOString().split('T')[0]
  });

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

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      if (Array.isArray(data)) {
        setEmployees(data);
      } else if (data && typeof data === 'object' && 'results' in data) {
        setEmployees((data as any).results || []);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };


  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, []);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee) {
      toast.error("Please select an employee.");
      return;
    }

    const basic = parseFloat(formData.basic_salary) || 0;
    const allow = parseFloat(formData.allowances) || 0;
    const bon = parseFloat(formData.bonus) || 0;
    const ded = parseFloat(formData.deductions) || 0;
    const tx = parseFloat(formData.tax) || 0;
    const net = basic + allow + bon - ded - tx;

    if (net < 0) {
      toast.error("Net pay cannot be negative. Please adjust earnings and deductions.");
      return;
    }

    setSubmitting(true);
    try {
      await payrollService.create({
        employee: formData.employee,
        pay_period_start: formData.pay_period_start,
        pay_period_end: formData.pay_period_end,
        basic_salary: basic,
        allowances: allow,
        deductions: ded,
        tax: tx,
        bonus: bon,
        net_pay: net,
        pay_date: formData.pay_date,
        payment_mode: formData.payment_mode
      });
      toast.success("Payroll record generated successfully!");
      setShowGenerateModal(false);
      // Reset form
      setFormData({
        employee: '',
        pay_period_start: '',
        pay_period_end: '',
        basic_salary: '',
        allowances: '0',
        deductions: '0',
        tax: '0',
        bonus: '0',
        payment_mode: 'BANK_TRANSFER',
        pay_date: new Date().toISOString().split('T')[0]
      });
      fetchPayroll();
    } catch (error: any) {
      console.error("Failed to generate payroll", error);
      const errMsg = error.response?.data?.detail || "Failed to generate payroll record.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };


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
          <p className="text-sm font-medium text-slate-500">Real-time tracking of employee salaries and disbursements.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg font-medium transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm shadow-indigo-200"
          >
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
                      <button 
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 hover:scale-110 rounded-xl transition-all shadow-sm shadow-indigo-100/50" 
                        title="View Detailed Payslip"
                      >
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

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Generate Payroll Record</h3>
                <p className="text-xs text-slate-500">Calculate and dispatch individual monthly salaries.</p>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleGeneratePayroll} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Employee</label>
                <select 
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 bg-white"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Period Start</label>
                  <input 
                    type="date"
                    value={formData.pay_period_start}
                    onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Period End</label>
                  <input 
                    type="date"
                    value={formData.pay_period_end}
                    onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-black">Base Salary</label>
                  <input 
                    type="number"
                    placeholder="Base"
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Allowances</label>
                  <input 
                    type="number"
                    placeholder="Allowances"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bonus / Incentives</label>
                  <input 
                    type="number"
                    placeholder="Bonus"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deductions (PF / Loss)</label>
                  <input 
                    type="number"
                    placeholder="Deductions"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Taxes (TDS)</label>
                  <input 
                    type="number"
                    placeholder="Tax"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Mode</label>
                  <select 
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Date</label>
                  <input 
                    type="date"
                    value={formData.pay_date}
                    onChange={(e) => setFormData({ ...formData, pay_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              {/* Live Calculator Summary widget */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Estimated Net Pay</p>
                  <p className="text-xs text-slate-400 mt-0.5">Basic + Allowances + Bonus - Deductions - Tax</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-700 font-mono">
                    {formatCurrency(
                      (parseFloat(formData.basic_salary) || 0) + 
                      (parseFloat(formData.allowances) || 0) + 
                      (parseFloat(formData.bonus) || 0) - 
                      (parseFloat(formData.deductions) || 0) - 
                      (parseFloat(formData.tax) || 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-bold text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-indigo-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Ledger...</span>
                    </>
                  ) : (
                    <span>Generate Payslip</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Payslip View Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest bg-indigo-600 text-white px-2 py-0.5 rounded uppercase">Salary Receipt</span>
                <h3 className="text-lg font-black tracking-tight mt-1">HRMS Enterprise</h3>
                <p className="text-xs text-slate-400 font-medium">Cycle: {format(new Date(selectedRecord.pay_period_start), 'MMM d')} - {format(new Date(selectedRecord.pay_period_end), 'MMM d, yyyy')}</p>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white font-bold p-2 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Payslip details content */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</p>
                  <h4 className="font-extrabold text-slate-900 text-base">{selectedRecord.employee_name}</h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Mode</p>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 uppercase">{selectedRecord.payment_mode?.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Earnings vs Deductions grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Earnings Column */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Earnings</p>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Base Salary</span>
                    <span className="font-mono text-slate-800 font-bold">{formatCurrency(selectedRecord.basic_salary)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Allowances</span>
                    <span className="font-mono text-slate-800 font-bold">+{formatCurrency(selectedRecord.allowances)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Incentives</span>
                    <span className="font-mono text-emerald-600 font-bold">+{formatCurrency(selectedRecord.bonus)}</span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Deductions</p>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">PF / Loss</span>
                    <span className="font-mono text-red-500 font-bold">-{formatCurrency(selectedRecord.deductions)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Taxes (TDS)</span>
                    <span className="font-mono text-red-500 font-bold">-{formatCurrency(selectedRecord.tax)}</span>
                  </div>
                </div>
              </div>

              {/* Total Calculation breakdown */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase">Net Disbursed</p>
                  <p className="text-[10px] text-slate-400">Total credited to bank account</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600 font-mono tracking-tight">{formatCurrency(selectedRecord.net_pay)}</span>
                </div>
              </div>

              {/* Status and Signature */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                {selectedRecord.pay_date && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disbursement Date</p>
                    <p className="font-bold text-slate-800 mt-1">{format(new Date(selectedRecord.pay_date), 'MMMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-all"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

