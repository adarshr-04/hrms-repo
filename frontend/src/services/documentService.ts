import api from '@/lib/api';

export interface Document {
  id: number;
  employee: number;
  document_type: string;
  file: string;
  created_at: string;
  updated_at: string;
}

export const documentService = {
  getByEmployee: (employeeId: number): Promise<Document[]> =>
    api.get(`/employees/documents/?employee=${employeeId}`).then((r: any) => r.data),

  upload: (formData: FormData): Promise<Document> =>
    api.post('/employees/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r: any) => r.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/employees/documents/${id}/`),
};
