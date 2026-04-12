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

// ─── VSL Landing Page events ──────────────────────
export const gtm = {
  // Called when VSL landing page loads
  viewVSL() {
    trackPageView("vsl");
    push({
      event: "ViewContent",
      content_name: "The Sleep Rewire Protocol",
      content_category: "Digital Product",
      content_type: "product",
      page_type: "vsl",
      value: 47,
      currency: "EUR",
    });
    push({
      event: "view_item",
      ecommerce: {
        currency: "EUR",
        value: 47,
        items: [{ item_id: "sleep-rewire-7night", item_name: "The Sleep Rewire Protocol", price: 47, quantity: 1 }],
      },
    });
  },

  // DEPRECATED: use viewVSL() instead
  viewContent() {
    this.viewVSL();
  },

  initiateCheckout(email: string) {
    push({
      event: "InitiateCheckout",
      content_name: "The Sleep Rewire Protocol",
      page_type: "vsl",
      value: 47,
      currency: "EUR",
      num_items: 1,
      email,
    });
    push({
      event: "begin_checkout",
      ecommerce: {
        currency: "EUR",
        value: 47,
        items: [{ item_id: "sleep-rewire-7night", item_name: "The Sleep Rewire Protocol", price: 47, quantity: 1 }],
      },
    });
  },

  purchase(sessionId: string, email?: string | null) {
    push({
      event: "Purchase",
      content_name: "The Sleep Rewire Protocol",
      page_type: "vsl",
      value: 47,
      currency: "EUR",
      transaction_id: sessionId,
      num_items: 1,
      ...(email ? { email } : {}),
    });
    push({
      event: "purchase",
      ecommerce: {
        transaction_id: sessionId,
        currency: "EUR",
        value: 47,
        items: [{ item_id: "sleep-rewire-7night", item_name: "The Sleep Rewire Protocol", price: 47, quantity: 1 }],
      },
    });
  },

  completeRegistration(email?: string | null) {
    push({
      event: "CompleteRegistration",
      content_name: "The Sleep Rewire Protocol",
      page_type: "vsl",
      currency: "EUR",
      value: 47,
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
