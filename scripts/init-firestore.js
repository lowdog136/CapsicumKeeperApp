const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

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

// Базовые сорта перцев для библиотеки
const baseVarieties = [
  {
    name: 'Халапеньо',
    scientificName: 'Capsicum annuum',
    species: 'Capsicum annuum',
    description: 'Классический мексиканский перец средней остроты',
    heatLevel: 'medium',
    color: ['зеленый', 'красный'],
    plantHeight: { min: 60, max: 90, unit: 'cm' },
    daysToMaturity: { min: 70, max: 80 },
    fruitSize: {
      length: { min: 5, max: 9, unit: 'cm' },
      width: { min: 2, max: 3, unit: 'cm' },
    },
    growingTips: ['Любит солнечные места', 'Требует регулярного полива', 'Созревает за 70-80 дней'],
    origin: 'Мексика',
    category: 'jalapeno',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Хабанеро',
    scientificName: 'Capsicum chinense',
    species: 'Capsicum chinense',
    description: 'Один из самых острых перцев в мире',
    heatLevel: 'extremely-hot',
    color: ['оранжевый', 'красный', 'шоколадный'],
    plantHeight: { min: 45, max: 75, unit: 'cm' },
    daysToMaturity: { min: 90, max: 120 },
    fruitSize: {
      length: { min: 2, max: 6, unit: 'cm' },
      width: { min: 2, max: 4, unit: 'cm' },
    },
    growingTips: [
      'Требует много тепла и солнца',
      'Долгий период созревания',
      'Очень острый - будьте осторожны!',
    ],
    origin: 'Карибский бассейн',
    category: 'habanero',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Болгарский перец',
    scientificName: 'Capsicum annuum',
    species: 'Capsicum annuum',
    description: 'Сладкий перец без остроты',
    heatLevel: 'no-heat',
    color: ['зеленый', 'желтый', 'красный', 'оранжевый'],
    plantHeight: { min: 50, max: 80, unit: 'cm' },
    daysToMaturity: { min: 60, max: 90 },
    fruitSize: {
      length: { min: 8, max: 15, unit: 'cm' },
      width: { min: 6, max: 10, unit: 'cm' },
    },
    growingTips: [
      'Отлично подходит для начинающих',
      'Не требует особого ухода',
      'Можно выращивать в горшках',
    ],
    origin: 'Центральная Америка',
    category: 'bell',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Кайенский перец',
    scientificName: 'Capsicum annuum',
    species: 'Capsicum annuum',
    description: 'Классический острый перец для сушки',
    heatLevel: 'hot',
    color: ['красный'],
    plantHeight: { min: 60, max: 120, unit: 'cm' },
    daysToMaturity: { min: 80, max: 100 },
    fruitSize: {
      length: { min: 10, max: 25, unit: 'cm' },
      width: { min: 1, max: 2, unit: 'cm' },
    },
    growingTips: ['Отлично подходит для сушки', 'Высокое растение', 'Устойчив к засухе'],
    origin: 'Французская Гвиана',
    category: 'cayenne',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Базовые элементы дорожной карты
const baseRoadmapItems = [
  {
    title: 'Система пользователей',
    description: 'Добавление авторизации и персональных коллекций перцев',
    category: 'feature',
    priority: 'high',
    status: 'completed',
    estimatedEffort: 'medium',
    targetVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    notes: 'Реализована система авторизации через Firebase Auth',
    assignee: 'lowdog136@gmail.com',
  },
  {
    title: 'Библиотека сортов',
    description: 'Создание базы данных сортов перцев с подробной информацией',
    category: 'feature',
    priority: 'high',
    status: 'completed',
    estimatedEffort: 'large',
    targetVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    notes: 'Добавлена библиотека с сортами и возможностью поиска',
    assignee: 'lowdog136@gmail.com',
  },
  {
    title: 'Улучшение UI/UX',
    description: 'Обновление интерфейса для лучшего пользовательского опыта',
    category: 'ui',
    priority: 'medium',
    status: 'in-progress',
    estimatedEffort: 'medium',
    targetVersion: '1.1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Работа над улучшением дизайна и навигации',
    assignee: 'lowdog136@gmail.com',
  },
  {
    title: 'Мобильное приложение',
    description: 'Создание нативного мобильного приложения',
    category: 'feature',
    priority: 'low',
    status: 'planned',
    estimatedEffort: 'large',
    targetVersion: '2.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Планируется разработка на React Native или Flutter',
    assignee: 'lowdog136@gmail.com',
  },
];

async function initializeFirestore() {
  try {
    console.log('Начинаем инициализацию Firestore...');

    // Добавляем базовые сорта перцев
    console.log('Добавляем базовые сорта перцев...');
    for (const variety of baseVarieties) {
      await addDoc(collection(db, 'pepper-varieties'), variety);
      console.log(`Добавлен сорт: ${variety.name}`);
    }

    // Добавляем элементы дорожной карты
    console.log('Добавляем элементы дорожной карты...');
    for (const item of baseRoadmapItems) {
      await addDoc(collection(db, 'roadmap'), item);
      console.log(`Добавлен элемент дорожной карты: ${item.title}`);
    }

    console.log('Инициализация завершена успешно!');
    console.log(`Добавлено сортов: ${baseVarieties.length}`);
    console.log(`Добавлено элементов дорожной карты: ${baseRoadmapItems.length}`);
  } catch (error) {
    console.error('Ошибка при инициализации:', error);
  }
}

// Запускаем инициализацию
initializeFirestore();
