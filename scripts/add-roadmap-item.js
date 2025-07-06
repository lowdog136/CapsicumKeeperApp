import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq',
  authDomain: 'capsicum-keeper.firebaseapp.com',
  projectId: 'capsicum-keeper',
  storageBucket: 'capsicum-keeper.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456',
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function addRoadmapItem() {
  try {
    // Вход в систему (замените на реальные данные)
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'lowdog136@gmail.com',
      'password',
    );
    console.log('Вход выполнен успешно');

    // Данные элемента дорожной карты
    const roadmapItem = {
      title: 'Завершение масштабного рефакторинга компонентов',
      description:
        'Полное разбиение монолитных компонентов на специализированные модули для улучшения читаемости, переиспользуемости и поддержки кода. Рефакторинг включает PepperForm, PepperHistoryManager, HistoryEntryDialog, VarietySelector и PepperStats.',
      status: 'completed',
      priority: 'high',
      category: 'refactoring',
      details: {
        components: [
          'PepperForm.vue (700+ строк → 219 строк)',
          'PepperHistoryManager.vue (500+ строк → 89 строк)',
          'HistoryEntryDialog.vue (230 строк → 89 строк)',
          'VarietySelector.vue (400+ строк → 89 строк)',
          'PepperStats.vue (329 строк → 27 строк)',
        ],
        newComponents: [
          'PepperBasicInfo.vue, PepperPlantingInfo.vue',
          'PepperWateringHistory.vue, PepperFertilizerHistory.vue',
          'PepperTreatmentHistory.vue, PepperObservationHistory.vue',
          'WateringEntryForm.vue, FertilizingEntryForm.vue',
          'TreatmentEntryForm.vue, ObservationEntryForm.vue',
          'VarietySearchField.vue, VarietyInfoCard.vue',
          'VarietySelectionDialog.vue, VarietyDetailsDialog.vue',
          'PepperMainStats.vue, PepperDistributionStats.vue',
          'PepperCareActivity.vue',
        ],
        benefits: [
          'Улучшена читаемость кода',
          'Повышена переиспользуемость компонентов',
          'Упрощено тестирование',
          'Улучшена поддержка кода',
          'Ускорена разработка новых функций',
        ],
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    };

    // Добавление в Firestore
    const docRef = await addDoc(collection(db, 'roadmap'), roadmapItem);
    console.log('Элемент дорожной карты добавлен с ID:', docRef.id);

    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

addRoadmapItem();
