import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

/** Global UI state: toasts, confirmation dialog and mobile sidebar. */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([]);
  const confirmState = ref<ConfirmState>({ open: false, title: '' });
  const sidebarOpen = ref(false);
  let nextId = 1;

  function pushToast(type: ToastType, title: string, message?: string, timeout = 4000) {
    const id = nextId++;
    toasts.value.push({ id, type, title, message });
    if (timeout) setTimeout(() => dismissToast(id), timeout);
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirmState.value = { variant: 'danger', ...options, open: true, resolve };
    });
  }

  function resolveConfirm(value: boolean) {
    confirmState.value.resolve?.(value);
    confirmState.value = { ...confirmState.value, open: false, resolve: undefined };
  }

  return { toasts, confirmState, sidebarOpen, pushToast, dismissToast, confirm, resolveConfirm };
});
