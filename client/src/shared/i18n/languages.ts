export const supportedLngs = ['ru', 'en', 'de', 'fr', 'es', 'zh'] as const;
export type AppLanguage = (typeof supportedLngs)[number];

export const isSupportedLanguage = (value: string | null | undefined): value is AppLanguage =>
  value !== null && value !== undefined && (supportedLngs as readonly string[]).includes(value);
