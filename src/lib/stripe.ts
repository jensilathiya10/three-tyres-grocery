import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Online payments switch on as soon as a Stripe secret key is set. */
export const onlinePaymentsEnabled = () => !!process.env.STRIPE_SECRET_KEY;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client ??= new Stripe(key);
  return client;
}

/** Public base URL for Stripe's return links. */
export function siteUrl(requestHost?: string | null, proto?: string | null) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  return `${proto ?? "http"}://${requestHost ?? "localhost:3000"}`;
}
