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
      { path: 'varieties', component: () => import('pages/VarietyLibraryV2Page.vue') },
      { path: 'variety-library', component: () => import('pages/VarietyLibraryV2Page.vue') },
      { path: 'fertilizer-library', component: () => import('pages/FertilizerLibraryPage.vue') },
      { path: 'mass-watering', component: () => import('pages/MassWateringPage.vue') },
      { path: 'seedling-trays', component: () => import('pages/SeedlingTrayListPage.vue') },
      { path: 'seedling-trays/:id', component: () => import('pages/SeedlingTrayDetailsPage.vue') },
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
