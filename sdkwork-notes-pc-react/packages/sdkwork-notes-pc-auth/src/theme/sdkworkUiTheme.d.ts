declare module '@sdkwork/ui-pc-react/theme' {
  import type { PropsWithChildren, ReactElement } from 'react';

  export type SdkworkThemeSelection = 'dark' | 'light' | 'system';

  export interface SdkworkThemeProviderProps extends PropsWithChildren {
    className?: string;
    defaultTheme?: SdkworkThemeSelection;
    dir?: 'ltr' | 'rtl';
    locale?: string;
    onThemeSelectionChange?: (theme: SdkworkThemeSelection) => void;
    overrides?: Record<string, string>;
    themeColor?: string;
    themeSelection?: SdkworkThemeSelection;
  }

  export function SdkworkThemeProvider(props: SdkworkThemeProviderProps): ReactElement;
}
