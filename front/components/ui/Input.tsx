import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  rightIcon,
  className = '',
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative rounded-xl">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          className={`
            w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400
            transition-all duration-200 outline-none
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}
            ${className}
          `.trim()}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
