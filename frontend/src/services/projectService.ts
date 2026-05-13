import api from '@/lib/api';

export interface TaskLog {
  id?: number | string;
  date: string;
  task_description: string;
  status: string;
  owner: string;
  remarks?: string;
}

export const projectService = {
  getTaskLogs: async () => {
    const response = await api.get('/projects/task-logs/');
    return response.data;
  },

  createTaskLog: async (data: TaskLog) => {
    const response = await api.post('/projects/task-logs/', data);
    return response.data;
  },

  updateTaskLog: async (id: number | string, data: Partial<TaskLog>) => {
    const response = await api.patch(`/projects/task-logs/${id}/`, data);
    return response.data;
  },

  deleteTaskLog: async (id: number | string) => {
    const response = await api.delete(`/projects/task-logs/${id}/`);
    return response.data;
  },
};
