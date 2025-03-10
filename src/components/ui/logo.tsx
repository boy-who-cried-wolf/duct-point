import React from 'react';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Logo = ({ className, ...props }: LogoProps) => {
  return (
    <div className={`text-primary font-bold text-2xl ${className}`} {...props}>
      DUCT Points
    </div>
  );
}; 