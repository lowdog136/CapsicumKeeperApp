<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="main-header">
      <div v-if="isMobile" class="mobile-status-bar">
        <div class="status-time">{{ currentTime }}</div>
        <div class="status-icons">
          <q-icon name="signal_cellular_alt" size="16px" />
          <q-icon name="network_wifi" size="16px" />
          <q-icon name="battery_full" size="16px" />
        </div>
      </div>

      <q-toolbar :class="['app-toolbar', { 'app-toolbar--mobile': isMobile }]">
        <div class="toolbar-left">
          <q-btn
            flat
            round
            :padding="isMobile ? 'sm' : 'xs'"
            :size="isMobile ? 'md' : 'sm'"
            class="toolbar-menu-btn"
            icon="menu"
            aria-label="Menu"
            @click="toggleLeftDrawer"
          />
        </div>

        <q-toolbar-title
          class="app-title text-weight-medium"
          :class="{ 'text-center': isMobile }"
        >
          CapsicumKeeper
        </q-toolbar-title>

        <div class="toolbar-actions">
          <LogoutButton
            v-if="user"
            :flat="isMobile"
            :dense="false"
            :size="isMobile ? 'md' : 'sm'"
            :class="['toolbar-auth-btn', { 'toolbar-auth-btn--mobile': isMobile }]"
          />
          <LoginButton
            v-else
            :flat="isMobile"
            :dense="false"
            :size="isMobile ? 'md' : 'sm'"
            :class="['toolbar-auth-btn', { 'toolbar-auth-btn--mobile': isMobile }]"
          />
        </div>
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
          <q-item clickable :to="{ path: '/mass-watering' }">
            <q-item-section avatar><q-icon name="water_drop" /></q-item-section>
            <q-item-section>Массовый полив</q-item-section>
          </q-item>
          <q-item clickable :to="{ path: '/seedling-trays' }">
            <q-item-section avatar><q-icon name="grid_view" /></q-item-section>
            <q-item-section>Кассеты для рассады</q-item-section>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useUserStore } from 'stores/user-store';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import LogoutButton from 'components/LogoutButton.vue';
import LoginButton from 'components/LoginButton.vue';

const leftDrawerOpen = ref(false);
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const $q = useQuasar();

const isMobile = computed(() => $q.screen.lt.sm);
const currentTime = ref(formatTime(new Date()));
let timeInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = formatTime(new Date());
  }, 1000 * 30);
});

onBeforeUnmount(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.main-header {
  background: #111;
  color: #f1f5f9;
}

.mobile-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px 4px;
  font-size: 12px;
  letter-spacing: 0.4px;
  color: rgba(241, 245, 249, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-toolbar {
  min-height: 64px;
  padding: 6px 16px 12px;
  backdrop-filter: blur(6px);
}

.app-toolbar--mobile {
  min-height: 68px;
  padding: 12px 12px 14px;
}

.toolbar-left,
.toolbar-actions {
  display: flex;
  align-items: center;
}

.toolbar-menu-btn {
  border-radius: 14px;
}

.toolbar-actions :deep(button) {
  margin-left: 12px;
}

.app-title {
  font-size: 1.2rem;
  letter-spacing: 0.5px;
}

@media (max-width: 599px) {
  .app-title {
    font-size: 1.05rem;
  }

  .toolbar-actions :deep(button) {
    margin-left: 12px;
  }

  .toolbar-auth-btn--mobile {
    padding: 6px 14px;
  }
}
</style>
