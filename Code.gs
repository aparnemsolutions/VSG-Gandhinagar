// VSG Vihar Seva — Google Apps Script Backend
// Sheet ID: 1tvZ2SVEUYX8dzGg1wZXeTvMZURjxwntOKrECiWqLcEA
//
// HOW TO DEPLOY:
// 1. Open Google Sheet → Extensions → Apps Script
// 2. Paste this entire file → Save (Ctrl+S)
// 3. Click Deploy → New deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Click Deploy → Copy the Web App URL

const SS = SpreadsheetApp.openById('1tvZ2SVEUYX8dzGg1wZXeTvMZURjxwntOKrECiWqLcEA');

// OAuth Client ID (same as VITE_GOOGLE_CLIENT_ID in the frontend).
// Recommended: set this as Script Property `GOOGLE_CLIENT_ID` instead of hardcoding.
// Keeping this here makes copy/paste deployment easier.
const GOOGLE_CLIENT_ID_FALLBACK = '59223363231-s3q8p0b9flkpuhd4r1qbedbh4c8gu3e2.apps.googleusercontent.com';

const SHEETS = {
  VIHAR:     'Vihar Seva',
  DIRECTORY: 'Directory',
  MASTER:    'Master Data',
  USERS:     'Users',
  CONTACTS:  'Important Contacts',
  CONFIG:    'App Config',
  SESSIONS:  'Sessions',
};

const ROLES = {
  ADMIN: 'admin',
  CAPTAIN: 'captain',
  USER: 'user',
};

const PERMISSIONS = {
  canWrite: (role) => role === ROLES.ADMIN || role === ROLES.CAPTAIN,
  canDelete: (role) => role === ROLES.ADMIN,
  canNewYear: (role) => role === ROLES.ADMIN,
};

const VIHAR_HEADERS = [
  'ID', 'Vihar No.', 'Date', 'Start Time', 'End Time',
  'Sadhviji Bhagvant', 'Sadhu Bhagvant', 'Maharaj Saheb Names',
  'KM', 'From', 'Via', 'To',
  'Vihar Sevak', 'Vihar Sevika',
  'Saved At', 'Deleted', 'Saved By',
];

// ── One-time authorization helper ────────────────────────────────────────────
// If you see: "You do not have permission to call UrlFetchApp.fetch",
// open Apps Script editor and run `authorize()` once (as the script owner),
// then redeploy the Web App (New version).
function authorize() {
  // Touch spreadsheet scope
  SpreadsheetApp.getActiveSpreadsheet();

  // Touch external request scope (required for Google tokeninfo validation)
  UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=invalid', {
    muteHttpExceptions: true,
  });

  return { ok: true };
}

// ── Entry point ─────────────────────────────────────────────────────────────

function doGet(e) {
  e = e || { parameter: {} };
  const action = e.parameter.action;
  let result;
  const tokenParam = e.parameter.sessionToken || e.parameter.idToken;

  try {
    if      (action === 'getAll')      result = getAll();
    else if (action === 'save')        result = saveEntry(e.parameter.data, tokenParam);
    else if (action === 'delete')      result = deleteEntry(e.parameter.id, tokenParam);
    else if (action === 'getConfig')   result = getConfig();
    else if (action === 'getDirectory') result = getDirectoryRecords();
    else if (action === 'login')        result = login(e.parameter.username, e.parameter.password);
    else if (action === 'googleLogin')  result = googleLogin(tokenParam);
    else if (action === 'sessionInfo')  result = sessionInfo(tokenParam);
    else if (action === 'newYear')      result = newYear(e.parameter.year, tokenParam);
    else if (action === 'ping')         result = { ok: true, at: new Date().toISOString() };
    else if (action === 'authorize')    result = authorize();
    else                               result = { error: 'Unknown action: ' + action };
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── getAll ───────────────────────────────────────────────────────────────────

function getAll() {
  const sheet = getOrCreateViharSheet();
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1)
    .filter(r => r[headers.indexOf('Deleted')] !== true && r[headers.indexOf('Deleted')] !== 'TRUE')
    .map(r => rowToEntry(headers, r));
}

// ── saveEntry ────────────────────────────────────────────────────────────────

function saveEntry(dataStr, idToken) {
  const actor = requireWriteAccess_(idToken);
  const entry = JSON.parse(dataStr || '{}');
  const lock = LockService.getScriptLock();

  // Prevent concurrent inserts generating the same Vihar No.
  lock.waitLock(30 * 1000);
  try {
    const sheet = getOrCreateViharSheet();
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];

    // Never trust client-supplied savedBy / savedAt
    entry.savedBy = actor.fullName || actor.email || '';
    entry.savedAt = new Date().toISOString();

    const idCol = headers.indexOf('ID');
    const viharNoCol = headers.indexOf('Vihar No.');
    if (idCol === -1) throw new Error('Vihar sheet missing "ID" column');

    // Update existing row by ID (keep original Vihar No.)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idCol] === entry.id) {
        if (viharNoCol !== -1) entry.viharNo = rows[i][viharNoCol];
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([entryToRow(headers, entry)]);
        return { success: true, action: 'updated', viharNo: entry.viharNo };
      }
    }

    // New row: assign next available Vihar No. on the server (first-come-first-serve).
    const next = getNextViharNo_(rows, viharNoCol);
    entry.viharNo = next;

    sheet.appendRow(entryToRow(headers, entry));
    return { success: true, action: 'inserted', viharNo: entry.viharNo };
  } finally {
    lock.releaseLock();
  }
}

