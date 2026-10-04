/**
 * Central API configuration.
 * Local dev default: http://127.0.0.1:8000 (explicit IPv4 to prevent IPv6 ERR_CONNECTION_REFUSED on Windows)
 * Production / Cloud Run: Uses window.location.origin (same-origin) or explicit VITE_API_URL
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000'
        : window.location.origin)
    : '');
