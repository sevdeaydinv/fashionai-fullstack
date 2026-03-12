'use client';

import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-900 shadow-sm',
  secondary:
    'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-sm',
  ghost:
    'bg-transparent text-ink-900 border border-ink-200 hover:bg-ink-50 active:bg-ink-100',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-5 text-sm rounded-xl',
  lg: 'h-12 px-7 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-all duration-150 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <svg
            className={`animate-spin h-4 w-4 shrink-0 transition-opacity ${loading ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
