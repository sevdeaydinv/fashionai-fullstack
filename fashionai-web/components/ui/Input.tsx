'use client';

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900',
            'placeholder:text-ink-400',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
              : 'border-ink-200 hover:border-ink-300',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
