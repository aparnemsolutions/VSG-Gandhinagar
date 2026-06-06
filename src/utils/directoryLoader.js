import { getScriptUrl } from '../config/sheets';

export async function fetchDirectoryRecords() {
  const url = getScriptUrl();
  if (!url) throw new Error('No Apps Script URL configured');

  const response = await fetch(`${url}?action=getDirectory`);
  if (!response.ok) throw new Error(`Unable to fetch directory records (${response.status})`);

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : [];
  } catch {
    throw new Error('Invalid directory response from Apps Script');
  }
}
