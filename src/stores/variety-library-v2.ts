import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
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

  function setLastManualUpdate(dateStr?: string) {
    lastManualUpdate.value = dateStr || new Date().toISOString();
  }

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
    lastManualUpdate,
    setLastManualUpdate,
  };
});