function getNextViharNo_(rows, viharNoCol) {
  if (viharNoCol === -1) throw new Error('Vihar sheet missing "Vihar No." column');

  let maxNo = 0;
  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i][viharNoCol];
    const num = Number(raw);
    if (Number.isFinite(num) && num > maxNo) maxNo = num;
  }
  return maxNo + 1;
}

// ── deleteEntry ──────────────────────────────────────────────────────────────

function deleteEntry(id, idToken) {
  const actor = requireDeleteAccess_(idToken);
  const sheet = getOrCreateViharSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('ID');
  const delCol = headers.indexOf('Deleted');
  const byCol = headers.indexOf('Saved By');
  const atCol = headers.indexOf('Saved At');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === id) {
      sheet.getRange(i + 1, delCol + 1).setValue(true);
      if (byCol !== -1) sheet.getRange(i + 1, byCol + 1).setValue(actor.email || '');
      if (atCol !== -1) sheet.getRange(i + 1, atCol + 1).setValue(new Date().toISOString());
      return { success: true };
    }
  }
  return { error: 'Entry not found: ' + id };
}

// ── getConfig ────────────────────────────────────────────────────────────────

function getConfig() {
  const config = {
    places: [],
    sevakNames: [],
    sevikaNames: [],
    importantContacts: [],
    appConfig: {},
  };

  // Master Data
  const master = SS.getSheetByName(SHEETS.MASTER);
  if (master) {
    const data = master.getDataRange().getValues();
    data.slice(1).forEach(r => {
      if (r[0]) config.places.push(String(r[0]));
      if (r[1]) config.sevakNames.push(String(r[1]));
      if (r[2]) config.sevikaNames.push(String(r[2]));
    });
  }

  // Important Contacts
  const contacts = SS.getSheetByName(SHEETS.CONTACTS);
  if (contacts) {
    const data = contacts.getDataRange().getValues();
    data.slice(1).forEach(r => {
      if (r[1]) config.importantContacts.push({
        section: r[0] || 'Others',
        name: r[1],
        phone: r[2] ? String(r[2]) : '',
        note: r[3] || '',
      });
    });
  }

  // App Config
  const appCfg = SS.getSheetByName(SHEETS.CONFIG);
  if (appCfg) {
    const data = appCfg.getDataRange().getValues();
    data.slice(1).forEach(r => {
      if (r[0]) config.appConfig[r[0]] = r[1];
    });
  }

  return config;
}

// ── getDirectoryRecords -------------------------------------------------------

function getDirectoryRecords() {
  const sheet = SS.getSheetByName(SHEETS.DIRECTORY);
  if (!sheet) return [];

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headerRowIndex = rows.length >= 4 ? 3 : 0;
  const headers = rows[headerRowIndex].map((h) => String(h || '').trim());
  const allowedHeaders = new Set([
    'Email Id',
    'First Name',
    'Middle Name',
    'Last Name',
    'Gender',
    'Blood Group',
    'Contact Number',
    'Address',
    'Area',
    'City',
    'Work Type',
    'Company / Business Name',
    'Occupation / Profession',
    'Office Location / Business Area',
    'Team',
  ]);

  return rows.slice(headerRowIndex + 1)
    .filter((row) => row.some((cell, colIndex) => {
      const header = headers[colIndex];
      return header && allowedHeaders.has(header) && String(cell || '').trim();
    }))
    .map((row, index) => {
      const record = {};
      headers.forEach((header, colIndex) => {
        if (!header || !allowedHeaders.has(header)) return;
        const value = row[colIndex] == null ? '' : row[colIndex];
        if (String(value).trim() !== '') {
          record[header] = value;
        }
      });
      record._rowIndex = headerRowIndex + 2 + index;
      return record;
    });
}

