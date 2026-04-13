import api from '../lib/api';

export const roomService = {
  // Fetch all rooms
  getAll: async () => {
    const response = await api.get('/rooms');
    return response.data;
  },

  // Get room stats
  getStats: async () => {
    const response = await api.get('/rooms/stats');
    return response.data;
  },

  // Update room occupancy
  updateOccupancy: async (roomId, isOccupied) => {
    const response = await api.patch(`/rooms/${roomId}/occupancy`, { isOccupied });
    return response.data;
  },

  // Create a new room
  create: async (roomData) => {
    const response = await api.post('/rooms', roomData);
    return response.data;
  },
  
  // Update an existing room
  update: async (roomId, roomData) => {
    const response = await api.put(`/rooms/${roomId}`, roomData);
    return response.data;
  }
};
