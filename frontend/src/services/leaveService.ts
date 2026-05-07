import api from '@/lib/api';

export interface LeaveData {
  employee: number | string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  approver?: number | string;
}

export const leaveService = {
  getAll: async (params?: any) => {
    const response = await api.get('/leaves/leaves/', { params });
    return response.data;
  },

  updateStatus: async (id: number | string, status: string, approverId?: number) => {
    const response = await api.patch(`/leaves/leaves/${id}/`, { 
      status,
      approver: approverId,
      approved_date: status === 'APPROVED' ? new Date().toISOString().split('T')[0] : null
    });
    return response.data;
  },

  create: async (data: LeaveData) => {
    const response = await api.post('/leaves/leaves/', data);
    return response.data;
  }
};
