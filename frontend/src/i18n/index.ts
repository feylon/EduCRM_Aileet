import { createI18n } from 'vue-i18n';
import en from './locales/en';
import ru from './locales/ru';
import uz from './locales/uz';

export type AppLocale = 'uz' | 'ru' | 'en';

export const SUPPORTED_LOCALES: { code: AppLocale; label: string; short: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
];

const STORAGE_KEY = 'educrm.locale';
export const DEFAULT_LOCALE: AppLocale = 'uz';

function initialLocale(): AppLocale {
  const saved = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
  return saved && SUPPORTED_LOCALES.some((item) => item.code === saved) ? saved : DEFAULT_LOCALE;
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { uz, ru, en },
});

export function hasStoredLocale(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

export function currentLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale;
}

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.setAttribute('lang', locale);
}

document.documentElement.setAttribute('lang', initialLocale());
