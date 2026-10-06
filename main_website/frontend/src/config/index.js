/**
 * Application Runtime Environment Configuration
 * Centralizes all Vite environment variables with validation and path normalization.
 */

const rawApiBase = import.meta.env.VITE_API_BASE_URL;

// Validation: In production, missing API base URL is a fatal configuration error
if (!rawApiBase && import.meta.env.PROD) {
  throw new Error('[AlignGrade Config Error] VITE_API_BASE_URL is required in production mode but is not defined.');
}

if (!rawApiBase && import.meta.env.DEV) {
  console.warn('[AlignGrade Config Warning] VITE_API_BASE_URL is not defined in development. Using local default: http://localhost:5001/api');
}

// Normalize API base by stripping trailing slashes
export const API_BASE = (rawApiBase || (import.meta.env.DEV ? 'http://localhost:5001/api' : '')).replace(/\/+$/, '');

// Domain & Portal Configurations (Optional in single-domain or dev mode; used for multi-subdomain deployments)
const rawLandingUrl = import.meta.env.VITE_LANDING_URL || '';
const rawCandidateUrl = import.meta.env.VITE_CANDIDATE_URL || '';
const rawRecruiterUrl = import.meta.env.VITE_RECRUITER_URL || '';

export const LANDING_URL = rawLandingUrl.replace(/\/+$/, '');
export const CANDIDATE_URL = rawCandidateUrl.replace(/\/+$/, '');
export const RECRUITER_URL = rawRecruiterUrl.replace(/\/+$/, '');

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

