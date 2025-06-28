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
  CapsicumSpecies,
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

  // Научные виды Capsicum
  const species = [
    {
      value: 'Capsicum annuum',
      label: 'Capsicum annuum',
      description: 'Самый распространенный вид, включает болгарский, халапеньо, кайенский',
    },
    {
      value: 'Capsicum chinense',
      label: 'Capsicum chinense',
      description: 'Очень острые сорта: Хабанеро, Призрак, Шотландская шапочка',
    },
    {
      value: 'Capsicum baccatum',
      label: 'Capsicum baccatum',
      description: 'Южноамериканские сорта с фруктовым вкусом',
    },
    {
      value: 'Capsicum pubescens',
      label: 'Capsicum pubescens',
      description: 'Рокото, Манзано - сорта с опушенными листьями',
    },
    {
      value: 'Capsicum frutescens',
      label: 'Capsicum frutescens',
      description: 'Табаско, Малагита - кустарниковые формы',
    },
  ];

  // Computed свойства
  const favoriteVarieties = computed(() => varieties.value.filter((v) => v.isFavorite));

  const getHeatLevelInfo = (level: HeatLevel): HeatLevelInfo => {
    const info = heatLevels.find((h) => h.level === level);
    if (!info) {
      throw new Error(`Unknown heat level: ${level}`);
    }
    return info;
  };

  const getSpeciesInfo = (speciesValue: CapsicumSpecies) => {
    return species.find((s) => s.value === speciesValue);
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
        varieties.value[index] = {
          ...varieties.value[index],
          ...updateData,
        } as PepperVariety;
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
      species?: CapsicumSpecies;
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

    // Фильтр по виду
    if (filters?.species) {
      filtered = filtered.filter((v) => v.species === filters.species);
    }

    // Только избранные
    if (filters?.onlyFavorites) {
      filtered = filtered.filter((v) => v.isFavorite);
    }

    return filtered;
  };

  // Импорт данных с pepperseeds.ru
  const importFromPepperSeeds = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Используем парсер для получения данных
      const { getAllPepperSeedsVarieties } = await import('src/utils/pepper-seeds-parser');
      const pepperSeedsVarieties = getAllPepperSeedsVarieties();

      // Добавляем сорта в базу
      for (const variety of pepperSeedsVarieties) {
        await addVariety(variety);
      }

      return pepperSeedsVarieties.length;
    } catch (err) {
      error.value = 'Ошибка импорта: ' + (err as Error).message;
      console.error('Error importing varieties:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Инициализация с примерами сортов
  const initializeWithExamples = async () => {
    if (varieties.value.length > 0) return; // Уже есть данные

    const exampleVarieties = [
      {
        name: 'Халапеньо',
        species: 'Capsicum annuum' as CapsicumSpecies,
        scientificName: 'Capsicum annuum',
        description:
          'Популярный мексиканский перец среднего размера с характерным вкусом и умеренной остротой. Идеален для сальсы, начинки и маринования.',
        heatLevel: 'medium' as HeatLevel,
        color: ['зеленый', 'красный'],
        plantHeight: { min: 60, max: 90, unit: 'cm' as const },
        daysToMaturity: { min: 70, max: 80 },
        fruitSize: {
          length: { min: 5, max: 9, unit: 'cm' as const },
          width: { min: 2, max: 3, unit: 'cm' as const },
        },
        growingTips: [
          'Любит теплое солнечное место',
          'Требует регулярного полива',
          'Собирайте зелеными или красными',
          'Хорошо растет в контейнерах',
        ],
        origin: 'Мексика',
        category: 'jalapeno' as PepperCategory,
        imageUrl: 'https://images.unsplash.com/photo-1603046891744-76e6300f82b8?w=400',
      },
      {
        name: 'Хабанеро',
        species: 'Capsicum chinense' as CapsicumSpecies,
        scientificName: 'Capsicum chinense',
        description:
          'Один из самых острых перцев в мире с фруктовым ароматом. Используется в острых соусах и мексиканской кухне.',
        heatLevel: 'very-hot' as HeatLevel,
        color: ['оранжевый', 'красный', 'шоколадный'],
        plantHeight: { min: 45, max: 75, unit: 'cm' as const },
        daysToMaturity: { min: 90, max: 120 },
        fruitSize: {
          length: { min: 2, max: 6, unit: 'cm' as const },
          width: { min: 2, max: 4, unit: 'cm' as const },
        },
        growingTips: [
          'Требует очень теплого климата',
          'Долгий вегетационный период',
          'Полив умеренный',
          'Защита от ветра',
        ],
        origin: 'Мексика',
        category: 'habanero' as PepperCategory,
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      },
      {
        name: 'Болгарский перец',
        species: 'Capsicum annuum' as CapsicumSpecies,
        scientificName: 'Capsicum annuum',
        description:
          'Сладкий перец без остроты, богатый витаминами. Отлично подходит для салатов, фарширования и приготовления блюд.',
        heatLevel: 'no-heat' as HeatLevel,
        color: ['зеленый', 'желтый', 'красный', 'оранжевый'],
        plantHeight: { min: 50, max: 80, unit: 'cm' as const },
        daysToMaturity: { min: 60, max: 90 },
        fruitSize: {
          length: { min: 8, max: 15, unit: 'cm' as const },
          width: { min: 6, max: 10, unit: 'cm' as const },
        },
        growingTips: [
          'Любит богатую почву',
          'Регулярный полив',
          'Подвязка для крупных плодов',
          'Сбор в любой стадии зрелости',
        ],
        origin: 'Центральная Америка',
        category: 'bell' as PepperCategory,
        imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
      },
      {
        name: 'Кайенский перец',
        species: 'Capsicum annuum' as CapsicumSpecies,
        scientificName: 'Capsicum annuum',
        description:
          'Тонкий острый перец, часто используемый в сушеном виде как специя. Добавляет остроту в блюда.',
        heatLevel: 'hot' as HeatLevel,
        color: ['красный'],
        plantHeight: { min: 60, max: 120, unit: 'cm' as const },
        daysToMaturity: { min: 70, max: 85 },
        fruitSize: {
          length: { min: 10, max: 25, unit: 'cm' as const },
          width: { min: 1, max: 2, unit: 'cm' as const },
        },
        growingTips: [
          'Теплолюбивое растение',
          'Хорошо переносит засуху',
          'Отлично сушится',
          'Можно выращивать в горшках',
        ],
        origin: 'Французская Гвиана',
        category: 'cayenne' as PepperCategory,
        imageUrl: 'https://images.unsplash.com/photo-1603046891744-76e6300f82b8?w=400',
      },
    ];

    try {
      for (const variety of exampleVarieties) {
        await addVariety(variety);
      }
    } catch (error) {
      console.error('Error initializing examples:', error);
    }
  };

  return {
    // State
    varieties,
    loading,
    error,
    heatLevels,
    categories,
    species,

    // Computed
    favoriteVarieties,
    getHeatLevelInfo,
    getSpeciesInfo,

    // Methods
    loadVarieties,
    addVariety,
    updateVariety,
    deleteVariety,
    toggleFavorite,
    searchVarieties,
    importFromPepperSeeds,
    initializeWithExamples,
  };
});
