import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize from localStorage
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('access_token');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;
  const hasToken = !!storedToken;

  return {
    user: initialUser,
    isAuthenticated: !!(initialUser && hasToken),
    setUser: (user) => {
      const token = localStorage.getItem('access_token');
      const isAuth = !!(user && token);
      set({ user, isAuthenticated: isAuth });
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    },
    logout: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    },
  };
});



