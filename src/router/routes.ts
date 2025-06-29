import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'peppers', component: () => import('pages/PepperListPage.vue') },
      { path: 'add-pepper', component: () => import('pages/AddPepperPage.vue') },
      { path: 'favorites', component: () => import('pages/FavoritesPage.vue') },
      { path: 'variety-library', component: () => import('pages/VarietyLibraryPage.vue') },
      { path: 'roadmap', component: () => import('pages/RoadmapPage.vue') },
      { path: 'migration', component: () => import('pages/MigrationPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
