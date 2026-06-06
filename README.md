# VSG Vihar Seva (Frontend)

## Setup

### 1) Frontend environment variables

Create a `.env.local`:

- `VITE_GOOGLE_CLIENT_ID` = your Google OAuth 2.0 Web Client ID.

Reference: `.env.example`.

### 2) Backend (Google Apps Script)

- Deploy `Code.gs` as a Web App.
- Copy the deployment URL (ends with `/exec`).

### 3) Configure the Apps Script URL in the app

Set `SCRIPT_URL` in `src/config/sheets.js` to your deployed Apps Script Web App URL (ends with `/exec`).

### 4) Users allowlist (Google Sheet)

Create a sheet/tab named `Users` with columns:

- `Email` (required)
- `Role` (required: `admin` | `captain` | `user`)
- `Active` (required: TRUE/FALSE)
- `Full Name` (optional)

Only `admin` and `captain` can add/edit entries.
