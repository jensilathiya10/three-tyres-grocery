import Link from "next/link";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getDeliveryAreas } from "@/lib/catalog";
import { botCheckEnabled } from "@/lib/bot-check";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const areas = await getDeliveryAreas();
  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/cart">Cart</Link><span aria-hidden="true">/</span><span>Checkout</span></nav>
      <h1 className="page-h">Checkout</h1>
      <CheckoutForm areas={areas} botCheckSiteKey={botCheckEnabled() ? process.env.TURNSTILE_SITE_KEY : undefined} />
    </div>
  );
}
