import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { analyticsApi, type DashboardAnalytics } from '../api/analytics';
import { DashboardSkeleton } from '../components/LoadingSpinner';
import type { Ticket, TicketStatus, Priority } from '../types';
import { format } from 'date-fns';

export const Dashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || token.trim().length === 0) {
      console.error('No access token available');
      setLoading(false);
      return;
    }
    
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [ticketsData, analyticsData] = await Promise.all([
        ticketsApi.getTickets({ limit: 10 }).catch((err) => {
          console.error('Failed to load tickets:', err);
          return { items: [], total: 0, skip: 0, limit: 10 };
        }),
        analyticsApi.getDashboardAnalytics().catch((err) => {
          console.error('Failed to load analytics:', err);
          // Return default analytics if API fails
          return {
            total_tickets: 0,
            open_tickets: 0,
            done_tickets: 0,
            recent_tickets: 0,
            tickets_this_month: 0,
            my_tickets: 0,
            avg_resolution_days: 0,
            status_counts: {},
            priority_counts: {},
            my_status_counts: {}
          };
        })
      ]);
      setTickets(ticketsData.items);
      setAnalytics(analyticsData);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      // Set default values on error
      setTickets([]);
      setAnalytics({
        total_tickets: 0,
        open_tickets: 0,
        done_tickets: 0,
        recent_tickets: 0,
        tickets_this_month: 0,
        my_tickets: 0,
        avg_resolution_days: 0,
        status_counts: {},
        priority_counts: {},
        my_status_counts: {}
      });
      
      // Set user-friendly error message
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        setError('Unable to connect to the server. Please ensure the backend server is running.');
      } else {
        setError('Failed to load dashboard data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      LOW: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600',
      MEDIUM: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      HIGH: 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      CRITICAL: 'bg-gradient-to-br from-red-100 to-red-200 text-red-700 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300 border-red-300 dark:border-red-700',
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getStatusColor = (status: TicketStatus) => {
    const colors = {
      OPEN: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      IN_PROGRESS: 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      REVIEW: 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 dark:from-yellow-900/40 dark:to-yellow-800/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      IN_TESTING: 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 dark:from-indigo-900/40 dark:to-indigo-800/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
      BLOCKED: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600',
      DONE: 'bg-gradient-to-br from-green-100 to-green-200 text-green-700 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300 border-green-300 dark:border-green-700',
    };
    return colors[status] || colors.OPEN;
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    trend, 
    delay = 0 
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    color: string; 
    trend?: string;
    delay?: number;
  }) => (
    <div 
      className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center shadow-sm transition-colors duration-200`}>
            {icon}
          </div>
          {trend && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your tickets.
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Ticket</span>
        </Link>
      </div>

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {analytics && (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Tickets"
              value={analytics.total_tickets}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              color="bg-blue-600"
              delay={0}
            />
            <StatCard
              title="Open Tickets"
              value={analytics.open_tickets}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
              color="bg-orange-600"
              delay={0}
            />
            <StatCard
              title="Done Tickets"
              value={analytics.done_tickets}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="bg-green-600"
              delay={0}
            />
            <StatCard
              title="My Tickets"
              value={analytics.my_tickets}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              color="bg-purple-600"
              delay={0}
            />
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-shadow duration-200 hover:shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Recent (7 days)</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.recent_tickets}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-shadow duration-200 hover:shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">This Month</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.tickets_this_month}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-shadow duration-200 hover:shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Avg Resolution</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.avg_resolution_days} <span className="text-base text-gray-500 dark:text-gray-400 font-normal">days</span>
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-shadow duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span>Tickets by Status</span>
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.status_counts).map(([status, count], index) => (
                  <ProgressBar
                    key={status}
                    label={status.replace('_', ' ')}
                    value={count}
                    max={analytics.total_tickets}
                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                  />
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-shadow duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span>Tickets by Priority</span>
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.priority_counts).map(([priority, count], index) => (
                  <ProgressBar
                    key={priority}
                    label={priority}
                    value={count}
                    max={analytics.total_tickets}
                    color="bg-gradient-to-r from-orange-500 to-orange-600"
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Tickets Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow duration-200 hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span>Recent Tickets</span>
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No recent tickets</p>
            </div>
          ) : (
            tickets.slice(0, 10).map((ticket, index) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="group block px-6 py-4 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent dark:hover:from-primary-900/10 transition-all duration-300 hover:pl-8"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        #{ticket.id}
                      </span>
                      <span className="text-base font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 truncate">
                        {ticket.title}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {ticket.creator.full_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
