import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/utils/errors';
import { useToast } from './useToast';

export type Rule = (value: unknown, values: Record<string, unknown>) => string | true;

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && !value.length);

/** Validation rule factories. Messages are translated at validation time. */
export function useRules() {
  const { t } = useI18n();
  return {
    required: (): Rule => (value) => (!isEmpty(value) ? true : t('validation.required')),
    email: (): Rule => (value) =>
      isEmpty(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? true : t('validation.email'),
    minLength: (min: number): Rule => (value) =>
      isEmpty(value) || String(value).length >= min ? true : t('validation.minLength', { min }),
    maxLength: (max: number): Rule => (value) =>
      isEmpty(value) || String(value).length <= max ? true : t('validation.maxLength', { max }),
    phone: (): Rule => (value) =>
      isEmpty(value) || /^\+?[0-9\s\-()]{7,20}$/.test(String(value)) ? true : t('validation.phone'),
    min: (min: number): Rule => (value) =>
      isEmpty(value) || Number(value) >= min ? true : t('validation.min', { min }),
    max: (max: number): Rule => (value) =>
      isEmpty(value) || Number(value) <= max ? true : t('validation.max', { max }),
    sameAs: (field: string): Rule => (value, values) =>
      value === values[field] ? true : t('validation.passwordMismatch'),
    /** Applies `rule` only when `predicate()` is true (e.g. password required only on create). */
    when: (predicate: () => boolean, rule: Rule): Rule => (value, values) => (predicate() ? rule(value, values) : true),
    after: (field: string, messageKey = 'validation.dateRange'): Rule => (value, values) =>
      isEmpty(value) || isEmpty(values[field]) || String(value) > String(values[field]) ? true : t(messageKey),
  };
}

/**
 * Small form helper: reactive values, rule-based validation and submit handling
 * that maps API validation errors back to fields and shows toasts.
 */
export function useForm<T extends Record<string, any>>(
  initial: T,
  rules: Partial<Record<keyof T, Rule[]>> = {},
) {
  const values = reactive({ ...initial }) as T;
  const errors = reactive<Record<string, string>>({});
  const submitting = ref(false);
  const toast = useToast();

  function clearErrors() {
    Object.keys(errors).forEach((key) => delete errors[key]);
  }

  function validateField(field: keyof T & string): boolean {
    for (const rule of rules[field] || []) {
      const result = rule(values[field], values);
      if (result !== true) {
        errors[field] = result;
        return false;
      }
    }
    delete errors[field];
    return true;
  }

  function validate(): boolean {
    clearErrors();
    return (Object.keys(rules) as (keyof T & string)[]).map(validateField).every(Boolean);
  }

  function reset(next: Partial<T> = {}) {
    Object.assign(values, { ...initial, ...next });
    clearErrors();
  }

  async function submit(action: (data: T) => Promise<unknown>): Promise<boolean> {
    if (!validate()) return false;
    submitting.value = true;
    try {
      await action(values);
      return true;
    } catch (error) {
      Object.assign(errors, getFieldErrors(error));
      if (getErrorCode(error) !== 'VALIDATION_ERROR' || !Object.keys(errors).length) {
        toast.error(getErrorMessage(error));
      }
      return false;
    } finally {
      submitting.value = false;
    }
  }

  return { values, errors, submitting, validate, validateField, reset, submit, clearErrors };
}
