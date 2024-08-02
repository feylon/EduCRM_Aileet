import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authService } from '@/services/auth.service';
import { setSessionExpiredHandler } from '@/services/http';
import type { Role, User } from '@/types/models';
import { tokenStorage } from '@/utils/token-storage';

const STAFF: Role[] = ['super_admin', 'admin'];

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const role = computed<Role | null>(() => user.value?.role ?? null);
  const isSuperAdmin = computed(() => role.value === 'super_admin');
  const isStaff = computed(() => !!role.value && STAFF.includes(role.value));
  const isTeacher = computed(() => role.value === 'teacher');
  const isStudent = computed(() => role.value === 'student');

  /** Mirrors the backend RolesGuard: super admin can do everything. */
  function hasRole(roles?: Role[]): boolean {
    if (!roles || !roles.length) return true;
    if (!role.value) return false;
    return role.value === 'super_admin' || roles.includes(role.value);
  }

  async function login(email: string, password: string) {
    const result = await authService.login(email, password);
    tokenStorage.set(result.accessToken, result.refreshToken);
    user.value = result.user;
    return result.user;
  }

  /** Restores the session on page load (token refresh happens transparently in http.ts). */
  async function init() {
    if (initialized.value) return;
    initialized.value = true;
    if (!tokenStorage.getAccess()) return;
    try {
      user.value = await authService.me();
    } catch {
      clearSession();
    }
  }

  function clearSession() {
    tokenStorage.clear();
    user.value = null;
  }

  async function logout() {
    try {
      await authService.logout(tokenStorage.getRefresh());
    } catch {
      // the session is cleared locally anyway
    }
    clearSession();
  }

  function setUser(next: User) {
    user.value = next;
  }

  setSessionExpiredHandler(() => {
    clearSession();
    if (window.location.pathname !== '/login') {
      window.location.href = `/login?expired=1&redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  });

  return {
    user,
    initialized,
    isAuthenticated,
    role,
    isSuperAdmin,
    isStaff,
    isTeacher,
    isStudent,
    hasRole,
    login,
    logout,
    init,
    setUser,
    clearSession,
  };
});
