import type { User } from '../types';

interface AvatarProps {
  user: User | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
  showOnlineStatus?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

import { getProfilePictureUrl as getProfilePictureUrlUtil } from '../utils/urls';

const getProfilePictureUrl = (profilePictureUrl?: string | null): string | null => {
  return getProfilePictureUrlUtil(profilePictureUrl);
};

const sizeClasses = {
  sm: 'w-5 h-5 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export const Avatar = ({ user, size = 'md', className = '', showName = false, showOnlineStatus = true }: AvatarProps) => {
  if (!user) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${className}`}>
        <span className="text-gray-600 dark:text-gray-400">?</span>
      </div>
    );
  }

  const profilePictureUrl = getProfilePictureUrl(user.profile_picture_url);
  const initials = getInitials(user.full_name);
  const isOnline = user.is_online ?? false;
  
  // Size for online indicator based on avatar size
  const indicatorSize = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  }[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative inline-block">
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-white dark:ring-gray-800 hover:scale-110 transition-transform duration-300 group`}>
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="relative z-10">{initials}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        {showOnlineStatus && (
          <div 
            className={`absolute -bottom-0.5 -right-0.5 ${indicatorSize} rounded-full border-2 border-white dark:border-gray-800 z-10 shadow-lg ${
              isOnline ? 'bg-green-500 dark:bg-green-400 ring-2 ring-green-400/50 dark:ring-green-500/50 animate-pulse' : 'bg-gray-400 dark:bg-gray-500'
            }`} 
            title={isOnline ? 'Online' : 'Offline'} 
          />
        )}
      </div>
      {showName && (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user.full_name}</span>
      )}
    </div>
  );
};


