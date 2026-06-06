import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getScriptUrl, GOOGLE_CLIENT_ID_FALLBACK, PERMISSIONS, ROLES } from '../config/sheets';
import GoogleWriteModal from '../components/GoogleWriteModal';

const AuthContext = createContext(null);

const SESSION_KEY = 'vsg-google-session-v1';

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function decodeJwtPayload(idToken) {
  try {
    const [, payload] = String(idToken).split('.');
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenValid(session) {
  if (!session) return false;
  if (session.sessionToken) {
    if (!session.expires) return true;
    const expiresAtMs = Number(new Date(session.expires).getTime());
    return Number.isFinite(expiresAtMs) && Date.now() < expiresAtMs;
  }
  if (!session?.idToken) return false;
  const payload = decodeJwtPayload(session.idToken);
  if (!payload?.exp) return false;
  const expiresAtMs = Number(payload.exp) * 1000;
  return Date.now() < (expiresAtMs - 60_000);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const existing = readSession();
    if (existing && isTokenValid(existing)) return existing;
    return { role: ROLES.USER, fullName: 'Guest', email: '', idToken: '', sessionToken: '', expires: '' };
  });
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleModalError, setGoogleModalError] = useState('');
  const pendingAuthRef = useRef(null);
  const gisInitializedRef = useRef(false);

  const canWrite = useMemo(
    () => isTokenValid(session) && PERMISSIONS.canAddEntry(session.role),
    [session],
  );

  const scriptApi = useCallback((params) => {
    const url = getScriptUrl();
    if (!url) return Promise.reject(new Error('No script URL configured'));
    const qs = new URLSearchParams(params).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    return fetch(`${url}?${qs}`, { signal: controller.signal })
      .then(async (r) => {
        const text = await r.text();
        if (!r.ok) {
          throw new Error(`Server error (${r.status}). Check Apps Script Web App URL/deployment.`);
        }
        try {
          return text ? JSON.parse(text) : null;
        } catch {
          throw new Error('Invalid server response. Check Apps Script Web App URL/deployment.');
        }
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        // CORS, network, or blocked third-party cookies often surface as "Failed to fetch".
        if (String(err?.message || '').includes('Failed to fetch')) {
          throw new Error('Failed to reach Apps Script (network/CORS). Check SCRIPT_URL and Web App deployment access.');
        }
        throw err;
      })
      .finally(() => {
        clearTimeout(timeout);
      });
  }, []);

  useEffect(() => {
    const stored = readSession();
    if (!stored) return;
    if (!isTokenValid(stored)) return;

    const token = stored.sessionToken || stored.idToken;
    if (!token) return;

    const action = stored.sessionToken ? 'sessionInfo' : 'googleLogin';
    const payload = stored.sessionToken ? { action, sessionToken: token } : { action, idToken: token };

    scriptApi(payload)
      .then((res) => {
        if (!res?.success) return;

        const next = {
          role: res.role || stored.role || ROLES.USER,
          fullName: res.fullName || stored.fullName || res.email || 'User',
          email: res.email || stored.email || '',
          idToken: stored.idToken || token,
          sessionToken: res.sessionToken || stored.sessionToken || '',
          expires: res.expires || stored.expires || '',
        };
        setSession(next);
        writeSession(next);
      })
      .catch(() => {
        // Keep the existing local session if the network check fails.
      });
  }, [scriptApi]);

  const handleGoogleCredential = useCallback(async (idToken) => {
    setGoogleModalError('');
    try {
      const res = await scriptApi({ action: 'googleLogin', idToken });
      if (!res?.success) throw new Error(res?.error || 'Google auth failed');
      const next = {
        role: res.role || ROLES.USER,
        fullName: res.fullName || res.email || 'User',
        email: res.email || '',
        idToken,
        sessionToken: res.sessionToken || '',
        expires: res.expires || '',
      };
      setSession(next);
      writeSession(next);

      const pending = pendingAuthRef.current;
      pendingAuthRef.current = null;
      setGoogleModalOpen(false);
      if (pending?.resolve) pending.resolve(next);
    } catch (err) {
      setGoogleModalError(err.message || 'Google auth failed');
    }
  }, [scriptApi]);

  const initGoogleIdentity_ = useCallback(() => {
    if (gisInitializedRef.current) return true;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;
    if (!clientId) return false;

    const googleId = typeof window !== 'undefined' ? window.google?.accounts?.id : null;
    if (!googleId) return false;

    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) handleGoogleCredential(response.credential);
      },
      // If the browser has an active Google session, this can often return an ID token without extra UI.
      auto_select: true,
      // Keep popup mode for explicit button sign-in fallback.
      ux_mode: 'popup',
    });

    gisInitializedRef.current = true;
    return true;
  }, [handleGoogleCredential]);

  const ensureWriteAccess = useCallback(() => {
    if (canWrite) {
      return Promise.resolve(session);
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;
    if (!clientId) return Promise.reject(new Error('Missing VITE_GOOGLE_CLIENT_ID'));

    setGoogleModalError('');

    return new Promise((resolve, reject) => {
      pendingAuthRef.current = { resolve, reject };

      const googleId = typeof window !== 'undefined' ? window.google?.accounts?.id : null;
      const inited = initGoogleIdentity_();

      // Try One Tap first. If it can't show or user dismisses, fall back to the modal button.
      if (googleId && inited && typeof googleId.prompt === 'function') {
        try {
          googleId.prompt((notification) => {
            if (
              notification?.isNotDisplayed?.() ||
              notification?.isSkippedMoment?.() ||
              notification?.isDismissedMoment?.()
            ) {
              setGoogleModalOpen(true);
            }
          });

          // If nothing happens quickly (covers browsers that neither display nor callback), show the modal.
          setTimeout(() => {
            if (pendingAuthRef.current) setGoogleModalOpen(true);
          }, 900);
        } catch {
          setGoogleModalOpen(true);
        }
      } else {
        setGoogleModalOpen(true);
      }
    });
  }, [canWrite, initGoogleIdentity_, session]);

  const cancelEnsureWriteAccess = useCallback(() => {
    const pending = pendingAuthRef.current;
    pendingAuthRef.current = null;
    setGoogleModalOpen(false);
    if (pending?.reject) pending.reject(new Error('Cancelled'));
  }, []);

  return (
    <AuthContext.Provider value={{ session, role: session.role, fullName: session.fullName, ensureWriteAccess }}>
      {children}
      <GoogleWriteModal
        open={googleModalOpen}
        clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK}
        error={googleModalError}
        onClose={cancelEnsureWriteAccess}
        onInit={initGoogleIdentity_}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
