import api from '@/lib/api';

import { Employee, Department, PaginatedResponse } from '@/types';

export type EmployeeData = Omit<Employee, 'id' | 'department_name' | 'manager_name' | 'created_at' | 'updated_at'>;

export type ListResponse<T> = PaginatedResponse<T> | T[];

export const employeeService = {
  getAll: async (params?: any): Promise<ListResponse<Employee>> => {
    const response = await api.get('/employees/employees/', { params });
    return response.data;
  },

  getById: async (id: number | string): Promise<Employee> => {
    const response = await api.get(`/employees/employees/${id}/`);
    return response.data;
  },

  create: async (formData: FormData) => {
    // Axios will automatically set the correct multipart/form-data header and boundary
    const response = await api.post('/employees/employees/', formData);
    return response.data;
  },

  update: async (id: number | string, formData: FormData) => {
    const response = await api.patch(`/employees/employees/${id}/`, formData);
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await api.delete(`/employees/employees/${id}/`);
    return response.data;
  },

  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get('/employees/departments/');
    return response.data;
  },

  bulkImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/employees/employees/bulk-import/', formData);
    return response.data;
  },
};
