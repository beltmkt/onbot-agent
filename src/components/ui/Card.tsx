import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl shadow-glass', // Glassmorphism styles
        'p-6 md:p-8', // Default padding
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
