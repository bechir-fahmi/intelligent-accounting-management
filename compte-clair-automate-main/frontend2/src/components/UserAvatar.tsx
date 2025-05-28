import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12'
};

const UserAvatar: React.FC<UserAvatarProps> = ({ size = 'md', className }) => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'accountant':
        return 'bg-green-100 text-green-800';
      case 'finance':
        return 'bg-blue-100 text-blue-800';
      case 'finance_director':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return null;

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {user.profileImage ? (
        <AvatarImage src={user.profileImage} alt={user.name} />
      ) : (
        <AvatarFallback className={getRoleColor(user.type)}>
          {getInitials(user.name)}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default UserAvatar; 