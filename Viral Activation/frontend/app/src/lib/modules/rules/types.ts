export interface AppRulesResponse {
  requestedLanguage: string | null;
  language: string;
  defaultLanguage: string;
  fallbackLanguage: string | null;
  availableLanguages: string[];
  title: string;
  content: string;
  updatedAt: string | null;
}
