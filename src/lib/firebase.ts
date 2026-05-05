import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// We try to import the local config file. In AI Studio, this is the primary source.
let firebaseConfig: any = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

try {
  // @ts-ignore
  const localConfigs = import.meta.glob('/firebase-applet-config.json', { eager: true });
  const configValues = Object.values(localConfigs) as any[];
  if (configValues.length > 0 && configValues[0].default) {
    const config = configValues[0].default;
    firebaseConfig = { ...firebaseConfig, ...config };
  }
} catch (e) {
  console.log("No local firebase config found, using environment variables.");
}

// Check if Firebase is actually configured
const isConfigured = !!firebaseConfig.apiKey;

const app = isConfigured && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);

// --- MOCK IMPLEMENTATIONS FOR DEMO MODE ---
const mockAuth = isConfigured ? null : {
  currentUser: JSON.parse(localStorage.getItem('lumina_demo_user') || 'null'),
  onAuthStateChanged: (callback: any) => {
    const user = JSON.parse(localStorage.getItem('lumina_demo_user') || 'null');
    callback(user);
    return () => {};
  },
  signOut: async () => {
    localStorage.removeItem('lumina_demo_user');
    window.location.reload();
  },
  getIdToken: async () => "demo-token"
};

const mockDb = isConfigured ? null : {
  collection: (path: string) => ({ path, type: 'collection' }),
  doc: (path: string, id?: string) => ({ path: id ? `${path}/${id}` : path, type: 'doc' })
};
// --- END MOCK ---

export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)') : (mockDb as any);
export const auth = app ? getAuth(app) : (mockAuth as any);
export const isRealFirebase = !!app;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
