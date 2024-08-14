import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { i18n } from '@/i18n';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { useAuthStore } from '@/stores/auth';
import type { Role } from '@/types/models';

declare module 'vue-router' {
  interface RouteMeta {
    /** Accessible without authentication (login page) */
    guest?: boolean;
    /** Allowed roles; empty = any authenticated user */
    roles?: Role[];
    /** i18n key of the page title */
    title?: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { guest: true, title: 'auth.signIn' },
  },
  {
    path: '/',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: { title: 'nav.dashboard' },
      },
      {
        path: 'students',
        name: 'students',
        component: () => import('@/pages/students/StudentsPage.vue'),
        meta: { title: 'nav.students', roles: ['admin', 'teacher'] },
      },
      {
        path: 'students/:id',
        name: 'student-detail',
        component: () => import('@/pages/students/StudentDetailPage.vue'),
        meta: { title: 'nav.students', roles: ['admin', 'teacher'] },
      },
      {
        path: 'teachers',
        name: 'teachers',
        component: () => import('@/pages/teachers/TeachersPage.vue'),
        meta: { title: 'nav.teachers', roles: ['admin'] },
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () => import('@/pages/notifications/NotificationsPage.vue'),
        meta: { title: 'notifications.title' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/pages/profile/ProfilePage.vue'),
        meta: { title: 'nav.profile' },
      },
      {
        path: 'forbidden',
        name: 'forbidden',
        component: () => import('@/pages/errors/ForbiddenPage.vue'),
        meta: { title: 'errorPages.forbiddenTitle' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/errors/NotFoundPage.vue'),
    meta: { title: 'errorPages.notFoundTitle' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.init();

  if (to.meta.guest) {
    return auth.isAuthenticated ? { name: 'dashboard' } : true;
  }
  if (to.name === 'not-found') return true;
  if (!auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} };
  }
  if (!auth.hasRole(to.meta.roles)) {
    return { name: 'forbidden' };
  }
  return true;
});

router.afterEach((to) => {
  const appName = i18n.global.t('app.name');
  document.title = to.meta.title ? `${i18n.global.t(to.meta.title)} · ${appName}` : appName;
});

export default router;
