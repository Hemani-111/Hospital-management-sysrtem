import { supabase } from '../lib/supabase';

export const caseService = {
  // Fetch case requests with optional filters (e.g. { doctoremployeeid: 5, status: 'Open' })
  getAll: async (filters = {}) => {
    let query = supabase
      .from('caserequest')
      .select('*, patient(firstname, lastname, dateofbirth, gender, bloodgroup), department(name), employee!doctoremployeeid(firstname, lastname)')
      .order('createdon', { ascending: false });
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get all cases for a specific patient
  getByPatient: async (patientId) => {
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

  // Get case details by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('caserequest')
      .select('*, patient(*), patientassessment(*), diagnosis(*), prescription(*), labreport(*, labtest(*))')
      .eq('caserequestid', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update case status
  updateStatus: async (id, statusData) => {
    const { data, error } = await supabase
      .from('caserequest')
      .update(statusData)
      .eq('caserequestid', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Save/Update Diagnosis
  saveDiagnosis: async (diagnosisData) => {
    const { data, error } = await supabase
      .from('diagnosis')
      .upsert(diagnosisData)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Save/Update Prescription
  savePrescription: async (prescriptionData) => {
    const { data, error } = await supabase
      .from('prescription')
      .upsert(prescriptionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
