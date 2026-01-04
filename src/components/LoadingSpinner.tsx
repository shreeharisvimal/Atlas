import { Loader } from './Loader';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
}

// Backward compatibility wrapper - uses the new Loader component
export const LoadingSpinner = ({ size = 'md', className = '', variant = 'spinner' }: LoadingSpinnerProps) => {
  return <Loader size={size} variant={variant} className={className} />;
};

// Export the new Loader component for direct use
export { Loader };

export const LoadingSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  );
};

// Skeleton components for different use cases
export const TicketListSkeleton = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="card p-6 animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3 animate-shimmer"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full mb-2 animate-shimmer"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 animate-shimmer"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-shimmer"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-shimmer"></div>
            </div>
          </div>
          <div className="flex items-center mt-4 space-x-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-shimmer"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-shimmer"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-shimmer"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const TicketDetailSkeleton = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-4 animate-shimmer"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-shimmer"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-shimmer"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6 animate-shimmer"></div>
        </div>
        <div className="flex space-x-4 mt-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-shimmer"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-shimmer"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-shimmer"></div>
        </div>
      </div>
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 mb-4 animate-shimmer"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-shimmer"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/4 mb-2 animate-shimmer"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="card p-6 animate-scale-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mb-3 animate-shimmer"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 animate-shimmer"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="card p-6 animate-scale-in"
            style={{ animationDelay: `${(i + 4) * 0.1}s` }}
          >
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mb-4 animate-shimmer"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-shimmer"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6 animate-shimmer"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-4/6 animate-shimmer"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="card p-6 animate-scale-in" style={{ animationDelay: '0.7s' }}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 mb-4 animate-shimmer"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-2 animate-shimmer"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 animate-shimmer"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const UserListSkeleton = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="card p-6 animate-slide-up"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-shimmer"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/4 mb-2 animate-shimmer"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 animate-shimmer"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-shimmer"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-shimmer"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

