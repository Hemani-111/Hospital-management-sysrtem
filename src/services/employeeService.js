import { supabase } from '../lib/supabase';

export const employeeService = {
  // Fetch all employees with department info
  getAll: async () => {
    const { data, error } = await supabase
    .from('employee')
    .select('*, department(name)')
    .order('firstname', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Get doctors with full profiles
  getDoctors: async () => {
    const { data, error } = await supabase
    .from('employee')
    .select('*, doctorprofile(*), department(name)')
    .eq('employeetype', 'Doctor');
    if (error) throw error;
    return data;
  },

  // ADMIN: Create a new staff record (no account yet — employee ID is the key)
  createStaff: async (profileData, doctorData = null) => {
    const { data: employee, error: empError } = await supabase
    .from('employee')
    .insert(profileData)
    .select()
    .single();

    if (empError) throw empError;

    // If doctor, also create the DoctorProfile row
    if (profileData.employeetype === 'Doctor' && doctorData) {
      const { error: drError } = await supabase
      .from('doctorprofile')
      .insert({ ...doctorData, employeeid: employee.employeeid });
      if (drError) throw drError;
    }

    return employee;
  },

  // STAFF SELF-REGISTRATION: Verify an employee ID and get the matching unregistered record
  verifyEmployeeID: async (idNumber) => {
    console.log('Verifying Employee ID:', idNumber.trim().toUpperCase());
    const { data, error } = await supabase
    .from('employee')
    .select('*, department(name)')
    .eq('employeenumber', idNumber.trim().toUpperCase())
    .maybeSingle();

    if (error) {
      console.error('Database error in verifyEmployeeID:', error);
      throw error;
    }

    if (data && data.userid) {
      throw new Error('This Employee ID is already registered. Please login instead.');
    }

    return data; // null if not found
  },

  // STAFF SELF-REGISTRATION: Link the new auth account to the employee record
  activateAccount: async (employeeId, email, userId) => {
    // 1. Insert into "User" table
    const { data: userRow, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      passwordhash: 'managed_by_supabase_auth',
      role: 'staff',
      isactive: true
    })
    .select('userid')
    .single();
    if (userError) throw userError;

    // 2. Link the employee record to the new user
    const { error: linkError } = await supabase
    .from('employee')
    .update({ userid: userRow.userid })
    .eq('employeeid', employeeId);
    if (linkError) throw linkError;

    return userRow;
  },

  // ------- Standard CRUD -------

  getProfileById: async (employeeId) => {
    const { data, error } = await supabase
      .from('employee')
      .select('*, doctorprofile(*), department(*)')
      .eq('employeeid', employeeId)
      .single();
    if (error) throw error;
    return data;
  },

  getProfileByEmail: async (email) => {
    try {
      console.log('--- PROFILE LOOKUP START ---');
      console.log('Search Email:', email);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('userid, email, role')
        .ilike('email', email)
        .maybeSingle();

      if (userError) {
        console.error('User table error:', userError);
        throw userError;
      }

      console.log('User found in custom table:', userData);

      if (!userData) {
        console.warn('CRITICAL: No entry in custom "User" table for email:', email);
        return null;
      }

      const { data, error } = await supabase
        .from('employee')
        .select('*, doctorprofile(*), department(*)')
        .eq('userid', userData.userid)
        .maybeSingle();

      if (error) {
        console.error('Employee table error:', error);
        throw error;
      }

      console.log('Employee record retrieved:', data);
      console.log('--- PROFILE LOOKUP END ---');

      return data;
    } catch (err) {
      console.error('Unhandled error in getProfileByEmail:', err);
      throw err;
    }
  },

  upsertDoctorProfile: async (profileData) => {
    const { data, error } = await supabase
      .from('doctorprofile')
      .upsert(profileData, { onConflict: 'employeeid' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (employeeId, employeeData) => {
    const { data, error } = await supabase
      .from('employee')
      .update(employeeData)
      .eq('employeeid', employeeId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (employeeId) => {
    const { error } = await supabase
      .from('employee')
      .delete()
      .eq('employeeid', employeeId);
    if (error) throw error;
    return true;
  },
};
