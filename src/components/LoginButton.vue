<script setup lang="ts">
import { ref, withDefaults } from 'vue';
import { GoogleAuthProvider, signInWithPopup, auth, signInWithEmailAndPassword } from 'boot/auth';

const dialog = ref(false);
const email = ref('');
const password = ref('');
const error = ref('');

const props = withDefaults(
  defineProps<{
    flat?: boolean;
    dense?: boolean;
    size?: string;
    color?: string;
  }>(),
  {
    flat: true,
    dense: false,
    size: 'md',
    color: 'primary',
  },
);

function openDialog() {
  dialog.value = true;
  error.value = '';
}

async function loginWithGoogle() {
  error.value = '';
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    dialog.value = false;
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'message' in e) {
      error.value = (e as { message?: string }).message || 'Ошибка входа через Google';
    } else {
      error.value = 'Ошибка входа через Google';
    }
  }
}

async function loginWithEmail() {
  error.value = '';
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    dialog.value = false;
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'message' in e) {
      error.value = (e as { message?: string }).message || 'Ошибка входа по email';
    } else {
      error.value = 'Ошибка входа по email';
    }
  }
}
</script>

<template>
  <q-btn
    :flat="props.flat"
    :dense="props.dense"
    :size="props.size"
    :color="props.color"
    icon="login"
    label="Войти"
    @click="openDialog"
  />
  <q-dialog v-model="dialog">
    <q-card style="min-width: 320px">
      <q-card-section class="text-h6">Вход</q-card-section>
      <q-card-section>
        <q-btn
          color="primary"
          label="Войти через Google"
          @click="loginWithGoogle"
          class="full-width q-mb-md"
        />
        <q-form @submit.prevent="loginWithEmail">
          <q-input v-model="email" label="Email" type="email" class="q-mb-sm" required />
          <q-input v-model="password" label="Пароль" type="password" class="q-mb-sm" required />
          <q-btn type="submit" label="Войти по email" color="primary" class="full-width" />
        </q-form>
        <div v-if="error" class="text-negative q-mt-sm">{{ error }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
