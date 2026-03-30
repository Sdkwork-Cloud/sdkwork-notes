import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../utils/cn';

export function SurfaceCard({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        'panel-surface rounded-[28px] p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