// ── login (Phase 2) ──────────────────────────────────────────────────────────

function login(username, password) {
  const sheet = SS.getSheetByName(SHEETS.USERS);
  if (!sheet) return { error: 'Users sheet not found' };

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0]; // Username | Password | Role | Full Name | Active
  const uCol = headers.indexOf('Username');
  const pCol = headers.indexOf('Password');
  const rCol = headers.indexOf('Role');
  const nCol = headers.indexOf('Full Name');
  const aCol = headers.indexOf('Active');

  const hashed = hashSHA256(password);

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[uCol]).toLowerCase() === username.toLowerCase() &&
        r[pCol] === hashed &&
        r[aCol] !== false && r[aCol] !== 'FALSE') {
      return { success: true, username: r[uCol], role: r[rCol], fullName: r[nCol] };
    }
  }
  return { error: 'Invalid username or password' };
}

// ── newYear ──────────────────────────────────────────────────────────────────

function newYear(year, idToken) {
  requireNewYearAccess_(idToken);
  const sheet = getOrCreateViharSheet();
  const archiveName = SHEETS.VIHAR + ' ' + year;

  // Duplicate current sheet as archive
  sheet.copyTo(SS).setName(archiveName);

  // Clear existing data (keep headers)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  return { success: true, archived: archiveName };
}

// ── Google Auth (write gate) ──────────────────────────────────────────────────

function googleLogin(idToken) {
  // Validate Google token and create a long-lived session token
  const actor = getActorFromToken_(idToken);
  const { token: sessionToken, expires } = createSessionForEmail_(actor.email);
  return {
    success: true,
    email: actor.email,
    role: actor.role,
    fullName: actor.fullName || actor.email,
    sessionToken,
    expires,
  };
}

function sessionInfo(token) {
  if (!token) throw new Error('Missing sessionToken');
  const actor = getActorFromToken_(token);
  return {
    success: true,
    email: actor.email,
    role: actor.role,
    fullName: actor.fullName || actor.email,
  };
}

function requireWriteAccess_(idToken) {
  const actor = getActorFromToken_(idToken);
  if (!PERMISSIONS.canWrite(actor.role)) throw new Error('Not authorized');
  return actor;
}

function requireDeleteAccess_(idToken) {
  const actor = getActorFromToken_(idToken);
  if (!PERMISSIONS.canDelete(actor.role)) throw new Error('Not authorized');
  return actor;
}

function requireNewYearAccess_(idToken) {
  const actor = getActorFromToken_(idToken);
  if (!PERMISSIONS.canNewYear(actor.role)) throw new Error('Not authorized');
  return actor;
}

// Support either a Google id_token OR an internal session token.
function getActorFromToken_(token) {
  if (!token) throw new Error('Missing idToken or sessionToken');

  // Session tokens created by this app are prefixed with 'sess_'
  if (String(token).startsWith('sess_')) {
    const actor = getUserBySessionToken_(token);
    if (!actor) throw new Error('Invalid or expired session token');
    return actor;
  }

  // Otherwise treat as Google ID token
  return getActorFromGoogle_(token);
}

function createSessionForEmail_(email) {
  const sheetName = SHEETS.SESSIONS;
  let sheet = SS.getSheetByName(sheetName);
  if (!sheet) {
    sheet = SS.insertSheet(sheetName);
    sheet.appendRow(['Token', 'Email', 'Expires', 'CreatedAt']);
  }

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0] || [];
  const tokenCol = headers.indexOf('Token');
  const emailCol = headers.indexOf('Email');
  const expiresCol = headers.indexOf('Expires');
  const now = new Date();

  // Reuse an existing valid session token for the same email to avoid creating
  // a new row every time the user authenticates during an active session.
  for (let i = 1; i < rows.length; i++) {
    const rowEmail = String(rows[i][emailCol] || '').trim().toLowerCase();
    const rowToken = String(rows[i][tokenCol] || '').trim();
    const rowExpires = rows[i][expiresCol];
    if (rowEmail === String(email).trim().toLowerCase() && rowToken && rowExpires) {
      const expiryDate = new Date(rowExpires);
      if (!isNaN(expiryDate) && expiryDate > now) {
        return { token: rowToken, expires: rowExpires };
      }
    }
  }

  const token = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 10 years
  const created = new Date().toISOString();
  sheet.appendRow([token, String(email), expires, created]);
  return { token, expires };
}

