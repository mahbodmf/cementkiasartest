import { clearCachedAccessToken } from './googleAuthService';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export class DriveAuthError extends Error {
  constructor(message = 'نشست دسترسی به Google Drive منقضی شده است. لطفاً مجدداً وارد شوید.') {
    super(message);
    this.name = 'DriveAuthError';
  }
}

export interface DriveFileOwner {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
  iconLink?: string;
  owners?: DriveFileOwner[];
  parents?: string[];
  starred?: boolean;
  trashed?: boolean;
}

export interface DriveAboutInfo {
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
}

export type DriveFileCategory = 'all' | 'folders' | 'spreadsheets' | 'documents' | 'json';

export interface ListFilesOptions {
  folderId?: string | null;
  searchQuery?: string;
  category?: DriveFileCategory;
  pageSize?: number;
  pageToken?: string;
}

export interface ListFilesResult {
  files: DriveFile[];
  nextPageToken?: string;
}

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

function escapeQueryValue(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function driveFetch(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearCachedAccessToken();
    throw new DriveAuthError();
  }

  if (!response.ok) {
    let errorMessage = `خطای سرویس Google Drive (کد ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errorMessage = errJson.error.message;
      }
    } catch {
      // Ignore JSON parse errors on error body
    }
    throw new Error(errorMessage);
  }

  return response;
}

/**
 * Retrieve authenticated user info and Drive storage quota.
 */
export async function getDriveAbout(accessToken: string): Promise<DriveAboutInfo> {
  const params = new URLSearchParams({
    fields: 'user(displayName,emailAddress,photoLink),storageQuota(limit,usage,usageInDrive,usageInDriveTrash)',
  });
  const res = await driveFetch(`${DRIVE_API_BASE}/about?${params.toString()}`, accessToken);
  return res.json();
}

/**
 * List Google Drive files with optional folder navigation, search query, category filter, and pagination.
 */
export async function listDriveFiles(
  accessToken: string,
  options: ListFilesOptions = {}
): Promise<ListFilesResult> {
  const {
    folderId = 'root',
    searchQuery = '',
    category = 'all',
    pageSize = 30,
    pageToken,
  } = options;

  const queryParts: string[] = ['trashed = false'];

  const trimmedSearch = searchQuery.trim();
  if (trimmedSearch) {
    queryParts.push(`name contains '${escapeQueryValue(trimmedSearch)}'`);
  } else if (folderId) {
    queryParts.push(`'${escapeQueryValue(folderId)}' in parents`);
  }

  if (category === 'folders') {
    queryParts.push(`mimeType = '${FOLDER_MIME_TYPE}'`);
  } else if (category === 'spreadsheets') {
    queryParts.push(
      "(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'application/vnd.ms-excel' or mimeType = 'text/csv')"
    );
  } else if (category === 'documents') {
    queryParts.push(
      "(mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain')"
    );
  } else if (category === 'json') {
    queryParts.push("(mimeType = 'application/json' or name contains '.json')");
  }

  const params = new URLSearchParams({
    q: queryParts.join(' and '),
    pageSize: String(pageSize),
    orderBy: 'folder,modifiedTime desc',
    fields:
      'nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,iconLink,owners(displayName,emailAddress),parents,starred,trashed)',
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const res = await driveFetch(`${DRIVE_API_BASE}/files?${params.toString()}`, accessToken);
  const data = await res.json();
  return {
    files: Array.isArray(data.files) ? data.files : [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Create a new folder inside Google Drive.
 */
export async function createDriveFolder(
  accessToken: string,
  name: string,
  parentId?: string | null
): Promise<DriveFile> {
  const metadata: Record<string, unknown> = {
    name: name.trim(),
    mimeType: FOLDER_MIME_TYPE,
  };
  if (parentId && parentId !== 'root') {
    metadata.parents = [parentId];
  }

  const res = await driveFetch(
    `${DRIVE_API_BASE}/files?fields=id,name,mimeType,modifiedTime,parents,owners(displayName,emailAddress)`,
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }
  );
  return res.json();
}

/**
 * Upload a Blob or File to Google Drive using multipart upload.
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  parentId?: string | null
): Promise<DriveFile> {
  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType: mimeType || 'application/octet-stream',
  };
  if (parentId && parentId !== 'root') {
    metadata.parents = [parentId];
  }

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  form.append('file', fileBlob, fileName);

  const res = await driveFetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,owners(displayName,emailAddress)`,
    accessToken,
    {
      method: 'POST',
      body: form,
    }
  );

  return res.json();
}

/**
 * Rename a Google Drive file or folder.
 */
export async function renameDriveFile(
  accessToken: string,
  fileId: string,
  newName: string
): Promise<DriveFile> {
  const res = await driveFetch(
    `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime`,
    accessToken,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName.trim() }),
    }
  );
  return res.json();
}

/**
 * Move a file or folder to Google Drive Trash (recoverable).
 */
export async function trashDriveFile(accessToken: string, fileId: string): Promise<void> {
  await driveFetch(`${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}`, accessToken, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trashed: true }),
  });
}

/**
 * Permanently delete a file or folder from Google Drive (irreversible).
 */
export async function deleteDriveFilePermanently(
  accessToken: string,
  fileId: string
): Promise<void> {
  await driveFetch(`${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}`, accessToken, {
    method: 'DELETE',
  });
}

/**
 * Download a Drive file as a Blob (exporting Google Workspace Docs/Sheets/Slides to standard office/PDF formats).
 */
export async function downloadDriveFile(
  accessToken: string,
  file: DriveFile
): Promise<{ blob: Blob; downloadName: string }> {
  let url: string;
  let downloadName = file.name;

  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    const exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent(exportMime)}`;
    if (!downloadName.toLowerCase().endsWith('.xlsx')) {
      downloadName += '.xlsx';
    }
  } else if (file.mimeType === 'application/vnd.google-apps.document') {
    const exportMime = 'application/pdf';
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent(exportMime)}`;
    if (!downloadName.toLowerCase().endsWith('.pdf')) {
      downloadName += '.pdf';
    }
  } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
    const exportMime = 'application/pdf';
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent(exportMime)}`;
    if (!downloadName.toLowerCase().endsWith('.pdf')) {
      downloadName += '.pdf';
    }
  } else {
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}?alt=media`;
  }

  const res = await driveFetch(url, accessToken);
  const blob = await res.blob();
  return { blob, downloadName };
}

/**
 * Fetch a text preview for JSON, CSV, plain text, or Google Docs/Sheets files.
 */
export async function fetchDriveFileTextPreview(
  accessToken: string,
  file: DriveFile
): Promise<string> {
  let url: string;

  if (file.mimeType === 'application/vnd.google-apps.document') {
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent('text/plain')}`;
  } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent('text/csv')}`;
  } else {
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}?alt=media`;
  }

  const res = await driveFetch(url, accessToken);
  const text = await res.text();
  if (file.mimeType === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }
  return text;
}

export function isPreviewableDriveFile(file: DriveFile): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.mimeType === 'application/json' ||
    file.mimeType === 'text/plain' ||
    file.mimeType === 'text/csv' ||
    file.mimeType === 'application/vnd.google-apps.document' ||
    file.mimeType === 'application/vnd.google-apps.spreadsheet' ||
    lower.endsWith('.json') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md')
  );
}
