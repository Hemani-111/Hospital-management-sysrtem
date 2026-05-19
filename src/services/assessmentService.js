import api from '../lib/api';

export const assessmentService = {
  // Get assessment history
  getAll: async () => {
    const response = await api.get('/patients/assessments/all');
    return response.data;
  },

  // Get patients that need assessment
  getPendingPatients: async () => {
    const response = await api.get('/patients/assessments/pending');
    return response.data;
  },

  // Save a new assessment
  create: async (assessmentData) => {
    const response = await api.post('/patients/assessments', assessmentData);
    return response.data;
  }
};
