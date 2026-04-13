import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      session: null, // Unified session object for component compatibility
      isAuthenticated: false,
      
      setSession: (data) => {
        if (data && data.token) {
          set({ 
            token: data.token, 
            user: data.user, 
            session: { user: data.user },
            isAuthenticated: true 
          });
        } else {
          set({ user: null, token: null, session: null, isAuthenticated: false });
        }
      },

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          set({ 
            token, 
            user, 
            session: { user },
            isAuthenticated: true 
          });
          
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          throw new Error(message);
        }
      },

      logout: async () => {
        set({ user: null, token: null, session: null, isAuthenticated: false });
      },
    }),
    {
      name: 'hms-auth-storage',
    }
  )
);
