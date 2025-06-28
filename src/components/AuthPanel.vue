<template>
  <div>
    <div v-if="user">
      <div class="q-mb-md">Привет, {{ user.displayName || user.email }}</div>
      <q-btn label="Выйти" color="primary" @click="signOut" />
    </div>
    <div v-else>
      <q-btn label="Войти через Google" color="primary" @click="signInWithGoogle" class="q-mb-md" />
      <q-form @submit.prevent="signInWithEmail">
        <q-input v-model="email" label="Email" type="email" class="q-mb-sm" required />
        <q-input v-model="password" label="Пароль" type="password" class="q-mb-sm" required />
        <q-btn type="submit" label="Войти по email" color="primary" class="q-mr-sm" />
        <q-btn flat label="Регистрация" color="secondary" @click="registerWithEmail" />
      </q-form>
      <div v-if="error" class="text-negative q-mt-sm">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from 'stores/user-store';
import {
  GoogleAuthProvider,
  signInWithPopup,
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'boot/auth';

const userStore = useUserStore();
const user = userStore.user;
const email = ref('');
const password = ref('');
const error = ref('');

async function signInWithGoogle() {
  error.value = '';
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'message' in e) {
      error.value = (e as { message?: string }).message || 'Ошибка входа через Google';
    } else {
      error.value = 'Ошибка входа через Google';
    }
  }
}

async function signInWithEmail() {
  error.value = '';
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'message' in e) {
      error.value = (e as { message?: string }).message || 'Ошибка входа по email';
    } else {
      error.value = 'Ошибка входа по email';
    }
  }
}

async function registerWithEmail() {
  error.value = '';
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'message' in e) {
      error.value = (e as { message?: string }).message || 'Ошибка регистрации';
    } else {
      error.value = 'Ошибка регистрации';
    }
  }
}

function signOut() {
  void userStore.signOut();
}
</script>
