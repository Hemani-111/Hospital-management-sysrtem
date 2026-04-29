import api from '../lib/api';

export const patientPortalService = {
  // Get patient profile
  getProfileById: async (patientId) => {
    const response = await api.get(`/patients/portal/profile/${patientId}`);
    return response.data;
  },

  getProfileByEmail: async (email) => {
    const response = await api.get(`/patients/portal/profile/email/${email}`);
    return response.data;
  },

  // Get all cases for a patient
  getCases: async (patientId) => {
    const response = await api.get(`/patients/portal/cases/${patientId}`);
    return response.data;
  },

  // Get all bills for a patient
  getBills: async (patientId) => {
    const response = await api.get(`/patients/portal/bills/${patientId}`);
    return response.data;
  },

  // Get appointments for a patient
  getAppointments: async (patientId) => {
    const response = await api.get(`/patients/portal/appointments/${patientId}`);
    return response.data;
  },

  // Get lab reports for a patient
  getLabReports: async (patientId) => {
    const response = await api.get(`/patients/portal/lab-reports/${patientId}`);
    return response.data;
  }
};
