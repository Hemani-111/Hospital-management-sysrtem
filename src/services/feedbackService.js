import api from '../lib/api';

export const feedbackService = {
  // Get staff that treated this patient
  getStaffToRate: async (patientId) => {
    const response = await api.get(`/patients/feedback/staff-to-rate/${patientId}`);
    return response.data;
  },

  // Get existing feedback submitted by patient
  getPatientFeedback: async (patientId) => {
    const response = await api.get(`/patients/feedback/patient/${patientId}`);
    return response.data;
  },

  // Submit new feedback
  submit: async (feedbackData) => {
    const response = await api.post('/patients/feedback', feedbackData);
    return response.data;
  }
};
