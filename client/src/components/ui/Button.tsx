import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const variantStyles = {
    primary:
      'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white focus:ring-blue-500/30 shadow-[0_1px_2px_rgba(37,99,235,0.2)] border border-blue-600/50',
    secondary:
      'bg-[#EFF6FF] hover:bg-[#DBEAFE] active:bg-[#BFDBFE] text-[#1D4ED8] border border-[#BFDBFE]/60 focus:ring-blue-500/20',
    outline:
      'bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] hover:border-[#94A3B8] active:bg-[#F1F5F9] text-[#334155] focus:ring-blue-500/20 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    destructive:
      'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white focus:ring-red-500/30 shadow-[0_1px_2px_rgba(220,38,38,0.2)] border border-red-700/40',
    ghost:
      'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] focus:ring-slate-400/20',
  };

  const sizeStyles = {
    sm: 'h-8 text-xs px-2.5 gap-1.5',
    md: 'h-9 text-xs font-semibold px-3.5 gap-2',
    lg: 'h-10 text-sm font-semibold px-4 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