function getUserBySessionToken_(token) {
  const sheet = SS.getSheetByName(SHEETS.SESSIONS);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return null;
  const headers = rows[0];
  const tCol = headers.indexOf('Token');
  const eCol = headers.indexOf('Email');
  const xCol = headers.indexOf('Expires');
  if (tCol === -1 || eCol === -1 || xCol === -1) return null;

  const now = new Date();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][tCol] === token) {
      const exp = rows[i][xCol];
      if (exp && new Date(exp) > now) {
        const email = String(rows[i][eCol] || '').trim();
        return getUserByEmail_(email);
      }
      return null;
    }
  }
  return null;
}

function getActorFromGoogle_(idToken) {
  if (!idToken) throw new Error('Missing idToken');

  const expectedClientId =
    PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') ||
    GOOGLE_CLIENT_ID_FALLBACK;
  if (!expectedClientId) throw new Error('Server not configured: GOOGLE_CLIENT_ID');

  // Validate token with Google
  const resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), {
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) throw new Error('Invalid Google token');

  const info = JSON.parse(resp.getContentText() || '{}');
  if (info.aud !== expectedClientId) throw new Error('Invalid token audience');
  if (!info.email) throw new Error('Google token missing email');
  if (String(info.email_verified).toLowerCase() !== 'true') throw new Error('Email not verified');

  const user = getUserByEmail_(info.email);
  if (!user) throw new Error('User not allowed');

  return user;
}

function getUserByEmail_(email) {
  const sheet = SS.getSheetByName(SHEETS.USERS);
  if (!sheet) throw new Error('Users sheet not found');

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0] || [];
  const eCol = headers.indexOf('Email');
  const rCol = headers.indexOf('Role');
  const nCol = headers.indexOf('Full Name');
  const aCol = headers.indexOf('Active');

  if (eCol === -1) throw new Error('Users sheet must have an \"Email\" column');
  if (rCol === -1) throw new Error('Users sheet must have a \"Role\" column');
  if (aCol === -1) throw new Error('Users sheet must have an \"Active\" column');

  const target = String(email).toLowerCase().trim();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[eCol]).toLowerCase().trim() === target &&
        r[aCol] !== false && r[aCol] !== 'FALSE') {
      const rawRole = String(r[rCol] || ROLES.USER).trim();
      const normalizedRole = rawRole.toLowerCase();
      return {
        email: String(r[eCol]).trim(),
        role: normalizedRole === 'admin' || normalizedRole === 'captain' || normalizedRole === 'user'
          ? normalizedRole
          : ROLES.USER,
        fullName: nCol === -1 ? '' : String(r[nCol] || '').trim(),
      };
    }
  }
  return null;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getOrCreateViharSheet() {
  let sheet = SS.getSheetByName(SHEETS.VIHAR);
  if (!sheet) {
    sheet = SS.insertSheet(SHEETS.VIHAR);
    sheet.appendRow(VIHAR_HEADERS);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(VIHAR_HEADERS);
  } else {
    ensureViharHeaders(sheet);
  }
  return sheet;
}

function ensureViharHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  const existing = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  if (!existing || existing.length === 0) {
    sheet.getRange(1, 1, 1, VIHAR_HEADERS.length).setValues([VIHAR_HEADERS]);
    return;
  }

  const missing = VIHAR_HEADERS.filter(h => existing.indexOf(h) === -1);
  if (!missing.length) return;

  sheet.insertColumnsAfter(existing.length, missing.length);
  sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
}

function rowToEntry(headers, row) {
  const e = {};
  headers.forEach((h, i) => { e[h] = row[i]; });
  return {
    id:           e['ID'],
    viharNo:      e['Vihar No.'],
    // Frontend expects ISO yyyy-MM-dd; sheet stores dd-MM-yyyy (text) for readability.
    date:         parseDateFromSheet_(e['Date']),
    startTime:    normalizeTime12(formatTimeValue(e['Start Time'])),
    endTime:      normalizeTime12(formatTimeValue(e['End Time'])),
    sadhviji:     e['Sadhviji Bhagvant'],
    sadhu:        e['Sadhu Bhagvant'],
    maharajNames: parseList(e['Maharaj Saheb Names']),
    km:           e['KM'],
    from:         e['From'],
    via:          e['Via'],
    to:           e['To'],
    sevak:        parseList(e['Vihar Sevak']),
    sevika:       parseList(e['Vihar Sevika']),
    savedAt:      e['Saved At'],
    savedBy:      e['Saved By'],
  };
}

