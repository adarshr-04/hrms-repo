import api from '@/lib/api';

export interface ProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  employee_id: string | null;
  employee_profile_id: number | null;
  phone_number?: string;
  alternative_email?: string;
  alternative_phone_number?: string;
  current_address?: string;
  permanent_address?: string;
  avatar?: string | null;
}

export const profileService = {
  getProfile: async (): Promise<ProfileData> => {
    const response = await api.get('/accounts/profile/');
    return response.data;
  },

  updateProfile: async (data: FormData | Partial<ProfileData>): Promise<ProfileData> => {
    const response = await api.patch('/accounts/profile/', data);
    return response.data;
  },

  changePassword: async (passwordData: any): Promise<any> => {
    const response = await api.post('/accounts/change-password/', passwordData);
    return response.data;
  }
};
