import { startTransition, useEffect, useEffectEvent } from 'react';
import type { RuntimeEventUnsubscribe } from '../runtime';
import { subscribeTrayNavigation, type TrayNavigatePayload } from '../tauriBridge';

const ALLOWED_TRAY_ROUTES = new Set<string>(['/notes', '/account']);

declare global {
  interface Window {
    __NOTES_PENDING_TRAY_ROUTE__?: string;
  }
}

export function DesktopTrayRouteBridge() {
  const applyRoute = useEffectEvent((nextRoute: string) => {
    const route = nextRoute.trim();
    if (!ALLOWED_TRAY_ROUTES.has(route)) {
      return;
    }

    window.__NOTES_PENDING_TRAY_ROUTE__ = undefined;
    if (window.location.pathname === route) {
      return;
    }

    startTransition(() => {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  });

  useEffect(() => {
    const pendingRoute = window.__NOTES_PENDING_TRAY_ROUTE__;
    if (pendingRoute) {
      applyRoute(pendingRoute);
    }
  }, [applyRoute]);

  useEffect(() => {
    const handleWindowEvent = (event: Event) => {
      const route = (event as CustomEvent<TrayNavigatePayload>).detail?.route;
      if (typeof route === 'string') {
        applyRoute(route);
      }
    };

    window.addEventListener('notes:tray-navigate', handleWindowEvent as EventListener);

    let disposed = false;
    let unlisten: RuntimeEventUnsubscribe = () => {};

    void subscribeTrayNavigation((payload) => {
      applyRoute(payload.route);
    }).then((nextUnlisten) => {
      if (disposed) {
        void nextUnlisten();
        return;
      }

      unlisten = nextUnlisten;
    });

    return () => {
      disposed = true;
      window.removeEventListener('notes:tray-navigate', handleWindowEvent as EventListener);
      void unlisten();
    };
  }, [applyRoute]);

  return null;
}
