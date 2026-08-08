import { useSyncExternalStore, useCallback } from "react";
import type { Dict } from "@/locales/types";
import en from "@/locales/en";
import fr from "@/locales/fr";
import es from "@/locales/es";
import pt from "@/locales/pt";

// ─── Locale plumbing for the funnel ──────────────────────────────────────────
// Four languages, statically imported. They are small (a few kB gzipped each)
// and code-splitting them would cost a flash of untranslated text on the first
// screen paid traffic sees, which is a bad trade.
//
// Resolution order, first hit wins:
//   1. ?lang= on the URL    (what an ad set links to, and what we forward)
//   2. localStorage         (what the visitor chose last time)
//   3. navigator.languages  (what the browser says)
//   4. English
//
// Scope note: this covers the paid path only, quiz → result → offer. The legacy
// /watch page is English-only and is not part of this system.

export const DICTS = { en, fr, es, pt } as const;
export type Locale = keyof typeof DICTS;
export const LOCALES = Object.keys(DICTS) as Locale[];
export const DEFAULT_LOCALE: Locale = "en";

const STORAGE_KEY = "sw_lang";
const QUERY_KEY = "lang";

function isLocale(v: string): v is Locale {
  return (LOCALES as string[]).includes(v);
}

/** "pt-BR" → "pt", "FR" → "fr", anything unknown → null. */
function normalize(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(base) ? base : null;
}

function fromQuery(): Locale | null {
  try {
    return normalize(new URLSearchParams(window.location.search).get(QUERY_KEY));
  } catch {
    return null;
  }
}

function fromStorage(): Locale | null {
  try {
    return normalize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function fromBrowser(): Locale | null {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of list) {
      const hit = normalize(tag);
      if (hit) return hit;
    }
  } catch {}
  return null;
}

export function detectLocale(): Locale {
  return fromQuery() ?? fromStorage() ?? fromBrowser() ?? DEFAULT_LOCALE;
}

let current: Locale = typeof window === "undefined" ? DEFAULT_LOCALE : detectLocale();
const listeners = new Set<() => void>();

function applyToDocument(locale: Locale) {
  try {
    document.documentElement.lang = DICTS[locale].htmlLang;
  } catch {}
}

if (typeof window !== "undefined") {
  applyToDocument(current);
  // A ?lang= arriving from an ad is a choice: remember it so the visitor keeps
  // the language across the result and offer pages even without the param.
  const q = fromQuery();
  if (q) {
    try { localStorage.setItem(STORAGE_KEY, q); } catch {}
  }
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale) {
  if (!isLocale(locale) || locale === current) return;
  current = locale;
  try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
  applyToDocument(locale);
  // Keep the URL honest so a shared or reloaded link stays in the same language.
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(QUERY_KEY, locale);
    window.history.replaceState(null, "", url.toString());
  } catch {}
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * The funnel's only translation hook.
 *   const { t, locale, setLocale } = useI18n();
 */
export function useI18n() {
  const locale = useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
  const change = useCallback((next: Locale) => setLocale(next), []);
  return { t: DICTS[locale] as Dict, locale, setLocale: change };
}

/** Fill {placeholders}. Missing keys are left in place rather than blanked. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

/** Price in the locale's own shape: "€27" in English, "27 €" everywhere else. */
export function money(t: Dict, amount: number): string {
  return fill(t.money, { n: amount });
}

/** Carry the chosen language onto an outgoing internal link. */
export function withLocale(params: URLSearchParams, locale: Locale = current): URLSearchParams {
  params.set(QUERY_KEY, locale);
  return params;
}

export type { Dict };
