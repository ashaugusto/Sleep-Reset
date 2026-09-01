import { useI18n } from "@/lib/i18n";
import type { LegalCopy } from "./types";
import termsEn from "./terms.en";
import termsFr from "./terms.fr";
import termsEs from "./terms.es";
import termsPt from "./terms.pt";

export type { LegalCopy, LegalSection } from "./types";

export const TERMS: Record<string, LegalCopy> = {
  en: termsEn,
  fr: termsFr,
  es: termsEs,
  pt: termsPt,
};

/** The terms in the language the rest of the app is already in. */
export function useTerms(): LegalCopy {
  const { locale } = useI18n();
  return TERMS[locale] ?? termsEn;
}
