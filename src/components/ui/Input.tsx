import React, { useState } from 'react'; // Import useState for passwordToggle
import { cn } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react'; // Import icons for password toggle

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode; // New prop for leading icon
  passwordToggle?: boolean; // New prop to enable password visibility toggle
  onTogglePassword?: () => void; // Callback for toggling password visibility
  showPassword?: boolean; // Controlled prop for password visibility
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon, // Destructure new icon prop
      passwordToggle, // Destructure new passwordToggle prop
      onTogglePassword, // Destructure new onTogglePassword prop
      showPassword, // Destructure new showPassword prop
      className,
      type, // Capture original type
      ...props
    },
    ref
  ) => {
    // Determine the actual input type based on showPassword prop
    const actualType = passwordToggle && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative"> {/* Wrapper for icon and input */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={actualType} // Use actualType
            className={cn(
              'w-full px-4 py-2.5 rounded-lg text-lg',
              'bg-white/5 border border-white/10 backdrop-blur-md',
              'text-white placeholder-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500/80 focus:shadow-lg',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-300',
              icon && 'pl-14', // Adjust padding if icon is present
              passwordToggle && 'pr-14', // Adjust padding if password toggle is present
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          {passwordToggle && onTogglePassword && (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
              onClick={onTogglePassword}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
