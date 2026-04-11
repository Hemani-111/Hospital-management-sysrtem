import { supabase } from '../lib/supabase';

export const assessmentService = {
  // Get assessment history for a nurse's department
  getAll: async () => {
    const { data, error } = await supabase
      .from('patientassessment')
      .select('*, patient(firstname, lastname, patientid, bloodgroup), employee!nurseemployeeid(firstname, lastname)')
      .order('assessedon', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get patients that need assessment (no recent assessment in last 24h)
  getPendingPatients: async () => {
    const { data, error } = await supabase
      .from('patient')
      .select('patientid, firstname, lastname, bloodgroup, gender')
      .eq('isregistered', true);
    if (error) throw error;
    return data;
  },

  // Save a new assessment
  create: async (assessmentData) => {
    const { data, error } = await supabase
      .from('patientassessment')
      .insert([assessmentData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
