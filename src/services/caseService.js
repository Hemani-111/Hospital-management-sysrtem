import api from '../lib/api';

export const caseService = {
  // Get diseases
  getDiseases: async () => {
    const response = await api.get('/diseases');
    return response.data;
  },

  // Fetch case requests
  getAll: async (filters = {}) => {
    const response = await api.get('/cases', { params: filters });
    return response.data;
  },

  // Get all cases for a specific patient
  getByPatient: async (patientId) => {
    const response = await api.get(`/cases/patient/${patientId}`);
    return response.data;
  },

  // Get case details by ID
  getById: async (id) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  // Update case status
  updateStatus: async (id, statusData) => {
    const response = await api.patch(`/cases/${id}/status`, statusData);
    return response.data;
  },

  // Save/Update Diagnosis
  saveDiagnosis: async (diagnosisData) => {
    const response = await api.post('/cases/diagnosis', diagnosisData);
    return response.data;
  },

  // Save/Update Prescription
  savePrescription: async (prescriptionData) => {
    const response = await api.post('/cases/prescription', prescriptionData);
    return response.data;
  },

  // Lab Tests
  getLabCatalog: async () => {
    const response = await api.get('/lab-tests/catalog');
    return response.data;
  },

  getLabQueue: async (filters = {}) => {
    const response = await api.get('/lab-tests/queue', { params: filters });
    return response.data;
  },

  getLabTests: async (caseId) => {
    const response = await api.get(`/lab-tests/case/${caseId}`);
    return response.data;
  },

  orderLabTest: async (testData) => {
    const response = await api.post('/lab-tests', testData);
    return response.data;
  },

  updateLabTest: async (reportId, updateData) => {
    const response = await api.patch(`/lab-tests/${reportId}`, updateData);
    return response.data;
  },

  // Rooms & Admission
  getAvailableRooms: async () => {
    const response = await api.get('/rooms/available');
    return response.data;
  },

  admitPatient: async (caseId, roomData) => {
    const response = await api.patch(`/cases/${caseId}/admit`, roomData);
    return response.data;
  },

  dischargePatient: async (caseId) => {
    const response = await api.patch(`/cases/${caseId}/discharge`);
    return response.data;
  }
};
