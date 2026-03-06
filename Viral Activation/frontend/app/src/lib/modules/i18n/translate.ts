import { DEFAULT_APP_LANGUAGE, I18N_PROTECT_TERMS } from "./constants";
import { I18N_PHRASES } from "./phrases.generated";
import { I18N_TEMPLATES } from "./templates.generated";
import type { AppLanguageCode } from "./types";

const phraseKeyCache = new Map<AppLanguageCode, string[]>();

function getPhrasePack(language: AppLanguageCode): Record<string, string> {
  if (language === "en") return {};
  return I18N_PHRASES[language];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lockProtectedTerms(input: string): { text: string; bag: string[] } {
  let text = input;
  const bag: string[] = [];

  for (const term of I18N_PROTECT_TERMS) {
    const escaped = escapeRegExp(term);
    const isWordLike = /^[A-Za-z0-9 ]+$/.test(term);
    const pattern = new RegExp(isWordLike ? `\\b${escaped}\\b` : escaped, "g");

    text = text.replace(pattern, (match) => {
      const token = `__I18N_KEEP_${bag.length}__`;
      bag.push(match);
      return token;
    });
  }

  return { text, bag };
}

function unlockProtectedTerms(input: string, bag: string[]): string {
  let text = input;
  for (let index = 0; index < bag.length; index += 1) {
    text = text.split(`__I18N_KEEP_${index}__`).join(bag[index]);
  }
  return text;
}

function getPhraseKeys(language: AppLanguageCode): string[] {
  const cached = phraseKeyCache.get(language);
  if (cached) return cached;

  if (language === DEFAULT_APP_LANGUAGE) {
    phraseKeyCache.set(language, []);
    return [];
  }

  const phrases = getPhrasePack(language);
  const keys = Object.keys(phrases).sort((a, b) => b.length - a.length);
  phraseKeyCache.set(language, keys);
  return keys;
}

export function translateTemplate(
  language: AppLanguageCode,
  key: string,
  data?: Record<string, string | number>
): string {
  const languagePack = I18N_TEMPLATES[language] ?? I18N_TEMPLATES[DEFAULT_APP_LANGUAGE];
  const source = languagePack[key] ?? I18N_TEMPLATES[DEFAULT_APP_LANGUAGE][key] ?? "";

  if (!data) return source;

  return source.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token) => {
    const value = data[token];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function translateText(language: AppLanguageCode, value: string): string {
  if (language === DEFAULT_APP_LANGUAGE) return String(value ?? "");

  const raw = String(value ?? "");
  if (raw.trim().length === 0) return raw;

  const lead = raw.match(/^\s*/)?.[0] ?? "";
  const tail = raw.match(/\s*$/)?.[0] ?? "";
  const core = raw.trim();
  const coreNormalized = core.replace(/\s+/g, " ");

  const phrases = getPhrasePack(language);

  if (phrases[core]) {
    return `${lead}${phrases[core]}${tail}`;
  }

  if (phrases[coreNormalized]) {
    return `${lead}${phrases[coreNormalized]}${tail}`;
  }

  let translated = coreNormalized;
  const keys = getPhraseKeys(language);

  for (const key of keys) {
    if (key === coreNormalized || key.indexOf(" ") < 0) continue;
    if (translated.includes(key)) {
      translated = translated.split(key).join(phrases[key]);
    }
  }

  const locked = lockProtectedTerms(translated);
  const unlocked = unlockProtectedTerms(locked.text, locked.bag);
  return `${lead}${unlocked}${tail}`;
}
