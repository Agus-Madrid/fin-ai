export interface DashboardIntlFormatters {
  compactNumber: Intl.NumberFormat;
  currency: Intl.NumberFormat;
  percent: Intl.NumberFormat;
  trendDate: Intl.DateTimeFormat;
  goalDeadline: Intl.DateTimeFormat;
}

export const DASHBOARD_DEFAULT_LOCALE = 'es-UY';

export function createDashboardIntlFormatters(
  locale: string = DASHBOARD_DEFAULT_LOCALE,
): DashboardIntlFormatters {
  return {
    compactNumber: new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }),
    currency: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'UYU',
      maximumFractionDigits: 0,
    }),
    percent: new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    trendDate: new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
    }),
    goalDeadline: new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
    }),
  };
}
