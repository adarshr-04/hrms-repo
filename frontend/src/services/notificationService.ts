import api from '@/lib/api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/accounts/notifications/');
    // Handle paginated or plain array response
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/accounts/notifications/${id}/mark_as_read/`);
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/accounts/notifications/mark_all_read/');
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/accounts/notifications/${id}/`);
  },
};
