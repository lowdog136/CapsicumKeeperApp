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
        const updateData = {
          ...pepper,
          updatedAt: new Date().toISOString(),
        };

        await updateDoc(doc(db, 'peppers', id), updateData);
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
