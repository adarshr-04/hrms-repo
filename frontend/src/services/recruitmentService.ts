import api from './api';

export const recruitmentService = {
  getJobs: async (params?: any) => {
    const response = await api.get('/recruitment/jobs/', { params });
    return response.data;
  },
  getCandidates: async (params?: any) => {
    const response = await api.get('/recruitment/candidates/', { params });
    return response.data;
  },
  getApplications: async (params?: any) => {
    const response = await api.get('/recruitment/applications/', { params });
    return response.data;
  }
};
