// Which database to connect to, shared by the app, the seed script and prisma.config.ts.
//
// Locally DATABASE_URL points at the Docker database. On Vercel the Supabase integration sets
// POSTGRES_PRISMA_URL (pooled, for the app) and POSTGRES_URL_NON_POOLING (direct, for migrations)
// as hidden values, so we read those when DATABASE_URL isn't set.

export function databaseUrl(kind: "app" | "direct" = "app") {
  const e = process.env;
  return e.DATABASE_URL || (kind === "direct" ? e.POSTGRES_URL_NON_POOLING : e.POSTGRES_PRISMA_URL || e.POSTGRES_URL) || undefined;
}

/**
 * Options for node-postgres. Supabase serves TLS with its own certificate authority, which newer
 * node-postgres rejects when the URL says sslmode=require, so for Supabase we keep TLS on but skip the
 * certificate check, and drop the PgBouncer-only "pgbouncer" flag that node-postgres doesn't understand.
 */
export function pgConfig(kind: "app" | "direct" = "app") {
  const raw = databaseUrl(kind);
  if (!raw) return { connectionString: raw };
  const url = new URL(raw);
  if (!/\.supabase\.(co|com)$/.test(url.hostname)) return { connectionString: raw };
  url.searchParams.delete("sslmode");
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("supa");
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: false } };
}
