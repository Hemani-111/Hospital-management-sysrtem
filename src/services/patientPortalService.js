import { supabase } from '../lib/supabase';

export const patientPortalService = {
  // Get patient profile by their auth Metadata PatientId
  getProfileById: async (patientId) => {
    const { data, error } = await supabase
      .from('patient')
      .select('*')
      .eq('patientid', patientId)
      .single();
    if (error) throw error;
    return data;
  },

  getProfileByEmail: async (email) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('userid')
      .eq('email', email)
      .single();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('patient')
      .select('*')
      .eq('userid', userData.userid)
      .single();
    if (error) throw error;
    return data;
  },

  // Get all cases for a patient
  getCases: async (patientId) => {
    const { data, error } = await supabase
      .from('caserequest')
      .select(`
        *,
        department(name),
        employee!doctoremployeeid(firstname, lastname, doctorprofile(specialization)),
        patientassessment(*),
        diagnosis(*, disease(name)),
        prescription(*),
        labreport(*, labtest(testname))
      `)
      .eq('patientid', patientId)
      .order('createdon', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get all bills for a patient
  getBills: async (patientId) => {
    const { data, error } = await supabase
      .from('bill')
      .select(`
        *,
        caserequest(caserequestid, casesummary)
      `)
      .eq('caserequest.patientid', patientId)
      .order('generatedon', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get appointments for a patient
  getAppointments: async (patientId) => {
    const { data, error } = await supabase
      .from('appointment')
      .select('*, employee!doctoremployeeid(firstname, lastname, doctorprofile(specialization))')
      .eq('patientid', patientId)
      .order('appointmentdate', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Get lab reports for a patient
  getLabReports: async (patientId) => {
    const { data, error } = await supabase
      .from('labreport')
      .select('*, labtest(testname, normalrange, unit)')
      .eq('patientid', patientId)
      .order('orderedon', { ascending: false });
    if (error) throw error;
    return data;
  }
};
