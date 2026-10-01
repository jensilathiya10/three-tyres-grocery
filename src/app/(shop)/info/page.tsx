import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { PostcodeChecker } from "@/components/shop/PostcodeChecker";
import { getDeliveryAreas } from "@/lib/catalog";
import { formatDay, money, upcomingDaysOff } from "@/lib/format";
import { waShopLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "How it works & delivery" };

export default async function InfoPage() {
  const areas = await getDeliveryAreas();
  const daysOff = upcomingDaysOff(areas[0]?.closedDays);
  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>How it works</span></nav>
      <h1 className="page-h">How Three Tyres Grocery works</h1>
      <div className="steps" style={{ marginBottom: 44 }}>
        <div className="step"><span className="n">1</span><h3>Shop online</h3><p>Browse by category or search. Add what you need to your cart. No account needed.</p></div>
        <div className="step"><span className="n">2</span><h3>Place your order</h3><p>Enter your Berlin address and pay on delivery, or confirm the order with us on WhatsApp.</p></div>
        <div className="step"><span className="n">3</span><h3>Get it delivered</h3><p>We pack everything and deliver it to your door the next evening.</p></div>
      </div>
      <div className="info-grid">
        <div className="panel" id="delivery">
          <h2>Delivery information</h2>
          {areas.map((a) => (
            <dl key={a.id} style={{ marginBottom: 12 }}>
              <dt>Area</dt><dd>{a.name}, postcodes {a.postcodeFrom}–{a.postcodeTo}</dd>
              <dt>When</dt><dd>{a.estimatedDays === 1 ? "Next day" : `In ${a.estimatedDays} days`}, 16:00–21:00, Monday to Saturday except public holidays</dd>
              <dt>Order by</dt><dd>{a.cutoffHour}:00. Later orders count as the next day&apos;s.</dd>
              <dt>Delivery fee</dt><dd>{money(a.feeCents)}</dd>
              <dt>Free delivery</dt><dd>On orders over {money(a.freeOverCents)}</dd>
              <dt>Minimum order</dt><dd>{money(a.minOrderCents)}</dd>
            </dl>
          ))}
          {daysOff.length > 0 && (
            <p style={{ margin: "4px 0 16px" }}>
              <b>No deliveries on:</b>{" "}
              {daysOff.map((o) => `${formatDay(o.date)} (${o.reason === "Shop closed" ? "we're closed" : o.reason})`).join(", ")}.
              {" "}Orders placed before then arrive on the next delivery day.
            </p>
          )}
          <PostcodeChecker areas={areas} label="Check your postcode" wide />
        </div>
        <div className="panel faq">
          <h2>Questions</h2>
          <details open><summary>Do I need an account?</summary><p>No. You order as a guest with your name, phone number and address.</p></details>
          <details><summary>How do I pay?</summary><p>Pay the driver by card or cash when your order arrives, or arrange payment with us on WhatsApp.</p></details>
          <details><summary>What if a product is out of stock?</summary><p>Out-of-stock products can&apos;t be added to the cart. Message us on WhatsApp and we&apos;ll tell you when it&apos;s back.</p></details>
          <details><summary>Can I order on WhatsApp instead?</summary><p>Yes. Send us your list and we&apos;ll put the order together and confirm the total with you.</p></details>
          <details><summary>How are frozen products delivered?</summary><p>Frozen items travel in insulated bags. Put them in your freezer when they arrive.</p></details>
        </div>
        <div className="panel" id="contact" style={{ gridColumn: "1 / -1" }}>
          <h2>Contact</h2>
          <dl>
            <dt>WhatsApp</dt><dd><a className="link" href={waShopLink()} target="_blank" rel="noopener"><Icon name="chat" />Message us</a></dd>
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL && <><dt>Email</dt><dd style={{ userSelect: "all" }}>{process.env.NEXT_PUBLIC_CONTACT_EMAIL}</dd></>}
          </dl>
        </div>
      </div>
    </div>
  );
}
