import api from '@/lib/api';

export interface ProjectData {
  project_name: string;
  description: string;
  start_date: string;
  end_date?: string;
  status: string;
}

export interface ProjectAssignmentData {
  project: number | string;
  employee: number | string;
  role: string;
  assigned_date: string;
}

export const projectService = {
  getProjects: async (params?: any) => {
    const response = await api.get('/projects/projects/', { params });
    return response.data;
  },

  getAssignments: async (params?: any) => {
    const response = await api.get('/projects/assignments/', { params });
    return response.data;
  },

  createProject: async (data: ProjectData) => {
    const response = await api.post('/projects/projects/', data);
    return response.data;
  },

  assignEmployee: async (data: ProjectAssignmentData) => {
    const response = await api.post('/projects/assignments/', data);
    return response.data;
  }
};
