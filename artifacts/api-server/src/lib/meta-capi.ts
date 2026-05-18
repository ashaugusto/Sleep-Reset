import { createHash } from "node:crypto";
import { logger } from "./logger";

const PIXEL_ID = process.env.META_PIXEL_ID || "1277058757910786";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export type CapiUserData = {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type CapiCustomData = {
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contentType?: string;
  contentCategory?: string;
  numItems?: number;
  orderId?: string;
};

export type CapiEventInput = {
  eventName: "Lead" | "Purchase" | "InitiateCheckout" | "ViewContent" | "CompleteRegistration";
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: "website" | "email" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other";
  userData: CapiUserData;
  customData?: CapiCustomData;
};

function buildUserData(u: CapiUserData): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (u.email) data.em = [sha256(normalizeEmail(u.email))];
  if (u.phone) {
    const p = normalizePhone(u.phone);
    if (p) data.ph = [sha256(p)];
  }
  if (u.externalId) data.external_id = [sha256(u.externalId)];
  if (u.clientIp) data.client_ip_address = u.clientIp;
  if (u.clientUserAgent) data.client_user_agent = u.clientUserAgent;
  if (u.fbp) data.fbp = u.fbp;
  if (u.fbc) data.fbc = u.fbc;
  return data;
}

function buildCustomData(c?: CapiCustomData): Record<string, unknown> | undefined {
  if (!c) return undefined;
  const data: Record<string, unknown> = {};
  if (c.value !== undefined) data.value = c.value;
  if (c.currency) data.currency = c.currency;
  if (c.contentIds) data.content_ids = c.contentIds;
  if (c.contentName) data.content_name = c.contentName;
  if (c.contentType) data.content_type = c.contentType;
  if (c.contentCategory) data.content_category = c.contentCategory;
  if (c.numItems !== undefined) data.num_items = c.numItems;
  if (c.orderId) data.order_id = c.orderId;
  return data;
}

export async function sendCapiEvent(input: CapiEventInput): Promise<{ ok: boolean; status: number; body: unknown }> {
  if (!ACCESS_TOKEN) {
    logger.warn("[meta-capi] META_ACCESS_TOKEN missing — event dropped");
    return { ok: false, status: 0, body: { error: "no_token" } };
  }

  const eventTime = input.eventTime ?? Math.floor(Date.now() / 1000);

  const event: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: eventTime,
    event_id: input.eventId,
    action_source: input.actionSource ?? "website",
    user_data: buildUserData(input.userData),
  };
  if (input.eventSourceUrl) event.event_source_url = input.eventSourceUrl;
  const customData = buildCustomData(input.customData);
  if (customData) event.custom_data = customData;

  const body: Record<string, unknown> = { data: [event] };
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseBody: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      logger.error({ status: res.status, body: responseBody, eventName: input.eventName, eventId: input.eventId }, "[meta-capi] event failed");
      return { ok: false, status: res.status, body: responseBody };
    }
    logger.info({ eventName: input.eventName, eventId: input.eventId, body: responseBody }, "[meta-capi] event sent");
    return { ok: true, status: res.status, body: responseBody };
  } catch (err) {
    logger.error({ err, eventName: input.eventName, eventId: input.eventId }, "[meta-capi] fetch error");
    return { ok: false, status: 0, body: { error: String(err) } };
  }
}
