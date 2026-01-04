import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ 
  title, 
  description, 
  icon, 
  action,
  className = '' 
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-20 px-4 animate-fade-in ${className}`}>
      <div className="flex justify-center mb-8">
        <div className="relative">
          {icon || (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center shadow-xl">
                <svg
                  className="h-12 w-12 text-primary-600 dark:text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      <h3 className="mt-6 text-2xl font-extrabold text-gray-900 dark:text-white animate-fade-in-up">
        {title}
      </h3>
      {description && (
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto animate-fade-in-up font-medium" style={{ animationDelay: '100ms' }}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {action}
        </div>
      )}
    </div>
  );
};


