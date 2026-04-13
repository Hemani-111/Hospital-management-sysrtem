import api from '../lib/api';

export const departmentService = {
  getAll: async () => {
    const response = await api.get('/departments');
    return response.data;
  }
};
