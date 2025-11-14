/**
 * Google Drive API Utilities
 * For uploading DTT PDFs to Google Drive
 */

// Google Drive configuration
const GOOGLE_DRIVE_CONFIG = {
  folderId: '1sQbu0kRzgnSqG7areh5WQnVlo_C2YTBM',
  apiKey: 'AIzaSyAyZh7jRH77_-l-2xAeR4YRxM3rIstPO1E', // TODO: Replace with actual API key from Google Cloud Console
  clientId: '821758027736-eg74nrgr6haak6detp40eg212lmt8php.apps.googleusercontent.com', // TODO: Replace with actual Client ID
  // Scopes needed for file upload
  scopes: 'https://www.googleapis.com/auth/drive.file'
};

class GoogleDriveUploader {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
  }

  /**
   * Initialize Google API and GIS (Google Identity Services)
   */
  async init() {
    return new Promise((resolve, reject) => {
      // Load gapi
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        gapi.load('client', async () => {
          await gapi.client.init({
            apiKey: GOOGLE_DRIVE_CONFIG.apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          this.gapiInited = true;
          this.checkInitComplete(resolve);
        });
      };
      document.head.appendChild(gapiScript);

      // Load GIS
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_DRIVE_CONFIG.clientId,
          scope: GOOGLE_DRIVE_CONFIG.scopes,
          callback: '', // defined later
        });
        this.gisInited = true;
        this.checkInitComplete(resolve);
      };
      document.head.appendChild(gisScript);
    });
  }

  checkInitComplete(resolve) {
    if (this.gapiInited && this.gisInited) {
      resolve();
    }
  }

  /**
   * Request authorization from user
   */
  async authorize() {
    return new Promise((resolve, reject) => {
      this.tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
          console.error('Authorization error:', resp);
          reject(resp);
        } else {
          this.accessToken = gapi.client.getToken().access_token;
          console.log('Authorization successful, access token obtained');
          resolve(this.accessToken);
        }
      };

      if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent
        console.log('Requesting new access token with consent...');
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Skip display of account chooser and consent dialog
        console.log('Requesting access token (existing session)...');
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  }

  /**
   * Upload PDF blob to Google Drive
   * @param {Blob} pdfBlob - PDF file as blob
   * @param {string} fileName - Name for the PDF file
   * @param {object} metadata - Additional metadata (dttId, driverName, etc.)
   * @returns {Promise<string>} - Google Drive file ID and view link
   */
  async uploadPdf(pdfBlob, fileName, metadata = {}) {
    try {
      // Ensure we have access token
      if (!this.accessToken) {
        await this.authorize();
      }

      // Create file metadata
      const fileMetadata = {
        name: fileName,
        mimeType: 'application/pdf',
        parents: [GOOGLE_DRIVE_CONFIG.folderId],
        description: JSON.stringify(metadata)
      };

      // Create form data for multipart upload
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', pdfBlob);

      // Upload to Google Drive
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: form
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Upload failed: ${response.status} ${response.statusText || ''} - ${errorText}`);
      }

      const result = await response.json();

      // Make file publicly accessible
      await this.makePublic(result.id);

      return {
        fileId: result.id,
        viewLink: result.webViewLink,
        downloadLink: result.webContentLink,
        publicLink: `https://drive.google.com/file/d/${result.id}/view?usp=sharing`
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  }

  /**
   * Make file publicly accessible (anyone with link can view)
   * @param {string} fileId - Google Drive file ID
   */
  async makePublic(fileId) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        }
      );

      if (!response.ok) {
        console.warn('Failed to make file public:', response.statusText);
      }
    } catch (error) {
      console.warn('Error making file public:', error);
    }
  }

  /**
   * Delete file from Google Drive
   * @param {string} fileId - Google Drive file ID
   */
  async deleteFile(fileId) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Check if user is authorized
   */
  isAuthorized() {
    return this.accessToken !== null;
  }

  /**
   * Revoke authorization
   */
  revokeAccess() {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
      this.accessToken = null;
    }
  }
}

// Create global instance
const driveUploader = new GoogleDriveUploader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    driveUploader.init().catch(console.error);
  });
} else {
  driveUploader.init().catch(console.error);
}
