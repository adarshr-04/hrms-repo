import api from '@/lib/api';

export interface AttendanceData {
  employee: number | string;
  attendance_date: string;
  check_in?: string;
  check_out?: string;
  work_hours?: number;
  status: string;
  notes?: string;
}

export const attendanceService = {
  getAll: async (params?: any) => {
    const response = await api.get('/attendance/attendance/', { params });
    return response.data;
  },

  logAttendance: async (data: AttendanceData) => {
    const response = await api.post('/attendance/attendance/', data);
    return response.data;
  },

  updateAttendance: async (id: number | string, data: Partial<AttendanceData>) => {
    const response = await api.patch(`/attendance/attendance/${id}/`, data);
    return response.data;
  },
  
  getSummary: async () => {
    const response = await api.get('/attendance/attendance/');
    return response.data;
  },

  getShifts: async (): Promise<any[]> => {
    const response = await api.get('/attendance/shifts/');
    return response.data.results || response.data;
  },

  getRequests: async (params?: any): Promise<any[]> => {
    const response = await api.get('/attendance/requests/', { params });
    return response.data.results || response.data;
  },

  createRequest: async (data: any): Promise<any> => {
    const response = await api.post('/attendance/requests/', data);
    return response.data;
  },

  updateRequest: async (id: number | string, data: any): Promise<any> => {
    const response = await api.patch(`/attendance/requests/${id}/`, data);
    return response.data;
  }
};
