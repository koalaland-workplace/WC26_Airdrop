export const APP_LANGUAGE_OPTIONS = ["en", "es", "pt", "kr", "jp"] as const;

export type AppLanguageCode = (typeof APP_LANGUAGE_OPTIONS)[number];

export interface LanguageOption {
  code: AppLanguageCode;
  label: Uppercase<AppLanguageCode>;
}
