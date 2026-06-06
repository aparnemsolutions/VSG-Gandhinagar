export const SHEET_ID = '1tvZ2SVEUYX8dzGg1wZXeTvMZURjxwntOKrECiWqLcEA';

// ── PRODUCTION: paste your Apps Script Web App URL here ─────────────────────
// Once this is set, the ⚙️ Settings icon in the app is not needed.
// Leave empty string during local development and use Settings instead.
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4m-B1hCg2zKKh_D88Yk_b2BnJklMdcY7hRqlmLt-RqrwD6Czn4Yt0tbiye1SxSzrGUg/exec';
// e.g. export const SCRIPT_URL = 'https://script.google.com/macros/s/ABC.../exec';
// ─────────────────────────────────────────────────────────────────────────────

const SCRIPT_URL_KEY = 'vsg-script-url';

export const getScriptUrl = () => SCRIPT_URL || localStorage.getItem(SCRIPT_URL_KEY) || '';
export const setScriptUrl = (url) => localStorage.setItem(SCRIPT_URL_KEY, url);

export const GOOGLE_CLIENT_ID_FALLBACK = '59223363231-s3q8p0b9flkpuhd4r1qbedbh4c8gu3e2.apps.googleusercontent.com';

export const ROLES = {
  ADMIN: 'admin',
  CAPTAIN: 'captain',
  USER: 'user',
};

export const PERMISSIONS = {
  canAddEntry: (role) => role === ROLES.ADMIN || role === ROLES.CAPTAIN,
  canEditEntry: (role) => role === ROLES.ADMIN || role === ROLES.CAPTAIN,
  canDeleteEntry: (role) => role === ROLES.ADMIN,
};

// Phase 1: admin hardcoded — no login yet
export const HARDCODED_SESSION = {
  username: 'admin',
  fullName: 'Admin',
  role: ROLES.ADMIN,
};
