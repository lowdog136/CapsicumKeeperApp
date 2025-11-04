import { defineStore } from 'pinia';
import { db } from '../boot/firebase';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import type { Pepper } from 'src/components/models';
import { useUserStore } from './user-store';

export const usePepperFirestore = defineStore('pepperFirestore', {
  state: () => ({
    peppers: [] as Pepper[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchPeppers() {
      // Предотвращаем множественные одновременные вызовы
      if (this.loading) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const userStore = useUserStore();

        // Если пользователь не авторизован, возвращаем пустой массив
        if (!userStore.user) {
          this.peppers = [];
          this.loading = false;
          return;
        }

        // Загружаем только перцы текущего пользователя
        const peppersRef = collection(db, 'peppers');
        const q = query(peppersRef, where('userId', '==', userStore.user.uid));
        const querySnapshot = await getDocs(q);

        // Заменяем массив новыми данными
        this.peppers = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Pepper,
        );
      } catch (error) {
        console.error('Error fetching peppers:', error);
        this.error = 'Ошибка загрузки перцев: ' + (error as Error).message;
        this.peppers = [];
      } finally {
        this.loading = false;
      }
    },

    // Функция для миграции существующих перцев без userId
    async migrateExistingPeppers() {
      const userStore = useUserStore();
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
          await updateDoc(doc(db, 'peppers', pepperDoc.id), {
            userId: userStore.user!.uid,
            updatedAt: new Date().toISOString(),
          });

          console.log(`Мигрирован перец "${pepperData.name}" с ID: ${pepperDoc.id}`);
          migratedCount++;
        }

        console.log(`Миграция завершена! Мигрировано: ${migratedCount}`);

        // Перезагружаем список перцев
        await this.fetchPeppers();

        return migratedCount;
      } catch (error) {
        console.error('Error migrating peppers:', error);
        throw error;
      }
    },

    // Функция для миграции ВСЕХ перцев к текущему пользователю (для консоли браузера)
    async migrateAllPeppersToCurrentUser() {
      const userStore = useUserStore();
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
          await updateDoc(doc(db, 'peppers', pepperDoc.id), {
            userId: userStore.user!.uid,
            updatedAt: new Date().toISOString(),
          });

          console.log(`Мигрирован перец "${pepperData.name}" с ID: ${pepperDoc.id}`);
          migratedCount++;
        }

        console.log(`Миграция завершена! Мигрировано: ${migratedCount}`);

        // Перезагружаем список перцев
        await this.fetchPeppers();

        return migratedCount;
      } catch (error) {
        console.error('Error migrating all peppers:', error);
        throw error;
      }
    },

    // Функция для удаления всех перцев (очистка тестовых данных)
    async clearAllPeppers() {
      const userStore = useUserStore();
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
          await deleteDoc(doc(db, 'peppers', pepperDoc.id));

          console.log(`Удален перец "${pepperData.name}" с ID: ${pepperDoc.id}`);
          deletedCount++;
        }

        console.log(`Очистка завершена! Удалено: ${deletedCount}`);

        // Перезагружаем список перцев
        await this.fetchPeppers();

        return deletedCount;
      } catch (error) {
        console.error('Error clearing peppers:', error);
        throw error;
      }
    },

    // Функция для проверки данных в консоли браузера
    async debugPeppers() {
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

        // Проверяем текущего пользователя
        const userStore = useUserStore();
        console.log('Текущий пользователь:', userStore.user?.uid);

        // Проверяем загруженные перцы в store
        console.log('Перцы в store:', this.peppers);

        console.log('=== КОНЕЦ ДЕБАГА ===');
      } catch (error) {
        console.error('Ошибка при дебаге:', error);
      }
    },

    async addPepper(pepper: Omit<Pepper, 'id'>) {
      const userStore = useUserStore();
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
        await this.fetchPeppers();
      } catch (error) {
        console.error('Error adding pepper:', error);
        throw error;
      }
    },

    async updatePepper(id: string, pepper: Partial<Pepper>) {
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
          console.warn('No valid data to update');
          return;
        }

        const updateData = {
          ...cleanPepper,
          updatedAt: new Date().toISOString(),
        };

        console.log('Updating pepper with data:', updateData);

        await updateDoc(doc(db, 'peppers', id), updateData);

        // Перезагружаем данные из Firestore для синхронизации
        // Это предотвращает циклические обновления реактивности
        await this.fetchPeppers();
      } catch (error) {
        console.error('Error updating pepper:', error);
        throw error;
      }
    },

    async deletePepper(id: string) {
      try {
        await deleteDoc(doc(db, 'peppers', id));
        await this.fetchPeppers();
      } catch (error) {
        console.error('Error deleting pepper:', error);
        throw error;
      }
    },
  },
});
