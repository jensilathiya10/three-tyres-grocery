import Link from "next/link";
import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getMainArea } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage({ searchParams }: PageProps<"/cart">) {
  const { main } = await getMainArea();
  const cancelled = (await searchParams).payment === "cancelled";
  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Cart</span></nav>
      <h1 className="page-h">Your cart</h1>
      {cancelled && <p className="warn" role="status" style={{ marginBottom: 20 }}>Payment cancelled. Nothing was charged, and your cart is still here.</p>}
      <CartView area={main} />
    </div>
  );
}
