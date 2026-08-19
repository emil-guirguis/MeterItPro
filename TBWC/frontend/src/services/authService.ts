/**
 * TBWC auth service.
 *
 * Login is a standard HTTPS fetch to the Supabase Auth REST API (via the shared
 * framework client) — the same path every framework app uses. The returned
 * Supabase access token is then sent as a Bearer token to the TBWC data API,
 * which verifies it against the same Supabase project.
 *
 * Exposes the surface the store middleware + auth context depend on
 * (login, logout, refresh, loadCurrentUser, setLogoutFlag, clearStoredToken).
 */
import { createSupabaseAuth } from '@meterit/framework-frontend/auth/supabaseAuth';
import { tokenStorage } from '../utils/tokenStorage';
import { API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/api';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';

const LOGOUT_FLAG_KEY = 'explicit_logout';
const supabaseAuth = createSupabaseAuth({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });

/** GET the authenticated user's tbwc profile from the data API. */
async function fetchProfile(accessToken: string): Promise<User> {
  // Bound the request: if the API is down/wedged, fail fast so the app bootstrap
  // falls back to the login page instead of spinning forever on `isLoading`.
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new Error(`Data API did not respond (${API_BASE_URL}). Is the TBWC worker running on 8788?`);
    }
    throw new Error(`Cannot reach data API (${API_BASE_URL}).`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to load profile (${res.status})`);
  }
  const data = await res.json();
  return data.data as User;
}

function withName(user: User): User {
  return {
    ...user,
    name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || '',
  };
}

class AuthService {
  /** Validate credentials against Supabase Auth, then load + gate the profile. */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password, rememberMe = false } = credentials;
    const res = await supabaseAuth.signInWithPassword(email, password);
    if (res.error || !res.data) {
      throw new Error(res.error || 'Invalid login credentials');
    }
    const session = res.data;

    // Store tokens before the profile call (it needs the bearer token).
    tokenStorage.storeTokens(session.access_token, session.refresh_token, session.expires_in, rememberMe);
    this.clearLogoutFlag();

    let profile: User;
    try {
      profile = await fetchProfile(session.access_token);
    } catch (e) {
      tokenStorage.clearTokens();
      throw e;
    }

    // Approval gate — mirrors the live tbwc-site sign-in.
    if (!profile.approved) {
      tokenStorage.clearTokens();
      throw new Error('Your registration is still pending approval.');
    }

    return {
      token: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      user: withName(profile),
    };
  }

  /** Load the current user if a valid token exists (app bootstrap). */
  async loadCurrentUser(): Promise<User | null> {
    const token = tokenStorage.getToken();
    if (!token) return null;
    try {
      return withName(await fetchProfile(token));
    } catch {
      return null;
    }
  }

  /** Refresh the Supabase session; returns the new access token or null. */
  async refresh(): Promise<string | null> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return null;
    const res = await supabaseAuth.refreshSession(refreshToken);
    if (res.error || !res.data) return null;
    const s = res.data;
    tokenStorage.storeTokens(s.access_token, s.refresh_token, s.expires_in, false);
    return s.access_token;
  }

  async logout(): Promise<void> {
    const token = tokenStorage.getToken();
    if (token) await supabaseAuth.signOut(token);
    this.setLogoutFlag();
    tokenStorage.clearTokens();
  }

  // --- helpers used by the store api middleware ---
  getToken(): string | null {
    return tokenStorage.getToken();
  }
  clearStoredToken(): void {
    tokenStorage.clearTokens();
  }
  setLogoutFlag(): void {
    try { localStorage.setItem(LOGOUT_FLAG_KEY, 'true'); } catch { /* ignore */ }
  }
  clearLogoutFlag(): void {
    try { localStorage.removeItem(LOGOUT_FLAG_KEY); } catch { /* ignore */ }
  }
}

export const authService = new AuthService();
export default authService;
