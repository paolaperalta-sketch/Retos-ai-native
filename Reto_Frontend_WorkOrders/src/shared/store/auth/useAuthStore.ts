import { create } from 'zustand';
import { ISession, IUserDetailsResponse } from './authStore.interface';

interface AuthState {
  session: ISession | null;
  user: IUserDetailsResponse | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (session: ISession, token: string, refreshToken: string) => void;
  setUser: (user: IUserDetailsResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  hydrated: false,
  
  login: (session: ISession, token: string, refreshToken: string) => {
    set({ 
      session, 
      token, 
      refreshToken,
      isAuthenticated: true 
    });
  },

  setUser: (user: IUserDetailsResponse) => {
    set({ user });
  },
  
  logout: () => {
    set({
      session: null,
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
