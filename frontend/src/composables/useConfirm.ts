import { useI18n } from 'vue-i18n';
import { useUiStore, type ConfirmOptions } from '@/stores/ui';

/** Promise-based confirmation dialog: `if (await confirm({...})) { ... }` */
export function useConfirm() {
  const ui = useUiStore();
  const { t } = useI18n();

  function confirm(options: ConfirmOptions) {
    return ui.confirm(options);
  }

  function confirmDelete(name?: string) {
    return ui.confirm({
      title: t('confirm.deleteTitle'),
      message: name ? t('confirm.deleteNamed', { name }) : t('confirm.deleteMessage'),
      confirmText: t('common.delete'),
      variant: 'danger',
    });
  }

  return { confirm, confirmDelete };
}
