import { defineStore } from 'pinia';
import { db } from '../boot/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Pepper } from 'src/components/models';
import { useUserStore } from './user-store';

export const usePepperFirestore = defineStore('pepperFirestore', {
  state: () => ({
    peppers: [] as Pepper[],
    loading: false,
  }),
  actions: {
    async fetchPeppers() {
      this.loading = true;
      const querySnapshot = await getDocs(collection(db, 'peppers'));
      this.peppers = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Pepper);
      this.loading = false;
    },
    async addPepper(pepper: Omit<Pepper, 'id'>) {
      const userStore = useUserStore();
      if (!userStore.user) {
        throw new Error('Только авторизованный пользователь может добавлять перцы');
      }
      await addDoc(collection(db, 'peppers'), pepper);
      await this.fetchPeppers();
    },
    async updatePepper(id: string, pepper: Partial<Pepper>) {
      await updateDoc(doc(db, 'peppers', id), pepper);
      await this.fetchPeppers();
    },
    async deletePepper(id: string) {
      await deleteDoc(doc(db, 'peppers', id));
      await this.fetchPeppers();
    },
  },
});
