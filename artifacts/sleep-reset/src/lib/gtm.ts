declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function push(data: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

// ─── Page identifiers (use in GTM triggers) ───────
export type PageType = "vsl" | "solution" | "welcome" | "onboarding" | "dashboard";

function trackPageView(pageType: PageType, extra?: Record<string, unknown>) {
  push({
    event: "custom_page_view",
    page_type: pageType,
    page_path: window.location.pathname,
    ...extra,
  });
}

// ─── Product identifiers (DPA / Meta catalog hygiene) ────
const PRODUCT_ID = "sleep-wired-7night";
const PRODUCT_NAME = "The Cognitive Shutdown Method";

// ─── VSL Landing Page events ──────────────────────
export const gtm = {
  // Called when VSL landing page loads
  viewVSL(eventId?: string) {
    trackPageView("vsl");
    push({
      event: "ViewContent",
      content_ids: [PRODUCT_ID],
      content_name: PRODUCT_NAME,
      content_category: "Digital Product",
      content_type: "product",
      page_type: "vsl",
      value: 27,
      currency: "EUR",
      ...(eventId ? { event_id: eventId } : {}),
    });
    push({
      event: "view_item",
      ecommerce: {
        currency: "EUR",
        value: 27,
        items: [{ item_id: "sleep-rewire-7night", item_name: "The Sleep Rewire Protocol", price: 27, quantity: 1 }],
      },
    });
  },

  // DEPRECATED: use viewVSL() instead
  viewContent() {
    this.viewVSL();
  },

  // Email submitted on order form — intent signal before Stripe redirect
  lead(email: string, eventId?: string) {
    push({
      event: "Lead",
      content_ids: [PRODUCT_ID],
      content_name: PRODUCT_NAME,
      content_type: "product",
      page_type: "vsl",
      value: 27,
      currency: "EUR",
      email,
      ...(eventId ? { event_id: eventId } : {}),
    });
  },

  // VSL play button clicked — engagement signal
  vslPlay() {
    push({
      event: "ViewVSL",
      content_ids: [PRODUCT_ID],
      content_name: `${PRODUCT_NAME} — VSL`,
      content_type: "product",
      page_type: "vsl",
      value: 27,
      currency: "EUR",
    });
  },

  // VSL watch-depth — fired by the native player at 25/50/75%
  vslProgress(pct: number) {
    push({ event: "VSLProgress", percent: pct, content_ids: [PRODUCT_ID], content_name: `${PRODUCT_NAME} — VSL` });
    try { (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("trackCustom", "VSL" + pct); } catch { /* noop */ }
  },

  // VSL watched to the end
  vslComplete() {
    push({ event: "VSLComplete", content_ids: [PRODUCT_ID], content_name: `${PRODUCT_NAME} — VSL` });
    try { (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("trackCustom", "VSLComplete"); } catch { /* noop */ }
  },

  initiateCheckout(email: string, sessionId?: string | null) {
    push({
      event: "InitiateCheckout",
      content_ids: [PRODUCT_ID],
      content_name: PRODUCT_NAME,
      content_type: "product",
      page_type: "vsl",
      value: 27,
      currency: "EUR",
      num_items: 1,
      email,
      ...(sessionId ? { transaction_id: sessionId } : {}),
    });
    push({
      event: "begin_checkout",
      ecommerce: {
        currency: "EUR",
        value: 27,
        items: [{ item_id: "sleep-rewire-7night", item_name: "The Sleep Rewire Protocol", price: 27, quantity: 1 }],
      },
    });
  },

  purchase(sessionId: string, email?: string | null) {
    push({
      event: "Purchase",
      content_ids: [PRODUCT_ID],
      content_name: PRODUCT_NAME,
      content_type: "product",
      page_type: "vsl",
      value: 27,
      currency: "EUR",
      transaction_id: sessionId,
      event_id: sessionId,
      num_items: 1,
      ...(email ? { email } : {}),
    });
    push({
      event: "purchase",
      ecommerce: {
        transaction_id: sessionId,
        currency: "EUR",
        value: 27,
        items: [{ item_id: "sleep-rewire-7night", item_name: "The Sleep Rewire Protocol", price: 27, quantity: 1 }],
      },
    });
  },

  // Quiz captured (email + WhatsApp gate) — fires Meta Lead + custom QuizComplete.
  // Lead is the sub-event Meta will learn on while campaign optimization stays on Purchase.
  // eventId is shared with server-side CAPI for dedup.
  quizComplete(type: string, email: string, eventId: string) {
    push({
      event: "Lead",
      content_ids: [PRODUCT_ID],
      content_name: PRODUCT_NAME + " — Quiz",
      content_type: "product",
      page_type: "quiz",
      value: 0,
      currency: "EUR",
      email,
      quiz_type: type,
      event_id: eventId,
    });
    try {
      (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("trackCustom", "QuizComplete", { type, currency: "EUR", value: 0 });
    } catch { /* noop */ }
  },

  completeRegistration(email?: string | null) {
    push({
      event: "CompleteRegistration",
      content_name: "The Sleep Rewire Protocol",
      page_type: "vsl",
      currency: "EUR",
      value: 27,
      ...(email ? { email } : {}),
    });
    push({ event: "sign_up", method: "email" });
  },
};

// ─── Solution Page events ─────────────────────────
export const solutionEvents = {
  viewSolution() {
    trackPageView("solution");
    push({
      event: "ViewContent",
      content_name: "Sleep Solution — Dublin Delivery",
      content_category: "Physical Product",
      content_type: "product",
      page_type: "solution",
      value: 30,
      currency: "EUR",
    });
  },

  whatsappClick(buttonLocation: string) {
    push({
      event: "solution_whatsapp_click",
      page_type: "solution",
      button_location: buttonLocation,
      content_name: "Sleep Solution — Dublin Delivery",
      value: 30,
      currency: "EUR",
    });
    // Also fire as Lead event for Meta Pixel
    push({
      event: "Lead",
      content_name: "Sleep Solution WhatsApp",
      page_type: "solution",
      value: 30,
      currency: "EUR",
    });
  },

  selectPack(packName: string, price: number, qty: number) {
    push({
      event: "solution_select_pack",
      page_type: "solution",
      pack_name: packName,
      pack_price: price,
      pack_qty: qty,
      currency: "EUR",
    });
  },
};
