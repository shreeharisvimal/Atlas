import React from 'react';
import { useThemeStore } from '../store/theme';

interface LoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'ring' | 'bars' | 'orbit';
  className?: string;
  fullScreen?: boolean;
  text?: string;
  overlay?: boolean;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export const Loader = ({
  size = 'md',
  variant = 'spinner',
  className = '',
  fullScreen = false,
  text,
  overlay = false,
}: LoaderProps) => {
  const { theme } = useThemeStore();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const checkDarkMode = () => {
      if (theme === 'dark') {
        setIsDark(true);
      } else if (theme === 'light') {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    checkDarkMode();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setIsDark(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const renderSpinner = () => (
    <div className={`relative ${sizeClasses[size]}`}>
      <div
        className={`absolute inset-0 border-4 border-transparent rounded-full ${
          isDark ? 'border-primary-900/30' : 'border-primary-100'
        }`}
      />
      <div
        className={`absolute inset-0 border-4 border-t-transparent rounded-full animate-spin ${
          isDark
            ? 'border-r-primary-500 border-b-primary-400 border-l-primary-600'
            : 'border-r-primary-500 border-b-primary-400 border-l-primary-600'
        }`}
        style={{
          background: isDark
            ? 'conic-gradient(from 0deg, transparent, #ea580c, #f97316, #fb923c, transparent)'
            : 'conic-gradient(from 0deg, transparent, #ea580c, #f97316, #fb923c, transparent)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
        }}
      />
      <div
        className={`absolute inset-1 rounded-full gradient-primary opacity-20 animate-pulse-slow`}
      />
    </div>
  );

  const renderDots = () => (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} gradient-primary rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} gradient-primary rounded-full animate-pulse-slow relative`}>
        <div
          className={`absolute inset-0 gradient-primary rounded-full animate-ping`}
          style={{ animationDuration: '1.5s' }}
        />
      </div>
    </div>
  );

  const renderRing = () => (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg
        className={`${sizeClasses[size]} animate-spin`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={isDark ? 'rgba(234, 88, 12, 0.2)' : 'rgba(249, 115, 22, 0.2)'}
          strokeWidth="4"
        />
        <path
          d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12"
          stroke="url(#gradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#ea580c' : '#ea580c'} />
            <stop offset="50%" stopColor={isDark ? '#f97316' : '#f97316'} />
            <stop offset="100%" stopColor={isDark ? '#fb923c' : '#fb923c'} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  const renderBars = () => {
    const barHeights = {
      xs: '12px',
      sm: '16px',
      md: '24px',
      lg: '32px',
      xl: '40px',
    };

    return (
      <div className={`flex items-end justify-center gap-1 ${className}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1.5 gradient-primary rounded-t-full animate-loader-bars"
            style={{
              height: barHeights[size],
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  };

  const renderOrbit = () => (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`${size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'} gradient-primary rounded-full`}
        />
      </div>
      <div
        className="absolute inset-0 border-2 border-transparent border-t-primary-500 rounded-full animate-spin"
        style={{ animationDuration: '1s' }}
      />
      <div
        className="absolute inset-0 border-2 border-transparent border-r-primary-400 rounded-full animate-spin"
        style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
      />
      <div
        className="absolute inset-0 border-2 border-transparent border-b-primary-600 rounded-full animate-spin"
        style={{ animationDuration: '2s' }}
      />
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'ring':
        return renderRing();
      case 'bars':
        return renderBars();
      case 'orbit':
        return renderOrbit();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderLoader()}
      {text && (
        <p
          className={`mt-3 ${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium animate-pulse`}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          overlay ? 'bg-black/20 dark:bg-black/40 backdrop-blur-sm' : 'bg-white/80 dark:bg-gray-900/80'
        }`}
      >
        {content}
      </div>
    );
  }

  return content;
};

// Bars animation is handled via inline styles

