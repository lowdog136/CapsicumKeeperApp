import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useUserStore } from './user-store';
import type {
  FertilizerComposition,
  SoilNutrientState,
  NutrientAddition,
  WateringBatch,
  WateringBatchStatus,
  WateringBatchTarget,
  WateringEvent,
  WateringEventTarget,
  WateringScheduleSettings,
  WateringSolutionIngredient,
  WateringSolutionRecipe,
} from 'src/components/models';
import {
  calculateSoilNutrients,
  getCurrentSoilNutrients,
} from 'src/utils/nutrient-absorption';

interface CreateSolutionRecipePayload {
  name: string;
  description?: string | null;
  waterVolumeMl: number;
  validForHours?: number | null;
  ingredients: WateringSolutionIngredient[];
  nutrientsPerLiter?: FertilizerComposition | null;
  totalNutrients?: FertilizerComposition | null;
}

interface UpdateSolutionRecipePayload
  extends Partial<Omit<WateringSolutionRecipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {}

interface CreateWateringBatchPayload {
  name: string;
  description?: string | null;
  recipeId?: string | null;
  preparedAt?: string;
  expiresAt?: string | null;
  totalVolumeMl: number;
  remainingVolumeMl?: number | null;
  waterTemperatureC?: number | null;
  nutrientsPerLiter?: FertilizerComposition | null;
  totalNutrients?: FertilizerComposition | null;
  targetPlants?: WateringBatchTarget[];
  notes?: string | null;
  status?: WateringBatchStatus;
}

interface UpdateWateringBatchPayload
  extends Partial<Omit<WateringBatch, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {}

interface ApplyWateringTarget {
  pepperId: string;
  volumeMl: number;
  seedlingSlot?: WateringBatchTarget['seedlingSlot'];
  consumption?: FertilizerComposition | null;
}

interface ApplyWateringPayload {
  batchId: string;
  targets: ApplyWateringTarget[];
  appliedAt?: string;
  notes?: string | null;
}

interface FirestoreWateringBatch extends Omit<WateringBatch, 'id'> {}
interface FirestoreSolutionRecipe extends Omit<WateringSolutionRecipe, 'id'> {}
interface FirestoreWateringEvent extends Omit<WateringEvent, 'id'> {}

type UnsubscribeFn = () => void;

const multiplyNutrients = (nutrients: FertilizerComposition | null | undefined, factor: number) => {
  const result: FertilizerComposition = {};
  if (!nutrients) {
    return result;
  }
  Object.entries(nutrients).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    result[key] = value * factor;
  });
  return result;
};

const addNutrients = (
  base: FertilizerComposition | null | undefined,
  delta: FertilizerComposition | null | undefined,
) => {
  const result: FertilizerComposition = { ...(base ?? {}) };
  if (!delta) {
    return result;
  }
  Object.entries(delta).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    const current = result[key] ?? 0;
    result[key] = current + value;
  });
  return result;
};

const subtractNutrients = (
  base: FertilizerComposition | null | undefined,
  deduction: FertilizerComposition | null | undefined,
) => {
  const result: FertilizerComposition = { ...(base ?? {}) };
  if (!deduction) {
    return result;
  }
  Object.entries(deduction).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    const current = result[key] ?? 0;
    result[key] = current - value;
  });
  return result;
};

const hasPositiveNutrients = (nutrients: FertilizerComposition | null | undefined) => {
  if (!nutrients) {
    return false;
  }
  return Object.values(nutrients).some((value) => (value ?? 0) > 0);
};

const normalizeSoilState = (
  state: SoilNutrientState | null | undefined,
  now: string,
  growthStage?: string,
) => {
  // Если есть существующее состояние, используем его, иначе создаем новое
  const existingState = state ?? {
    current: {},
    lastUpdated: now,
    additions: [],
  };

  // Если нет additions, инициализируем пустым массивом
  const additions = existingState.additions ?? [];

  // Пересчитываем current на основе истории (если есть история)
  let current = existingState.current ?? {};
  if (additions.length > 0) {
    current = calculateSoilNutrients(existingState, now, growthStage);
  }

  return {
    current,
    thresholds: existingState.thresholds ?? null,
    lastUpdated: now,
    lastWateredAt: now,
    lastFertilizedAt: existingState.lastFertilizedAt ?? null,
    additions,
    lastCalculatedAt: now,
  } as SoilNutrientState;
};

