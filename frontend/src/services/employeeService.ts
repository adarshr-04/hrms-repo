import api from '@/lib/api';

export interface EmployeeData {
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  phone_number?: string;
  date_of_birth?: string;
  hire_date?: string;
  job_title: string;
  employment_type?: string;
  status: string;
  department?: number | string;
  manager?: number | string;
  alternative_email?: string;
  alternative_phone_number?: string;
  current_address?: string;
  permanent_address?: string;
  end_date?: string;
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

  getDepartments: async () => {
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
