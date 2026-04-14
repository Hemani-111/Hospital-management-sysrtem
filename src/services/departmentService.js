import api from '../lib/api';

export const departmentService = {
  getAll: async () => {
    const response = await api.get('/departments');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/departments/stats');
    return response.data;
  }
};
