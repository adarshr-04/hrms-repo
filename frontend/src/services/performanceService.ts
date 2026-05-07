import api from '@/lib/api';

export interface PerformanceData {
  employee: number | string;
  reviewer: number | string;
  review_date: string;
  rating: number;
  comments: string;
  status: string;
}

export const performanceService = {
  getAll: async (params?: any) => {
    const response = await api.get('/performance/performance/', { params });
    return response.data;
  },

  create: async (data: PerformanceData) => {
    const response = await api.post('/performance/performance/', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<PerformanceData>) => {
    const response = await api.patch(`/performance/performance/${id}/`, data);
    return response.data;
  }
};