function entryToRow(headers, entry) {
  const map = {
    'ID':                  entry.id || '',
    'Vihar No.':           entry.viharNo || '',
    // Store as dd-MM-yyyy in the sheet (as text to avoid locale reformatting).
    'Date':                formatDateForSheet_(entry.date),
    // Leading apostrophe forces Sheets to keep this as text
    'Start Time':          entry.startTime ? ("'" + normalizeTime12(entry.startTime)) : '',
    'End Time':            entry.endTime ? ("'" + normalizeTime12(entry.endTime)) : '',
    'Sadhviji Bhagvant':   entry.sadhviji || 0,
    'Sadhu Bhagvant':      entry.sadhu || 0,
    'Maharaj Saheb Names': (entry.maharajNames || []).filter(Boolean).join(', '),
    'KM':                  entry.km || '',
    'From':                entry.from || '',
    'Via':                 entry.via || '',
    'To':                  entry.to || '',
    'Vihar Sevak':         (entry.sevak || []).filter(Boolean).join(', '),
    'Vihar Sevika':        (entry.sevika || []).filter(Boolean).join(', '),
    'Saved At':            entry.savedAt || new Date().toISOString(),
    'Deleted':             false,
    'Saved By':            entry.savedBy || '',
  };
  return headers.map(h => map[h] !== undefined ? map[h] : '');
}

function formatTimeValue(val) {
  if (!val && val !== 0) return '';
  if (typeof val === 'string' && val.startsWith("'")) return val.slice(1);
  if (val instanceof Date) return Utilities.formatDate(val, 'Asia/Kolkata', 'hh:mm a');
  return String(val);
}

function parseDateFromSheet_(val) {
  if (!val) return '';

  // Date cell
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Kolkata', 'yyyy-MM-dd');
  }

  // Text cell
  let s = String(val).trim();
  if (s.startsWith("'")) s = s.slice(1).trim();
  if (!s) return '';

  // dd-MM-yyyy
  const ddmmyyyy = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyy) {
    const dd = ('0' + Number(ddmmyyyy[1])).slice(-2);
    const mm = ('0' + Number(ddmmyyyy[2])).slice(-2);
    const yyyy = ddmmyyyy[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // yyyy-MM-dd
  const yyyymmdd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    const yyyy = yyyymmdd[1];
    const mm = ('0' + Number(yyyymmdd[2])).slice(-2);
    const dd = ('0' + Number(yyyymmdd[3])).slice(-2);
    return `${yyyy}-${mm}-${dd}`;
  }

  // Fallback: attempt Date parse, then format to ISO
  const d = new Date(s);
  if (!isNaN(d)) return Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd');
  return '';
}

function formatDateForSheet_(isoDate) {
  const iso = String(isoDate || '').trim();
  if (!iso) return '';

  const m = iso.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return iso;

  const yyyy = m[1];
  const mm = ('0' + Number(m[2])).slice(-2);
  const dd = ('0' + Number(m[3])).slice(-2);

  // Leading apostrophe forces Sheets to keep this as text (prevents locale auto-format).
  return `'${dd}-${mm}-${yyyy}`;
}

function normalizeTime12(val) {
  if (!val && val !== 0) return '';
  const s = String(val).trim();
  if (!s) return '';

  // Already 12h format (e.g. "04:45 AM")
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (m12) {
    const hh = ('0' + Number(m12[1])).slice(-2);
    const mm = ('0' + Number(m12[2])).slice(-2);
    const ap = m12[3].toUpperCase();
    return `${hh}:${mm} ${ap}`;
  }

  // 24h format (e.g. "16:05")
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    let h = Number(m24[1]);
    const mm = ('0' + Number(m24[2])).slice(-2);
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const hh = ('0' + h).slice(-2);
    return `${hh}:${mm} ${ap}`;
  }

  // Date object serialized or other values – keep as string
  return s;
}

function parseList(val) {
  if (!val) return [];
  const s = String(val).trim();
  if (!s) return [];
  // Handle legacy JSON arrays saved by old code
  if (s.startsWith('[')) {
    try { return JSON.parse(s).filter(Boolean); } catch {}
  }
  // Normal comma-separated
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

function hashSHA256(str) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}
