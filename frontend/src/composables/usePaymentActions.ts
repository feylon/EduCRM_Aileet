import { useI18n } from 'vue-i18n';
import { paymentsService } from '@/services/payments.service';
import type { Payment } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatMoney } from '@/utils/format';
import { useConfirm } from './useConfirm';
import { useToast } from './useToast';

/** Refund / delete with confirmation, shared by the payments page and student profile. */
export function usePaymentActions(onChange: () => void) {
  const { t } = useI18n();
  const toast = useToast();
  const { confirm, confirmDelete } = useConfirm();

  async function refund(payment: Payment) {
    const ok = await confirm({
      title: t('payments.refundTitle'),
      message: t('payments.refundMessage', { amount: formatMoney(payment.amount) }),
      confirmText: t('payments.refund'),
    });
    if (!ok) return;
    try {
      await paymentsService.update(payment.id, { status: 'refunded' });
      toast.success(t('payments.refunded'));
      onChange();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function remove(payment: Payment) {
    if (!(await confirmDelete(formatMoney(payment.amount)))) return;
    try {
      await paymentsService.remove(payment.id);
      toast.success(t('payments.deleted'));
      onChange();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return { refund, remove };
}
