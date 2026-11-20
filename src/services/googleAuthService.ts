import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// All Google Drive OAuth scopes configured for this application
export const GOOGLE_DRIVE_SCOPES: string[] = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

// Initialize Firebase single instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Strictly in-memory OAuth access token cache (never persisted to localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export interface GoogleAuthResult {
  user: User;
  accessToken: string;
}

/**
 * Subscribe to Firebase Authentication state changes.
 * Automatically clears the in-memory OAuth access token when signed out.
 */
export function subscribeToAuthChanges(
  callback: (user: User | null, hasAccessToken: boolean) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
    callback(user, Boolean(user && cachedAccessToken));
  });
}

/**
 * Sign in with Google via Firebase Auth popup and request configured Google Drive scopes.
 * Stores the resulting OAuth access token strictly in memory.
 */
export async function signInWithGoogleDrive(): Promise<GoogleAuthResult> {
  const provider = new GoogleAuthProvider();
  for (const scope of GOOGLE_DRIVE_SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken ?? null;

  if (!accessToken) {
    throw new Error('توکن دسترسی Google Drive از فرآیند احراز هویت دریافت نشد.');
  }

  cachedAccessToken = accessToken;
  return {
    user: result.user,
    accessToken,
  };
}

/**
 * Return the current in-memory Google OAuth access token, or null if unavailable.
 */
export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Clear the in-memory access token (e.g., when a 401 response indicates expiration).
 */
export function clearCachedAccessToken(): void {
  cachedAccessToken = null;
}

/**
 * Sign out of Firebase Auth and clear the in-memory OAuth access token.
 */
export async function signOutGoogleDrive(): Promise<void> {
  cachedAccessToken = null;
  await signOut(auth);
}
