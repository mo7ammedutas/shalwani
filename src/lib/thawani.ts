import "server-only";
import { assertBaisa } from "@/lib/money";

/**
 * Thawani Pay (Checkout API) integration.
 *
 * Docs: https://developer.thawani.om/ and https://docs.thawani.om/
 * - UAT/Sandbox base URL:   https://uatcheckout.thawani.om/api/v1
 * - Production base URL:    https://checkout.thawani.om/api/v1
 * - Auth header:            `thawani-api-key: <secret key>`
 * - Amounts:                integer baisa (1 OMR = 1000 baisa)
 * - Hosted pay page:        {origin}/pay/{session_id}?key={publishable key}
 *
 * Set THAWANI_MOCK=1 to run the full checkout flow locally / in tests
 * without calling Thawani at all.
 */

export interface ThawaniProduct {
  name: string;
  quantity: number;
  unit_amount: number; // integer baisa
}

export interface CreateSessionInput {
  clientReferenceId: string; // our order number
  products: ThawaniProduct[];
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface ThawaniSession {
  session_id: string;
  client_reference_id: string;
  payment_status: string; // "unpaid" | "paid" | "cancelled" | ...
  total_amount: number;
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export function isMockMode(): boolean {
  return process.env.THAWANI_MOCK === "1";
}

function baseUrl(): string {
  return env("THAWANI_BASE_URL").replace(/\/$/, "");
}

/** The customer-facing hosted checkout page for a created session. */
export function payRedirectUrl(sessionId: string): string {
  if (isMockMode()) {
    // In mock mode we skip the hosted page entirely; the checkout API
    // sends the customer straight to the success URL.
    return `/mock-pay/${sessionId}`;
  }
  const origin = baseUrl().replace(/\/api\/v\d+$/, "");
  return `${origin}/pay/${sessionId}?key=${env("THAWANI_PUBLISHABLE_KEY")}`;
}

async function thawaniFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "thawani-api-key": env("THAWANI_SECRET_KEY"),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    description?: string;
  } | null;
  if (!res.ok || !body?.success) {
    throw new Error(
      `Thawani request failed (${res.status}): ${body?.description ?? "unknown error"}`,
    );
  }
  return body.data as T;
}

export async function createCheckoutSession(
  input: CreateSessionInput,
): Promise<ThawaniSession> {
  for (const p of input.products) {
    assertBaisa(p.unit_amount);
  }

  if (isMockMode()) {
    return {
      session_id: `mock_${input.clientReferenceId}`,
      client_reference_id: input.clientReferenceId,
      payment_status: "unpaid",
      total_amount: input.products.reduce(
        (sum, p) => sum + p.unit_amount * p.quantity,
        0,
      ),
    };
  }

  return thawaniFetch<ThawaniSession>("/checkout/session", {
    method: "POST",
    body: JSON.stringify({
      client_reference_id: input.clientReferenceId,
      mode: "payment",
      products: input.products,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: input.metadata ?? {},
    }),
  });
}

export async function getSession(sessionId: string): Promise<ThawaniSession> {
  if (isMockMode()) {
    return {
      session_id: sessionId,
      client_reference_id: sessionId.replace(/^mock_/, ""),
      // Mock sessions are considered paid once queried, so the verify
      // flow can be exercised end-to-end in development and tests.
      payment_status: "paid",
      total_amount: 0,
    };
  }
  return thawaniFetch<ThawaniSession>(`/checkout/session/${sessionId}`);
}
