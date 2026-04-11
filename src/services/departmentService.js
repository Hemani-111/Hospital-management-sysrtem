import { supabase } from '../lib/supabase';

export const departmentService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('department')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};
