import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseAppletConfig?.projectId || "alien-geode-bn50x",
  appId: firebaseAppletConfig?.appId || "1:195530948037:web:24453c4532d12cb4e71fac",
  apiKey: firebaseAppletConfig?.apiKey || "AIzaSyDGyC41nr9dH-M6kaG9ermS-XbOgsgT_VQ",
  authDomain: firebaseAppletConfig?.authDomain || "alien-geode-bn50x.firebaseapp.com",
  storageBucket: firebaseAppletConfig?.storageBucket || "alien-geode-bn50x.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig?.messagingSenderId || "195530948037"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const databaseId = firebaseAppletConfig?.firestoreDatabaseId || "ai-studio-orgeducationmana-8f4b46d2-1edd-4c11-b88c-39730d43ae1e";

// Initialize Firestore with the custom database ID provisioned for this applet
// and use experimentalForceLongPolling to prevent iframe/sandboxed network block issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

/**
 * Generic helper to save a document in Firestore
 */
export async function dbSaveItem(collectionName: string, id: string, data: any) {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error(`Error saving item in ${collectionName}:`, error);
  }
}

/**
 * Generic helper to delete a document in Firestore
 */
export async function dbDeleteItem(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting item from ${collectionName}:`, error);
  }
}

/**
 * Generic helper to get all documents from a Firestore collection
 */
export async function dbGetItems(collectionName: string): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: any[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id });
    });
    return items;
  } catch (error) {
    console.error(`Error fetching items from ${collectionName}:`, error);
    return [];
  }
}
