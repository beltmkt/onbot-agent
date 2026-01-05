import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary-neon' | 'secondary-glass' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary-neon', // Default to the new primary style
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

  const variants = {
    'primary-neon': 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:from-cyan-600 hover:to-indigo-700 focus:ring-cyan-500',
    'secondary-glass': 'bg-white/5 border border-white/10 text-slate-200 backdrop-blur-md hover:bg-white/10 hover:border-white/20 focus:ring-white/30',
    'outline': 'border border-slate-700 text-slate-200 hover:bg-white/5 hover:border-white/20 focus:ring-slate-500',
    'ghost': 'text-slate-300 hover:bg-white/5 focus:ring-slate-500',
    'danger': 'bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};