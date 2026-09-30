import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

export type Limit = { ok: boolean; count: number; retryAfterSec: number };

/**
 * Counts one hit for `key` in a fixed window and says whether it's still within `max`.
 * A single atomic upsert, so parallel requests can't slip past the limit.
 */
export async function hit(key: string, max: number, windowSec: number): Promise<Limit> {
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, NOW() + make_interval(secs => ${windowSec}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN NOW() + make_interval(secs => ${windowSec}) ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  // Occasionally sweep expired rows so the table stays small
  if (Math.random() < 0.02) await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 86_400_000) } } });
  const { count, resetAt } = rows[0];
  return { ok: count <= max, count, retryAfterSec: Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)) };
}

/** Checks a counter without adding to it, e.g. to refuse a login while locked out. */
export async function peek(key: string, max: number): Promise<Limit> {
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt.getTime() < Date.now()) return { ok: true, count: 0, retryAfterSec: 0 };
  return { ok: row.count < max, count: row.count, retryAfterSec: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)) };
}

export async function reset(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}

/** Best-effort client IP. Behind a proxy/CDN the first X-Forwarded-For entry is the visitor. */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

/** "15 minutes", "2 hours" — for telling people how long to wait. */
export function waitText(sec: number) {
  const m = Math.max(1, Math.ceil(sec / 60));
  if (m < 90) return `${m} minute${m === 1 ? "" : "s"}`;
  const h = Math.round(m / 60);
  return `${h} hour${h === 1 ? "" : "s"}`;
}
