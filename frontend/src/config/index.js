// Application configuration (environment-facing values).
// Kept separate from domain reference data so config and constants each have a
// single responsibility.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
