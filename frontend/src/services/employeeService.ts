import api from '@/lib/api';

export interface EmployeeData {
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  phone_number?: string;
  date_of_birth: string;
  hire_date: string;
  job_title: string;
  employment_type: string;
  status: string;
  department: number | string;
  branch: number | string;
  manager?: number | string;
}

export const employeeService = {
  getAll: async (params?: any) => {
    const response = await api.get('/employees/employees/', { params });
    return response.data;
  },

  getById: async (id: number | string) => {
    const response = await api.get(`/employees/employees/${id}/`);
    return response.data;
  },

  create: async (data: EmployeeData) => {
    const response = await api.post('/employees/employees/', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<EmployeeData>) => {
    const response = await api.patch(`/employees/employees/${id}/`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await api.delete(`/employees/employees/${id}/`);
    return response.data;
  },

  getDepartments: async () => {
    const response = await api.get('/employees/departments/');
    return response.data;
  },

  getBranches: async () => {
    const response = await api.get('/employees/branches/');
    return response.data;
  },
};
