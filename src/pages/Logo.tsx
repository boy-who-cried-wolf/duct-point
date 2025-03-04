
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center font-medium ${sizes[size]} ${className}`}>
      <span className="text-primary">Duct</span>
      <ChevronRight className="h-4 w-4 text-primary mx-0.5" />
      <span className="font-light">Points</span>
    </div>
  );
};

export default Logo;
