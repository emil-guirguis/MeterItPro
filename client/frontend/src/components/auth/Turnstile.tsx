import { useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;
console.log('[Turnstile] SITE_KEY:', SITE_KEY || '(undefined — check VITE_TURNSTILE_SITE_KEY)');

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: object) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
    _turnstileLoading?: boolean;
    _turnstileCallbacks?: Array<() => void>;
    onTurnstileLoad?: () => void;
  }
}

const IS_DEV = import.meta.env.DEV;

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const render = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    if (widgetId.current) window.turnstile.remove(widgetId.current);
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onVerify,
      'expired-callback': () => { onExpire?.(); },
      'error-callback': (code: string) => { console.error('[Turnstile] error', code, 'sitekey:', SITE_KEY); onExpire?.(); },
    });
  }, [onVerify, onExpire]);

  useEffect(() => {
    if (IS_DEV) {
      onVerify('dev-bypass');
      return;
    }

    if (window.turnstile) {
      render();
      return;
    }

    if (!window._turnstileCallbacks) window._turnstileCallbacks = [];
    window._turnstileCallbacks.push(render);

    if (!window._turnstileLoading) {
      window._turnstileLoading = true;
      window.onTurnstileLoad = () => {
        window._turnstileCallbacks?.forEach(cb => cb());
        window._turnstileCallbacks = [];
      };
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      s.async = true;
      document.head.appendChild(s);
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [render, onVerify]);

  if (IS_DEV) return null;

  return <Box ref={containerRef} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />;
}
