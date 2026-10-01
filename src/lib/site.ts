import "server-only";
import { headers } from "next/headers";

/** Public base URL for links in emails and alerts: APP_URL when set, otherwise the current request's host. */
export async function siteBase() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"}`;
}
