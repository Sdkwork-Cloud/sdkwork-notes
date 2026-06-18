import { useEffect, type PropsWithChildren, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';

export interface DialogProps extends PropsWithChildren {
  open: boolean;
  title: string;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
}

export function Dialog({
  open,
  title,
  description,
  footer,
  onClose,
  children,
}: DialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[var(--dialog-backdrop)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-[121] w-full max-w-lg rounded-[28px] border border-[var(--line-soft)] bg-[var(--panel-bg)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-[28px]',
        )}
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{title}</h2>
          {description ? (
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>

        {children ? (
          <div className="mt-5">{children}</div>
        ) : null}

        {footer ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
