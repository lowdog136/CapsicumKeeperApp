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
  onSnapshot,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import type {
  PepperVariety,
  HeatLevel,
  PepperCategory,
  HeatLevelInfo,
  CapsicumSpecies,
} from 'src/components/models';
import { useErrorHandler } from 'src/composables/useErrorHandler';
import { useLogger } from 'src/composables/useLogger';

export const useVarietyLibraryStore = defineStore('varietyLibrary', () => {
  const varieties = ref<PepperVariety[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastCheckDate = ref<string | null>(null);
  let unsubscribe: (() => void) | null = null;
  
  const { handleErrorWithStore } = useErrorHandler();
  const logger = useLogger('VarietyLibrary');

  // Загрузка даты последней проверки из localStorage
  const loadLastCheckDate = () => {
    const saved = localStorage.getItem('varietyLibrary_lastCheck');
    if (saved) {
      lastCheckDate.value = saved;
    }
  };

  // Сохранение даты последней проверки
  const saveLastCheckDate = () => {
    const now = new Date().toISOString();
    lastCheckDate.value = now;
    localStorage.setItem('varietyLibrary_lastCheck', now);
  };

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
      // Отписываемся от предыдущего слушателя, если он есть
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      const varietiesRef = collection(db, 'pepper-varieties');
      const q = query(varietiesRef, orderBy('name'));

      // Подписываемся на изменения в реальном времени
      unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          console.log('✅ Получены изменения сортов, документов:', querySnapshot.size);

          varieties.value = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PepperVariety[];

          loading.value = false;
        },
        (err) => {
          console.error('❌ Ошибка при получении изменений сортов:', err);
          error.value = `Ошибка при получении изменений: ${err.message}`;
          loading.value = false;
        },
      );

      console.log('✅ Подписка на изменения сортов установлена');
    } catch (err) {
      error.value = 'Ошибка загрузки сортов: ' + (err as Error).message;
      console.error('Error loading varieties:', err);
      loading.value = false;
    }
  };

  // Отписка от изменений
  const unsubscribeVarieties = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      logger.log('Отписаны от изменений сортов');
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

      await addDoc(collection(db, 'pepper-varieties'), varietyData);
      logger.log('Сорт добавлен в Firestore');
      // onSnapshot автоматически обновит список сортов
    } catch (err) {
      handleErrorWithStore(err, error, 'Ошибка добавления сорта');
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
      logger.log('Сорт обновлен в Firestore');
      // onSnapshot автоматически обновит список сортов
    } catch (err) {
      handleErrorWithStore(err, error, 'Ошибка обновления сорта');
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
      logger.log('Сорт удален из Firestore');
      // onSnapshot автоматически обновит список сортов
    } catch (err) {
      handleErrorWithStore(err, error, 'Ошибка удаления сорта');
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

  // Полный импорт всех данных с pepperseeds.ru (оптимизированная версия)
  const importAllFromPepperSeeds = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Используем оптимизированный парсер для получения группированных данных
      const { getOptimizedVarieties } = await import('src/utils/pepper-seeds-parser');
      const pepperSeedsVarieties = getOptimizedVarieties();

      let addedCount = 0;
      let skippedCount = 0;

      // Добавляем все сорта в базу с проверкой на дублирование
      for (const variety of pepperSeedsVarieties) {
        // Проверяем, существует ли уже сорт с таким названием
        const existingVariety = varieties.value.find(
          (v) => v.name.toLowerCase() === variety.name.toLowerCase(),
        );

        if (existingVariety) {
          console.log(`Сорт "${variety.name}" уже существует, пропускаем`);
          skippedCount++;
          continue;
        }

        await addVariety(variety);
        addedCount++;
      }

      // Сохраняем дату импорта
      saveLastCheckDate();

      console.log(`Полный импорт завершен: добавлено ${addedCount}, пропущено ${skippedCount}`);
      return { added: addedCount, skipped: skippedCount, total: pepperSeedsVarieties.length };
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

  // Проверка наличия дубликатов (без удаления)
  const checkForDuplicates = () => {
    const seen = new Set<string>();
    const duplicates: PepperVariety[] = [];

    // Находим дубликаты по названию (без учета регистра)
    for (const variety of varieties.value) {
      const nameLower = variety.name.toLowerCase();
      if (seen.has(nameLower)) {
        duplicates.push(variety);
      } else {
        seen.add(nameLower);
      }
    }

    return {
      hasDuplicates: duplicates.length > 0,
      count: duplicates.length,
      duplicates: duplicates,
    };
  };

  // Удаление дубликатов сортов
  const removeDuplicates = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Сначала проверяем наличие дубликатов
      const duplicateCheck = checkForDuplicates();

      if (!duplicateCheck.hasDuplicates) {
        console.log('Дубликаты не найдены');
        return 0;
      }

      console.log(`Найдено ${duplicateCheck.count} дубликатов для удаления`);
      console.log(
        'Дубликаты:',
        duplicateCheck.duplicates.map((d) => `${d.name} (ID: ${d.id})`),
      );

      // Удаляем дубликаты из Firebase
      for (const duplicate of duplicateCheck.duplicates) {
        try {
          await deleteVariety(duplicate.id);
          console.log(`Удален дубликат: ${duplicate.name} (ID: ${duplicate.id})`);
        } catch (err) {
          console.error(`Ошибка удаления дубликата ${duplicate.name}:`, err);
        }
      }

      // onSnapshot автоматически обновит список сортов

      console.log(`Удаление дубликатов завершено. Удалено ${duplicateCheck.count} дубликатов`);
      return duplicateCheck.count;
    } catch (err) {
      error.value = 'Ошибка удаления дубликатов: ' + (err as Error).message;
      console.error('Error removing duplicates:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Проверка новых сортов с pepperseeds.ru (оптимизированная версия)
  const checkForNewVarieties = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Используем оптимизированный парсер для получения группированных данных
      const { getOptimizedVarieties } = await import('src/utils/pepper-seeds-parser');
      const pepperSeedsVarieties = getOptimizedVarieties();

      let newCount = 0;
      let existingCount = 0;

      // Проверяем каждый сорт на новизну
      for (const variety of pepperSeedsVarieties) {
        const existingVariety = varieties.value.find(
          (v) => v.name.toLowerCase() === variety.name.toLowerCase(),
        );

        if (existingVariety) {
          existingCount++;
        } else {
          newCount++;
        }
      }

      // Сохраняем дату проверки
      saveLastCheckDate();

      console.log(`Проверка завершена: новых ${newCount}, существующих ${existingCount}`);
      return {
        new: newCount,
        existing: existingCount,
        total: pepperSeedsVarieties.length,
        hasNew: newCount > 0,
      };
    } catch (err) {
      error.value = 'Ошибка проверки: ' + (err as Error).message;
      console.error('Error checking varieties:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Импорт только новых сортов (оптимизированная версия)
  const importNewVarieties = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Сначала проверяем, какие сорта новые
      const checkResult = await checkForNewVarieties();

      if (!checkResult.hasNew) {
        return { added: 0, skipped: 0, message: 'Новых сортов не найдено' };
      }

      // Импортируем только новые сорта
      const { getOptimizedVarieties } = await import('src/utils/pepper-seeds-parser');
      const pepperSeedsVarieties = getOptimizedVarieties();

      let addedCount = 0;

      for (const variety of pepperSeedsVarieties) {
        const existingVariety = varieties.value.find(
          (v) => v.name.toLowerCase() === variety.name.toLowerCase(),
        );

        if (!existingVariety) {
          await addVariety(variety);
          addedCount++;
        }
      }

      console.log(`Импорт новых сортов завершен: добавлено ${addedCount}`);
      return { added: addedCount, skipped: 0, message: `Добавлено ${addedCount} новых сортов` };
    } catch (err) {
      error.value = 'Ошибка импорта новых сортов: ' + (err as Error).message;
      console.error('Error importing new varieties:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Получить статистику по группам сортов
  const getVarietyGroupsStats = () => {
    const groups: Record<string, number> = {};

    varieties.value.forEach((variety) => {
      const baseName = variety.name.split(' ')[0];
      groups[baseName] = (groups[baseName] || 0) + 1;
    });

    return {
      totalGroups: Object.keys(groups).length,
      totalVarieties: varieties.value.length,
      groups: Object.entries(groups)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  };

  return {
    // State
    varieties,
    loading,
    error,
    heatLevels,
    categories,
    species,
    lastCheckDate,

    // Computed
    favoriteVarieties,
    getHeatLevelInfo,
    getSpeciesInfo,

    // Methods
    loadVarieties,
    unsubscribeVarieties,
    addVariety,
    updateVariety,
    deleteVariety,
    toggleFavorite,
    searchVarieties,
    importAllFromPepperSeeds,
    initializeWithExamples,
    removeDuplicates,
    loadLastCheckDate,
    saveLastCheckDate,
    checkForNewVarieties,
    importNewVarieties,
    checkForDuplicates,
    getVarietyGroupsStats,
  };
});
