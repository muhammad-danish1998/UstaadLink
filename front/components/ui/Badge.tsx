import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'neutral' | 'info' | 'warning';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    primary: 'bg-blue-50 text-blue-700 border border-blue-200/70',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/70',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/70',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim()}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
