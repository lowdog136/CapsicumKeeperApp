// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export { app };
export const db = getFirestore(app);
export const storage = getStorage(app);
