import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api/auth';

export const useAuth = () => {
  const { user, setUser, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch user if we have a token but no user data
    // Skip if user is already set (e.g., after login)
    const token = localStorage.getItem('access_token');
    if (token && token.trim().length > 0 && !user) {
      // Small delay to avoid race conditions with token storage
      const timer = setTimeout(() => {
        authApi.getCurrentUser()
          .then(setUser)
          .catch((error) => {
            // Only logout if it's a real auth error (401), not a network error
            if (error.response?.status === 401) {
              logout();
            }
          });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, logout, setUser]);

  const handleLogin = async (email: string, password: string) => {
    try {
      // Clear any existing tokens first
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      const response = await authApi.login({ email, password });
      
      // Validate response has tokens
      if (!response.access_token || !response.refresh_token) {
        throw new Error('Invalid response from server: missing tokens');
      }
      
      // Store tokens immediately and synchronously - ensure no whitespace or quotes
      let accessToken = String(response.access_token).trim();
      let refreshToken = String(response.refresh_token).trim();
      
      // Remove any surrounding quotes
      accessToken = accessToken.replace(/^["']|["']$/g, '');
      refreshToken = refreshToken.replace(/^["']|["']$/g, '');
      
      if (!accessToken || !refreshToken) {
        throw new Error('Invalid tokens received from server');
      }
      
      // Store tokens - use JSON.stringify to ensure proper storage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      
      // Verify tokens were stored correctly
      const storedAccessToken = localStorage.getItem('access_token');
      const storedRefreshToken = localStorage.getItem('refresh_token');
      
      if (storedAccessToken !== accessToken || storedRefreshToken !== refreshToken) {
        throw new Error('Failed to store tokens correctly');
      }
      
      // Verify token format (JWT should have 3 parts)
      if (storedAccessToken.split('.').length !== 3) {
        throw new Error('Invalid token format stored');
      }
      
      // Set user in store from login response
      setUser(response.user);
      
      // Wait a bit longer to ensure everything is committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to dashboard - let ProtectedRoute and components handle auth
      navigate('/dashboard');
    } catch (error: any) {
      // Clear tokens on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw new Error(error.response?.data?.detail || error.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return {
    user,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
  };
};



