import { Minus, Square, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNotesTranslation } from '@sdkwork/notes-i18n';

type WindowUnsubscribe = () => void | Promise<void>;

interface NotesDesktopWindowApi {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  restoreWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;
  subscribeWindowMaximized: (
    listener: (isMaximized: boolean) => void,
  ) => Promise<WindowUnsubscribe> | WindowUnsubscribe;
}

export interface DesktopWindowControlsProps {
  variant?: 'header' | 'floating';
  className?: string;
}

function resolveDesktopWindowApi(): NotesDesktopWindowApi | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtimeWindow = window as Window & {
    __NOTES_DESKTOP_API__?: {
      window?: Partial<NotesDesktopWindowApi>;
    };
  };
  const windowApi = runtimeWindow.__NOTES_DESKTOP_API__?.window;

  if (
    typeof windowApi?.minimizeWindow !== 'function' ||
    typeof windowApi.maximizeWindow !== 'function' ||
    typeof windowApi.restoreWindow !== 'function' ||
    typeof windowApi.closeWindow !== 'function' ||
    typeof windowApi.isWindowMaximized !== 'function' ||
    typeof windowApi.subscribeWindowMaximized !== 'function'
  ) {
    return null;
  }

  return windowApi as NotesDesktopWindowApi;
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function resolveControlLabel(
  translatedLabel: string,
  translationKey: string,
  englishLabel: string,
  chineseLabel: string,
) {
  if (translatedLabel !== translationKey) {
    return translatedLabel;
  }

  if (
    typeof document !== 'undefined' &&
    document.documentElement.lang.toLowerCase().startsWith('zh')
  ) {
    return chineseLabel;
  }

  return englishLabel;
}

function WindowSizeGlyph({ isMaximized }: { isMaximized: boolean }) {
  if (!isMaximized) {
    return <Square className="h-3.5 w-3.5 stroke-[2.2]" />;
  }

  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 3.5h7.5V11" />
      <path d="M3.5 5H11v7.5H3.5z" />
    </svg>
  );
}

function getRootClassName(
  variant: NonNullable<DesktopWindowControlsProps['variant']>,
  className?: string,
) {
  return joinClasses(
    'flex items-stretch',
    variant === 'header'
      ? 'h-full'
      : 'overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-bg)] shadow-[var(--shadow-md)] backdrop-blur-xl',
    className,
  );
}

function getButtonClassName(params: {
  variant: NonNullable<DesktopWindowControlsProps['variant']>;
  intent?: 'default' | 'danger';
  withDivider?: boolean;
}) {
  const { variant, intent = 'default', withDivider = false } = params;

  return joinClasses(
    'flex items-center justify-center transition-colors',
    variant === 'header'
      ? 'h-full w-11 text-[var(--text-secondary)]'
      : 'h-10 w-10 text-[var(--text-secondary)]',
    intent === 'danger'
      ? 'hover:bg-rose-500 hover:text-white'
      : 'hover:bg-[var(--panel-muted)] hover:text-[var(--text-primary)]',
    withDivider && variant === 'floating'
      ? 'border-r border-[var(--line-soft)]'
      : '',
  );
}

function renderButton(options: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className: string;
}) {
  return (
    <button
      type="button"
      aria-label={options.label}
      title={options.label}
      data-tauri-drag-region="false"
      onClick={options.onClick}
      className={options.className}
    >
      {options.children}
    </button>
  );
}

export function DesktopWindowControls({
  variant = 'header',
  className,
}: DesktopWindowControlsProps) {
  const { t } = useNotesTranslation();
  const [windowApi] = useState(() => resolveDesktopWindowApi());
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!windowApi) {
      return;
    }

    let active = true;
    let cleanup: WindowUnsubscribe | null = null;

    void windowApi.isWindowMaximized().then((value) => {
      if (active) {
        setIsMaximized(value);
      }
    });

    void Promise.resolve(
      windowApi.subscribeWindowMaximized((value) => {
        if (active) {
          setIsMaximized(value);
        }
      }),
    ).then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      active = false;
      void cleanup?.();
    };
  }, [windowApi]);

  if (!windowApi) {
    return null;
  }

  const labels = {
    minimize: resolveControlLabel(
      t('shell.layout.windowControls.minimize'),
      'shell.layout.windowControls.minimize',
      'Minimize window',
      '\u6700\u5c0f\u5316\u7a97\u53e3',
    ),
    maximize: resolveControlLabel(
      t('shell.layout.windowControls.maximize'),
      'shell.layout.windowControls.maximize',
      'Maximize window',
      '\u6700\u5927\u5316\u7a97\u53e3',
    ),
    restore: resolveControlLabel(
      t('shell.layout.windowControls.restore'),
      'shell.layout.windowControls.restore',
      'Restore window',
      '\u8fd8\u539f\u7a97\u53e3',
    ),
    close: resolveControlLabel(
      t('shell.layout.windowControls.close'),
      'shell.layout.windowControls.close',
      'Hide to tray',
      '\u9690\u85cf\u5230\u6258\u76d8',
    ),
  };

  return (
    <div
      data-tauri-drag-region="false"
      className={getRootClassName(variant, className)}
    >
      {renderButton({
        label: labels.minimize,
        onClick: () => {
          void windowApi.minimizeWindow();
        },
        className: getButtonClassName({
          variant,
          withDivider: true,
        }),
        children: <Minus className="h-3.5 w-3.5 stroke-[2.4]" />,
      })}

      {renderButton({
        label: isMaximized ? labels.restore : labels.maximize,
        onClick: () => {
          void (isMaximized ? windowApi.restoreWindow() : windowApi.maximizeWindow());
        },
        className: getButtonClassName({
          variant,
          withDivider: true,
        }),
        children: <WindowSizeGlyph isMaximized={isMaximized} />,
      })}

      {renderButton({
        label: labels.close,
        onClick: () => {
          void windowApi.closeWindow();
        },
        className: getButtonClassName({
          variant,
          intent: 'danger',
        }),
        children: <X className="h-3.5 w-3.5 stroke-[2.2]" />,
      })}
    </div>
  );
}
