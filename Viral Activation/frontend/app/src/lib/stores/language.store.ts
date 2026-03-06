import { writable } from "svelte/store";
import {
  APP_LANGUAGE_STORAGE_KEY,
  DEFAULT_APP_LANGUAGE,
  LANGUAGE_OPTIONS
} from "../modules/i18n/constants";
import type { AppLanguageCode, LanguageOption } from "../modules/i18n/types";

interface LanguageState {
  current: AppLanguageCode;
  options: LanguageOption[];
}

const initialState: LanguageState = {
  current: DEFAULT_APP_LANGUAGE,
  options: LANGUAGE_OPTIONS
};

function isAppLanguageCode(value: string | null | undefined): value is AppLanguageCode {
  return value === "en" || value === "es" || value === "pt" || value === "kr" || value === "jp";
}

function resolveStoredLanguage(): AppLanguageCode {
  if (typeof window === "undefined") return DEFAULT_APP_LANGUAGE;
  const stored = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  return isAppLanguageCode(stored) ? stored : DEFAULT_APP_LANGUAGE;
}

function persistLanguage(language: AppLanguageCode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
}

function createLanguageStore() {
  const { subscribe, update, set } = writable<LanguageState>(initialState);

  function init(): void {
    const language = resolveStoredLanguage();
    set({ current: language, options: LANGUAGE_OPTIONS });
  }

  function setLanguage(language: AppLanguageCode): void {
    persistLanguage(language);
    update((state) => ({ ...state, current: language }));
  }

  return {
    subscribe,
    init,
    setLanguage
  };
}

export const languageStore = createLanguageStore();
export type { LanguageState };
