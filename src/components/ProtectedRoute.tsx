import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LoadingSpinner } from './LoadingSpinner';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to ensure auth state is loaded
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [user]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center animate-fade-in">
          <LoadingSpinner size="lg" variant="spinner" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('access_token');
  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


