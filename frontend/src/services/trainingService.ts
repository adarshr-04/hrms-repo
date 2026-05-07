import api from '@/lib/api';

export interface TrainingData {
  training_name: string;
  trainer_name: string;
  start_date: string;
  end_date: string;
  description: string;
  location: string;
}

export interface EnrollmentData {
  training: number | string;
  employee: number | string;
  status: string;
  completion_date?: string;
}

export const trainingService = {
  getTrainings: async (params?: any) => {
    const response = await api.get('/training/trainings/', { params });
    return response.data;
  },

  getEnrollments: async (params?: any) => {
    const response = await api.get('/training/enrollments/', { params });
    return response.data;
  },

  createTraining: async (data: TrainingData) => {
    const response = await api.post('/training/trainings/', data);
    return response.data;
  },

  enrollEmployee: async (data: EnrollmentData) => {
    const response = await api.post('/training/enrollments/', data);
    return response.data;
  }
};
