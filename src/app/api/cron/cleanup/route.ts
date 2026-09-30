import { releaseStaleOrders } from "@/lib/orders";

// Call this on a schedule once the shop is online (e.g. Vercel Cron or any uptime pinger every 15 minutes)
// with the header  Authorization: Bearer <CRON_SECRET>
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const cancelled = await releaseStaleOrders();
  return Response.json({ cancelled });
}
