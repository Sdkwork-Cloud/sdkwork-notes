import type { CSSProperties } from 'react';
import type { StartupAppearanceSnapshot } from './startupAppearance';

const ACCENT_BY_THEME = {
  default: '#3367f6',
  forest: '#248751',
  amber: '#dc9107',
  ink: '#6172c0',
} satisfies Record<StartupAppearanceSnapshot['themeColor'], string>;

function resolveCopy(language: StartupAppearanceSnapshot['language'], status: 'booting' | 'ready') {
  const isChinese = language === 'zh-CN';

  if (status === 'ready') {
    return {
      title: 'Notes Studio',
      badge: isChinese ? '\u684c\u9762\u5de5\u4f5c\u53f0\u5df2\u5c31\u7eea' : 'Desktop workspace ready',
      description: isChinese
        ? '\u6b63\u5728\u5207\u6362\u5230\u5b8c\u6574\u5de5\u4f5c\u533a\u3002'
        : 'Handing off to the full workspace.',
    };
  }

  return {
    title: 'Notes Studio',
    badge: isChinese
      ? '\u6b63\u5728\u51c6\u5907\u684c\u9762\u5de5\u4f5c\u53f0'
      : 'Preparing desktop workspace',
    description: isChinese
      ? '\u6b63\u5728\u7a33\u5b9a\u4e3b\u9898\u3001\u5e03\u5c40\u548c\u81ea\u5b9a\u4e49\u684c\u9762\u7a97\u53e3\u3002'
      : 'Stabilizing theme, layout, and the custom desktop window.',
  };
}

export interface DesktopStartupScreenProps {
  appearance: StartupAppearanceSnapshot;
  isVisible: boolean;
  status: 'booting' | 'ready';
}

export function DesktopStartupScreen({
  appearance,
  isVisible,
  status,
}: DesktopStartupScreenProps) {
  const isDark = appearance.resolvedColorScheme === 'dark';
  const accentColor = ACCENT_BY_THEME[appearance.themeColor];
  const copy = resolveCopy(appearance.language, status);

  const rootStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 60,
    opacity: isVisible ? 1 : 0,
    pointerEvents: isVisible ? 'auto' : 'none',
    transition: 'opacity 180ms ease-out',
    background: appearance.backgroundColor,
    color: appearance.foregroundColor,
  };

  const panelStyle: CSSProperties = {
    width: 'min(30rem, calc(100vw - 3rem))',
    borderRadius: '28px',
    border: `1px solid ${isDark ? 'rgba(113,132,174,0.2)' : 'rgba(134,148,178,0.2)'}`,
    background: isDark ? 'rgba(18,24,37,0.94)' : 'rgba(255,255,255,0.94)',
    boxShadow: isDark
      ? '0 24px 80px rgba(0, 0, 0, 0.34)'
      : '0 24px 80px rgba(27, 39, 67, 0.12)',
    backdropFilter: 'blur(18px)',
    padding: '1.75rem',
  };

  return (
    <div data-tauri-drag-region style={rootStyle}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? `radial-gradient(circle at top, rgba(138,168,255,0.18), transparent 40%), ${appearance.backgroundColor}`
            : `radial-gradient(circle at top, rgba(51,103,246,0.14), transparent 40%), ${appearance.backgroundColor}`,
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          height: '100%',
          minHeight: 0,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                height: '3.5rem',
                width: '3.5rem',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '18px',
                background: accentColor,
                color: '#ffffff',
                boxShadow: `0 18px 36px ${accentColor}33`,
                flexShrink: 0,
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                style={{ height: '1.5rem', width: '1.5rem' }}
              >
                <path
                  d="M7 4.5h7.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9.5a2 2 0 0 1-2-2V4.5Zm0 0V8h3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.15,
                }}
              >
                {copy.title}
              </div>
              <div
                style={{
                  marginTop: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  color: isDark ? '#c7d1e5' : '#41526b',
                  fontSize: '0.95rem',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    height: '0.5rem',
                    width: '0.5rem',
                    borderRadius: '999px',
                    background: accentColor,
                    boxShadow: `0 0 0 6px ${accentColor}1a`,
                  }}
                />
                <span>{copy.badge}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.4rem' }}>
            <div
              style={{
                height: '0.45rem',
                borderRadius: '999px',
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(18,32,51,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: status === 'ready' ? '100%' : '72%',
                  borderRadius: '999px',
                  background: accentColor,
                  transition: 'width 180ms ease-out',
                }}
              />
            </div>
          </div>

          <p
            style={{
              margin: '1rem 0 0',
              color: isDark ? '#93a0bc' : '#6d7c92',
              fontSize: '0.92rem',
              lineHeight: 1.65,
            }}
          >
            {copy.description}
          </p>
        </div>
      </div>
    </div>
  );
}
