import { supabase } from '../lib/supabase';

export const feedbackService = {
  // Get staff that treated this patient (to request feedback)
  getStaffToRate: async (patientId) => {
    // We look for resolved cases for this patient
    const { data, error } = await supabase
      .from('caserequest')
      .select(`
        caserequestid,
        createdon,
        status,
        employee!caserequest_doctoremployeeid_fkey(
           employeeid, firstname, lastname, doctorprofile(specialization)
        ),
        nurse:employee!caserequest_nurseemployeeid_fkey(
           employeeid, firstname, lastname
        )
      `)
      .eq('patientid', patientId)
      .eq('status', 'Resolved')
      .order('createdon', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get existing feedback submitted by patient
  getPatientFeedback: async (patientId) => {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, employee(firstname, lastname)')
      .eq('patientid', patientId)
      .order('createdon', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Submit new feedback
  submit: async (feedbackData) => {
    const { data, error } = await supabase
      .from('feedback')
      .upsert(feedbackData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
