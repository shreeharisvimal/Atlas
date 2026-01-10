import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  // Clear any errors and stale tokens when component mounts
  useEffect(() => {
    setError('');
    setErrors({});
    // Clear any stale tokens to prevent automatic validation attempts
    // The login function will handle clearing tokens before attempting login
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      // Extract meaningful error message from API response
      let errorMsg = 'Login failed. Please check your credentials.';
      
      if (err.response?.data?.detail) {
        // Use the detail from API response
        errorMsg = err.response.data.detail;
      } else if (err.message && !err.message.includes('status code')) {
        // Use error message if it's not a generic axios status code message
        errorMsg = err.message;
      }
      
      // Set field-specific errors based on error message
      const newErrors: { email?: string; password?: string } = {};
      const lowerMsg = errorMsg.toLowerCase();
      
      if (lowerMsg.includes('user does not exist') || 
          lowerMsg.includes('invalid email') ||
          lowerMsg.includes('email')) {
        newErrors.email = errorMsg;
      } else if (lowerMsg.includes('invalid password') ||
                 lowerMsg.includes('incorrect password') ||
                 lowerMsg.includes('password')) {
        newErrors.password = errorMsg;
      } else if (lowerMsg.includes('inactive')) {
        newErrors.email = errorMsg;
      } else {
        // Show general error banner for other errors
        setError(errorMsg);
      }
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Left Side - Branding Panel */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between lg:bg-gradient-to-br from-primary-600 to-primary-700 lg:p-12 xl:p-16">
        <div>
          <div className="flex items-center space-x-3 mb-12">
            <img 
              src={import.meta.env.VITE_BASE_PATH ? `${import.meta.env.VITE_BASE_PATH}logo-icon.svg` : '/logo-icon.svg'} 
              alt="SETU AI Atlas Logo" 
              className="w-10 h-10 flex-shrink-0"
              onError={(e) => {
                // Fallback if logo fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-white">SETU AI Atlas</h1>
              <p className="text-xs text-white/80">Enterprise Platform</p>
            </div>
          </div>
          
          <div className="max-w-md">
            <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
              Streamline Your Issue Tracking
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              A comprehensive internal issue tracking system designed for enterprise teams to manage, track, and resolve issues efficiently.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Secure Authentication</p>
              <p className="text-white/80 text-sm">Enterprise-grade security protocols</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Real-time Collaboration</p>
              <p className="text-white/80 text-sm">Team-based issue management</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Advanced Analytics</p>
              <p className="text-white/80 text-sm">Comprehensive reporting and insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src={import.meta.env.VITE_BASE_PATH ? `${import.meta.env.VITE_BASE_PATH}logo-icon.svg` : '/logo-icon.svg'} 
                alt="SETU AI Atlas Logo" 
                className="w-10 h-10 flex-shrink-0"
                onError={(e) => {
                  // Fallback if logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">SETU AI Atlas</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enterprise Platform</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign in to continue to your account
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Authentication Error</h3>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`block w-full pl-11 pr-4 py-3.5 border-2 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 ${
                        errors.email 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-400 focus:border-red-400 animate-shake' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                          setErrors({ ...errors, email: undefined });
                        }
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 flex items-center">
                      <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className={`block w-full pl-11 pr-4 py-3.5 border-2 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 ${
                        errors.password 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-400 focus:border-red-400 animate-shake' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password && e.target.value.length >= 6) {
                          setErrors({ ...errors, password: undefined });
                        }
                      }}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 flex items-center">
                      <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} SETU AI Atlas. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Enterprise Issue Tracking System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

