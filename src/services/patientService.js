import { supabase } from '../lib/supabase';

export const patientService = {
  // Fetch all patients
  getAll: async () => {
    const { data, error } = await supabase
      .from('patient')
      .select('*')
      .order('createdon', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get a single patient by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('patient')
      .select('*, patientinsurance(*, insurance(*))')
      .eq('patientid', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get patient profile by UserID (from auth)
  getProfileByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('patient')
      .select('*, patientinsurance(*, insurance(*))')
      .eq('userid', userId)
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
      .select('*, patientinsurance(*, insurance(*))')
      .eq('userid', userData.userid)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create a new patient
  create: async (patientData) => {
    const { data, error } = await supabase
      .from('patient')
      .insert([patientData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update patient info
  update: async (id, patientData) => {
    const { data, error } = await supabase
      .from('patient')
      .update(patientData)
      .eq('patientid', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete patient
  delete: async (id) => {
    const { error } = await supabase
      .from('patient')
      .delete()
      .eq('patientid', id);
    
    if (error) throw error;
    return true;
  }
};
