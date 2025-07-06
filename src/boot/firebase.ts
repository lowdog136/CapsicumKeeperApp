// Import only needed functions from Firebase SDK
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Конфигурация Firebase для проекта SeverFans
// Storage будет использоваться из проекта SeverFans
const firebaseConfig = {
  apiKey: 'AIzaSyCUgPTvsh179mdCCW4t5hmSItwb8Ei67h8',
  authDomain: 'pepperfarmapp-e782b.firebaseapp.com',
  projectId: 'pepperfarmapp-e782b',
  storageBucket: 'severfans.appspot.com', // Storage bucket из проекта SeverFans
  messagingSenderId: '530249028171',
  appId: '1:530249028171:web:2ffbadbf6013d75dc233ce',
  measurementId: 'G-4ZESK2ST90',
};

// Initialize Firebase only once
let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseStorage: any = null;

function initializeFirebase() {
  if (!firebaseApp) {
    console.log('🚀 Инициализация Firebase...');
    firebaseApp = initializeApp(firebaseConfig);
    console.log('✅ Firebase приложение инициализировано');

    firestoreDb = getFirestore(firebaseApp);
    console.log('✅ Firestore инициализирован');

    firebaseStorage = getStorage(firebaseApp);
    console.log('✅ Storage инициализирован');
  }

  return { app: firebaseApp, db: firestoreDb, storage: firebaseStorage };
}

// Lazy initialization
export const getFirebaseApp = () => {
  const { app } = initializeFirebase();
  return app;
};

export const getFirebaseDb = () => {
  const { db } = initializeFirebase();
  return db;
};

export const getFirebaseStorage = () => {
  const { storage } = initializeFirebase();
  return storage;
};

// For backward compatibility
export const app = getFirebaseApp();
export const db = getFirebaseDb();
export const storage = getFirebaseStorage();
