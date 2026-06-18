import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

export interface ShellLayoutProps {
  mode?: 'default' | 'auth';
  children?: ReactNode;
}

export function ShellLayout({ mode = 'default', children }: ShellLayoutProps) {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,_rgba(51,103,246,0.14),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(93,139,255,0.18),_transparent_70%)]" />
        <div className="absolute inset-y-0 left-0 w-72 bg-[radial-gradient(circle_at_left,_rgba(18,47,116,0.08),_transparent_72%)] dark:bg-[radial-gradient(circle_at_left,_rgba(138,168,255,0.06),_transparent_72%)]" />
      </div>
      <AppHeader mode={mode} />
      {children}
    </div>
  );
}
