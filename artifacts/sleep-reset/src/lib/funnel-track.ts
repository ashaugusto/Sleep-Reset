// ─── Funnel tracking helpers ─────────────────────────────────────────────────
// The quiz, the result and the offer page all needed the same four functions.
// They were copied into each page, which is how the offer page ended up being
// the only one not logging anything. One copy now.

/** Stable per-browser id, also used as the quiz session_id. */
export function clientId(): string {
  try {
    let id = localStorage.getItem("sw_cid");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem("sw_cid", id);
    }
    return id;
  } catch {
    return String(Date.now());
  }
}

export function getParam(name: string): string {
  try {
    return new URLSearchParams(window.location.search).get(name) || "";
  } catch {
    return "";
  }
}

export function getCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

/** Fire-and-forget funnel event. Never throws, never blocks navigation. */
export function logEvent(event: string) {
  try {
    void fetch("/api/sw/e", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ad_id: getParam("utm_content"), client_id: clientId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/** The ad's hook, stashed by the quiz and reused for message-match downstream. */
export function heroVariant(): string {
  try {
    return sessionStorage.getItem("sw_hero_variant") || "";
  } catch {
    return "";
  }
}

/** Light haptic on tap. Makes it feel like an app, not a form. No-op on iOS. */
export function haptic() {
  try {
    navigator.vibrate?.(8);
  } catch {}
}
