import { useUiStore } from '@/stores/ui';

export function useToast() {
  const ui = useUiStore();
  return {
    success: (title: string, message?: string) => ui.pushToast('success', title, message),
    error: (title: string, message?: string) => ui.pushToast('error', title, message, 6000),
    info: (title: string, message?: string) => ui.pushToast('info', title, message),
    warning: (title: string, message?: string) => ui.pushToast('warning', title, message),
  };
}
