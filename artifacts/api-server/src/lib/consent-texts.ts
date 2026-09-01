// ─── The words the two boxes are ticked against ──────────────────────────────
// These live on the server on purpose. What gets stored as proof of consent is
// the sentence the buyer saw, and a sentence the client hands us is not proof
// of anything: it is whatever the browser felt like sending. So the page sends
// a locale and a boolean, and the text is looked up here.
//
// The cost of that is one copy of eight strings out of step with the front end.
// They are kept in step by hand, and the source of truth for both is
// marketing/flu235-degrau7-compliance.md, point 5, under "Caixa 1" and
// "Caixa 2". The front end's copies are in
// artifacts/sleep-reset/src/locales/{pt,en,fr,es}.ts under `backend.consent`.
// Change one, change the other, and change the doc first.

export const CONSENT_KINDS = ["backend_early_start", "backend_log_reading"] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

export const CONSENT_LOCALES = ["en", "fr", "es", "pt"] as const;
export type ConsentLocale = (typeof CONSENT_LOCALES)[number];

const TEXTS: Record<ConsentLocale, Record<ConsentKind, string>> = {
  en: {
    backend_early_start:
      "I ask you to start work on my plan now, before the 14 day cancellation period ends. I understand that I lose my right to cancel as soon as the plan is delivered to me.",
    backend_log_reading:
      "I allow a person at Sleep Wired to read my sleep log in order to prepare my plan. I understand this log concerns my health, and I can withdraw this permission at any time.",
  },
  pt: {
    backend_early_start:
      "Peço que comecem a trabalhar no meu plano já, antes de acabarem os 14 dias para anular. Sei que perco o direito de anular assim que o plano me for entregue.",
    backend_log_reading:
      "Autorizo que uma pessoa da Sleep Wired leia o meu registo de sono para preparar o meu plano. Sei que este registo diz respeito à minha saúde e posso retirar esta autorização a qualquer momento.",
  },
  fr: {
    backend_early_start:
      "Je demande que le travail sur mon plan commence maintenant, avant la fin du délai de rétractation de 14 jours. Je sais que je perds mon droit de rétractation dès que le plan m'est remis.",
    backend_log_reading:
      "J'autorise une personne de Sleep Wired à lire mon journal de sommeil pour préparer mon plan. Je sais que ce journal concerne ma santé et je peux retirer cette autorisation à tout moment.",
  },
  es: {
    backend_early_start:
      "Pido que empiecen a trabajar en mi plan ahora, antes de que terminen los 14 días para anular. Sé que pierdo el derecho a anular en cuanto se me entregue el plan.",
    backend_log_reading:
      "Autorizo a que una persona de Sleep Wired lea mi registro de sueño para preparar mi plan. Sé que este registro se refiere a mi salud y puedo retirar esta autorización en cualquier momento.",
  },
};

export function isConsentLocale(v: unknown): v is ConsentLocale {
  return typeof v === "string" && (CONSENT_LOCALES as readonly string[]).includes(v);
}

/** The sentence to store. Unknown locales fall back to English rather than to nothing. */
export function consentText(kind: ConsentKind, locale: string): string {
  const key: ConsentLocale = isConsentLocale(locale) ? locale : "en";
  return TEXTS[key][kind];
}
