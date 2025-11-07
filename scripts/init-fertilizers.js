import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем конфигурацию Firebase
const googleServicesPath = path.join(__dirname, '..', 'google-services.json');
const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));

const firebaseConfig = {
  apiKey: googleServices.client[0].api_key[0].current_key,
  authDomain: googleServices.project_info.project_id + '.firebaseapp.com',
  projectId: googleServices.project_info.project_id,
  storageBucket: googleServices.project_info.storage_bucket,
  messagingSenderId: googleServices.project_info.project_number,
  appId: googleServices.client[0].client_info.android_client_info.package_name,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const defaultFertilizers = [
  {
    name: 'NPK 16-16-16',
    description: 'Сбалансированное комплексное удобрение',
    composition: { N: 16, P: 16, K: 16 },
    category: 'complex',
    manufacturer: 'Стандарт',
    isFavorite: false,
  },
  {
    name: 'NPK 20-20-20',
    description: 'Высококонцентрированное комплексное удобрение',
    composition: { N: 20, P: 20, K: 20 },
    category: 'complex',
    manufacturer: 'Стандарт',
    isFavorite: false,
  },
  {
    name: 'Аммиачная селитра',
    description: 'Азотное удобрение',
    composition: { N: 34 },
    category: 'mineral',
    manufacturer: 'Стандарт',
    isFavorite: false,
  },
  {
    name: 'Суперфосфат',
    description: 'Фосфорное удобрение',
    composition: { P: 20, Ca: 12 },
    category: 'mineral',
    manufacturer: 'Стандарт',
    isFavorite: false,
  },
  {
    name: 'Сульфат калия',
    description: 'Калийное удобрение',
    composition: { K: 50, S: 18 },
    category: 'mineral',
    manufacturer: 'Стандарт',
    isFavorite: false,
  },
  {
    name: 'Кальциевая селитра',
    description: 'Кальциевое удобрение',
    composition: { N: 15, Ca: 19 },
    category: 'mineral',
    manufacturer: 'Стандарт',
    isFavorite: false,
  },
  {
    name: 'Сульфат магния',
    description: 'Магниевое удобрение',
    composition: { Mg: 16, S: 13 },
    category: 'mineral',
    manufacturer: 'Стандарт',
    isFavorite: false,
  },
  {
    name: 'Хелат железа',
    description: 'Железосодержащее удобрение',
    composition: { Fe: 13 },
    category: 'micro',
    manufacturer: 'Стандарт',
    isFavorite: false,
  },
  {
    name: 'Компост',
    description: 'Органическое удобрение',
    composition: { N: 2, P: 1, K: 1, Ca: 1, Mg: 0.5 },
    category: 'organic',
    manufacturer: 'Домашний',
    isFavorite: false,
  },
  {
    name: 'Кристалон Томатный',
    description: 'Комплексное удобрение для томатов и перцев с микроэлементами',
    composition: {
      N: 7.5,
      P: 5.2, // из P2O5 12%
      K: 29.9, // из K2O 36%
      Mg: 2.8,
      S: 4,
      B: 0.027,
      Cu: 0.04,
      Fe: 0.15,
      Mn: 0.06,
      Mo: 0.004,
      Zn: 0.027,
    },
    category: 'complex',
    manufacturer: 'Yara',
    isFavorite: false,
  },
];

async function initFertilizers() {
  try {
    console.log('Начинаем инициализацию библиотеки удобрений...');

    // Проверяем существующие удобрения
    const existingSnapshot = await getDocs(query(collection(db, 'fertilizers')));
    const existingNames = new Set(existingSnapshot.docs.map((doc) => doc.data().name));

    console.log(`Найдено ${existingNames.size} существующих удобрений`);

    let added = 0;
    let skipped = 0;

    for (const fertilizer of defaultFertilizers) {
      if (existingNames.has(fertilizer.name)) {
        console.log(`Пропущено (уже существует): ${fertilizer.name}`);
        skipped++;
        continue;
      }

      try {
        const now = new Date().toISOString();
        await addDoc(collection(db, 'fertilizers'), {
          ...fertilizer,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`Добавлено: ${fertilizer.name}`);
        added++;
      } catch (error) {
        console.error(`Ошибка при добавлении ${fertilizer.name}:`, error);
        skipped++;
      }
    }

    console.log('\nИнициализация завершена:');
    console.log(`  Добавлено: ${added}`);
    console.log(`  Пропущено: ${skipped}`);
    console.log(`  Всего: ${defaultFertilizers.length}`);
  } catch (error) {
    console.error('Ошибка при инициализации:', error);
    process.exit(1);
  }
}

initFertilizers()
  .then(() => {
    console.log('Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });

