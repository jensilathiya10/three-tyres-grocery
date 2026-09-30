import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon, isIconName } from "@/components/Icon";
import { PackArt } from "@/components/PackArt";
import { ProductGrid } from "@/components/shop/ProductCard";
import { PostcodeChecker } from "@/components/shop/PostcodeChecker";
import { StudentPackButton } from "@/components/shop/StudentPackButton";
import { getCategories, getMainArea, getProduct, getProducts, toView } from "@/lib/catalog";
import { deliveryDate, money } from "@/lib/format";
import { waShopLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// The eight main categories from the brand brief; Frozen and Packs stay in the shop menu
const HOME_CATEGORIES = ["rice", "atta", "dal", "masala", "snacks", "pickles", "tea", "sweets"];
const HERO_SLUGS = ["india-gate-basmati-5kg", "aashirvaad-atta-5kg", "toor-dal-1kg", "mdh-chana-masala", "mango-pickle-500g"];

export default async function HomePage() {
  const [categories, popular, deals, { areas, main }, student, heroAll] = await Promise.all([
    getCategories(),
    getProducts({ popular: true, take: 10 }),
    getProducts({ deals: true }),
    getMainArea(),
    getProduct("student-starter-pack"),
    getProducts({}),
  ]);
  const hero = HERO_SLUGS.map((s) => heroAll.find((p) => p.slug === s)).filter((p) => !!p);
  const shownDeals = deals.filter((p) => p.stock > 0).slice(0, 4);
  const tomorrow = deliveryDate(main?.estimatedDays ?? 1).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });

  return (
    <>
      <div className="wrap">
        <section className="hero">
          <div className="min0">
            <p className="eyebrow">Indian &amp; South Asian groceries · Berlin</p>
            <h1>Your favourite Indian groceries, <em>delivered.</em></h1>
            <p className="lede">Rice, atta, dal, spices, snacks and more, conveniently delivered across Berlin. No more carrying 5 kg bags home on the U-Bahn.</p>
            <div className="ctas">
              <Link className="btn btn-primary" href="/shop"><Icon name="cart" />Shop now</Link>
              <a className="btn btn-ghost" href={waShopLink()} target="_blank" rel="noopener"><Icon name="chat" />Order on WhatsApp</a>
            </div>
            <div className="trust">
              <span><Icon name="truck" />1-day delivery</span>
              <span><Icon name="flag" />Indian products</span>
              <span><Icon name="chat" />Easy ordering</span>
            </div>
            <PostcodeChecker areas={areas} />
          </div>
          <div className="hero-art" role="img" aria-label="A basket of Indian grocery packs">
            {hero.map((p) => <PackArt key={p.id} p={p} />)}
            <span className="hero-tag"><Icon name="truck" />Order today, arrives {tomorrow}</span>
          </div>
        </section>
      </div>

      <section className="block wrap" id="categories" style={{ scrollMarginTop: 80 }}>
        <div className="sec-head">
          <h2>Shop by category</h2>
          <Link className="link" href="/shop">All products <Icon name="arrow" /></Link>
        </div>
        <div className="cats-scroll">
          <div className="cats">
            {categories.filter((c) => HOME_CATEGORIES.includes(c.slug) && c._count.products > 0).map((c) => (
              <Link key={c.id} className="cat" href={`/shop?cat=${c.slug}`} style={{ "--c": c.color } as CSSProperties}>
                <span className="ic"><Icon name={isIconName(c.slug) ? c.slug : "box"} /></span>
                {c.short}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {popular.length > 0 && (
        <section className="block wrap" style={{ paddingTop: 8 }}>
          <div className="sec-head">
            <div><h2>Popular in Berlin kitchens</h2><p>What people reorder most.</p></div>
            <Link className="link" href="/shop">See all <Icon name="arrow" /></Link>
          </div>
          <ProductGrid products={popular} />
        </section>
      )}

      {shownDeals.length > 0 && (
        <section className="block wrap">
          <div className="deals-band">
            <div>
              <p className="eyebrow">This week&apos;s deals</p>
              <h2>Stock up for less.</h2>
              <p>Real price drops on everyday staples, while stock lasts.</p>
              <Link className="btn btn-saffron" href="/shop?deals=1">View all deals <Icon name="arrow" /></Link>
            </div>
            <ProductGrid products={shownDeals} />
          </div>
        </section>
      )}

      <section className="block wrap">
        <div className="sec-head"><h2>How it works</h2></div>
        <div className="steps">
          <div className="step"><span className="n">1</span><h3>Shop online</h3><p>Pick your favourite Indian groceries from the shop, or send us your list on WhatsApp.</p></div>
          <div className="step"><span className="n">2</span><h3>Place your order</h3><p>Enter your Berlin address. No account needed.</p></div>
          <div className="step"><span className="n">3</span><h3>Get it delivered</h3><p>We pack your order and bring it to your door the next day.</p></div>
        </div>
      </section>

      {student && (
        <section className="block wrap">
          <div className="student">
            <div>
              <p className="eyebrow">For students</p>
              <h2>New to Berlin? Start with the {student.name}.</h2>
              <p className="lede">Six kitchen essentials in one order, so you can cook dal-chawal and rotis from day one without hauling heavy bags from the shop.</p>
              <div className="pricing">
                <b>{money(student.priceCents)}</b>
                {student.wasCents && <span>{money(student.wasCents)} if bought separately</span>}
              </div>
              <div className="actions">
                <StudentPackButton p={toView(student)} />
                <Link className="btn btn-ghost" href={`/product/${student.slug}`}>See what&apos;s inside</Link>
              </div>
            </div>
            <ul className="contents">
              {student.contents.map((p) => (
                <li key={p.id}><PackArt p={p} /><div className="min0"><small>{p.brand}</small><b>{p.name}</b></div></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="block wrap">
        <div className="sec-head"><h2>Why people order from us</h2></div>
        <div className="why">
          <div><span className="ic"><Icon name="truck" /></span><h3>Next-day delivery</h3><p>Your groceries arrive without a trip across the city to the Indian shop.</p></div>
          <div><span className="ic"><Icon name="flag" /></span><h3>The brands you know</h3><p>Rice, dal, masala, snacks and sweets from the brands you grew up with.</p></div>
          <div><span className="ic"><Icon name="chat" /></span><h3>Easy ordering</h3><p>Check out on the website, or send your list on WhatsApp.</p></div>
          <div><span className="ic"><Icon name="tag" /></span><h3>Fair prices</h3><p>Reasonable prices on everyday essentials, and real weekly deals.</p></div>
        </div>
      </section>
    </>
  );
}
