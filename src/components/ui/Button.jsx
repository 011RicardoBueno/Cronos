import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  isActive = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'font-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variantStyles = {
    primary: 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 hover:scale-[1.02]',
    secondary: 'bg-brand-surface text-brand-text border border-brand-muted/20 hover:bg-brand-muted/10',
    ghost: 'bg-transparent text-brand-text hover:bg-brand-muted/10',
    outline: 'bg-transparent border-2 border-brand-muted/10 hover:border-brand-primary/30 hover:bg-brand-surface',
    danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600',
  };

  const activeVariantStyles = {
    primary: 'ring-2 ring-offset-2 ring-brand-primary',
    secondary: 'border-brand-primary ring-2 ring-brand-primary',
    ghost: 'bg-brand-primary/10 text-brand-primary',
    outline: 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5',
    danger: 'ring-2 ring-offset-2 ring-red-500',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 rounded-lg text-sm',
    md: 'px-12 py-4 rounded-2xl text-lg',
    lg: 'px-16 py-5 rounded-2xl text-xl',
    custom: '',
  };

  const combinedClassName = [baseStyles, sizeStyles[size], variantStyles[variant], isActive ? activeVariantStyles[variant] : '', className].join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={combinedClassName}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : children}
    </button>
  );
};

export default Button;