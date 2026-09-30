import "server-only";

export const botCheckEnabled = () => !!(process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY);

/** Verifies a Cloudflare Turnstile token. Passes automatically when Turnstile isn't configured. */
export async function verifyBotCheck(token: string, ip: string) {
  if (!botCheckEnabled()) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("Turnstile verification failed", e);
    return false;
  }
}
