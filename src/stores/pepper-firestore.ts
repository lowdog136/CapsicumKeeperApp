import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../boot/firebase';
import {
  collection,
  getDocs,
  addDoc,
  doc as firestoreDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  doc,
} from 'firebase/firestore';
import type { Pepper } from 'src/components/models';
import { useUserStore } from './user-store';
import { useErrorHandler } from 'src/composables/useErrorHandler';
import { useLogger } from 'src/composables/useLogger';

export const usePepperFirestore = defineStore('pepperFirestore', () => {
  // State
  const peppers = ref<Pepper[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let unsubscribe: (() => void) | null = null;
  
  const { handleErrorWithStore } = useErrorHandler();
  const logger = useLogger('PepperFirestore');

  const userStore = useUserStore();

  // Подписка на изменения перцев в реальном времени
  const fetchPeppers = async () => {
    // Предотвращаем множественные одновременные вызовы
    if (loading.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Если пользователь не авторизован, возвращаем пустой массив
      if (!userStore.user) {
        // Отписываемся от предыдущего слушателя, если он есть
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        peppers.value = [];
        loading.value = false;
        return;
      }

      // Отписываемся от предыдущего слушателя, если он есть
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      // Создаем запрос для перцев текущего пользователя
      const peppersRef = collection(db, 'peppers');
      const q = query(peppersRef, where('userId', '==', userStore.user.uid));

      // Подписываемся на изменения в реальном времени
      unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          logger.log('Получены изменения перцев, документов:', querySnapshot.size);

          // Обновляем массив перцев с нормализацией данных для отображения
          peppers.value = querySnapshot.docs.map((docSnapshot) => {
            const data = docSnapshot.data();
            const pepper = {
              id: docSnapshot.id,
              ...data,
            } as Pepper;

            // Нормализуем поле location только для отображения, если оно отсутствует или некорректно
            // Не обновляем базу автоматически - это делается только при явном редактировании
            if (!pepper.location || typeof pepper.location !== 'object' || Array.isArray(pepper.location)) {
              pepper.location = {
                type: 'грунт' as Pepper['location']['type'],
                potVolume: '',
              };
            } else if (!pepper.location.type || typeof pepper.location.type !== 'string') {
              // Если location есть, но type отсутствует или некорректен
              pepper.location = {
                type: 'грунт' as Pepper['location']['type'],
                potVolume: pepper.location.potVolume || '',
              };
            }

            return pepper;
          });

          loading.value = false;
        },
        (err) => {
          handleErrorWithStore(err, error, 'Ошибка при получении изменений перцев');
          loading.value = false;
        },
      );

      logger.log('Подписка на изменения перцев установлена');
    } catch (err) {
      handleErrorWithStore(err, error, 'Ошибка загрузки перцев');
      peppers.value = [];
      loading.value = false;
    }
  };

  // Отписка от изменений
  const unsubscribePeppers = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      logger.log('Отписаны от изменений перцев');
    }
  };

  // Функция для миграции существующих перцев без userId
  const migrateExistingPeppers = async () => {
    if (!userStore.user) {
      throw new Error('Только авторизованный пользователь может выполнять миграцию');
    }

    try {
      console.log('Начинаем миграцию существующих перцев...');

      // Получаем все перцы без userId
      const peppersRef = collection(db, 'peppers');
      const q = query(peppersRef, where('userId', '==', null));
      const querySnapshot = await getDocs(q);

      console.log(`Найдено ${querySnapshot.size} перцев для миграции`);

      let migratedCount = 0;

      for (const pepperDoc of querySnapshot.docs) {
        const pepperData = pepperDoc.data();

        // Добавляем userId к существующему перцу
        await updateDoc(firestoreDoc(db, 'peppers', pepperDoc.id), {
          userId: userStore.user!.uid,
          updatedAt: new Date().toISOString(),
        });

        console.log(`Мигрирован перец "${pepperData.name}" с ID: ${pepperDoc.id}`);
        migratedCount++;
      }

      console.log(`Миграция завершена! Мигрировано: ${migratedCount}`);
      // onSnapshot автоматически обновит список перцев

      return migratedCount;
    } catch (error) {
      console.error('Error migrating peppers:', error);
      throw error;
    }
  };

  // Функция для миграции ВСЕХ перцев к текущему пользователю (для консоли браузера)
  const migrateAllPeppersToCurrentUser = async () => {
    if (!userStore.user) {
      throw new Error('Только авторизованный пользователь может выполнять миграцию');
    }

    try {
      console.log('Начинаем миграцию ВСЕХ перцев к текущему пользователю...');

      // Получаем ВСЕ перцы
      const peppersRef = collection(db, 'peppers');
      const querySnapshot = await getDocs(peppersRef);

      console.log(`Найдено ${querySnapshot.size} перцев для миграции`);

      let migratedCount = 0;

      for (const pepperDoc of querySnapshot.docs) {
        const pepperData = pepperDoc.data();

        // Обновляем userId для всех перцев
        await updateDoc(firestoreDoc(db, 'peppers', pepperDoc.id), {
          userId: userStore.user!.uid,
          updatedAt: new Date().toISOString(),
        });

        console.log(`Мигрирован перец "${pepperData.name}" с ID: ${pepperDoc.id}`);
        migratedCount++;
      }

      console.log(`Миграция завершена! Мигрировано: ${migratedCount}`);
      // onSnapshot автоматически обновит список перцев

      return migratedCount;
    } catch (error) {
      console.error('Error migrating all peppers:', error);
      throw error;
    }
  };

  // Функция для удаления всех перцев (очистка тестовых данных)
  const clearAllPeppers = async () => {
    if (!userStore.user) {
      throw new Error('Только авторизованный пользователь может очищать данные');
    }

    try {
      console.log('Начинаем очистку всех перцев...');

      // Получаем ВСЕ перцы
      const peppersRef = collection(db, 'peppers');
      const querySnapshot = await getDocs(peppersRef);

      console.log(`Найдено ${querySnapshot.size} перцев для удаления`);

      let deletedCount = 0;

      for (const pepperDoc of querySnapshot.docs) {
        const pepperData = pepperDoc.data();

        // Удаляем перец
        await deleteDoc(firestoreDoc(db, 'peppers', pepperDoc.id));

        console.log(`Удален перец "${pepperData.name}" с ID: ${pepperDoc.id}`);
        deletedCount++;
      }

      console.log(`Очистка завершена! Удалено: ${deletedCount}`);
      // onSnapshot автоматически обновит список перцев

      return deletedCount;
    } catch (error) {
      console.error('Error clearing peppers:', error);
      throw error;
    }
  };

  // Функция для проверки данных в консоли браузера
  const debugPeppers = async () => {
    try {
      console.log('=== ДЕБАГ ПЕРЦЕВ ===');

      // Получаем все перцы
      const peppersRef = collection(db, 'peppers');
      const querySnapshot = await getDocs(peppersRef);

      console.log(`Всего перцев в базе: ${querySnapshot.size}`);

      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Перец ${index + 1}:`, {
          id: doc.id,
          name: data.name,
          userId: data.userId,
          stage: data.stage,
          createdAt: data.createdAt,
        });
      });

      console.log('Текущий пользователь:', userStore.user?.uid);

      // Проверяем загруженные перцы в store
      console.log('Перцы в store:', peppers.value);

      console.log('=== КОНЕЦ ДЕБАГА ===');
    } catch (error) {
      console.error('Ошибка при дебаге:', error);
    }
  };

  const addPepper = async (pepper: Omit<Pepper, 'id'>) => {
    if (!userStore.user) {
      throw new Error('Только авторизованный пользователь может добавлять перцы');
    }

    try {
      const pepperData = {
        ...pepper,
        userId: userStore.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'peppers'), pepperData);
      logger.log('Перец добавлен в Firestore');
      // onSnapshot автоматически обновит список перцев
    } catch (err) {
      logger.error('Error adding pepper:', err);
      throw err;
    }
  };

  const updatePepper = async (id: string, pepper: Partial<Pepper>) => {
    try {
      // Очищаем объект от undefined значений и id
      const cleanPepper = Object.fromEntries(
        Object.entries(pepper).filter(([key, value]) => {
          // Исключаем id и undefined значения
          if (key === 'id' || value === undefined) return false;

          // Для массивов проверяем, что они не пустые или содержат валидные элементы
          if (Array.isArray(value)) {
            return value.length > 0;
          }

          // Для объектов проверяем, что они не пустые или содержат валидные свойства
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const hasValidProps = Object.values(value).some((v) => v !== undefined && v !== null);
            return hasValidProps;
          }

          return value !== null;
        }),
      );

      // Проверяем, есть ли что обновлять
      if (Object.keys(cleanPepper).length === 0) {
        logger.warn('No valid data to update');
        return;
      }

      const updateData = {
        ...cleanPepper,
        updatedAt: new Date().toISOString(),
      };

      logger.debug('Updating pepper with data:', updateData);

      await updateDoc(firestoreDoc(db, 'peppers', id), updateData);
      logger.log('Перец обновлен в Firestore');
      // onSnapshot автоматически обновит список перцев
    } catch (err) {
      logger.error('Error updating pepper:', err);
      throw err;
    }
  };

  const deletePepper = async (id: string) => {
    if (!userStore.user) {
      throw new Error('Требуется авторизация');
    }

    try {
      const now = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        const pepperRef = firestoreDoc(db, 'peppers', id);
        const pepperSnap = await transaction.get(pepperRef);

        if (!pepperSnap.exists()) {
          return;
        }

        const pepperData = pepperSnap.data() as {
          userId?: string | null;
          seedlingSlot?: { trayId?: string; row?: number; column?: number };
        };

        const isOwner = pepperData.userId === userStore.user?.uid;
        const canClaimOwnership = pepperData.userId == null;

        if (!isOwner && !canClaimOwnership) {
          throw new Error('Нет доступа к удалению этого перца');
        }

        const slot = pepperData.seedlingSlot;
        let trayRef: ReturnType<typeof doc> | null = null;
        let updatedSlots: any[] | null = null;
        let claimTrayOwnership = false;

        if (slot?.trayId && slot.row && slot.column) {
          trayRef = doc(db, 'seedlingTrays', String(slot.trayId));
          const traySnap = await transaction.get(trayRef);
          if (traySnap.exists()) {
            const trayData = traySnap.data() as {
              userId?: string | null;
              slots?: any[];
            };

            if (
              trayData.userId === userStore.user?.uid ||
              trayData.userId == null
            ) {
              const slots = Array.isArray(trayData.slots) ? trayData.slots : [];
              updatedSlots = slots.filter(
                (s) =>
                  !(
                    s.pepperId === id ||
                    (s.row === slot.row && s.column === slot.column)
                  ),
              );

              if (trayData.userId == null) {
                claimTrayOwnership = true;
              }
            } else {
              throw new Error('Нет доступа к кассете для обновления');
            }
          }
        }

        transaction.delete(pepperRef);

        if (trayRef && updatedSlots) {
          const trayUpdate: Record<string, unknown> = {
            slots: updatedSlots,
            updatedAt: now,
          };

          if (claimTrayOwnership) {
            trayUpdate.userId = userStore.user.uid;
          }

          transaction.update(trayRef, trayUpdate);
        }
      });
      // onSnapshot автоматически обновит список перцев
      logger.log('Перец удален из Firestore');
    } catch (err) {
      logger.error('Error deleting pepper:', err);
      throw err;
    }
  };

  // Сброс store (например, при выходе пользователя)
  const $reset = () => {
    unsubscribePeppers();
    peppers.value = [];
    loading.value = false;
    error.value = null;
  };

  return {
    // State
    peppers,
    loading,
    error,
    // Actions
    fetchPeppers,
    unsubscribePeppers,
    migrateExistingPeppers,
    migrateAllPeppersToCurrentUser,
    clearAllPeppers,
    debugPeppers,
    addPepper,
    updatePepper,
    deletePepper,
    $reset,
  };
});
