/**
 * Debug Console Utilities (TBWC portal)
 *
 * Registers helpers on `window` for quick inspection from the browser console.
 * Only active in dev (or when `?debug` / localStorage `tbwc_debug=1` is set).
 *
 *   window.tbwc.auth()    - token data, decoded JWT, expiry countdown
 *   window.tbwc.token()   - raw + decoded access token
 *   window.tbwc.config()  - API base + Supabase config (anon key masked)
 *   window.tbwc.storage() - dump all auth-related storage keys
 *   window.tbwc.clear()   - clear tokens (force logout)
 *   window.tbwc.all()     - everything above
 */

import { API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/api';
import { tokenStorage } from './tokenStorage';

const AUTH_KEYS = [
  'auth_token',
  'refresh_token',
  'token_data',
  'token_expires_at',
  'explicit_logout',
];

function mask(v?: string | null): string {
  if (!v) return '(missing)';
  if (v.length <= 8) return '****';
  return `${v.slice(0, 4)}…${v.slice(-4)} (len ${v.length})`;
}

function fmtMs(ms: number): string {
  if (ms <= 0) return 'expired';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function debugAuth() {
  console.group('=== TBWC AUTH ===');
  const data = tokenStorage.getTokenData();
  console.log('token data:', data);
  console.log('valid:', tokenStorage.isTokenValid());
  console.log('expiring soon:', tokenStorage.isTokenExpiringSoon());
  console.log('time until expiry:', fmtMs(tokenStorage.getTimeUntilExpiry()));
  console.log('remember me:', tokenStorage.isRememberMeEnabled());
  console.log('logout flag:', tokenStorage.hasLogoutFlag());
  console.log('decoded JWT:', tokenStorage.decodeTokenPayload());
  console.groupEnd();
}

function debugToken() {
  console.group('=== TBWC TOKEN ===');
  console.log('access token:', mask(tokenStorage.getToken()));
  console.log('refresh token:', mask(tokenStorage.getRefreshToken()));
  console.log('decoded payload:', tokenStorage.decodeTokenPayload());
  console.groupEnd();
}

function debugConfig() {
  console.group('=== TBWC CONFIG ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('SUPABASE_URL:', SUPABASE_URL || '(missing)');
  console.log('SUPABASE_ANON_KEY:', mask(SUPABASE_ANON_KEY));
  console.log('MODE:', import.meta.env.MODE);
  console.log('DEV:', import.meta.env.DEV);
  console.groupEnd();
}

function debugStorage() {
  console.group('=== TBWC STORAGE ===');
  for (const key of AUTH_KEYS) {
    console.log(`local.${key}:`, localStorage.getItem(key));
    console.log(`session.${key}:`, sessionStorage.getItem(key));
  }
  console.groupEnd();
}

function debugClear() {
  tokenStorage.clearTokens();
  tokenStorage.setLogoutFlag();
  window.dispatchEvent(new Event('auth:force-logout'));
  console.log('✅ tokens cleared + force-logout dispatched');
}

function debugAll() {
  debugConfig();
  debugAuth();
  debugToken();
  debugStorage();
}

/** True in dev, or when opted in via ?debug or localStorage tbwc_debug=1. */
export function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    if (new URLSearchParams(window.location.search).has('debug')) {
      localStorage.setItem('tbwc_debug', '1');
    }
    return localStorage.getItem('tbwc_debug') === '1';
  } catch {
    return false;
  }
}

export function setupDebugConsole() {
  if (!isDebugEnabled()) return;

  (window as any).tbwc = {
    auth: debugAuth,
    token: debugToken,
    config: debugConfig,
    storage: debugStorage,
    clear: debugClear,
    all: debugAll,
  };

  console.log(
    '%c✅ TBWC debug ready',
    'color:#2e7d32;font-weight:bold',
    '— window.tbwc.{auth,token,config,storage,clear,all}()'
  );
}
