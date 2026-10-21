import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { SystemRole } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { NotificationPopupContainer } from './NotificationPopup';
import { Breadcrumbs } from './Breadcrumbs';
import { Avatar } from './Avatar';
import { notificationsApi } from '../api/notifications';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotificationPopupStore } from '../store/notificationPopupStore';
import { NotificationType } from '../types';
import type { NotificationStats } from '../types';
import { browserNotificationService } from '../services/browserNotificationService';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lastMessage } = useWebSocket();
  const { addNotification } = useNotificationPopupStore();

  useEffect(() => {
    if (user) {
      // Request browser notification permission on mount
      // This is important - browsers require user interaction to request permission
      // So we request it as soon as the user logs in
      if (browserNotificationService.isSupported()) {
        // Check current permission status
        const currentPermission = browserNotificationService.getPermission();
        
        if (currentPermission === 'default') {
          // Permission not yet requested, request it now
          browserNotificationService.requestPermission().then((permission) => {
            if (permission === 'granted') {
              console.log('✅ Browser notification permission granted! System notifications will now work.');
            } else if (permission === 'denied') {
              console.warn('❌ Browser notification permission denied. Notifications will only show in-app.');
              console.warn('💡 User can enable notifications in browser settings.');
            }
          }).catch((error) => {
            console.error('Error requesting notification permission:', error);
          });
        } else if (currentPermission === 'granted') {
          console.log('✅ Browser notifications already enabled');
        } else {
          console.warn('❌ Browser notifications were previously denied');
        }
      } else {
        console.warn('⚠️ Browser does not support system notifications');
      }

      // Wait longer to ensure token is available and validated before making requests
      const timer = setTimeout(() => {
        const token = localStorage.getItem('access_token');
        if (token && token.trim().length > 0) {
          // Verify token format before making request
          const parts = token.trim().split('.');
          if (parts.length === 3) {
            loadNotificationStats();
          } else {
            console.warn('Invalid token format, skipping notification stats');
          }
        }
      }, 500); // Increased delay to 500ms
      
      const interval = setInterval(() => {
        const token = localStorage.getItem('access_token');
        if (token && token.trim().length > 0) {
          const parts = token.trim().split('.');
          if (parts.length === 3) {
            loadNotificationStats();
          }
        }
      }, 30000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [user]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'notification') {
      // Add notification to pop-up store
      const notificationData = lastMessage.data;
      const notificationId = `notification-${notificationData.id}-${Date.now()}`;
      
      // Check if page is visible (tab is active)
      const isPageVisible = !document.hidden;
      
      // Show in-app popup if page is visible
      if (isPageVisible) {
        addNotification({
          id: notificationId,
          title: notificationData.title,
          message: notificationData.message,
          notification_type: notificationData.notification_type,
          ticket_id: notificationData.ticket_id,
          is_read: notificationData.is_read,
          created_at: notificationData.created_at,
          timestamp: Date.now(),
        });
      }
      
      // ALWAYS show browser notification (system-level, like WhatsApp)
      // This works even when tab is in background or minimized
      // The service will request permission if needed
      if (notificationData.ticket_id) {
        browserNotificationService.registerClickHandler(
          notificationData.ticket_id,
          () => {
            navigate(`/tickets/${notificationData.ticket_id}`);
          }
        );
      }
      
      // Always try to show browser notification (system-level)
      // This will request permission automatically if not granted
      // IMPORTANT: This creates a REAL system-level notification (like WhatsApp)
      // It will appear even when browser tab is minimized or in background
      browserNotificationService.showNotification({
        title: notificationData.title,
        message: notificationData.message,
        notificationType: notificationData.notification_type as NotificationType,
        ticketId: notificationData.ticket_id,
        tag: `notification-${notificationData.id}`,
      }).then((notification) => {
        if (notification) {
          console.log('✅ System-level notification displayed successfully');
        } else {
          console.warn('⚠️ System notification not shown (permission may be needed)');
        }
      }).catch((error) => {
        console.error('❌ Failed to show browser notification:', error);
      });

      // Always fetch fresh stats from server to ensure accuracy
      // Don't increment locally as the server is the source of truth
      loadNotificationStats();
    } else if (lastMessage.type === 'ticket_update') {
      // Convert ticket updates to pop-up notifications
      // NOTE: These are NOT database notifications, just UI pop-ups
      // They should NOT increment the notification count
      const update = lastMessage.data;
      const updatedBy = update.updated_by?.full_name || 'Someone';
      
      let title = '';
      let message = '';
      let notificationType: NotificationType = NotificationType.TICKET_UPDATED;
      
      if (update.action === 'status_changed') {
        const oldStatus = update.old_status?.replace(/_/g, ' ') || 'N/A';
        const newStatus = update.new_status?.replace(/_/g, ' ') || 'N/A';
        title = `Status Changed: Ticket #${update.ticket_id}`;
        message = `${updatedBy} changed status from ${oldStatus} to ${newStatus}`;
        notificationType = NotificationType.TICKET_STATUS_CHANGED;
      } else if (update.action === 'updated') {
        title = `Ticket Updated: #${update.ticket_id}`;
        message = `${updatedBy} updated the ticket`;
        notificationType = NotificationType.TICKET_UPDATED;
      } else if (update.action === 'created') {
        title = `New Ticket: #${update.ticket_id}`;
        message = `${updatedBy} created a new ticket: ${update.ticket?.title || 'Untitled'}`;
        notificationType = NotificationType.TICKET_CREATED;
      } else if (update.action === 'assigned') {
        title = `Ticket Assigned: #${update.ticket_id}`;
        message = `${updatedBy} assigned the ticket`;
        notificationType = NotificationType.TICKET_ASSIGNED;
      }
      
      // Show pop-up notification for ticket updates (instant)
      // Use a deduplication mechanism: check if we recently added a notification for this ticket
      if (title && message) {
        const notificationId = `ticket-update-${update.ticket_id}-${Date.now()}`;
        const isPageVisible = !document.hidden;
        
        // Show in-app popup if page is visible
        if (isPageVisible) {
          addNotification({
            id: notificationId,
            title,
            message,
            notification_type: notificationType,
            ticket_id: update.ticket_id,
            is_read: false,
            created_at: lastMessage.timestamp,
            timestamp: Date.now(),
          });
        }
        
        // Always show browser notification (system-level, like WhatsApp)
        if (update.ticket_id) {
          browserNotificationService.registerClickHandler(
            update.ticket_id,
            () => {
              navigate(`/tickets/${update.ticket_id}`);
            }
          );
          
          // Always try to show browser notification (system-level)
          browserNotificationService.showNotification({
            title,
            message,
            notificationType,
            ticketId: update.ticket_id,
            tag: `ticket-update-${update.ticket_id}`,
          }).catch((error) => {
            console.error('Failed to show browser notification:', error);
          });
        }
        
        // Don't update notification stats - ticket_update messages are not database notifications
        // They're just UI pop-ups for real-time updates
      }
    } else if (lastMessage.type === 'comment') {
      // Convert comment updates to pop-up notifications
      // NOTE: These are NOT database notifications, just UI pop-ups
      // They should NOT increment the notification count
      const comment = lastMessage.data;
      const author = comment.author?.full_name || 'Someone';
      const isPageVisible = !document.hidden;
      
      // Show in-app popup if page is visible
      if (isPageVisible) {
        addNotification({
          id: `comment-${comment.comment_id}-${Date.now()}`,
          title: `New Comment: Ticket #${comment.ticket_id}`,
          message: `${author} commented on ticket #${comment.ticket_id}`,
          notification_type: NotificationType.TICKET_COMMENTED,
          ticket_id: comment.ticket_id,
          is_read: false,
          created_at: lastMessage.timestamp,
          timestamp: Date.now(),
        });
      }
      
      // Always show browser notification (system-level, like WhatsApp)
      if (comment.ticket_id) {
        browserNotificationService.registerClickHandler(
          comment.ticket_id,
          () => {
            navigate(`/tickets/${comment.ticket_id}`);
          }
        );
        
        // Always try to show browser notification (system-level)
        browserNotificationService.showNotification({
          title: `New Comment: Ticket #${comment.ticket_id}`,
          message: `${author} commented on ticket #${comment.ticket_id}`,
          notificationType: NotificationType.TICKET_COMMENTED,
          ticketId: comment.ticket_id,
          tag: `comment-${comment.comment_id}`,
        }).catch((error) => {
          console.error('Failed to show browser notification:', error);
        });
      }
      
      // Don't update notification stats - comment messages are not database notifications
      // They're just UI pop-ups for real-time updates
    }
  }, [lastMessage, addNotification]);

  const loadNotificationStats = async () => {
    try {
      const stats = await notificationsApi.getNotificationStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canManageUsers = user?.system_role === SystemRole.ADMIN || user?.system_role === SystemRole.MANAGER;

  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const getThemeIcon = () => {
    if (theme === 'light') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    if (theme === 'dark') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'system') => {
    setTheme(selectedTheme);
    setShowThemeMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-menu-container')) {
        setShowThemeMenu(false);
      }
    };

    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeMenu]);

  const NavLink = ({ to, children, exact = false }: { to: string; children: React.ReactNode; exact?: boolean }) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 group whitespace-nowrap flex-shrink-0 ${
          active
            ? 'text-primary-700 dark:text-primary-400 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/40 dark:to-primary-800/20 shadow-sm'
            : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">{children}</span>
        {active && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-500 rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 gap-4">
            <div className="flex items-center flex-1 min-w-0">
              <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-2">
                  <img 
                    src={import.meta.env.VITE_BASE_PATH ? `${import.meta.env.VITE_BASE_PATH}logo-icon.svg` : '/logo-icon.svg'} 
                    alt="Shree Atlas Logo" 
                    className="w-8 h-8 flex-shrink-0"
                    onError={(e) => {
                      // Fallback if logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      Shree Atlas
                    </h1>
                  </div>
                </div>
              </Link>
              <div className="hidden lg:ml-4 lg:flex lg:space-x-1 lg:items-center lg:flex-nowrap">
                <NavLink to="/dashboard" exact>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="whitespace-nowrap">Dashboard</span>
                </NavLink>
                <NavLink to="/tickets">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="whitespace-nowrap">Tickets</span>
                </NavLink>
                <NavLink to="/sprints">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="whitespace-nowrap">Active Sprints</span>
                </NavLink>
                {canManageUsers && (
                  <>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-0.5 flex-shrink-0" />
                    <NavLink to="/projects">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="whitespace-nowrap">Projects</span>
                    </NavLink>
                    <NavLink to="/users">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="whitespace-nowrap">Users</span>
                    </NavLink>
                    <NavLink to="/tags">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="whitespace-nowrap">Tags</span>
                    </NavLink>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
              {/* Theme Selector Dropdown */}
              <div className="relative theme-menu-container flex-shrink-0">
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-600 whitespace-nowrap"
                  aria-label="Theme selector"
                  title={`Current theme: ${getThemeLabel()}`}
                >
                  <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">{getThemeIcon()}</span>
                  <span className="hidden 2xl:inline text-sm font-medium whitespace-nowrap">{getThemeLabel()}</span>
                  <svg 
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 flex-shrink-0 ${showThemeMenu ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showThemeMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowThemeMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Theme
                        </div>
                        <button
                          onClick={() => handleThemeSelect('light')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                            theme === 'light'
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">Light</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Clean and bright</div>
                          </div>
                          {theme === 'light' && (
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleThemeSelect('dark')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                            theme === 'dark'
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">Dark</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</div>
                          </div>
                          {theme === 'dark' && (
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleThemeSelect('system')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                            theme === 'system'
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">System</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Match device</div>
                          </div>
                          {theme === 'system' && (
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationStats && notificationStats.unread > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                      {notificationStats.unread > 9 ? '9+' : notificationStats.unread}
                    </span>
                  )}
                </button>
                {/* Browser notification permission indicator - shows yellow dot if permission not granted */}
                {browserNotificationService.isSupported() && !browserNotificationService.hasPermission() && (
                  <button
                    onClick={async () => {
                      const permission = await browserNotificationService.requestPermission();
                      if (permission === 'granted') {
                        console.log('Browser notifications enabled!');
                      }
                    }}
                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 border-2 border-white dark:border-gray-800 hover:bg-yellow-600 transition-colors"
                    title="Click to enable browser notifications (works even when tab is in background)"
                    aria-label="Enable browser notifications"
                  />
                )}
              </div>
              <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 ml-1 sm:ml-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-1.5 sm:space-x-2 px-1.5 sm:px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <Avatar user={user || undefined} size="md" showOnlineStatus={true} />
                  <div className="hidden xl:block">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{user?.full_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{user?.designation}</div>
                  </div>
                </Link>
                <Link
                  to="/settings"
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
                  aria-label="Settings"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 animate-slide-down">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <NavLink to="/dashboard" exact>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/tickets">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Tickets</span>
              </NavLink>
              <NavLink to="/sprints">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Active Sprints</span>
              </NavLink>
              {canManageUsers && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                  <NavLink to="/projects">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Projects</span>
                  </NavLink>
                  <NavLink to="/users">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Users</span>
                  </NavLink>
                  <NavLink to="/tags">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Tags</span>
                  </NavLink>
                </>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        <Breadcrumbs />
        <div className="mt-6">
          {children}
        </div>
      </main>
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          loadNotificationStats();
        }}
      />
      <NotificationPopupContainer />
    </div>
  );
};

