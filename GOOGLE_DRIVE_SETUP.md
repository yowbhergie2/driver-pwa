# Google Drive API Setup Guide

Gabay para sa pag-setup ng Google Drive API para sa automatic PDF upload ng Driver Trip Tickets.

## Prerequisites

- Google Account na may access sa Google Cloud Console
- DPWH Google Drive folder ID: `1sQbu0kRzgnSqG7areh5WQnVlo_C2YTBM`

## Step 1: Gumawa ng Google Cloud Project

1. Pumunta sa [Google Cloud Console](https://console.cloud.google.com/)
2. I-click ang **"Select a Project"** dropdown sa taas
3. I-click ang **"New Project"**
4. I-enter ang project name: `DPWH-Vehicle-Management`
5. I-click ang **"Create"**

## Step 2: I-enable ang Google Drive API

1. Sa Google Cloud Console, pumunta sa **"APIs & Services"** > **"Library"**
2. Maghanap ng **"Google Drive API"**
3. I-click ang Google Drive API result
4. I-click ang **"Enable"** button
5. Hintayin na matapos ang pag-enable (mga 1-2 minutes)

## Step 3: Gumawa ng OAuth 2.0 Credentials

### A. I-configure ang OAuth Consent Screen

1. Pumunta sa **"APIs & Services"** > **"OAuth consent screen"**
2. Piliin ang **"External"** user type
3. I-click ang **"Create"**
4. Punan ang required fields:
   - **App name**: `DPWH Vehicle Management System`
   - **User support email**: [your-dpwh-email@dpwh.gov.ph]
   - **Developer contact email**: [your-dpwh-email@dpwh.gov.ph]
5. I-click ang **"Save and Continue"**
6. Sa **"Scopes"**, i-click ang **"Add or Remove Scopes"**
7. Maghanap ng at i-check ang:
   - `../auth/drive.file` (View and manage Google Drive files and folders that you have opened or created with this app)
8. I-click ang **"Update"** > **"Save and Continue"**
9. Sa **"Test users"**, **IMPORTANTE**: I-add ang email ng mga driver na gagamit
   - Click **"+ ADD USERS"**
   - Enter your email (e.g., `yowbhergie2@gmail.com`)
   - Click **"ADD"**
   - **NOTE**: Kung hindi mo i-add ang email mo dito, makakakuha ka ng "Error 403: access_denied"
10. I-click ang **"Save and Continue"**

### B. Gumawa ng OAuth 2.0 Client ID

1. Pumunta sa **"APIs & Services"** > **"Credentials"**
2. I-click ang **"+ Create Credentials"** > **"OAuth client ID"**
3. Piliin ang application type: **"Web application"**
4. I-enter ang name: `DPWH Driver App`
5. Sa **"Authorized JavaScript origins"**, i-add ang:
   - `https://fuel-vehicle-management.web.app` (production)
   - `http://localhost:5000` (local testing)
   - `http://127.0.0.1:5000` (local testing)
6. Sa **"Authorized redirect URIs"**, i-add ang:
   - `https://fuel-vehicle-management.web.app`
   - `http://localhost:5000`
7. I-click ang **"Create"**
8. **IMPORTANTE**: I-copy ang **Client ID** - kakailanganin ito sa Step 4

## Step 4: Gumawa ng API Key

1. Sa **"APIs & Services"** > **"Credentials"**
2. I-click ang **"+ Create Credentials"** > **"API key"**
3. **IMPORTANTE**: I-copy ang **API Key**
4. I-click ang **"Restrict Key"** para mas secure:
   - Sa **"Application restrictions"**, piliin ang **"HTTP referrers"**
   - I-add ang:
     - `fuel-vehicle-management.web.app/*`
     - `localhost:5000/*`
   - Sa **"API restrictions"**, piliin ang **"Restrict key"**
   - I-select lang ang **"Google Drive API"**
5. I-click ang **"Save"**

## Step 5: I-update ang Code

I-edit ang file: [`google-drive-utils.js`](google-drive-utils.js)

```javascript
// Replace these values with your actual credentials
const GOOGLE_DRIVE_CONFIG = {
  folderId: '1sQbu0kRzgnSqG7areh5WQnVlo_C2YTBM', // Already correct
  apiKey: 'YOUR_API_KEY_HERE', // Paste your API Key from Step 4
  clientId: 'YOUR_CLIENT_ID_HERE', // Paste your Client ID from Step 3
  scopes: 'https://www.googleapis.com/auth/drive.file'
};
```

### Example (with fake credentials):

```javascript
const GOOGLE_DRIVE_CONFIG = {
  folderId: '1sQbu0kRzgnSqG7areh5WQnVlo_C2YTBM',
  apiKey: 'AIzaSyD1234567890abcdefghijklmnopqrstuv',
  clientId: '123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com',
  scopes: 'https://www.googleapis.com/auth/drive.file'
};
```

## Step 6: I-configure ang Drive Folder Permissions

1. Pumunta sa Google Drive
2. Hanapin ang folder ID: `1sQbu0kRzgnSqG7areh5WQnVlo_C2YTBM`
   - O pumunta directly sa: https://drive.google.com/drive/folders/1sQbu0kRzgnSqG7areh5WQnVlo_C2YTBM
3. Right-click sa folder > **"Share"**
4. I-add ang service account email (kung mayroon) o i-set as:
   - **"Anyone with the link"** can **"View"** (recommended)
   - O **"Anyone at [your-org].com"** can **"Edit"** (kung may G Suite)
5. I-click ang **"Done"**

## Step 7: Testing

### Local Testing (Before Deployment)

1. I-run ang firebase emulator:
   ```bash
   firebase serve
   ```

2. I-open ang browser: `http://localhost:5000`

3. I-test ang workflow:
   - Login as driver
   - Create new trip ticket
   - Dapat makita ang "Uploading to Google Drive..." message
   - Kung successful, makikita ang **"View PDF on Drive"** button sa My Trips

### Production Testing

1. I-deploy ang app:
   ```bash
   firebase deploy
   ```

2. I-open ang production URL: `https://fuel-vehicle-management.web.app`

3. Ulitin ang testing workflow

## Common Issues & Solutions

### Issue 1: "Authorization failed" error

**Solution**:
- I-check kung tama ang Client ID at API Key sa `google-drive-utils.js`
- I-verify kung na-enable na ang Google Drive API
- I-check kung naka-add ang correct authorized origins

### Issue 2: "Error 403: access_denied" or "Access blocked: DPWH Vehicle Management System has not completed the Google verification process"

**ROOT CAUSE**: Ang email mo ay HINDI naka-add sa Test Users list!

**Solution** (Pick ONE):

**Option A: Add Test User** (For testing/development)
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll to **"Test users"** section
3. Click **"+ ADD USERS"**
4. Enter your email (e.g., `yowbhergie2@gmail.com`)
5. Click **"SAVE"**
6. Refresh your app and try again

**Option B: Publish App** (For production with many users)
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Click **"PUBLISH APP"** button (top of page)
3. Click **"CONFIRM"**
4. Now anyone can use it (with "unverified app" warning)
5. Users click "Advanced" → "Go to DPWH..." to bypass warning

### Issue 3: "Insufficient permissions" error

**Solution**:
- I-check kung tama ang scope: `https://www.googleapis.com/auth/drive.file`
- I-logout at i-login ulit para ma-refresh ang permissions
- I-revoke access sa https://myaccount.google.com/permissions at i-authorize ulit

### Issue 4: "Folder not found" error

**Solution**:
- I-verify kung tama ang folder ID: `1sQbu0kRzgnSqG7areh5WQnVlo_C2YTBM`
- I-check kung may access ka sa folder
- I-make sure na naka-share ang folder (see Step 6)

### Issue 5: PDF uploads to Drive but file is not viewable

**Solution**:
- I-check ang `makePublic()` function sa `google-drive-utils.js`
- I-verify kung may permission ang app na mag-share ng files
- Manually i-change ang sharing settings ng uploaded file

## Security Best Practices

1. **NEVER commit API keys or Client IDs to public repositories**
   - I-add sa `.gitignore`:
     ```
     google-drive-utils.js
     ```
   - O gumamit ng environment variables

2. **Restrict API Key permissions**
   - HTTP referrer restrictions
   - API-specific restrictions (Drive API only)

3. **Regular monitoring**
   - I-check ang quota usage sa Google Cloud Console
   - I-monitor ang uploaded files sa Drive folder

4. **Rotate credentials regularly**
   - Every 6 months or kung may security incident

## File Upload Workflow

### Ano ang nangyayari pagka-create ng DTT:

1. Driver fills out trip ticket form
2. I-click ang "Submit Trip Ticket"
3. System saves DTT data sa Firestore
4. System generates PDF using jsPDF
5. **System automatically uploads PDF to Google Drive folder** ⬅️ NEW!
6. Drive returns shareable link
7. Link is saved sa Firestore under DTT document
8. Success modal shows with:
   - Download PDF button
   - View PDF button
   - **View on Drive button** ⬅️ NEW!

### Ano ang makikita sa My Trips:

- **Green "View PDF on Drive" button** - opens Google Drive viewer
- **Red "Download PDF" button** - generates fresh PDF from data

## Support

Para sa technical issues:
- Check Firebase logs: `firebase functions:log`
- Check browser console for errors
- Verify Google Cloud Console API usage quotas

---

**Last Updated**: 2025-11-14
**Maintained by**: DPWH ICT Team
