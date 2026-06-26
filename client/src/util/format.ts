import type { Locale } from "@/app/i18n"

const INTL_LOCALE_MAP: Record<Locale, string> = {
  en: "en-US",
  th: "th-TH",
  zh: "zh-CN",
}

export function getIntlLocale(locale: Locale): string {
  return INTL_LOCALE_MAP[locale]
}

export function formatCurrency(
  amount: number,
  locale: Locale,
  currency = "USD"
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(value)
}

export function formatDate(value: string | Date, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function formatDateTime(value: string | Date, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}
