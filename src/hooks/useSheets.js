import { useState, useEffect, useCallback } from 'react';
import { getScriptUrl, setScriptUrl } from '../config/sheets';

const ENTRIES_KEY = 'vsg-entries-v5';
const CONFIG_KEY = 'vsg-config-v1';
const SESSION_KEY = 'vsg-google-session-v1';

function getIdToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return '';
    const s = JSON.parse(raw);
    return s?.sessionToken || s?.idToken || '';
  } catch {
    return '';
  }
}

function api(params) {
  const url = getScriptUrl();
  if (!url) return Promise.reject(new Error('No script URL configured'));
  const qs = new URLSearchParams(params).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  return fetch(`${url}?${qs}`, { signal: controller.signal })
    .then(async (r) => {
      const text = await r.text();
      if (!r.ok) throw new Error(`Server error (${r.status}). Check Apps Script Web App URL/deployment.`);
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
      if (String(err?.message || '').includes('Failed to fetch')) {
        throw new Error('Failed to reach Apps Script (network/CORS). Check SCRIPT_URL and Web App deployment access.');
      }
      throw err;
    })
    .finally(() => {
      clearTimeout(timeout);
    });
}

export function useSheets() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ENTRIES_KEY)) || []; }
    catch { return []; }
  });
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}; }
    catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptUrl, setScriptUrlState] = useState(getScriptUrl);

  const syncEntries = useCallback(async () => {
    if (!getScriptUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api({ action: 'getAll' });
      const list = Array.isArray(data) ? data : (data.data || []);
      setEntries(list);
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(list));
      return list;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const syncConfig = useCallback(async () => {
    if (!getScriptUrl()) return;
    try {
      const data = await api({ action: 'getConfig' });
      setConfig(data);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
    } catch { /* keep cached */ }
  }, []);

  const syncAll = useCallback(async () => {
    await Promise.all([syncEntries(), syncConfig()]);
  }, [syncEntries, syncConfig]);

  useEffect(() => {
    if (scriptUrl) syncAll();
  }, [scriptUrl, syncAll]);

  // Warm up GAS 30 seconds after initial load so it's ready when user saves
  useEffect(() => {
    if (!scriptUrl) return;
    const t = setTimeout(() => api({ action: 'ping' }).catch(() => {}), 30000);
    return () => clearTimeout(t);
  }, [scriptUrl]);

  const saveEntry = useCallback(async (entry) => {
    const data = await api({ action: 'save', data: JSON.stringify(entry), sessionToken: getIdToken() });
    if (data?.error) throw new Error(data.error);
    const canonical = data?.viharNo ? { ...entry, viharNo: data.viharNo } : entry;
    // Update local cache directly — avoids a second getAll round-trip after every save
    setEntries(prev => {
      const exists = prev.some(e => e.id === canonical.id);
      const next = exists
        ? prev.map(e => e.id === canonical.id ? canonical : e)
        : [...prev, canonical];
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
      return next;
    });
    return data;
  }, []);

  const deleteEntry = useCallback(async (id) => {
    await api({ action: 'delete', id, sessionToken: getIdToken() });
    await syncEntries();
  }, [syncEntries]);

  const saveScriptUrl = useCallback((url) => {
    setScriptUrl(url);
    setScriptUrlState(url);
  }, []);

  const nextViharNo = entries.length
    ? Math.max(...entries.map(e => Number(e.viharNo) || 0)) + 1
    : 1;

  return {
    entries,
    config,
    loading,
    error,
    syncAll,
    syncEntries,
    syncConfig,
    saveEntry,
    deleteEntry,
    nextViharNo,
    scriptUrl,
    saveScriptUrl,
  };
}
