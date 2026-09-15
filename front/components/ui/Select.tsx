import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  icon?: React.ReactNode;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  icon,
  placeholder = 'Select an option',
  className = '',
  id,
  required,
  value,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label 
          htmlFor={selectId} 
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

        <select
          ref={ref}
          id={selectId}
          required={required}
          value={value}
          className={`
            w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 appearance-none
            transition-all duration-200 outline-none
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            pr-10
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}
            ${className}
          `.trim()}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400">
              {placeholder}
            </option>
          )}
          {options.map((opt, idx) => (
            <option key={`${opt.value}-${idx}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
