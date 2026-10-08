import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, size = 'md', className = '' }) => {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg font-medium'
  };

  return (
    <div
      className={`rounded-full bg-[#E8E6DD] text-[#020202] font-semibold flex items-center justify-center border border-[#D9D6CC] select-none shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  );
};
