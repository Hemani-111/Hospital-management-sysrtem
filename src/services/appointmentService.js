import api from '../lib/api';

export const appointmentService = {
  // Fetch all appointments
  getAll: async () => {
    const response = await api.get('/appointments');
    return response.data;
  },

  // Get appointments for a specific doctor
  getDoctorAppointments: async (doctorId, date = null) => {
    const params = date ? { date } : {};
    const response = await api.get(`/appointments/doctor/${doctorId}`, { params });
    return response.data;
  },

  // Get appointments for a specific patient
  getPatientAppointments: async (patientId) => {
    const response = await api.get(`/appointments/patient/${patientId}`);
    return response.data;
  },

  // Create appointment
  create: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  // Update appointment status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data;
  }
};
