import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  leftIcon?: React.ReactNode;
}

// Style constants moved outside component
const BASE_STYLES = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const SIZE_STYLES = "px-4 py-2.5 text-sm sm:text-base";
const VARIANT_STYLES = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-md hover:shadow-lg",
  secondary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-500",
} as const;

export const Button = memo<ButtonProps>(({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  disabled,
  leftIcon,
  ...props 
}) => (
  <button
    className={`${BASE_STYLES} ${VARIANT_STYLES[variant]} ${SIZE_STYLES} ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
    {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
    {children}
  </button>
));

Button.displayName = 'Button';