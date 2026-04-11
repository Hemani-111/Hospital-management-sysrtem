import { supabase } from '../lib/supabase';

export const billingService = {
  // Get all bills with patient details and all charge columns
  getAll: async () => {
    const { data, error } = await supabase
      .from('bill')
      .select(`
        billid, caserequestid, totalamount, insurancecovered, discount, paymentstatus, generatedon,
        consultationfee, roomcharges, labcharges, medicinecharges, othercharges,
        caserequest(caserequestid, patient(firstname, lastname))
      `)
      .order('generatedon', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get bills for a specific patient via their case IDs
  getByPatient: async (patientId) => {
    const { data, error } = await supabase
      .from('bill')
      .select(`
        billid, caserequestid, totalamount, insurancecovered, discount, paymentstatus, generatedon,
        caserequest(caserequestid, casesummary, patientid)
      `)
      .order('generatedon', { ascending: false });
    const filtered = (data || []).filter(b => b.caserequest?.patientid === patientId);
    if (error) throw error;
    return filtered;
  },

  // Get a specific bill
  getById: async (id) => {
    const { data, error } = await supabase
      .from('bill')
      .select('*, caserequest(*, patient(*), prescription(*), labreport(*, labtest(*)))')
      .eq('billid', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Update payment status (alias used by BillingManagement)
  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('bill')
      .update({ paymentstatus: status })
      .eq('billid', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update payment (generic)
  updatePayment: async (id, paymentData) => {
    const { data, error } = await supabase
      .from('bill')
      .update(paymentData)
      .eq('billid', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
