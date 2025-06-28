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

console.log('🚀 Инициализация Firebase...');
console.log('📋 Конфигурация Firebase:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase приложение инициализировано');

export { app };

export const db = getFirestore(app);
console.log('✅ Firestore инициализирован:', db);

export const storage = getStorage(app);
console.log('✅ Storage инициализирован:', storage);
