import api from '../lib/api';

export const employeeService = {
  // Fetch all employees with department info
  getAll: async () => {
    const response = await api.get('/employees');
    return response.data;
  },

  // Get doctors with full profiles
  getDoctors: async () => {
    const response = await api.get('/employees/doctors');
    return response.data;
  },

  // Get profile by email (used for dashboard initialization)
  getProfileByEmail: async (email) => {
    try {
      const response = await api.get(`/employees/profile/${email}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 440) return null;
      throw error;
    }
  },

  // ADMIN: Create a new staff record
  createStaff: async (profileData, doctorData = null) => {
    const response = await api.post('/employees', { profileData, doctorData });
    return response.data;
  },

  // STAFF SELF-REGISTRATION: Verify an employee number and get unregistered record
  verifyEmployeeID: async (idNumber) => {
    const response = await api.get(`/employees/verify/${idNumber}`);
    return response.data; // returns null if already registered, or the employee record
  },

  // Standard CRUD
  getProfileById: async (employeeId) => {
    const response = await api.get(`/employees/${employeeId}`);
    return response.data;
  },

  update: async (employeeId, employeeData) => {
    const response = await api.put(`/employees/${employeeId}`, employeeData);
    return response.data;
  },

  delete: async (employeeId) => {
    await api.delete(`/employees/${employeeId}`);
    return true;
  },

  // Update or Create Doctor Portfolio
  upsertDoctorProfile: async (doctorData) => {
    const response = await api.post('/employees/doctor', doctorData);
    return response.data;
  },
};
