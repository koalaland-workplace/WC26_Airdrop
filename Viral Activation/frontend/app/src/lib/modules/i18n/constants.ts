import type { AppLanguageCode, LanguageOption } from "./types";
import { APP_LANGUAGE_OPTIONS } from "./types";

export const APP_LANGUAGE_STORAGE_KEY = "wc26_app_lang_v1";
export const DEFAULT_APP_LANGUAGE: AppLanguageCode = "en";

export const LANGUAGE_OPTIONS: LanguageOption[] = APP_LANGUAGE_OPTIONS.map((code) => ({
  code,
  label: code.toUpperCase() as Uppercase<AppLanguageCode>
}));

export const I18N_PROTECT_TERMS: string[] = [
  "National Journey Airdrop",
  "Viral Activation",
  "Tournament Ignition",
  "World Cup 2026"
];
