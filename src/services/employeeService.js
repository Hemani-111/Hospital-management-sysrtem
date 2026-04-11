import { supabase } from '../lib/supabase';

export const employeeService = {
  // Fetch all employees
  getAll: async () => {
    const { data, error } = await supabase
      .from('employee')
      .select('*, department(name)')
      .order('firstname', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get doctors with their profiles (which include availability info)
  getDoctors: async () => {
    const { data, error } = await supabase
      .from('employee')
      .select('*, doctorprofile(*), department(name)')
      .eq('employeetype', 'Doctor');
    
    if (error) throw error;
    return data;
  },

  // Create employee
  create: async (employeeData) => {
    const { data, error } = await supabase
      .from('employee')
      .insert([employeeData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create/Update Doctor Profile
  upsertDoctorProfile: async (profileData) => {
    const { data, error } = await supabase
      .from('doctorprofile')
      .upsert(profileData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get employee and doctor profile by EmployeeID (from auth metadata)
  getProfileById: async (employeeId) => {
    const { data, error } = await supabase
      .from('employee')
      .select('*, doctorprofile(*), department(*)')
      .eq('employeeid', employeeId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get employee by Email directly, handling custom user mapping
  getProfileByEmail: async (email) => {
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('userid')
      .eq('email', email)
      .single();
    
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('employee')
      .select('*, doctorprofile(*), department(*)')
      .eq('userid', userData.userid)
      .single();
    
    if (error) throw error;
    return data;
  }
};