const mapRecipeSnapshot = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
): WateringSolutionRecipe => {
  const data = snapshot.data() as FirestoreSolutionRecipe;
  return {
    id: snapshot.id,
    ...data,
    description: data.description ?? null,
    validForHours: data.validForHours ?? null,
    nutrientsPerLiter: data.nutrientsPerLiter ?? null,
    totalNutrients: data.totalNutrients ?? null,
  };
};

const mapBatchSnapshot = (snapshot: QueryDocumentSnapshot<DocumentData>): WateringBatch => {
  const data = snapshot.data() as FirestoreWateringBatch;
  return {
    id: snapshot.id,
    ...data,
    description: data.description ?? null,
    recipeId: data.recipeId ?? null,
    expiresAt: data.expiresAt ?? null,
    waterTemperatureC: data.waterTemperatureC ?? null,
    nutrientsPerLiter: data.nutrientsPerLiter ?? null,
    totalNutrients: data.totalNutrients ?? null,
    targetPlants: Array.isArray(data.targetPlants) ? data.targetPlants : [],
    notes: data.notes ?? null,
  };
};

const mapEventSnapshot = (snapshot: QueryDocumentSnapshot<DocumentData>): WateringEvent => {
  const data = snapshot.data() as FirestoreWateringEvent;
  return {
    id: snapshot.id,
    ...data,
    notes: data.notes ?? null,
    nutrientTotals: data.nutrientTotals ?? null,
    targets: Array.isArray(data.targets) ? data.targets : [],
  };
};

