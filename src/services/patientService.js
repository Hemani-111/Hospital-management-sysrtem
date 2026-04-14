import api from '../lib/api';

export const patientService = {
  // Fetch all patients
  getAll: async (params = {}) => {
    const response = await api.get('/patients', { params });
    return response.data;
  },

  // Get a single patient by ID
  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  // Get patient profile by UserID
  getProfileByUserId: async (userId) => {
    const response = await api.get(`/patients/profile/${userId}`);
    return response.data;
  },

  getProfileByEmail: async (email) => {
    const response = await api.get(`/patients/email/${email}`);
    return response.data;
  },

  // Create a new patient
  create: async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },

  // Update patient info
  update: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },

  // Delete patient
  delete: async (id) => {
    await api.delete(`/patients/${id}`);
    return true;
  },

  // History methods
  getCases: async (id) => {
    const response = await api.get(`/patients/${id}/cases`);
    return response.data;
  },

  getAssessments: async (id) => {
    const response = await api.get(`/patients/${id}/assessments`);
    return response.data;
  }
};
