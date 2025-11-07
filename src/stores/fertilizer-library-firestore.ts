import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import type { FertilizerComposition } from 'components/models';

export interface Fertilizer {
  id: string;
  name: string;
  description?: string;
  composition: FertilizerComposition;
  category: 'organic' | 'mineral' | 'complex' | 'micro' | 'other';
  manufacturer?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useFertilizerLibraryFirestore = defineStore('fertilizer-library-firestore', () => {
  const fertilizers = ref<Fertilizer[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Загрузка всех удобрений
  const fetchFertilizers = async () => {
    loading.value = true;
    error.value = null;
    try {
      const q = query(collection(db, 'fertilizers'), orderBy('name'));
      const snapshot = await getDocs(q);
      fertilizers.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Fertilizer[];
    } catch (e: any) {
      error.value = e.message || 'Ошибка загрузки удобрений';
      console.error('[fetchFertilizers] error:', error.value);
    } finally {
      loading.value = false;
    }
  };

  // Подписка на изменения в реальном времени
  const subscribeFertilizers = () => {
    const q = query(collection(db, 'fertilizers'), orderBy('name'));
    return onSnapshot(
      q,
      (snapshot) => {
        fertilizers.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Fertilizer[];
      },
      (err) => {
        error.value = err.message || 'Ошибка подписки на удобрения';
        console.error('[subscribeFertilizers] error:', error.value);
      },
    );
  };

  // Поиск удобрений
  const searchFertilizers = async (searchTerm: string, category?: Fertilizer['category']) => {
    loading.value = true;
    error.value = null;
    try {
      let q: any = collection(db, 'fertilizers');

      if (searchTerm && searchTerm.trim().length >= 2) {
        const searchLower = searchTerm.trim().toLowerCase();
        q = query(
          q,
          where('name', '>=', searchLower),
          where('name', '<=', searchLower + '\uf8ff'),
          orderBy('name'),
        );
      } else if (category) {
        q = query(q, where('category', '==', category), orderBy('name'));
      } else {
        q = query(q, orderBy('name'));
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Fertilizer[];

      // Если есть и поиск, и фильтр по категории, фильтруем на клиенте
      if (category && searchTerm && searchTerm.trim().length >= 2) {
        results = results.filter((f) => f.category === category);
      }

      return results;
    } catch (e: any) {
      error.value = e.message || 'Ошибка поиска';
      console.error('[searchFertilizers] error:', error.value);
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Добавление удобрения
  const addFertilizer = async (fertilizer: Omit<Fertilizer, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true;
    error.value = null;
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'fertilizers'), {
        ...fertilizer,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (e: any) {
      error.value = e.message || 'Ошибка добавления удобрения';
      console.error('[addFertilizer] error:', error.value);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Обновление удобрения
  const updateFertilizer = async (id: string, updates: Partial<Omit<Fertilizer, 'id' | 'createdAt'>>) => {
    loading.value = true;
    error.value = null;
    try {
      const fertilizerRef = doc(db, 'fertilizers', id);
      await updateDoc(fertilizerRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      error.value = e.message || 'Ошибка обновления удобрения';
      console.error('[updateFertilizer] error:', error.value);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Удаление удобрения
  const deleteFertilizer = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const fertilizerRef = doc(db, 'fertilizers', id);
      await deleteDoc(fertilizerRef);
    } catch (e: any) {
      error.value = e.message || 'Ошибка удаления удобрения';
      console.error('[deleteFertilizer] error:', error.value);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Переключение избранного
  const toggleFavorite = async (id: string) => {
    const fertilizer = fertilizers.value.find((f) => f.id === id);
    if (fertilizer) {
      await updateFertilizer(id, {
        isFavorite: !fertilizer.isFavorite,
      });
    }
  };

  // Получение удобрения по ID
  const getFertilizerById = (id: string): Fertilizer | undefined => {
    return fertilizers.value.find((f) => f.id === id);
  };

  // Получение удобрений по категории
  const getFertilizersByCategory = (category: Fertilizer['category']): Fertilizer[] => {
    return fertilizers.value.filter((f) => f.category === category);
  };

  // Инициализация библиотеки примерами удобрений
  const initializeLibrary = async () => {
    loading.value = true;
    error.value = null;

    const defaultFertilizers: Omit<Fertilizer, 'id' | 'createdAt' | 'updatedAt'>[] = [
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
      {
        name: 'Монокалий фосфат',
        description: 'Фосфорно-калийное удобрение для всех культур',
        composition: {
          P: 21.9, // из P2O5 50%
          K: 27.4, // из K2O 33%
        },
        category: 'mineral',
        manufacturer: 'Буйские удобрения',
        isFavorite: false,
      },
    ];

    try {
      // Проверяем существующие удобрения
      const existingSnapshot = await getDocs(query(collection(db, 'fertilizers'), orderBy('name')));
      const existingNames = new Set(existingSnapshot.docs.map((doc) => doc.data().name));

      let added = 0;
      let skipped = 0;

      for (const fertilizer of defaultFertilizers) {
        if (existingNames.has(fertilizer.name)) {
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
          added++;
        } catch (e: any) {
          console.error(`Ошибка при добавлении ${fertilizer.name}:`, e);
          skipped++;
        }
      }

      // Обновляем список после инициализации
      await fetchFertilizers();

      return { added, skipped, total: defaultFertilizers.length };
    } catch (e: any) {
      error.value = e.message || 'Ошибка инициализации библиотеки';
      console.error('[initializeLibrary] error:', error.value);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    fertilizers,
    loading,
    error,
    fetchFertilizers,
    subscribeFertilizers,
    searchFertilizers,
    addFertilizer,
    updateFertilizer,
    deleteFertilizer,
    toggleFavorite,
    getFertilizerById,
    getFertilizersByCategory,
    initializeLibrary,
  };
});

