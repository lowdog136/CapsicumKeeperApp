import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  addDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { globalCache } from 'src/composables/useCache';

export interface PepperVarietyV2 {
  id: string;
  name: string;
  species?: string;
  description?: string;
  shu?: number[];
  color?: string[];
  length?: number;
  weight?: number;
  plantHeight?: any;
  fruitLength?: any;
  daysToMaturity?: string;
  origin?: string;
  // ... другие поля по необходимости
}

export const useVarietyLibraryV2Store = defineStore('variety-library-v2', () => {
  const items = ref<PepperVarietyV2[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pageSize = ref(24);
  const cursorStack = ref<(QueryDocumentSnapshot<DocumentData> | null)[]>([]); // стек курсоров
  const hasNextPage = ref(false);
  const currentPage = ref(1);
  const totalCount = ref(0); // Можно обновлять при импорте или отдельным запросом
  const allItems = ref<PepperVarietyV2[]>([]);
  const lastManualUpdate = ref<string>('');
  const importProgress = ref({
    current: 0,
    total: 0,
    added: 0,
    skipped: 0,
    currentVariety: '',
  });

  function setLastManualUpdate(dateStr?: string) {
    lastManualUpdate.value = dateStr || new Date().toISOString();
  }

  // Импорт сортов с проверкой дубликатов и индикацией прогресса
  const importVarieties = async (
    varietiesToImport: Omit<PepperVarietyV2, 'id'>[],
    onProgress?: (progress: typeof importProgress.value) => void,
  ) => {
    loading.value = true;
    error.value = null;

    // Сбрасываем прогресс
    importProgress.value = {
      current: 0,
      total: varietiesToImport.length,
      added: 0,
      skipped: 0,
      currentVariety: '',
    };

    try {
      // Загружаем все существующие сорта для проверки дубликатов
      console.log('Загружаем существующие сорта для проверки дубликатов...');
      const existingSnapshot = await getDocs(query(collection(db, 'varieties_v2'), orderBy('name')));
      const existingVarieties = existingSnapshot.docs.map((doc) => {
        const data = doc.data() as PepperVarietyV2;
        return {
          id: doc.id,
          name: data.name?.toLowerCase().trim() || '',
        };
      });

      // Создаем Set для быстрой проверки дубликатов
      const existingNamesSet = new Set(existingVarieties.map((v) => v.name));

      console.log(`Найдено ${existingVarieties.length} существующих сортов`);
      console.log(`Импортируем ${varietiesToImport.length} новых сортов...`);

      let addedCount = 0;
      let skippedCount = 0;

      // Импортируем сорта с прогрессом
      for (let i = 0; i < varietiesToImport.length; i++) {
        const variety = varietiesToImport[i];
        const varietyName = variety.name?.toLowerCase().trim() || '';

        // Обновляем прогресс
        importProgress.value.current = i + 1;
        importProgress.value.currentVariety = variety.name || '';

        // Проверяем дубликат
        if (existingNamesSet.has(varietyName)) {
          skippedCount++;
          importProgress.value.skipped = skippedCount;
          console.log(`[${i + 1}/${varietiesToImport.length}] Пропущен дубликат: "${variety.name}"`);
        } else {
          try {
            // Добавляем новый сорт
            await addDoc(collection(db, 'varieties_v2'), {
              ...variety,
              // Убираем id если он есть (будет создан автоматически)
              name: variety.name.trim(),
            });

            // Добавляем в Set существующих, чтобы не дублировать в рамках одного импорта
            existingNamesSet.add(varietyName);
            addedCount++;
            importProgress.value.added = addedCount;

            console.log(`[${i + 1}/${varietiesToImport.length}] Добавлен: "${variety.name}"`);
          } catch (e: any) {
            console.error(`Ошибка при добавлении "${variety.name}":`, e);
            skippedCount++;
            importProgress.value.skipped = skippedCount;
          }
        }

        // Вызываем callback прогресса (каждые 10 элементов или на последнем)
        if (onProgress && (i % 10 === 0 || i === varietiesToImport.length - 1)) {
          onProgress({ ...importProgress.value });
        }

        // Небольшая задержка для избежания rate limiting
        if (i % 50 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Очищаем кэш после импорта
      globalCache.clear();

      // Обновляем дату последнего обновления
      setLastManualUpdate();

      const result = {
        total: varietiesToImport.length,
        added: addedCount,
        skipped: skippedCount,
      };

      console.log('Импорт завершен:', result);
      return result;
    } catch (e: any) {
      error.value = e.message || 'Ошибка импорта';
      console.error('[importVarieties] error:', error.value);
      throw e;
    } finally {
      loading.value = false;
      // Сбрасываем прогресс через небольшую задержку
      setTimeout(() => {
        importProgress.value = {
          current: 0,
          total: 0,
          added: 0,
          skipped: 0,
          currentVariety: '',
        };
      }, 2000);
    }
  };

  // Загрузка первой страницы с кэшированием
  const fetchFirstPage = async () => {
    const cacheKey = `varieties_v2_page_1_${pageSize.value}`;

    // Проверяем кэш
    const cachedData = globalCache.get<{
      items: PepperVarietyV2[];
      hasNextPage: boolean;
    }>(cacheKey);

    if (cachedData) {
      console.log('[fetchFirstPage] загружено из кэша');
      items.value = cachedData.items;
      hasNextPage.value = cachedData.hasNextPage;
      currentPage.value = 1;
      cursorStack.value = [null];
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      console.log('[fetchFirstPage] start');
      const q = query(collection(db, 'varieties_v2'), orderBy('name'), limit(pageSize.value));
      const snap = await getDocs(q);
      console.log(
        '[fetchFirstPage] docs:',
        snap.docs.length,
        snap.docs.map((d) => d.id),
      );

      const fetchedItems = snap.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() } as PepperVarietyV2;
        (data as any)._docRef = doc;
        return data;
      });

      items.value = fetchedItems;
      cursorStack.value = [null];
      console.log('[fetchFirstPage] cursorStack:', cursorStack.value);
      hasNextPage.value = snap.docs.length === pageSize.value;
      currentPage.value = 1;
      console.log('[fetchFirstPage] currentPage:', currentPage.value);

      // Кэшируем результат на 10 минут
      globalCache.set(
        cacheKey,
        {
          items: fetchedItems,
          hasNextPage: hasNextPage.value,
        },
        10 * 60 * 1000,
      );
    } catch (e: any) {
      error.value = e.message || 'Ошибка загрузки';
      console.error('[fetchFirstPage] error:', error.value);
    } finally {
      loading.value = false;
    }
  };

  // Загрузка следующей страницы
  const fetchNextPage = async () => {
    if (loading.value) return;
    const lastCursor =
      items.value.length > 0 ? (items.value as any)[items.value.length - 1]._docRef : null;
    if (!lastCursor) return;

    const cacheKey = `varieties_v2_page_${currentPage.value + 1}_${pageSize.value}`;

    // Проверяем кэш
    const cachedData = globalCache.get<{
      items: PepperVarietyV2[];
      hasNextPage: boolean;
    }>(cacheKey);

    if (cachedData) {
      console.log('[fetchNextPage] загружено из кэша');
      items.value = cachedData.items;
      hasNextPage.value = cachedData.hasNextPage;
      currentPage.value++;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const q = query(
        collection(db, 'varieties_v2'),
        orderBy('name'),
        startAfter(lastCursor),
        limit(pageSize.value),
      );
      const snap = await getDocs(q);
      console.log(
        '[fetchNextPage] docs:',
        snap.docs.length,
        snap.docs.map((d) => d.id),
      );

      const fetchedItems = snap.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() } as PepperVarietyV2;
        (data as any)._docRef = doc;
        return data;
      });

      items.value = fetchedItems;
      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      if (lastDoc) {
        cursorStack.value.push(lastDoc);
        currentPage.value++;
      }
      hasNextPage.value = snap.docs.length === pageSize.value;
      console.log('[fetchNextPage] currentPage:', currentPage.value);
      console.log('[fetchNextPage] cursorStack:', cursorStack.value);

      // Кэшируем результат на 10 минут
      globalCache.set(
        cacheKey,
        {
          items: fetchedItems,
          hasNextPage: hasNextPage.value,
        },
        10 * 60 * 1000,
      );
    } catch (e: any) {
      error.value = e.message || 'Ошибка загрузки';
      console.error('[fetchNextPage] error:', error.value);
    } finally {
      loading.value = false;
    }
  };

  // Загрузка предыдущей страницы
  const fetchPrevPage = async () => {
    if (loading.value) return;
    if (currentPage.value <= 1 || cursorStack.value.length <= 1) return;

    const cacheKey = `varieties_v2_page_${currentPage.value - 1}_${pageSize.value}`;

    // Проверяем кэш
    const cachedData = globalCache.get<{
      items: PepperVarietyV2[];
      hasNextPage: boolean;
    }>(cacheKey);

    if (cachedData) {
      console.log('[fetchPrevPage] загружено из кэша');
      items.value = cachedData.items;
      hasNextPage.value = cachedData.hasNextPage;
      currentPage.value--;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      // Для перехода назад используем курсор на 2 позициях назад (до pop)
      const prevCursor =
        cursorStack.value.length > 2 ? cursorStack.value[cursorStack.value.length - 2] : null;
      const q = prevCursor
        ? query(
            collection(db, 'varieties_v2'),
            orderBy('name'),
            startAfter(prevCursor),
            limit(pageSize.value),
          )
        : query(collection(db, 'varieties_v2'), orderBy('name'), limit(pageSize.value));
      const snap = await getDocs(q);
      console.log(
        '[fetchPrevPage] docs:',
        snap.docs.length,
        snap.docs.map((d) => d.id),
      );

      const fetchedItems = snap.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() } as PepperVarietyV2;
        (data as any)._docRef = doc;
        return data;
      });

      items.value = fetchedItems;
      if (cursorStack.value.length > 1) {
        cursorStack.value.pop();
        currentPage.value--;
      }
      hasNextPage.value = snap.docs.length === pageSize.value;
      console.log('[fetchPrevPage] currentPage:', currentPage.value);
      console.log('[fetchPrevPage] cursorStack:', cursorStack.value);

      // Кэшируем результат на 10 минут
      globalCache.set(
        cacheKey,
        {
          items: fetchedItems,
          hasNextPage: hasNextPage.value,
        },
        10 * 60 * 1000,
      );
    } catch (e: any) {
      error.value = e.message || 'Ошибка загрузки';
      console.error('[fetchPrevPage] error:', error.value);
    } finally {
      loading.value = false;
    }
  };

  // Загрузка всех сортов (для поиска/фильтрации) с кэшированием
  const fetchAllItems = async () => {
    const cacheKey = 'varieties_v2_all_items';

    // Проверяем кэш (кэшируем на 30 минут)
    const cachedData = globalCache.get<PepperVarietyV2[]>(cacheKey);
    if (cachedData) {
      console.log('[fetchAllItems] загружено из кэша');
      allItems.value = cachedData;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const snap = await getDocs(query(collection(db, 'varieties_v2'), orderBy('name')));
      const fetchedItems = snap.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() } as PepperVarietyV2;
        (data as any)._docRef = doc;
        return data;
      });

      allItems.value = fetchedItems;

      // Кэшируем на 30 минут
      globalCache.set(cacheKey, fetchedItems, 30 * 60 * 1000);
    } catch (e: any) {
      error.value = e.message || 'Ошибка загрузки';
      console.error('[fetchAllItems] error:', error.value);
    } finally {
      loading.value = false;
    }
  };

  // Поиск сортов через Firestore (более эффективно, чем клиентская фильтрация)
  const searchVarieties = async (searchTerm: string, species?: string) => {
    // Не показываем loading для поиска, чтобы не блокировать UI
    // loading.value = true;
    error.value = null;

    try {
      let q: any = collection(db, 'varieties_v2');

      // Если есть поисковый запрос (минимум 2 символа), используем Firestore where
      if (searchTerm && searchTerm.trim().length >= 2) {
        const searchLower = searchTerm.trim().toLowerCase();
        // Используем range query для поиска по началу строки
        q = query(
          q,
          where('name', '>=', searchLower),
          where('name', '<=', searchLower + '\uf8ff'),
          orderBy('name'),
          limit(50), // Уменьшаем лимит для лучшей производительности
        );
      } else if (species) {
        // Если только фильтр по виду без поиска, используем where для вида
        q = query(
          q,
          where('species', '==', species),
          orderBy('name'),
          limit(50),
        );
      } else {
        // Если нет поиска и фильтра, возвращаем пустой массив
        return [];
      }

      // Добавляем фильтр по виду, если указан вместе с поиском
      if (species && searchTerm && searchTerm.trim().length >= 2) {
        // Если есть и поиск, и фильтр по виду, используем клиентскую фильтрацию
        // (требуется составной индекс в Firestore для оптимизации)
        const snap = await getDocs(q);
        let fetchedItems = snap.docs.map((doc) => {
          const data = { id: doc.id, ...doc.data() } as PepperVarietyV2;
          (data as any)._docRef = doc;
          return data;
        });

        // Фильтруем по виду на клиенте
        fetchedItems = fetchedItems.filter((v) => v.species === species);

        return fetchedItems;
      }

      const snap = await getDocs(q);
      const fetchedItems = snap.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() } as PepperVarietyV2;
        (data as any)._docRef = doc;
        return data;
      });

      return fetchedItems;
    } catch (e: any) {
      error.value = e.message || 'Ошибка поиска';
      console.error('[searchVarieties] error:', error.value);
      return [];
    } finally {
      // Не сбрасываем loading, так как не устанавливали его
      // loading.value = false;
    }
  };

  return {
    items,
    loading,
    error,
    pageSize,
    hasNextPage,
    currentPage,
    fetchFirstPage,
    fetchNextPage,
    fetchPrevPage,
    totalCount,
    allItems,
    fetchAllItems,
    searchVarieties,
    lastManualUpdate,
    setLastManualUpdate,
    importVarieties,
    importProgress,
  };
});
