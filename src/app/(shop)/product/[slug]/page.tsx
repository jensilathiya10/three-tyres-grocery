import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Fragment, type CSSProperties } from "react";
import { unitPrice } from "@/lib/unit-price";
import { Icon } from "@/components/Icon";
import { PackArt } from "@/components/PackArt";
import { AddToCartBox } from "@/components/cart/BuyControl";
import { ProductGrid, StockTag } from "@/components/shop/ProductCard";
import { getMainArea, getProduct, getProducts, toView } from "@/lib/catalog";
import { berlinHour, deliveryDate, formatDay, money } from "@/lib/format";
import { waShopLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: `${p.brand} ${p.name} ${p.size}`, description: p.description || p.category.blurb } : {};
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const [{ main }, related] = await Promise.all([
    getMainArea(),
    getProducts({ cat: p.category.slug === "packs" ? "rice" : p.category.slug, take: 5 }),
  ]);
  const view = toView(p);
  const more = related.filter((x) => x.id !== p.id && x.stock > 0).slice(0, 4);
  const contentsTotal = p.contents.reduce((s, x) => s + x.priceCents, 0);
  const perUnit = unitPrice(p.priceCents, p.netQuantity, p.netUnit);
  // "Energy: 1500 kJ / 355 kcal" per line → table rows
  const nutrition = p.nutrition
    .split(/\r?\n/)
    .map((line) => {
      const i = line.indexOf(":");
      return i < 0 ? ["", ""] : [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
    .filter(([k, v]) => k && v) as [string, string][];

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link><span aria-hidden="true">/</span>
        <Link href={`/shop?cat=${p.category.slug}`}>{p.category.name}</Link><span aria-hidden="true">/</span>
        <span>{p.name}</span>
      </nav>
      <div className="pdp">
        <div className="pdp-media" style={{ "--pb": p.packBg } as CSSProperties}>
          <StockTag p={view} />
          <PackArt p={view} />
        </div>
        <div className="min0">
          <span className="brand">{p.brand}</span>
          <h1>{p.name}</h1>
          <p className="size">{p.size}</p>
          <div className="pricerow">
            <span className="price">{money(p.priceCents)}</span>
            {p.wasCents && <><span className="was">{money(p.wasCents)}</span><span className="save">Save {money(p.wasCents - p.priceCents)}</span></>}
          </div>
          <p className="hint" style={{ marginTop: 6 }}>
            {perUnit && <>{perUnit} · </>}Incl. VAT, plus <Link className="link" href="/info#delivery" style={{ fontWeight: 600 }}>delivery</Link>
          </p>
          {p.stock <= 0 ? <p className="stock out">Out of stock. Ask us on WhatsApp when it&apos;s back.</p>
            : p.stock <= 5 ? <p className="stock low">Only {p.stock} left in stock</p>
            : <p className="stock">In stock</p>}

          {p.stock > 0 ? (
            <AddToCartBox p={view} />
          ) : (
            <div className="buybox">
              <a className="btn btn-ghost" href={waShopLink(`Hi! Please let me know when ${p.brand} ${p.name} (${p.size}) is back in stock.`)} target="_blank" rel="noopener">
                <Icon name="chat" />Tell me when it&apos;s back
              </a>
            </div>
          )}

          {p.description && <p style={{ marginTop: 20 }}>{p.description}</p>}

          {p.contents.length > 0 && (
            <div className="inside">
              <h2>What&apos;s inside</h2>
              <ul>
                {p.contents.map((x) => (
                  <li key={x.id}><Link href={`/product/${x.slug}`}>{x.brand} {x.name}, {x.size}</Link><span className="num muted">{money(x.priceCents)}</span></li>
                ))}
                <li style={{ borderTop: "1px solid var(--line)", paddingTop: 6, marginTop: 4 }}><b>Bought separately</b><b className="num">{money(contentsTotal)}</b></li>
              </ul>
            </div>
          )}

          {main && (
            <ul className="perks">
              <li><Icon name="truck" />Delivered {formatDay(deliveryDate(main))} if you order {berlinHour() < main.cutoffHour ? `before ${main.cutoffHour}:00 today` : "now"}</li>
              <li><Icon name="box" />Free delivery on orders over {money(main.freeOverCents)}</li>
              <li><Icon name="pin" />{main.name} postcodes {main.postcodeFrom}–{main.postcodeTo}</li>
            </ul>
          )}

          <div className="specs">
            <h2>Product information</h2>
            <dl>
              <dt>Brand</dt><dd>{p.brand}</dd>
              <dt>Net quantity</dt><dd>{p.size}</dd>
              <dt>Category</dt><dd>{p.category.name}</dd>
              <dt>Country of origin</dt><dd>{p.origin}</dd>
              {p.ingredients && <><dt>Ingredients</dt><dd><Emphasised text={p.ingredients} /></dd></>}
              <dt>Allergens</dt><dd>{p.allergens || (p.ingredients ? "See the highlighted ingredients." : "See the pack label for full allergen information.")}</dd>
              {p.storage && <><dt>Storage</dt><dd>{p.storage}</dd></>}
              {p.foodOperator && <><dt>Responsible food business</dt><dd style={{ whiteSpace: "pre-line" }}>{p.foodOperator}</dd></>}
            </dl>
            {nutrition.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, marginTop: 20, marginBottom: 6 }}>Nutrition per 100 g / 100 ml</h3>
                <dl>
                  {nutrition.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd className="num">{v}</dd></Fragment>)}
                </dl>
              </>
            )}
          </div>
        </div>
      </div>
      {more.length > 0 && (
        <section className="block" style={{ paddingTop: 12 }}>
          <div className="sec-head"><h2>More {p.category.slug === "packs" ? "staples" : p.category.name.toLowerCase()}</h2></div>
          <ProductGrid products={more} />
        </section>
      )}
    </div>
  );
}

/** Shows ingredient text with **allergens** in bold, as EU food law requires. Escapes everything else. */
function Emphasised({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  )}</>;
}
