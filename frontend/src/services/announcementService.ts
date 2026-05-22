import api from '@/lib/api';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  posted_by: number | null;
  posted_by_name: string;
  is_active: boolean;
  created_at: string;
}

export const announcementService = {
  getAll: (): Promise<Announcement[]> =>
    api.get('/accounts/announcements/').then((r: any) => r.data),

  create: (data: { title: string; content: string; priority: string }): Promise<Announcement> =>
    api.post('/accounts/announcements/', data).then((r: any) => r.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/accounts/announcements/${id}/`),
};