export const useMassWateringStore = defineStore('mass-watering', () => {
  const userStore = useUserStore();

  const recipes = ref<WateringSolutionRecipe[]>([]);
  const batches = ref<WateringBatch[]>([]);
  const events = ref<Record<string, WateringEvent[]>>({});

  const loadingRecipes = ref(false);
  const loadingBatches = ref(false);
  const loadingEvents = ref<Record<string, boolean>>({});
  const error = ref<string | null>(null);

  let unsubscribeRecipes: UnsubscribeFn | null = null;
  let unsubscribeBatches: UnsubscribeFn | null = null;
  const unsubscribeEvents = new Map<string, UnsubscribeFn>();

  const currentUserId = computed(() => userStore.user?.uid ?? null);

  const recipesCollection = computed(() => collection(db, 'solutionRecipes'));
  const batchesCollection = computed(() => collection(db, 'wateringBatches'));

  const ensureAuthenticated = () => {
    if (!currentUserId.value) {
      throw new Error('Требуется авторизация');
    }
  };

  const resetState = () => {
    if (unsubscribeRecipes) {
      unsubscribeRecipes();
      unsubscribeRecipes = null;
    }
    if (unsubscribeBatches) {
      unsubscribeBatches();
      unsubscribeBatches = null;
    }
    unsubscribeEvents.forEach((fn) => fn());
    unsubscribeEvents.clear();
    recipes.value = [];
    batches.value = [];
    events.value = {};
    loadingRecipes.value = false;
    loadingBatches.value = false;
    loadingEvents.value = {};
    error.value = null;
  };

  const fetchRecipes = async () => {
    try {
      ensureAuthenticated();
      loadingRecipes.value = true;
      const q = query(
        recipesCollection.value,
        where('userId', '==', currentUserId.value),
        orderBy('createdAt', 'desc'),
      );
      const snapshot = await getDocs(q);
      recipes.value = snapshot.docs.map(mapRecipeSnapshot);
    } catch (e: any) {
      console.error('[massWatering] fetchRecipes error', e);
      error.value = e.message ?? 'Не удалось загрузить растворы';
    } finally {
      loadingRecipes.value = false;
    }
  };

  const subscribeRecipes = () => {
    if (!currentUserId.value) {
      resetState();
      return;
    }
    if (unsubscribeRecipes) {
      unsubscribeRecipes();
    }
    const q = query(
      recipesCollection.value,
      where('userId', '==', currentUserId.value),
      orderBy('createdAt', 'desc'),
    );
    unsubscribeRecipes = onSnapshot(
      q,
      (snapshot) => {
        recipes.value = snapshot.docs.map(mapRecipeSnapshot);
      },
      (err) => {
        console.error('[massWatering] subscribeRecipes error', err);
        error.value = err.message ?? 'Ошибка подписки на растворы';
      },
    );
  };

  const fetchBatches = async () => {
    try {
      ensureAuthenticated();
      loadingBatches.value = true;
      const q = query(
        batchesCollection.value,
        where('userId', '==', currentUserId.value),
        orderBy('preparedAt', 'desc'),
      );
      const snapshot = await getDocs(q);
      batches.value = snapshot.docs.map(mapBatchSnapshot);
    } catch (e: any) {
      console.error('[massWatering] fetchBatches error', e);
      error.value = e.message ?? 'Не удалось загрузить замесы';
    } finally {
      loadingBatches.value = false;
    }
  };

  const subscribeBatches = () => {
    if (!currentUserId.value) {
      resetState();
      return;
    }
    if (unsubscribeBatches) {
      unsubscribeBatches();
    }
    const q = query(
      batchesCollection.value,
      where('userId', '==', currentUserId.value),
      orderBy('preparedAt', 'desc'),
    );
    unsubscribeBatches = onSnapshot(
      q,
      (snapshot) => {
        batches.value = snapshot.docs.map(mapBatchSnapshot);
      },
      (err) => {
        console.error('[massWatering] subscribeBatches error', err);
        error.value = err.message ?? 'Ошибка подписки на замесы';
      },
    );
  };

  const fetchEventsForBatch = async (batchId: string) => {
    if (!batchId) return;
    try {
      ensureAuthenticated();
      loadingEvents.value = {
        ...loadingEvents.value,
        [batchId]: true,
      };
      const eventsCollection = collection(db, 'wateringBatches', batchId, 'events');
      const q = query(eventsCollection, orderBy('appliedAt', 'desc'));
      const snapshot = await getDocs(q);
      events.value = {
        ...events.value,
        [batchId]: snapshot.docs.map(mapEventSnapshot),
      };
    } catch (e: any) {
      console.error('[massWatering] fetchEventsForBatch error', e);
      error.value = e.message ?? 'Не удалось загрузить события полива';
    } finally {
      loadingEvents.value = {
        ...loadingEvents.value,
        [batchId]: false,
      };
    }
  };

  const subscribeEventsForBatch = (batchId: string) => {
    if (!batchId || !currentUserId.value) {
      return;
    }
    if (unsubscribeEvents.has(batchId)) {
      unsubscribeEvents.get(batchId)!();
    }
    const eventsCollection = collection(db, 'wateringBatches', batchId, 'events');
    const q = query(eventsCollection, orderBy('appliedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        events.value = {
          ...events.value,
          [batchId]: snapshot.docs.map(mapEventSnapshot),
        };
      },
      (err) => {
        console.error('[massWatering] subscribeEventsForBatch error', err);
        error.value = err.message ?? 'Ошибка подписки на историю поливов';
      },
    );
    unsubscribeEvents.set(batchId, unsubscribe);
  };

  const createSolutionRecipe = async (payload: CreateSolutionRecipePayload) => {
    ensureAuthenticated();
    const now = new Date().toISOString();
    await addDoc(recipesCollection.value, {
      userId: currentUserId.value,
      name: payload.name,
      description: payload.description ?? null,
      waterVolumeMl: payload.waterVolumeMl,
      validForHours: payload.validForHours ?? null,
      ingredients: payload.ingredients ?? [],
      nutrientsPerLiter: payload.nutrientsPerLiter ?? null,
      totalNutrients: payload.totalNutrients ?? null,
      createdAt: now,
      updatedAt: now,
    } satisfies FirestoreSolutionRecipe);
  };

  const updateSolutionRecipe = async (
    recipeId: string,
    updates: UpdateSolutionRecipePayload,
  ) => {
    ensureAuthenticated();
    if (!recipeId) {
      throw new Error('Не указан рецепт');
    }
    const recipeRef = doc(db, 'solutionRecipes', recipeId);
    await updateDoc(recipeRef, {
      ...updates,
      description: updates.description ?? null,
      validForHours: updates.validForHours ?? null,
      nutrientsPerLiter: updates.nutrientsPerLiter ?? null,
      totalNutrients: updates.totalNutrients ?? null,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteSolutionRecipe = async (recipeId: string) => {
    ensureAuthenticated();
    if (!recipeId) return;
    const recipeRef = doc(db, 'solutionRecipes', recipeId);
    await deleteDoc(recipeRef);
  };

  const createWateringBatch = async (payload: CreateWateringBatchPayload) => {
    ensureAuthenticated();
    const now = new Date().toISOString();
    const preparedAt = payload.preparedAt ?? now;
    const remainingVolume =
      payload.remainingVolumeMl ?? payload.totalVolumeMl ?? payload.totalVolumeMl;
    await addDoc(batchesCollection.value, {
      userId: currentUserId.value,
      name: payload.name,
      description: payload.description ?? null,
      recipeId: payload.recipeId ?? null,
      preparedAt,
      expiresAt: payload.expiresAt ?? null,
      status: payload.status ?? 'ready',
      totalVolumeMl: payload.totalVolumeMl,
      remainingVolumeMl: remainingVolume,
      waterTemperatureC: payload.waterTemperatureC ?? null,
      nutrientsPerLiter: payload.nutrientsPerLiter ?? null,
      totalNutrients: payload.totalNutrients ?? null,
      targetPlants: payload.targetPlants ?? [],
      notes: payload.notes ?? null,
      createdAt: now,
      updatedAt: now,
    } satisfies FirestoreWateringBatch);
  };

  const updateWateringBatch = async (
    batchId: string,
    updates: UpdateWateringBatchPayload,
  ) => {
    ensureAuthenticated();
    if (!batchId) {
      throw new Error('Не указан замес');
    }
    const batchRef = doc(db, 'wateringBatches', batchId);
    await updateDoc(batchRef, {
      ...updates,
      description: updates.description ?? null,
      recipeId: updates.recipeId ?? null,
      expiresAt: updates.expiresAt ?? null,
      waterTemperatureC: updates.waterTemperatureC ?? null,
      nutrientsPerLiter: updates.nutrientsPerLiter ?? null,
      totalNutrients: updates.totalNutrients ?? null,
      targetPlants: updates.targetPlants ?? [],
      notes: updates.notes ?? null,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteWateringBatch = async (batchId: string) => {
    ensureAuthenticated();
    if (!batchId) return;
    
    const batchRef = doc(db, 'wateringBatches', batchId);
    
    // Сначала читаем batch и события вне транзакции (для подготовки данных)
    const batchSnap = await getDoc(batchRef);
    if (!batchSnap.exists()) {
      throw new Error('Замес не найден');
    }
    const batchData = batchSnap.data() as FirestoreWateringBatch;
    
    if (batchData.userId !== currentUserId.value) {
      throw new Error('Нет доступа к замесу');
    }
    
    // Читаем все события полива для этого batch
    const eventsCollection = collection(batchRef, 'events');
    const eventsSnapshot = await getDocs(query(eventsCollection));
    
    // Собираем информацию о событиях
    const eventInfo: Array<{
      id: string;
      appliedAt: string;
      targets: Array<{ pepperId: string; volumeMl: number }>;
    }> = [];
    const affectedPepperIds = new Set<string>();
    
    eventsSnapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data() as FirestoreWateringEvent;
      eventInfo.push({
        id: eventDoc.id,
        appliedAt: eventData.appliedAt,
        targets: eventData.targets || [],
      });
      if (eventData.targets) {
        eventData.targets.forEach((target) => {
          affectedPepperIds.add(target.pepperId);
        });
      }
    });
    
    // Создаем мапу: pepperId -> массив событий с объемом и датой
    const pepperEventsMap = new Map<string, Array<{ date: string; volumeMl: number }>>();
    eventInfo.forEach((event) => {
      event.targets.forEach((target) => {
        if (!pepperEventsMap.has(target.pepperId)) {
          pepperEventsMap.set(target.pepperId, []);
        }
        pepperEventsMap.get(target.pepperId)!.push({
          date: event.appliedAt,
          volumeMl: target.volumeMl,
        });
      });
    });
    
    // Используем транзакцию для каскадного удаления
    await runTransaction(db, async (transaction) => {
      // ВСЕ READS ПЕРВЫМИ
      const batchSnapInTx = await transaction.get(batchRef);
      if (!batchSnapInTx.exists()) {
        throw new Error('Замес не найден');
      }
      
      // Читаем все затронутые перцы
      const pepperSnaps: Array<{
        ref: ReturnType<typeof doc>;
        snap: Awaited<ReturnType<typeof transaction.get>>;
        pepperId: string;
      }> = [];
      
      for (const pepperId of affectedPepperIds) {
        const pepperRef = doc(db, 'peppers', pepperId);
        const pepperSnap = await transaction.get(pepperRef);
        pepperSnaps.push({ ref: pepperRef, snap: pepperSnap, pepperId });
      }
      
      // ВСЕ WRITES ПОСЛЕ ВСЕХ READS
      const now = new Date().toISOString();
      
      // Обновляем перцы: удаляем поливы из истории и записи из additions
      for (const { ref: pepperRef, snap: pepperSnap, pepperId } of pepperSnaps) {
        if (!pepperSnap.exists()) continue;
        
        const pepperData = pepperSnap.data() as {
          userId?: string | null;
          wateringHistory?: Array<{ date: string; volume?: number }>;
          soilNutrients?: SoilNutrientState;
        };
        
        // Проверяем доступ
        if (pepperData.userId && pepperData.userId !== currentUserId.value) {
          continue; // Пропускаем перцы других пользователей
        }
        
        const pepperEvents = pepperEventsMap.get(pepperId) || [];
        const eventDates = new Set(pepperEvents.map((e) => e.date.split('T')[0]));
        const eventVolumes = new Map<string, number>();
        pepperEvents.forEach((e) => {
          const dateKey = e.date.split('T')[0];
          eventVolumes.set(dateKey, (eventVolumes.get(dateKey) || 0) + e.volumeMl);
        });
        
        const updates: Record<string, unknown> = {
          updatedAt: now,
        };
        
        // Удаляем поливы из wateringHistory, которые совпадают по дате и объему
        if (pepperData.wateringHistory) {
          const filteredHistory = pepperData.wateringHistory.filter((entry) => {
            const entryDate = entry.date.split('T')[0];
            if (!eventDates.has(entryDate)) {
              return true; // Оставляем поливы с другими датами
            }
            // Если дата совпадает, проверяем объем
            const expectedVolume = eventVolumes.get(entryDate);
            if (expectedVolume && entry.volume === expectedVolume) {
              return false; // Удаляем полив, если дата и объем совпадают
            }
            return true; // Оставляем, если объем не совпадает
          });
          updates.wateringHistory = filteredHistory;
        }
        
        // Удаляем записи из soilNutrients.additions, связанные с этим batch
        if (pepperData.soilNutrients?.additions) {
          const filteredAdditions = pepperData.soilNutrients.additions.filter((addition) => {
            if (addition.source === 'watering') {
              const additionDate = addition.date.split('T')[0];
              return !eventDates.has(additionDate);
            }
            return true; // Оставляем записи из других источников
          });
          
          // Пересчитываем current на основе оставшихся additions
          const updatedSoil: SoilNutrientState = {
            ...pepperData.soilNutrients,
            additions: filteredAdditions,
            lastCalculatedAt: now,
          };
          
          if (filteredAdditions.length > 0) {
            updatedSoil.current = calculateSoilNutrients(updatedSoil, now);
          } else {
            updatedSoil.current = {};
          }
          
          updates.soilNutrients = updatedSoil;
        }
        
        // Обновляем userId для старых записей
        if (!pepperData.userId) {
          updates.userId = currentUserId.value;
        }
        
        transaction.update(pepperRef, updates);
      }
      
      // Удаляем все события
      for (const event of eventInfo) {
        const eventRef = doc(eventsCollection, event.id);
        transaction.delete(eventRef);
      }
      
      // Удаляем batch
      transaction.delete(batchRef);
    });
  };

  const applyWatering = async (payload: ApplyWateringPayload) => {
    ensureAuthenticated();
    if (!payload.batchId) {
      throw new Error('Не указан замес');
    }
    if (!payload.targets?.length) {
      throw new Error('Не выбраны растения для полива');
    }
    const now = new Date().toISOString();
    const totalVolumeMl = payload.targets.reduce(
      (sum, target) => sum + Math.max(target.volumeMl, 0),
      0,
    );

    await runTransaction(db, async (transaction) => {
      // ВСЕ READS ПЕРВЫМИ
      const batchRef = doc(db, 'wateringBatches', payload.batchId);
      const batchSnap = await transaction.get(batchRef);
      if (!batchSnap.exists()) {
        throw new Error('Раствор не найден');
      }
      const batchData = batchSnap.data() as FirestoreWateringBatch;
      if (batchData.userId !== currentUserId.value) {
        throw new Error('Нет доступа к раствору');
      }
      if (batchData.status === 'discarded') {
        throw new Error('Раствор уже списан');
      }

      if (batchData.expiresAt) {
        const expiresAtMs = new Date(batchData.expiresAt).getTime();
        if (!Number.isNaN(expiresAtMs) && expiresAtMs < Date.now()) {
          throw new Error('Раствор просрочен');
        }
      }

      const remainingVolume = batchData.remainingVolumeMl ?? batchData.totalVolumeMl ?? 0;
      if (totalVolumeMl > remainingVolume + 1e-6) {
        throw new Error('Недостаточно раствора');
      }

      const nutrientPerLiter = batchData.nutrientsPerLiter ?? null;

      // Читаем все перцы (ВСЕ READS ПЕРВЫМИ)
      const pepperSnaps: Array<{ snap: Awaited<ReturnType<typeof transaction.get>>; target: ApplyWateringTarget }> = [];

      for (const target of payload.targets) {
        const pepperRef = doc(db, 'peppers', target.pepperId);
        const pepperSnap = await transaction.get(pepperRef);
        pepperSnaps.push({ snap: pepperSnap, target });
      }

      // ВСЕ WRITES ПОСЛЕ ВСЕХ READS
      const eventTargets: WateringEventTarget[] = [];
      let nutrientTotals: FertilizerComposition | null = null;

      for (const { snap, target } of pepperSnaps) {
        if (!snap.exists()) {
          console.warn('[massWatering] pepper not found', target.pepperId);
          continue;
        }
        const pepperData = snap.data() as {
          userId?: string | null;
          stage?: string;
          soilNutrients?: SoilNutrientState;
          wateringSchedule?: WateringScheduleSettings;
          wateringHistory?: Array<{ date: string; volume?: number }>;
        };
        if (
          pepperData.userId &&
          pepperData.userId !== currentUserId.value
        ) {
          throw new Error('Нет доступа к растениям для полива');
        }

        const addition = multiplyNutrients(
          nutrientPerLiter,
          target.volumeMl > 0 ? target.volumeMl / 1000 : 0,
        );
        const consumption = target.consumption ?? null;
        nutrientTotals = addNutrients(nutrientTotals, addition);

        // Нормализуем состояние почвы (с учетом стадии роста)
        const growthStage = pepperData.stage;
        const normalizedSoil = normalizeSoilState(pepperData.soilNutrients, now, growthStage);

        // Если есть элементы для добавления, добавляем запись в историю
        // Даже если addition пустой, обновляем lastWateredAt
        if (hasPositiveNutrients(addition)) {
          // Получаем информацию об усвояемости из рецепта (если есть)
          // TODO: В будущем можно получать информацию из ingredients рецепта
          const newAddition: NutrientAddition = {
            date: now,
            amount: addition,
            source: 'watering',
            sourceId: null, // будет установлен после создания события
            // Информация об усвояемости будет добавлена позже, если рецепт содержит удобрения
            availabilityType: 'medium', // По умолчанию средняя усвояемость для растворов
            absorptionMultipliers: null,
          };

          // Добавляем новое внесение в историю
          normalizedSoil.additions = [...(normalizedSoil.additions ?? []), newAddition];

          // Пересчитываем текущее состояние на основе всей истории (с учетом стадии роста)
          normalizedSoil.current = calculateSoilNutrients(normalizedSoil, now, growthStage);
          normalizedSoil.lastCalculatedAt = now;
          normalizedSoil.lastFertilizedAt = now;
        } else {
          // Если нет элементов, но был полив, обновляем только lastWateredAt
          // и пересчитываем current на основе существующих additions
          if (normalizedSoil.additions && normalizedSoil.additions.length > 0) {
            normalizedSoil.current = calculateSoilNutrients(normalizedSoil, now, growthStage);
            normalizedSoil.lastCalculatedAt = now;
          }
        }

        // Если указано потребление (например, при ручном вычитании), вычитаем его из current
        if (consumption && hasPositiveNutrients(consumption)) {
          normalizedSoil.current = subtractNutrients(normalizedSoil.current, consumption);
        }

        // Обновляем историю поливов
        const existingWateringHistory = pepperData.wateringHistory ?? [];
        const wateringHistoryEntry = {
          date: now,
          volume: target.volumeMl,
        };
        const updatedWateringHistory = [...existingWateringHistory, wateringHistoryEntry];

        const pepperUpdate: Record<string, unknown> = {
          soilNutrients: normalizedSoil,
          wateringHistory: updatedWateringHistory,
          updatedAt: now,
        };

        if (!pepperData.userId) {
          pepperUpdate.userId = currentUserId.value;
        }

        const pepperRef = doc(db, 'peppers', target.pepperId);
        transaction.update(pepperRef, pepperUpdate);

        eventTargets.push({
          pepperId: target.pepperId,
          volumeMl: target.volumeMl,
          seedlingSlot: target.seedlingSlot ?? null,
          nutrientDelta: addition,
          consumption,
        });
      }

      // Обновляем список целевых растений - добавляем новые, если их нет
      const existingTargetPlants = batchData.targetPlants ?? [];
      const existingPepperIds = new Set(existingTargetPlants.map((t) => t.pepperId));
      const newTargetPlants: WateringBatchTarget[] = [...existingTargetPlants];

      // Добавляем новые перцы в список целевых растений
      for (const target of payload.targets) {
        if (!existingPepperIds.has(target.pepperId)) {
          newTargetPlants.push({
            pepperId: target.pepperId,
            seedlingSlot: target.seedlingSlot ?? null,
            plannedVolumeMl: target.volumeMl ?? null,
          });
        }
      }

      const eventsCollection = collection(batchRef, 'events');
      const eventRef = doc(eventsCollection);
      const batchUpdate: Record<string, unknown> = {
        remainingVolumeMl: Math.max(remainingVolume - totalVolumeMl, 0),
        targetPlants: newTargetPlants,
        updatedAt: now,
      };

      if ((batchUpdate.remainingVolumeMl as number) <= 0) {
        batchUpdate.status = 'applied';
      }

      transaction.update(batchRef, batchUpdate);

      const eventData: FirestoreWateringEvent = {
        batchId: payload.batchId,
        userId: currentUserId.value!,
        appliedAt: payload.appliedAt ?? now,
        notes: payload.notes ?? null,
        totalVolumeMl,
        targets: eventTargets,
        nutrientTotals: nutrientTotals ?? null,
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(eventRef, eventData);
    });
  };

  const discardBatch = async (batchId: string, notes?: string | null) => {
    ensureAuthenticated();
    if (!batchId) return;
    const batchRef = doc(db, 'wateringBatches', batchId);
    await updateDoc(batchRef, {
      status: 'discarded',
      notes: notes ?? null,
      updatedAt: new Date().toISOString(),
    });
  };

  const $reset = () => {
    resetState();
  };

  return {
    recipes,
    batches,
    events,
    loadingRecipes,
    loadingBatches,
    loadingEvents,
    error,
    currentUserId,
    fetchRecipes,
    subscribeRecipes,
    fetchBatches,
    subscribeBatches,
    fetchEventsForBatch,
    subscribeEventsForBatch,
    createSolutionRecipe,
    updateSolutionRecipe,
    deleteSolutionRecipe,
    createWateringBatch,
    updateWateringBatch,
    deleteWateringBatch,
    applyWatering,
    discardBatch,
    $reset,
  };
});

