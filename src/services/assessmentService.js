import api from '../lib/api';

export const assessmentService = {
  // Get assessment history
  getAll: async () => {
    const response = await api.get('/assessments');
    return response.data;
  },

  // Get patients that need assessment
  getPendingPatients: async () => {
    const response = await api.get('/assessments/pending');
    return response.data;
  },

  // Save a new assessment
  create: async (assessmentData) => {
    const response = await api.post('/assessments', assessmentData);
    return response.data;
  }
};
