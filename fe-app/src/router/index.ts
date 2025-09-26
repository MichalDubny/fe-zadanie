import { PAGE } from '@/models/constants';
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'; 

const routes: Array<RouteRecordRaw> = [
  {
    path: PAGE.INCIDENTS.path,
    name: PAGE.INCIDENTS.name,
    component: () => import('@/views/IncidentsView.vue'),
  },
  {
    path: PAGE.INSTRUCTIONS.path,
    name: PAGE.INSTRUCTIONS.name,
    component: () => import('@/views/InstructionsView.vue'),
  },
  {
    path: '/',
    redirect: PAGE.INCIDENTS.path,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior() {
    return {
      left: 0,
      top: 0,
    };
  },
  routes: routes,
});

export default router;
