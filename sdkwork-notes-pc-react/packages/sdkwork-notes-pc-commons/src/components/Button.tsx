import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../utils/cn';

type Appearance = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: Appearance;
}

const appearanceClasses: Record<Appearance, string> = {
  primary:
    'bg-primary-600 text-white shadow-[0_12px_30px_rgba(51,103,246,0.26)] hover:bg-primary-700',
  secondary:
    'border border-[var(--line-strong)] bg-[var(--panel-bg)] text-[var(--text-primary)] hover:bg-[var(--panel-muted)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--panel-muted)]',
  danger: 'bg-rose-600 text-white shadow-[0_12px_30px_rgba(225,29,72,0.24)] hover:bg-rose-700',
};

export function Button({
  appearance = 'secondary',
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition',
        appearanceClasses[appearance],
        props.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
