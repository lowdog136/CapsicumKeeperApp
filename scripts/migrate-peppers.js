const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Конфигурация Firebase (замените на вашу)
const firebaseConfig = {
  // Добавьте вашу конфигурацию Firebase здесь
  // apiKey: "your-api-key",
  // authDomain: "your-project.firebaseapp.com",
  // projectId: "your-project-id",
  // storageBucket: "your-project.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "your-app-id"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migratePeppers() {
  try {
    console.log('Начинаем миграцию перцев...');

    // Получаем все документы из коллекции peppers
    const peppersRef = collection(db, 'peppers');
    const querySnapshot = await getDocs(peppersRef);

    console.log(`Найдено ${querySnapshot.size} перцев для миграции`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const pepperDoc of querySnapshot.docs) {
      const pepperData = pepperDoc.data();

      // Проверяем, есть ли уже поле userId
      if (pepperData.userId) {
        console.log(`Перец "${pepperData.name}" уже имеет userId: ${pepperData.userId}`);
        skippedCount++;
        continue;
      }

      // Если нет userId, добавляем его (здесь нужно указать ID пользователя)
      // ВАЖНО: Замените 'YOUR_USER_ID' на реальный ID пользователя
      const userId = 'YOUR_USER_ID'; // Замените на реальный ID пользователя

      await updateDoc(doc(db, 'peppers', pepperDoc.id), {
        userId: userId,
        updatedAt: new Date().toISOString(),
      });

      console.log(`Мигрирован перец "${pepperData.name}" с ID: ${pepperDoc.id}`);
      migratedCount++;
    }

    console.log(`\nМиграция завершена!`);
    console.log(`Мигрировано: ${migratedCount}`);
    console.log(`Пропущено: ${skippedCount}`);
  } catch (error) {
    console.error('Ошибка при миграции:', error);
  }
}

// Запускаем миграцию
migratePeppers();
