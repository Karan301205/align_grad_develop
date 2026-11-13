/**
 * Application Runtime Environment Configuration
 * Centralizes all Vite environment variables with validation and path normalization.
 */

// The backend address comes ONLY from VITE_API_BASE_URL (no hardcoded or localhost fallback),
// so a wrong or missing value shows up immediately instead of being silently replaced.
const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();

// Normalize API base by stripping trailing slashes and ensuring '/api' path exists
let normalizedApiBase = rawApiBase.replace(/\/+$/, '');
if (normalizedApiBase && !normalizedApiBase.endsWith('/api')) {
  normalizedApiBase += '/api';
}

if (!normalizedApiBase) {
  console.error('[config] VITE_API_BASE_URL is not set — API calls will fail. Set it in main_website/frontend/.env (e.g. https://backend.example.com/api) and restart/rebuild.');
} else if (import.meta.env.DEV) {
  console.info(`[config] API_BASE = ${normalizedApiBase}`);
}

export const API_BASE = normalizedApiBase;

// Domain & Portal Configurations (Optional in single-domain or dev mode; used for multi-subdomain deployments)
const rawLandingUrl = import.meta.env.VITE_LANDING_URL || '';
const rawCandidateUrl = import.meta.env.VITE_CANDIDATE_URL || '';
const rawRecruiterUrl = import.meta.env.VITE_RECRUITER_URL || '';

export const LANDING_URL = rawLandingUrl.replace(/\/+$/, '');
export const CANDIDATE_URL = rawCandidateUrl.replace(/\/+$/, '');
export const RECRUITER_URL = rawRecruiterUrl.replace(/\/+$/, '');

// Landing Page Route Placeholders (configurable via environment variables)
export const COMMON_LANDING_PATH = import.meta.env.VITE_COMMON_LANDING_PATH || '/';
export const CANDIDATE_LANDING_PATH = import.meta.env.VITE_CANDIDATE_LANDING_PATH || '/for-candidates';
export const RECRUITER_LANDING_PATH = import.meta.env.VITE_RECRUITER_LANDING_PATH || '/for-recruiters';

// Safely extract hostname for host-checking logic
function extractHostname(urlStr) {
  if (!urlStr) return '';
  try {
    return new URL(urlStr).hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

export const LANDING_HOSTNAME = extractHostname(LANDING_URL);
export const CANDIDATE_HOSTNAME = extractHostname(CANDIDATE_URL);
export const RECRUITER_HOSTNAME = extractHostname(RECRUITER_URL);

// Google OAuth Client ID
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Supabase Configuration (Optional, for video showcase)
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

