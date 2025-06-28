import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth, onAuthStateChanged, signOut as fbSignOut } from '../boot/auth';
import type { User } from 'firebase/auth';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const loading = ref(true);

  onAuthStateChanged(auth, (u) => {
    user.value = u;
    loading.value = false;
  });

  async function signOut() {
    await fbSignOut(auth);
  }

  return { user, loading, signOut };
});
