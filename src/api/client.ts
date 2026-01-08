import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/constants';

const API_BASE_URL = API_CONFIG.BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
interface QueueItem {
  resolve: (value?: string) => void;
  reject: (reason?: AxiosError) => void;
}

let failedQueue: QueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token ?? undefined);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Don't add auth header for login or refresh endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')) {
      return config;
    }
    
    // If data is FormData, don't set Content-Type (let browser set it with boundary)
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }
    
    // Always read fresh token from localStorage to avoid stale values
    const token = localStorage.getItem('access_token');
    if (token) {
      // Trim any whitespace and ensure proper format
      let cleanToken = token.trim();
      // Remove any quotes that might have been added
      cleanToken = cleanToken.replace(/^["']|["']$/g, '');
      // Basic JWT format validation (should have 3 parts separated by dots)
      if (cleanToken && cleanToken.length > 0 && cleanToken.split('.').length === 3) {
        // Ensure Authorization header is set correctly
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and refresh tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry login endpoint failures
    if (originalRequest?.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken || refreshToken.trim().length === 0) {
        processQueue(error, null);
        isRefreshing = false;
        // Only redirect if we're not already on login page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          // Use navigate if available, otherwise use window.location
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        if (access_token) {
          localStorage.setItem('access_token', access_token);
          processQueue(null, access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          isRefreshing = false;
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;
        // Only redirect if we're not already on login page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          // Use navigate if available, otherwise use window.location
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

