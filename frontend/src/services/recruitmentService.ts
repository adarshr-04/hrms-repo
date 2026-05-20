import api from '@/lib/api';

export interface JobPosting {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range?: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'OPEN' | 'CLOSED' | 'ON_HOLD';
  application_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  resume?: string;
  linkedin_profile?: string;
  created_at: string;
}

export interface Application {
  id: number;
  job: number;
  candidate: number;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  notes?: string;
  applied_at: string;
  updated_at: string;
  job_title?: string;
  candidate_name?: string;
}

export const recruitmentService = {
  getJobs: async (params?: any): Promise<JobPosting[]> => {
    const response = await api.get('/recruitment/jobs/', { params });
    return response.data.results || response.data;
  },

  createJob: async (data: Partial<JobPosting>): Promise<JobPosting> => {
    const response = await api.post('/recruitment/jobs/', data);
    return response.data;
  },

  getCandidates: async (params?: any): Promise<Candidate[]> => {
    const response = await api.get('/recruitment/candidates/', { params });
    return response.data.results || response.data;
  },

  getApplications: async (params?: any): Promise<Application[]> => {
    const response = await api.get('/recruitment/applications/', { params });
    return response.data.results || response.data;
  },

  updateApplicationStatus: async (id: number, status: string, notes?: string): Promise<Application> => {
    const response = await api.patch(`/recruitment/applications/${id}/`, { status, notes });
    return response.data;
  }
};
