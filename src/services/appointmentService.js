import { supabase } from '../lib/supabase';

export const appointmentService = {
  // Fetch all appointments
  getAll: async () => {
    const { data, error } = await supabase
      .from('appointment')
      .select('*, caserequest(*), patient(firstname, lastname), employee!doctoremployeeid(firstname, lastname)')
      .order('appointmentdate', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get appointments for a specific doctor (optionally filtered by date)
  getDoctorAppointments: async (doctorId, date = null) => {
    let query = supabase
      .from('appointment')
      .select('*, patient(firstname, lastname, patientid), caserequest(caserequestid)')
      .eq('doctoremployeeid', doctorId)
      .order('appointmentdate', { ascending: true })
      .order('starttime', { ascending: true });
    if (date) query = query.eq('appointmentdate', date);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get appointments for a specific patient
  getPatientAppointments: async (patientId) => {
    const { data, error } = await supabase
      .from('appointment')
      .select('*, employee!doctoremployeeid(firstname, lastname, doctorprofile(specialization))')
      .eq('patientid', patientId)
      .order('appointmentdate', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Create appointment
  create: async (appointmentData) => {
    const { data, error } = await supabase
      .from('appointment')
      .insert([appointmentData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update appointment status
  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('appointment')
      .update({ status: status })
      .eq('appointmentid', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
