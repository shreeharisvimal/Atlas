import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationPopupStore } from '../store/notificationPopupStore';
import { WEBSOCKET_CONFIG } from '../config/websocket';
import type { NotificationPopup } from '../store/notificationPopupStore';
import { NotificationType } from '../types';

interface NotificationPopupItemProps {
  notification: NotificationPopup;
  onDismiss: (id: string) => void;
  onView: (ticketId?: number) => void;
}

const NotificationPopupItem = ({ notification, onDismiss, onView }: NotificationPopupItemProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation immediately (no delay for instant pop-up)
    setIsVisible(true);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, WEBSOCKET_CONFIG.NOTIFICATION_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 200); // Match exit animation duration
  };

  const handleView = () => {
    if (notification.ticket_id) {
      onView(notification.ticket_id);
    }
    handleDismiss();
  };

  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case NotificationType.TICKET_CREATED:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case NotificationType.TICKET_ASSIGNED:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case NotificationType.TICKET_STATUS_CHANGED:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case NotificationType.TICKET_COMMENTED:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case NotificationType.TICKET_UPDATED:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getNotificationColor = () => {
    switch (notification.notification_type) {
      case NotificationType.TICKET_CREATED:
        return 'bg-blue-500';
      case NotificationType.TICKET_ASSIGNED:
        return 'bg-purple-500';
      case NotificationType.TICKET_STATUS_CHANGED:
        return 'bg-yellow-500';
      case NotificationType.TICKET_COMMENTED:
        return 'bg-green-500';
      case NotificationType.TICKET_UPDATED:
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`
        relative w-full
        bg-white dark:bg-gray-800
        rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        ${isExiting ? 'pointer-events-none' : ''}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getNotificationColor()} text-white flex items-center justify-center`}>
            {getNotificationIcon()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {notification.message}
            </p>
            
            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              {notification.ticket_id && (
                <button
                  onClick={handleView}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  View Ticket
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export const NotificationPopupContainer = () => {
  const { notifications, removeNotification } = useNotificationPopupStore();
  const navigate = useNavigate();

  const handleView = (ticketId?: number) => {
    if (ticketId) {
      navigate(`/tickets/${ticketId}`);
    }
  };

  // Show only the most recent notifications (stacked)
  const visibleNotifications = notifications
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, WEBSOCKET_CONFIG.NOTIFICATION_MAX_VISIBLE);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-full max-w-md px-4"
    >
      <div className="relative">
        {visibleNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto mb-2"
            style={{
              transform: `translateY(${index * 90}px)`,
            }}
          >
            <NotificationPopupItem
              notification={notification}
              onDismiss={removeNotification}
              onView={handleView}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

