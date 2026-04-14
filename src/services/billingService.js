import api from '../lib/api';

export const billingService = {
  // Get all bills
  getAll: async () => {
    const response = await api.get('/billing');
    return response.data;
  },

  // Get unbilled resolved cases
  getUnbilledCases: async () => {
    const response = await api.get('/billing/unbilled-cases');
    return response.data;
  },

  // Generate a new bill 
  generateBill: async (caseRequestId) => {
    const response = await api.post(`/billing/generate/${caseRequestId}`);
    return response.data;
  },

  // Get bills for a specific patient
  getByPatient: async (patientId) => {
    const response = await api.get(`/billing/patient/${patientId}`);
    return response.data;
  },

  // Get a specific bill
  getById: async (id) => {
    const response = await api.get(`/billing/${id}`);
    return response.data;
  },

  // Update payment status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/billing/${id}/status`, { status });
    return response.data;
  },

  // Update payment (generic)
  updatePayment: async (id, paymentData) => {
    const response = await api.put(`/billing/${id}`, paymentData);
    return response.data;
  }
};
