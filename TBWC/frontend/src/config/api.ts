/** Central config for the TBWC portal. */

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8788/api';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surfaced early so a missing .env is obvious rather than a confusing 401.
  console.error('[config] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}
