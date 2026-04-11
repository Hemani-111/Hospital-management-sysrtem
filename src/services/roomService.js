import { supabase } from '../lib/supabase';

export const roomService = {
  // Fetch all rooms with department info
  getAll: async () => {
    const { data, error } = await supabase
      .from('room')
      .select('*, department(name)')
      .order('roomnumber', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Get room stats
  getStats: async () => {
    const { data, error } = await supabase.from('room').select('isoccupied');
    if (error) throw error;
    const total = data.length;
    const occupied = data.filter(r => r.isoccupied).length;
    return { total, occupied, available: total - occupied };
  },

  // Update room occupancy
  updateOccupancy: async (roomId, isOccupied) => {
    const { data, error } = await supabase
      .from('room')
      .update({ isoccupied: isOccupied })
      .eq('roomid', roomId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Create a new room
  create: async (roomData) => {
    const { data, error } = await supabase
      .from('room')
      .insert([roomData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
