import type { RouteRecordRaw } from 'vue-router';
import VarietyLibraryV2Page from 'pages/VarietyLibraryV2Page.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'peppers', component: () => import('pages/PepperListPage.vue') },
      { path: 'add-pepper', component: () => import('pages/AddPepperPage.vue') },
      { path: 'favorites', component: () => import('pages/FavoritesPage.vue') },
      { path: 'varieties', component: () => import('pages/VarietyLibraryPage.vue') },
      { path: 'roadmap', component: () => import('pages/RoadmapPage.vue') },
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
