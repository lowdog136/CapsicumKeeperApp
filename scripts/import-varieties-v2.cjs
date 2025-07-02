// Импортирует все сорта из all-peppers.json в коллекцию Firestore 'varieties_v2'
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Путь к вашему serviceAccountKey.json (скачайте из Firebase Console)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const dataPath = path.join(__dirname, 'all-peppers.json');
const varieties = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function importVarieties() {
  const batchSize = 500; // Firestore ограничение на batch
  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

  for (let i = 0; i < varieties.length; i++) {
    const variety = varieties[i];
    // Можно добавить нормализацию полей при необходимости
    const docRef = db.collection('varieties_v2').doc();
    batch.set(docRef, variety);
    count++;
    if (count % batchSize === 0) {
      await batch.commit();
      batchCount++;
      console.log(`Batch ${batchCount} committed (${count} docs)`);
      batch = db.batch();
    }
  }
  if (count % batchSize !== 0) {
    await batch.commit();
    batchCount++;
    console.log(`Final batch committed (${count} docs)`);
  }
  console.log(`Импорт завершён. Всего загружено: ${count} сортов.`);
  process.exit(0);
}

importVarieties().catch((err) => {
  console.error('Ошибка импорта:', err);
  process.exit(1);
});
