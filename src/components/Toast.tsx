import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent = ({ toast, onRemove }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setIsVisible(true);
    const duration = toast.duration || 5000;
    const interval = 50;
    const decrement = (100 / duration) * interval;
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, interval);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [toast, onRemove]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-500 dark:text-green-400',
          text: 'text-green-800 dark:text-green-200',
          progress: 'bg-green-500',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-500 dark:text-red-400',
          text: 'text-red-800 dark:text-red-200',
          progress: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-warning-50 dark:bg-warning-900/20',
          border: 'border-warning-200 dark:border-warning-800',
          icon: 'text-warning-500 dark:text-warning-400',
          text: 'text-warning-800 dark:text-warning-200',
          progress: 'bg-warning-500',
        };
      default:
        return {
          bg: 'bg-primary-50 dark:bg-primary-900/20',
          border: 'border-primary-200 dark:border-primary-800',
          icon: 'text-primary-500 dark:text-primary-400',
          text: 'text-primary-800 dark:text-primary-200',
          progress: 'bg-primary-500',
        };
    }
  };

  const styles = getStyles();

  const getIcon = () => {
    const iconClass = `w-5 h-5 ${styles.icon}`;
    switch (toast.type) {
      case 'success':
        return (
          <div className={`${iconClass} flex-shrink-0`}>
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className={`${iconClass} flex-shrink-0`}>
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className={`${iconClass} flex-shrink-0`}>
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${iconClass} flex-shrink-0`}>
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={`${styles.bg} ${styles.border} border-2 rounded-2xl shadow-elevation-4 p-5 mb-3 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-full scale-95'
      } backdrop-blur-sm`}
      style={{ minWidth: '340px', maxWidth: '440px' }}
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5 animate-scale-in">
          <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
            {getIcon()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-bold ${styles.text} break-words leading-relaxed`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 p-1.5 rounded-lg hover:bg-gray-200/80 dark:hover:bg-gray-700/80 active:scale-95"
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="mt-4 h-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${styles.progress} transition-all duration-50 ease-linear rounded-full shadow-sm`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 pointer-events-none">
      <div className="flex flex-col items-end space-y-3">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-in-right"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ToastComponent toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </div>
  );
};


