import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, collection, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the user's specific database ID: 'cekorderidhlookup'
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Connection test as required by skill
export async function testFirestoreConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // Test read from server to verify live connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true };
  } catch (error: any) {
    // If doc doesn't exist, that is still a successful connection to the server
    if (error?.code === 'not-found' || error?.message?.includes('No document to update')) {
      return { connected: true };
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { connected: false, error: 'Client is offline' };
    }
    // Any other response that reached server (permission or empty)
    return { connected: true };
  }
}
