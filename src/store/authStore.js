import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      
      setSession: (session) => {
        if (session) {
          // In some edge cases, metadata might come back as a string, though usually it's an object
          let metadata = session.user.user_metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              console.error('Failed to parse user metadata:', e);
            }
          }
          
          set({ 
            session, 
            user: metadata, 
            isAuthenticated: true 
          });
        } else {
          set({ user: null, session: null, isAuthenticated: false });
        }
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        // The metadata will be update via the auth listener in App.jsx or here
        return data;
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, isAuthenticated: false });
      },
    }),
    {
      name: 'hms-auth-storage',
    }
  )
);
