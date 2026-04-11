declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function push(data: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

export const gtm = {
  viewContent() {
    push({
      event: "ViewContent",
      content_name: "The Sleep Rewire Protocol",
      content_category: "Digital Product",
      content_type: "product",
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

  initiateCheckout(email: string) {
    push({
      event: "InitiateCheckout",
      content_name: "The Sleep Rewire Protocol",
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
      currency: "EUR",
      value: 47,
      ...(email ? { email } : {}),
    });
    push({
      event: "sign_up",
      method: "email",
    });
  },
};
