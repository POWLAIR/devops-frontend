import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      id,
      placeholder,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [filled, setFilled] = useState(
      Boolean(value !== undefined ? value : defaultValue)
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilled(e.target.value.length > 0);
      props.onChange?.(e);
    };

    const hasFloatingLabel = Boolean(label);

    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] pointer-events-none z-10">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            defaultValue={defaultValue}
            placeholder={hasFloatingLabel ? ' ' : placeholder}
            onChange={handleChange}
            {...props}
            className={cn(
              'peer w-full rounded-lg border bg-[var(--card-background)] text-sm text-[var(--foreground)]',
              'transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
              'placeholder:text-[var(--neutral-400)]',
              error
                ? 'border-[var(--error)] focus:ring-[var(--error)]'
                : 'border-[var(--border-color)]',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              hasFloatingLabel ? 'pt-5 pb-1.5 h-14' : 'py-2.5 h-10',
              props.disabled && 'opacity-50 cursor-not-allowed bg-[var(--neutral-100)]',
              className
            )}
          />

          {hasFloatingLabel && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-3 transition-all duration-200 pointer-events-none select-none text-[var(--neutral-400)]',
                leftIcon && 'left-9',
                // Floating up: when peer has value or is focused
                'peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--primary)]',
                filled || value
                  ? 'top-2 text-xs text-[var(--neutral-500)]'
                  : 'top-1/2 -translate-y-1/2 text-sm'
              )}
            >
              {label}
            </label>
          )}

          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] pointer-events-none z-10">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-[var(--neutral-500)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
