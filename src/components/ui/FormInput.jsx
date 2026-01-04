import React from 'react';

export default function FormInput({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  icon: Icon, 
  helperText,
  error,
  multiline = false,
  className = '',
  containerClassName = '',
  ...props 
}) {
  const borderColor = error ? "border-red-500 focus:border-red-500" : "border-brand-muted/20 focus:border-brand-primary hover:border-brand-primary/40";
  const baseStyles = `w-full bg-brand-surface border ${borderColor} rounded-2xl p-4 mt-1 outline-none transition-all font-medium`;
  
  return (
    <div className={containerClassName}>
      {label && (
        <label className={`text-xs font-black uppercase ml-1 ${error ? 'text-red-500' : 'text-brand-muted'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-500' : 'text-brand-muted'}`} size={16} />
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={onChange}
            className={`${baseStyles} min-h-[80px] ${Icon ? 'pl-12' : ''} ${className}`}
            placeholder={placeholder}
            required={required}
            aria-invalid={!!error}
            {...props}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            className={`${baseStyles} ${Icon ? 'pl-12' : ''} ${className}`}
            placeholder={placeholder}
            required={required}
            aria-invalid={!!error}
            {...props}
          />
        )}
      </div>
      {error ? (
        <p className="text-[10px] text-red-500 mt-2 ml-1 font-bold animate-in slide-in-from-top-1">
          {error}
        </p>
      ) : helperText && (
        <p className="text-[10px] text-brand-muted mt-2 ml-1 italic">
          {helperText}
        </p>
      )}
    </div>
  );
}