<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> CapsicumKeeper </q-toolbar-title>

        <div class="q-ml-auto">
          <LogoutButton v-if="user" />
          <LoginButton v-else />
        </div>

        <!-- <div>Quasar v{{ $q.version }}</div> -->
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Навигация </q-item-label>
        <q-item clickable :to="{ path: '/' }">
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>Главная</q-item-section>
        </q-item>

        <!-- Пункты только для авторизованных пользователей -->
        <template v-if="user">
          <q-item clickable :to="{ path: '/peppers' }">
            <q-item-section avatar><q-icon name="list" /></q-item-section>
            <q-item-section>Мои перцы</q-item-section>
          </q-item>
          <q-item clickable :to="{ path: '/add-pepper' }">
            <q-item-section avatar><q-icon name="add" /></q-item-section>
            <q-item-section>Добавить перец</q-item-section>
          </q-item>
          <q-item clickable :to="{ path: '/favorites' }">
            <q-item-section avatar><q-icon name="favorite" /></q-item-section>
            <q-item-section>Избранное</q-item-section>
          </q-item>
          <q-item clickable :to="{ path: '/migration' }">
            <q-item-section avatar><q-icon name="sync" /></q-item-section>
            <q-item-section>Управление данными</q-item-section>
          </q-item>
        </template>

        <!-- Пункты для всех пользователей -->
        <q-item clickable :to="{ path: '/variety-library' }">
          <q-item-section avatar><q-icon name="local_florist" /></q-item-section>
          <q-item-section>Библиотека сортов</q-item-section>
        </q-item>
        <q-item clickable :to="{ path: '/fertilizer-library' }">
          <q-item-section avatar><q-icon name="science" /></q-item-section>
          <q-item-section>Библиотека удобрений</q-item-section>
        </q-item>
        <q-item clickable :to="{ path: '/roadmap' }">
          <q-item-section avatar><q-icon name="assignment" /></q-item-section>
          <q-item-section>Дорожная карта</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from 'stores/user-store';
import { storeToRefs } from 'pinia';
import LogoutButton from 'components/LogoutButton.vue';
import LoginButton from 'components/LoginButton.vue';

const leftDrawerOpen = ref(false);
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
