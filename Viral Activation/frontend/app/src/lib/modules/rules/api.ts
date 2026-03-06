import { httpGet } from "../../api/http";
import type { AppRulesResponse } from "./types";

const APP_RULES_ENDPOINT = "/api/v1/app/rules";

export async function fetchAppRules(language: string): Promise<AppRulesResponse> {
  const normalizedLanguage = String(language).trim().toLowerCase();
  const params = new URLSearchParams();
  if (normalizedLanguage) {
    params.set("language", normalizedLanguage);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return httpGet<AppRulesResponse>(`${APP_RULES_ENDPOINT}${suffix}`);
}
