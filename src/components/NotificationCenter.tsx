import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import { useToastStore } from '../store/toast';
import { LoadingSpinner } from './LoadingSpinner';
import type { Notification, NotificationStats } from '../types';
import { format } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadStats();
    }
  }, [isOpen, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getNotifications({
        limit: 50,
        unread_only: filter === 'unread'
      });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await notificationsApi.getNotificationStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return;
    
    try {
      await notificationsApi.updateNotification(notification.id, true);
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
      if (stats) {
        setStats({ ...stats, unread: Math.max(0, stats.unread - 1) });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      showToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      if (stats) {
        setStats({ ...stats, unread: 0 });
      }
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (stats) {
        setStats({ ...stats, total: stats.total - 1 });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showToast('Failed to delete notification', 'error');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification);
    }
    if (notification.ticket_id) {
      navigate(`/tickets/${notification.ticket_id}`);
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
        return '🎫';
      case 'TICKET_ASSIGNED':
        return '👤';
      case 'TICKET_STATUS_CHANGED':
        return '🔄';
      case 'TICKET_COMMENTED':
        return '💬';
      default:
        return '📢';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl animate-slide-in-right">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
              {stats && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-semibold text-primary-600 dark:text-primary-400">{stats.unread}</span> unread of <span className="font-semibold">{stats.total}</span> total
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {stats && stats.unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors duration-200 active:scale-95"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 active:scale-95"
                aria-label="Close notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  filter === 'unread'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm mt-2">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 animate-slide-up ${
                      !notification.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.notification_type)}</span>
                          <h3 className={`text-sm font-semibold truncate ${
                            !notification.is_read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {format(new Date(notification.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="ml-2 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 flex-shrink-0 active:scale-95"
                        aria-label="Delete notification"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


