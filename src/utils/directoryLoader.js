import { getScriptUrl } from '../config/sheets';

// Fetch directory records with a short client-side timeout and no-cache to reduce stale results
export async function fetchDirectoryRecords() {
  const url = getScriptUrl();
  if (!url) throw new Error('No Apps Script URL configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch(`${url}?action=getDirectory&nocache=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response || !response.ok) throw new Error(`Unable to fetch directory records (${response ? response.status : 'no response'})`);

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : [];
  } catch (e) {
    throw new Error('Invalid directory response from Apps Script');
  }
}
