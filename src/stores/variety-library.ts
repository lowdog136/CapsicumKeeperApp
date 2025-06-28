import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import type {
  PepperVariety,
  HeatLevel,
  PepperCategory,
  HeatLevelInfo,
} from 'src/components/models';

export const useVarietyLibraryStore = defineStore('varietyLibrary', () => {
  const varieties = ref<PepperVariety[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Информация об уровнях остроты
  const heatLevels: HeatLevelInfo[] = [
    {
      level: 'no-heat',
      name: 'Без остроты',
      shuRange: '0 SHU',
      description: 'Сладкий перец',
      color: '#4CAF50',
    },
    {
      level: 'very-mild',
      name: 'Очень мягкий',
      shuRange: '100-500 SHU',
      description: 'Легкая острота',
      color: '#8BC34A',
    },
    {
      level: 'mild',
      name: 'Мягкий',
      shuRange: '500-2500 SHU',
      description: 'Умеренная острота',
      color: '#FFEB3B',
    },
    {
      level: 'medium',
      name: 'Средний',
      shuRange: '2500-8000 SHU',
      description: 'Заметная острота',
      color: '#FF9800',
    },
    {
      level: 'hot',
      name: 'Острый',
      shuRange: '8000-50000 SHU',
      description: 'Сильная острота',
      color: '#F44336',
    },
    {
      level: 'very-hot',
      name: 'Очень острый',
      shuRange: '50000-100000 SHU',
      description: 'Экстремальная острота',
      color: '#9C27B0',
    },
    {
      level: 'extremely-hot',
      name: 'Крайне острый',
      shuRange: '100000+ SHU',
      description: 'Максимальная острота',
      color: '#000000',
    },
  ];

  // Категории перцев
  const categories = [
    { value: 'bell', label: 'Болгарский' },
    { value: 'jalapeno', label: 'Халапеньо' },
    { value: 'habanero', label: 'Хабанеро' },
    { value: 'cayenne', label: 'Кайенский' },
    { value: 'serrano', label: 'Серрано' },
    { value: 'anaheim', label: 'Анахайм' },
    { value: 'poblano', label: 'Поблано' },
    { value: 'ghost', label: 'Призрак' },
    { value: 'scotch-bonnet', label: 'Шотландская шапочка' },
    { value: 'other', label: 'Другие' },
  ];

  // Computed свойства
  const favoriteVarieties = computed(() => varieties.value.filter((v) => v.isFavorite));

  const getHeatLevelInfo = (level: HeatLevel): HeatLevelInfo => {
    return heatLevels.find((h) => h.level === level) || heatLevels[0];
  };

  // Методы для работы с Firebase
  const loadVarieties = async () => {
    loading.value = true;
    error.value = null;

    try {
      const varietiesRef = collection(db, 'pepper-varieties');
      const q = query(varietiesRef, orderBy('name'));
      const querySnapshot = await getDocs(q);

      varieties.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PepperVariety[];
    } catch (err) {
      error.value = 'Ошибка загрузки сортов: ' + (err as Error).message;
      console.error('Error loading varieties:', err);
    } finally {
      loading.value = false;
    }
  };

  const addVariety = async (variety: Omit<PepperVariety, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true;
    error.value = null;

    try {
      const now = new Date().toISOString();
      const varietyData = {
        ...variety,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, 'pepper-varieties'), varietyData);
      const newVariety: PepperVariety = {
        id: docRef.id,
        ...varietyData,
      };

      varieties.value.push(newVariety);
      return newVariety;
    } catch (err) {
      error.value = 'Ошибка добавления сорта: ' + (err as Error).message;
      console.error('Error adding variety:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateVariety = async (id: string, updates: Partial<Omit<PepperVariety, 'id'>>) => {
    loading.value = true;
    error.value = null;

    try {
      const varietyRef = doc(db, 'pepper-varieties', id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(varietyRef, updateData);

      const index = varieties.value.findIndex((v) => v.id === id);
      if (index !== -1) {
        varieties.value[index] = { ...varieties.value[index], ...updateData };
      }
    } catch (err) {
      error.value = 'Ошибка обновления сорта: ' + (err as Error).message;
      console.error('Error updating variety:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteVariety = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await deleteDoc(doc(db, 'pepper-varieties', id));
      varieties.value = varieties.value.filter((v) => v.id !== id);
    } catch (err) {
      error.value = 'Ошибка удаления сорта: ' + (err as Error).message;
      console.error('Error deleting variety:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const toggleFavorite = async (id: string) => {
    const variety = varieties.value.find((v) => v.id === id);
    if (variety) {
      await updateVariety(id, { isFavorite: !variety.isFavorite });
    }
  };

  const searchVarieties = (
    searchTerm: string,
    filters?: {
      heatLevel?: HeatLevel;
      category?: PepperCategory;
      onlyFavorites?: boolean;
    },
  ) => {
    let filtered = varieties.value;

    // Поиск по названию
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.description.toLowerCase().includes(term) ||
          (v.scientificName && v.scientificName.toLowerCase().includes(term)),
      );
    }

    // Фильтр по остроте
    if (filters?.heatLevel) {
      filtered = filtered.filter((v) => v.heatLevel === filters.heatLevel);
    }

    // Фильтр по категории
    if (filters?.category) {
      filtered = filtered.filter((v) => v.category === filters.category);
    }

    // Только избранные
    if (filters?.onlyFavorites) {
      filtered = filtered.filter((v) => v.isFavorite);
    }

    return filtered;
  };

  return {
    // State
    varieties,
    loading,
    error,
    heatLevels,
    categories,

    // Computed
    favoriteVarieties,
    getHeatLevelInfo,

    // Methods
    loadVarieties,
    addVariety,
    updateVariety,
    deleteVariety,
    toggleFavorite,
    searchVarieties,
  };
});
