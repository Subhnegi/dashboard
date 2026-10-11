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
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variantStyles = {
    primary:
      'bg-[#5546D7] hover:bg-[#4739BE] active:bg-[#3C2FA3] text-white focus:ring-[#5546D7]/30 shadow-[0_1px_2px_rgba(85,70,215,0.2)]',
    secondary:
      'bg-[#EEECFB] hover:bg-[#E2DEFB] active:bg-[#D4CEF9] text-[#5546D7] focus:ring-[#5546D7]/20',
    outline:
      'border border-[#D0D5DD] hover:bg-[#F9FAFB] active:bg-[#F2F4F7] text-[#344054] focus:ring-[#5546D7]/20 shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
    destructive:
      'bg-[#D92D20] hover:bg-[#B42318] active:bg-[#912018] text-white focus:ring-[#D92D20]/30 shadow-[0_1px_2px_rgba(217,45,32,0.2)]',
    ghost:
      'text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7] active:bg-[#E4E7EC] focus:ring-[#5546D7]/20',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
