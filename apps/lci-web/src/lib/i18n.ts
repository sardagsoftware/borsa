/**
 * i18n Configuration for LyDian AI
 * Supports Turkish (tr) and English (en)
 */

export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'tr';

export const i18n = {
  defaultLocale,
  locales,
} as const;

/**
 * Get locale from pathname
 */
export function getLocaleFromPath(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  return (locales as readonly string[]).includes(seg as Locale)
    ? (seg as Locale)
    : defaultLocale;
}

/**
 * Get localized path by replacing current locale
 */
export function getLocalizedPath(pathname: string, locale: Locale): string {
  const current = getLocaleFromPath(pathname);
  return pathname.replace(`/${current}`, `/${locale}`);
}

/**
 * Get pathname without locale prefix
 */
export function getPathnameWithoutLocale(pathname: string, locale: Locale): string {
  return pathname.replace(`/${locale}`, '') || '/';
}

/**
 * Add locale to pathname
 */
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  if (pathname.startsWith(`/${locale}`)) {
    return pathname;
  }
  return `/${locale}${pathname === '/' ? '' : pathname}`;
}

/**
 * Check if locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    tr: 'Türkçe',
    en: 'English',
  };
  return names[locale];
}

/**
 * Get locale flag emoji
 */
export function getLocaleFlag(locale: Locale): string {
  const flags: Record<Locale, string> = {
    tr: '🇹🇷',
    en: '🇬🇧',
  };
  return flags[locale];
}

/**
 * Get locale code for HTML lang attribute
 */
export function getLocaleCode(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'tr-TR';
}
