import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { cancelAndRestock, recordPayment } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

// Stripe calls this after payments. Set the endpoint in the Stripe Dashboard to
// https://<your-domain>/api/stripe/webhook with the four checkout.session events handled below.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    // The signature covers the raw body, so read it as text before parsing
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await recordPayment(event.data.object);
        break;
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const orderId = event.data.object.metadata?.orderId;
        if (orderId) await cancelAndRestock(orderId, true);
        break;
      }
    }
  } catch (e) {
    console.error(`Stripe webhook ${event.type} failed`, e);
    return new Response("Handler error", { status: 500 }); // Stripe retries
  }

  revalidatePath("/", "layout");
  return Response.json({ received: true });
}
