import { AxiosError } from 'axios';
import { i18n } from '@/i18n';
import type { ApiError } from '@/types/api';

/** Translates an API error into a human friendly message using its stable `code`. */
export function getErrorMessage(error: unknown): string {
  const t = i18n.global.t;
  const te = i18n.global.te;
  if (error instanceof AxiosError) {
    if (!error.response) return t('errors.network');
    const body = error.response.data as ApiError | undefined;
    if (body?.code && te(`errors.${body.code}`)) return t(`errors.${body.code}`);
    if (body?.message) return body.message;
  }
  return t('errors.unknown');
}

export function getErrorCode(error: unknown): string | undefined {
  return error instanceof AxiosError ? (error.response?.data as ApiError | undefined)?.code : undefined;
}

/** Field-level validation errors returned by the API: { email: 'email must be an email' } */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof AxiosError)) return {};
  const body = error.response?.data as ApiError | undefined;
  return Object.fromEntries((body?.errors || []).map((item) => [item.field, item.messages[0]]));
}
