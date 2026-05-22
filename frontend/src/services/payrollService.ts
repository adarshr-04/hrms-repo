import api from '@/lib/api';

export interface PayrollData {
  employee: number | string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  tax: number;
  bonus: number;
  net_pay: number;
  pay_date: string;
  payment_mode: string;
}

export const payrollService = {
  getAll: async (params?: any) => {
    const response = await api.get('/payroll/payroll/', { params });
    return response.data;
  },

  create: async (data: PayrollData) => {
    const response = await api.post('/payroll/payroll/', data);
    return response.data;
  },

  bulkGenerate: async (data: { pay_period_start: string; pay_period_end: string; pay_date: string }) => {
    const response = await api.post('/payroll/payroll/bulk-generate/', data);
    return response.data;
  },

  updateStatus: async (id: number | string, status: string) => {
    const response = await api.patch(`/payroll/payroll/${id}/`, { status });
    return response.data;
  },

  getStats: async () => {
    // Custom calculation logic for the dashboard
    const response = await api.get('/payroll/payroll/');
    const results = response.data.results || response.data;
    
    const totalNetPay = results.reduce((acc: number, curr: any) => acc + parseFloat(curr.net_pay), 0);
    const totalBonus = results.reduce((acc: number, curr: any) => acc + parseFloat(curr.bonus), 0);
    
    return {
      totalNetPay,
      totalBonus,
      count: results.length
    };
  }
};
