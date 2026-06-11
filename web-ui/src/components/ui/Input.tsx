import React, { forwardRef } from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
}

/**
 * Text input — Figma `text-input`. Hairline border, focus communicated via ring,
 * never a fill change.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, className, ...props },
  ref
) {
  return (
    <div className={cn('relative', className)}>
      {leftIcon && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        className={cn(
          'w-full bg-canvas text-ink placeholder:text-ink/40 rounded-md border border-hairline-soft outline-none focus:ring-2 focus:ring-ink focus:ring-offset-0 focus:border-ink',
          leftIcon ? 'pl-9 pr-3.5 py-3 text-[16px]' : 'px-3.5 py-3 text-[16px]'
        )}
      />
    </div>
  );
});
