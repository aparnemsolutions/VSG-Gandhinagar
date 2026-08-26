import AsyncStorage from '@react-native-async-storage/async-storage';

export const SHEET_ID = '1tvZ2SVEUYX8dzGg1wZXeTvMZURjxwntOKrECiWqLcEA';

// ── PRODUCTION: paste your Apps Script Web App URL here ─────────────────────
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4m-B1hCg2zKKh_D88Yk_b2BnJklMdcY7hRqlmLt-RqrwD6Czn4Yt0tbiye1SxSzrGUg/exec';
// ─────────────────────────────────────────────────────────────────────────────

const SCRIPT_URL_KEY = 'vsg-script-url';

let cachedScriptUrl = '';

export const initScriptUrl = async () => {
  try {
    const val = await AsyncStorage.getItem(SCRIPT_URL_KEY);
    cachedScriptUrl = val || '';
  } catch {
    cachedScriptUrl = '';
  }
};

export const getScriptUrl = () => SCRIPT_URL || cachedScriptUrl || '';

export const setScriptUrl = async (url) => {
  cachedScriptUrl = url;
  try {
    await AsyncStorage.setItem(SCRIPT_URL_KEY, url);
  } catch (e) {
    console.error('Failed to save script URL to AsyncStorage', e);
  }
};

let cachedSessionToken = '';
export const getSessionToken = () => cachedSessionToken;
export const setSessionToken = (token) => {
  cachedSessionToken = token;
};

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
