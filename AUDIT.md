# Three Tyres Grocery: Full Application Audit

**Date:** 30 September 2026
**Scope:** everything in `D:\software\delivery` — the Next.js shop (`web/`), the database, the admin, the old HTML prototype, and what the business still needs outside the code to launch in Berlin.
**How this was done:** reading every source file, the database schema and migrations, the running app on `localhost:3100`, and the results of the browser and webhook tests run while building it.

> Legal items below are practical pointers, not legal advice. Before launch, have a lawyer, the IHK Berlin, or a service like a legal-texts generator (e.g. IT-Recht Kanzlei, Händlerbund, eRecht24) check the German shop requirements.

---

## 1. How to read this report

Every item has an ID, a priority and a rough size.

| Priority | Meaning |
| --- | --- |
| **P0** | Blocks launch. Illegal to go live without it, loses money or stock, or exposes data. |
| **P1** | Needed in the first weeks after launch to run the shop properly. |
| **P2** | Clear improvement. Do once the shop is running. |
| **P3** | Later / nice to have (the "Version 2 / Version 3" ideas from the original plan). |

| Size | Meaning |
| --- | --- |
| **S** | Under half a day |
| **M** | 1–3 days |
| **L** | More than 3 days |

Tags: **[BUG]** = something that works wrong today. **[MISSING]** = not built yet. **[DEBT]** = works, but should be cleaned up. **[BIZ]** = not code; a business or admin task.

---

## 2. Summary

**What works today (tested):**
- Storefront: home, category pages, search, sorting, deals, product pages, cart, guest checkout, order confirmation page, delivery/FAQ page.
- Payment options: pay on delivery and confirm on WhatsApp.
- WhatsApp buttons everywhere, going to +49 176 20587997.
- Postcode check at checkout and on the homepage; minimum order €20; delivery €3.99; free over €49.
- Stock is reserved safely when an order is placed (no overselling, even with two orders at the same moment) and put back when an order is cancelled.
- Admin: password login, dashboard, orders (status changes, mark paid, WhatsApp the customer), products (create, edit, hide, quick stock edit), delivery areas.
- Brand: Three Tyres Grocery logo, name and copy.

**Biggest gaps, in one line each:**
1. German legal requirements for an online food shop are not met (Impressum, privacy policy, terms, withdrawal info, "order with obligation to pay" button, unit prices, full food information).
2. **Nobody is told about new orders.** No email or message goes to you or the customer.
3. Anyone can place fake orders that lock up stock, and nothing stops it.
4. The Student Starter Pack does not reduce the stock of the products inside it.
5. Unconfirmed WhatsApp / pay-on-delivery orders hold stock forever.
6. The app is not deployed, not in git, has no backups and no automated tests.
7. The catalogue is sample data (prices, stock, drawn pictures instead of photos, missing ingredients).

**Counts:** 160 numbered items: **39 × P0 · 44 × P1 · 56 × P2 · 21 × P3**, plus 5 longer-term ideas. Full list in section 20.

---

## 3. Legal and compliance (Germany)

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| L-01 | **[MISSING] Impressum page** (name, address, contact, VAT ID, register entry if any). | Required by § 5 DDG for every business website; missing Impressum is a common reason for warning letters (Abmahnungen). | New page `/impressum`, footer link | P0 | S |
| L-02 | **[MISSING] Datenschutzerklärung (privacy policy).** Must cover: order data, the checkout details saved in the browser, WhatsApp links, Google Fonts (see T-12), hosting provider, database host, how long data is kept, customer rights. | GDPR Art. 13. | New page `/datenschutz` | P0 | S |
| L-03 | **[MISSING] AGB (terms of sale)** and a link to them at checkout. The checkout currently says "you agree to our terms of sale" but there are no terms. | Needed to define delivery, payment, cancellations, liability. | New page `/agb`; `CheckoutForm.tsx` line under the button | P0 | S |
| L-04 | **[MISSING] Widerrufsbelehrung** (withdrawal information) and model withdrawal form. Consumers have a 14-day right of withdrawal for distance sales; perishable goods and opened sealed food are exceptions, but you must still explain this clearly. | § 312g BGB, Art. 246a EGBGB. | New page `/widerruf`, link at checkout and in confirmation | P0 | S |
| L-05 | **[BUG] Order button text.** "Place order · €X" is not enough in Germany; the button must clearly say the order costs money, e.g. **"Zahlungspflichtig bestellen"** / "Order and pay". | § 312j (3) BGB. Without it, the contract may not be valid. | `CheckoutForm.tsx` ~line 150 | P0 | S |
| L-06 | **[MISSING] Unit prices (Grundpreis)** such as "€3.00 / kg" or "€5.99 / l" next to every price for goods sold by weight or volume. | § 4 PAngV (price indication law). Very commonly checked. | Product card, product page, cart; needs a new "net quantity + unit" field on products | P0 | M |
| L-07 | **[MISSING] "incl. VAT, plus delivery" notice** near prices, with a link to delivery costs. | PAngV. | Product card/page, cart | P0 | S |
| L-08 | **[MISSING] Full food information before purchase:** product name, **ingredients**, **allergens (highlighted)**, net quantity, storage conditions, name/address of the food business operator, country of origin where required, and **nutrition table**. The product page now only has brand, size, origin and a short allergen line. | EU Food Information Regulation (LMIV / FIC) Art. 14: for online food sales this must be shown before the order is placed. | New product fields + product page + admin product form | P0 | M |
| L-09 | **[BUG] Deal prices may break the 30-day rule.** Crossed-out "was" prices are typed in by hand. A price reduction must be measured against the **lowest price in the previous 30 days**. | § 11 PAngV. | Needs price history table + automatic "was" price | P1 | M |
| L-10 | **[BUG] Placeholder text visible to customers:** footer shows "Impressum · Datenschutz · AGB (add before launch)" and the contact page shows "Add NEXT_PUBLIC_CONTACT_EMAIL to .env". | Looks unfinished; missing contact email is also a legal issue (Impressum needs a fast way to contact you). | `(shop)/layout.tsx` line 59; `(shop)/info/page.tsx` line 49; `.env` | P0 | S |
| L-11 | **[MISSING] German-language legal texts.** The shop is in English. Legal pages should be available in German (and ideally English). | Consumers in Germany must be able to understand them. | Legal pages | P0 | S |
| L-12 | **[MISSING] Data retention and deletion.** Orders keep name, phone, email and address forever. Decide retention (e.g. 10 years for tax records of paid orders; shorter for cancelled ones) and add a way to delete or anonymise a customer's data on request. | GDPR Art. 5, 17. | Admin tool + scheduled job | P1 | M |
| L-13 | **[MISSING] Opt-in for saving checkout details on the device.** The checkout remembers name, phone, email and address in the browser without asking. On a shared device the next person sees them. | Privacy by default (GDPR Art. 25). | `CheckoutForm.tsx` (`DRAFT_KEY`) | P1 | S |
| L-14 | **[MISSING] Deposit (Pfand) handling** if you sell drinks in single-use bottles or cans (e.g. Thums Up, Frooti, Maaza cans). The deposit must be shown separately and added to the total. | Einwegpfand (VerpackG § 31) and PAngV § 7. | Product field + cart/checkout totals | P1 (if selling such drinks) | M |
| L-15 | **[MISSING] VAT on receipts.** Food is mostly 7 % VAT, some drinks 19 %. Order confirmations and any invoices should show VAT. Products need a VAT-rate field. | Tax law (UStG); customers may ask for an invoice. | Product field, order items, confirmation page | P1 | M |
| L-16 | **[MISSING] Accessibility statement / BFSG check.** Since 28 June 2025 the Barrierefreiheitsstärkungsgesetz applies to online shops for consumers. Micro-enterprises (under 10 staff and ≤ €2 m turnover) are exempt for services, but check whether you qualify, and fix the accessibility items in section 13 anyway. | BFSG. | Whole site | P2 | S |
| L-17 | **[MISSING] Cookie/consent banner — only if you add analytics, ads or embedded maps.** Right now the site uses only necessary browser storage (cart), so no banner is needed. | TDDDG § 25. | When adding analytics | P2 | S |
| L-18 | **[MISSING] Consumer dispute resolution statement** (whether you take part in arbitration). Needed in AGB/website if you have more than 10 employees; check if it applies. | § 36 VSBG. | AGB / Impressum | P3 | S |

---

## 4. Security

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| S-01 | **[BUG] Default admin password** `change-me` in `.env`. | Anyone who guesses it controls orders and prices. | `.env` → `ADMIN_PASSWORD` | P0 | S |
| S-02 | **[MISSING] Protection against fake orders.** Anyone (or a bot) can submit unlimited pay-on-delivery orders. Each one **reserves stock**, so an attacker can make the whole shop look sold out. | Loss of sales; wasted delivery trips. | `actions/order.ts` | P0 | M |
|  | Suggested fix: rate limit by IP and phone (e.g. 3 orders / hour), a bot check (Cloudflare Turnstile or hCaptcha), and optionally phone confirmation for first-time customers or large orders. | | | | |
| S-03 | **[MISSING] Login brute-force protection.** A wrong password only waits 0.6 s; there is no lockout or rate limit. | Password can be guessed with enough tries. | `actions/admin.ts` → `login` | P0 | S |
| S-04 | **[MISSING] Individual admin accounts.** One shared password for everyone; no way to see who changed what; no way to remove one person's access except changing the password for all. | Staff turnover, accountability. | New `AdminUser` table, hashed passwords (argon2/bcrypt) | P1 | M |
| S-05 | **[MISSING] Two-factor login for admin** (TOTP app). | Admin controls money and customer data. | Admin login | P2 | M |
| S-06 | **[MISSING] Session revocation / "sign out everywhere".** Sessions last 7 days and can only be killed by changing `SESSION_SECRET`. | Lost phone / laptop. | `lib/session.ts` (store sessions in DB, or add a version number) | P2 | S |
| S-07 | **[MISSING] Security headers:** Content-Security-Policy, Strict-Transport-Security, X-Frame-Options / frame-ancestors, Referrer-Policy, Permissions-Policy. | Defence against XSS, clickjacking. | `next.config.ts` headers or `proxy.ts` | P1 | S |
| S-08 | **[MISSING] Audit log** of admin actions (status changes, price/stock edits, cancellations). | Disputes, mistakes, fraud checks. | New table + writes in `actions/admin.ts` | P2 | M |
| S-09 | **[DEBT] Order page is public to anyone with the link.** `/order/<id>` shows name, phone and address. The id is unguessable, but the link lives forever and may be forwarded. Consider hiding the phone/address after delivery or after 30 days. | Privacy. | `(shop)/order/[id]/page.tsx` | P2 | S |
| S-10 | **[DEBT] Database password** in `docker-compose.yml` is `grocery`. Fine locally; production must use a strong password and a managed database. | | `docker-compose.yml`, hosting | P0 at deploy | S |
| S-11 | **[MISSING] Dependency and secret scanning** (npm audit in CI, Dependabot/Renovate, secret scanning in the git host). | Supply-chain risk. | CI | P2 | S |
| S-12 | **[DEBT] Admin product "photo link" accepts any https URL** and shows it to customers. Only admins can set it, but an upload with fixed storage is safer and faster (see C-03). | | `ProductForm.tsx`, `actions/admin.ts` | P2 | — |

---

## 5. Orders and stock — correctness

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| O-01 | **[BUG] Bundles don't reduce component stock.** Selling a Student Starter Pack reduces only the pack's own stock (15), not the rice, atta, dal, etc. inside it. You can sell packs you can't actually pack, or sell the last rice twice. | Overselling. | `actions/order.ts` (placeOrder), `lib/orders.ts` (restock), schema `contents` | P0 | M |
|  | Fix: treat a bundle as a list of components with quantities; a bundle's available stock = the minimum of its components; reserve and restock the components. | | | | |
| O-02 | **[BUG] Unconfirmed orders hold stock forever.** A "Confirm on WhatsApp" order (or a fake pay-on-delivery order) stays "New" and keeps its stock reserved until someone cancels it by hand. | Products look sold out when they aren't. | Needs auto-cancel after e.g. 24 h if still "New" and unconfirmed, plus a clear "Unconfirmed" list in admin | P0 | S |
| O-03 | **[MISSING] Create an order from the admin** (for customers who order by WhatsApp or phone). Right now WhatsApp orders never enter the system unless the customer uses the website. | Your main channel is WhatsApp; those orders need stock and delivery tracking too. | New admin page "New order" | P0 | M |
| O-04 | **[MISSING] Edit an order** (change quantities, add or remove items, substitute a product) with stock adjusted and totals recalculated. | Very common after a WhatsApp chat ("no toor dal, send moong instead"). | Admin order page | P1 | M |
| O-05 | **[BUG] Order numbers still use the old prefix `IGB-`** ("Indian Grocery Berlin"). Change to e.g. `TTG-`. Keep search working for both. | Brand consistency. | `lib/format.ts` line 3; `admin/(panel)/orders/page.tsx` lines 16, 38 | P1 | S |
| O-06 | **[DEBT] "Today's revenue" counts unpaid orders.** It adds up every non-cancelled order placed today, including ones not yet delivered or paid. Rename to "Today's order value" and add a separate "Paid today". | Misleading numbers. | `admin/(panel)/page.tsx` | P1 | S |
| O-07 | **[MISSING] Stock history.** No record of why stock changed (order, cancellation, manual edit, delivery from supplier). | Finding mistakes and theft; reordering. | New `StockMovement` table | P2 | M |
| O-08 | **[DEBT] Low-stock threshold (5) is hard-coded in five places.** Make it one setting, ideally per product ("reorder level"). | | `ProductCard.tsx`, `product/[slug]/page.tsx`, `admin/(panel)/page.tsx`, `admin/(panel)/products/page.tsx` (×2) | P2 | S |
| O-09 | **[MISSING] Maximum quantity per order line** (e.g. to stop one customer buying all 18 bags of rice) and a max order weight per delivery. | Fair stock, delivery capacity (5 kg bags add up fast). | Checkout + product field | P2 | S |
| O-10 | **[MISSING] Returns / partial refunds / damaged items** recorded against an order. | Customer service. | Admin order page | P2 | M |
| O-11 | **[DEBT] Re-running `npm run db:seed` overwrites real prices and stock** (the seed uses upsert). Make seeding refuse to run when the database already has orders, or only insert missing products. | Accidental data loss. | `prisma/seed.ts` | P1 | S |
| O-12 | **[MISSING] Suppliers and purchase orders** (what to reorder, from whom, at what cost). | Margins and restocking. | New admin section | P3 | L |
| O-13 | **[MISSING] Cost price and margin per product.** | Knowing which products make money. | Product field + reports | P2 | S |

---

## 6. Notifications (email / WhatsApp / SMS)

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| N-01 | **[MISSING] New-order alert to you.** Nothing tells you an order arrived; you'd have to keep the admin open. Send at least an email (and ideally a WhatsApp or Telegram message) for every new order. | You will miss orders. | After `placeOrder`; use Resend / Postmark / Brevo for email; WhatsApp Business API or a Telegram bot for chat | P0 | M |
| N-02 | **[MISSING] Order confirmation email to the customer** with items, total, delivery date, address, payment method, link to their order page, and the legal texts (AGB, withdrawal info) attached or linked. The checkout even says "For your order confirmation" under the email field. | Customer trust; legally the contract confirmation must reach the customer on a durable medium (§ 312f BGB). | Email template + send | P0 | M |
| N-03 | **[MISSING] Status update messages** to the customer: confirmed, out for delivery (with a time window), delivered, cancelled. | Fewer "where is my order?" calls. | `updateOrderStatus` | P1 | M |
| N-04 | **[MISSING] Low-stock alert** to you (daily email of products at or below reorder level). | Restock in time. | Scheduled job | P2 | S |
| N-05 | **[MISSING] "Back in stock" sign-up** instead of only "ask on WhatsApp". | Win back lost sales. | Product page + new table + notification | P2 | M |
| N-06 | **[MISSING] Daily summary** for you: orders for tomorrow's delivery, items to pack. | Planning. | Scheduled job | P2 | S |

---

## 7. Payments

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| P-01 | **[DEBT] Decide what to do with the switched-off Stripe code.** The "Pay online" option was removed from checkout, but the Stripe code is still in the project: webhook route `/api/stripe/webhook` (returns 400 without a secret), `lib/stripe.ts`, `lib/orders.ts`, refund logic in the admin, `AWAITING_PAYMENT` / `ONLINE` / `REFUNDED` in the database, and the Stripe variables in `.env`. Either finish it later (P-02) or delete it. | Unused code confuses future work; the README still describes it as working. | Listed files; `README.md` "Online payments" section | P1 | S |
| P-02 | **[MISSING] Online payment (when you're ready).** Needs a Stripe (or Mollie, popular in Germany) account, test keys, a real end-to-end test, a webhook on the live domain, and the payment methods switched on in the provider dashboard. The code for Stripe Checkout already exists. | Many customers expect to pay by card, PayPal or Klarna up front; fewer cancelled deliveries. | See P-01 | P2 | M |
| P-03 | **[BIZ] Card terminal for "pay on delivery"** (e.g. SumUp, Zettle) — checkout promises "Pay the driver by card or cash". | Promise on the website must be true. | Business | P0 | — |
| P-04 | **[MISSING] Record how an on-delivery order was paid** (cash / card) and reconcile cash per driver. | Bookkeeping. | Admin order page | P2 | S |
| P-05 | **[MISSING] Receipts / invoices (PDF)** with VAT breakdown and invoice number sequence. | Customers asking for invoices; bookkeeping. See L-15. | New | P2 | M |
| P-06 | **[MISSING] Export for your accountant** (orders and payments per month as CSV, or DATEV format). | Tax filing. | Admin | P2 | S |

---

## 8. Delivery

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| D-01 | **[BUG] Postcode range may include places outside Berlin.** The single range 10115–14199 likely contains some Brandenburg postcodes (for example 12529 is Schönefeld — please verify). Replace the range with the **exact list of Berlin postcodes** you serve, or allow several ranges plus exclusions. | Orders you can't deliver, or long trips. | `DeliveryArea` table, `lib/postcode.ts`, admin delivery page | P0 | S |
| D-02 | **[MISSING] Order cut-off time.** "Next-day delivery" is promised even for an order placed at 23:59 on Friday. Add a cut-off (e.g. orders after 20:00 count as the next day). | Broken promises. | `lib/format.ts` → `deliveryDate` | P0 | S |
| D-03 | **[MISSING] Days off and public holidays.** Only Sundays are skipped. Berlin public holidays (e.g. 3 October, Christmas) and your own days off are not. | Broken promises. | `deliveryDate` + admin "closed days" setting | P1 | S |
| D-04 | **[MISSING] Delivery time slots** that customers choose (e.g. 16–18, 18–21), with a limit per slot. Right now every order says "16:00–21:00". | Customers need to be home; you need to plan. | Checkout + admin + new table | P1 | M |
| D-05 | **[MISSING] Daily capacity limit** (max orders per day). When full, the next free day is offered. | You can only deliver so many. | Settings + `deliveryDate` | P1 | S |
| D-06 | **[MISSING] Packing list and route sheet** for tomorrow: all items to pick (summed), and all addresses in a sensible order with phone numbers and notes; printable. | Daily operations. | New admin page | P1 | M |
| D-07 | **[MISSING] Delivery-fee rules by area or weight** (outer districts cost more; heavy orders). Only one flat fee per area today. | Margins. | Delivery area model | P2 | S |
| D-08 | **[MISSING] Frozen goods handling** — the FAQ promises insulated bags. Consider flagging frozen items in the packing list and limiting frozen orders to evenings you can keep the cold chain. | Food safety. | Packing list, product flag | P2 | S |
| D-09 | **[MISSING] Driver view** (today's deliveries on a phone, mark delivered, collect payment, call the customer). | Planned for Version 3. | New | P3 | L |
| D-10 | **[MISSING] Address check** (street exists in the postcode) via a geocoding service. | Fewer failed deliveries. | Checkout | P3 | M |
| D-11 | **[MISSING] Click & collect / pickup point.** | Cheaper option for customers near you. | Checkout | P3 | M |

---

## 9. Storefront (customer side)

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| U-01 | **[BUG] Taps before the page finishes loading are lost.** "Add" buttons are visible immediately, but clicks do nothing until JavaScript has loaded (seen in testing on the product page and admin login). On slow phones this feels broken. | Lost add-to-cart taps. | `BuyControl.tsx`, `CartProvider.tsx`; show a disabled/loading state until ready, or make "Add" a real form | P1 | S |
| U-02 | **[MISSING] Phone-size check.** The mobile layout (bottom tab bar, horizontal categories, 2-column grid) was written but never visually checked on a real phone during this build. Test on iPhone Safari and Android Chrome. | Most customers come from Instagram/WhatsApp on phones. | Whole site | P0 | S |
| U-03 | **[MISSING] Real product photos** instead of drawn packs. | Trust; people recognise packs. | See C-03 | P1 | M |
| U-04 | **[MISSING] Custom "page not found" and "something went wrong" pages** in the brand style, and loading skeletons for slow pages. There are no `not-found.tsx`, `error.tsx` or `loading.tsx` files. | Polished experience. | `src/app/(shop)/…` | P1 | S |
| U-05 | **[MISSING] German language version** (and switcher). Many Berlin customers, including South Asians who've lived there long, and all German-speaking customers expect German. | Reach. | i18n for all pages | P2 | L |
| U-06 | **[MISSING] Search that understands Hindi/regional names and typos** ("arhar" → toor dal, "jeera", "haldi", "basmathi"). Now it's a plain "contains" search. | People search the way they speak. | `lib/catalog.ts` → add synonyms field and fuzzy match (Postgres `pg_trgm`) | P2 | M |
| U-07 | **[MISSING] Pagination or "load more"** on the shop page. Fine for 31 products; slow with 500. | Performance at scale. | `(shop)/shop/page.tsx` | P2 | S |
| U-08 | **[MISSING] Filters:** brand, price range, in-stock only, dietary tags (vegan, gluten-free, Jain). | Easier browsing. | Shop page + product fields | P2 | M |
| U-09 | **[MISSING] Order tracking page status timeline** (placed → confirmed → out for delivery → delivered). The order page shows only the current status. | Fewer calls. | `(shop)/order/[id]/page.tsx` | P2 | S |
| U-10 | **[MISSING] "Reorder" button** on the order page. | Groceries are repeat purchases. | Order page | P2 | S |
| U-11 | **[MISSING] Instagram and Google links** in the footer and a link to your Google Business profile. | Your main channels. | Footer | P1 | S |
| U-12 | **[MISSING] More grocery packs** (festival packs, family packs) and a "packs" landing section. | Average order value. | Content + O-01 fix first | P2 | S |
| U-13 | **[DEBT] The "Categories" link in the header jumps to the homepage section.** From another page it reloads the homepage; consider a dropdown menu with all categories. | Navigation. | `Chrome.tsx` | P2 | S |
| U-14 | **[MISSING] Recently viewed / "you may also like"** based on real co-purchases. | Discovery. | Product page | P3 | M |
| U-15 | **[MISSING] Customer accounts** (optional sign-in, saved addresses, order history). Planned for Version 2. | Convenience for regulars. | New | P3 | L |
| U-16 | **[MISSING] Coupons and referral codes.** Planned for Version 2. | Marketing. | Checkout + admin | P3 | M |
| U-17 | **[MISSING] Product reviews and ratings.** Planned for Version 2 (the original design sketch showed stars; they were left out on purpose because there are no real reviews yet). | Social proof. | New | P3 | M |
| U-18 | **[MISSING] Loyalty points, subscription boxes, scheduled repeat deliveries.** Planned for Version 3. | Retention. | New | P3 | L |
| U-19 | **[MISSING] Installable app (PWA)**: web manifest, app icons (apple-touch-icon), offline page. Native apps are Version 3. | Home-screen icon for regulars. | `src/app/manifest.ts`, icons | P2 | S |

---

## 10. Catalogue and content

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| C-01 | **[BIZ] Replace the sample catalogue** — all 31 products, prices, stock numbers and "was" prices are made up. | You can't sell sample data. | Admin products, or a CSV import (C-02) | P0 | M |
| C-02 | **[MISSING] Bulk import / export of products (CSV / Excel).** Typing 200+ products one by one in the admin is slow. | Setup and price updates. | Admin | P1 | M |
| C-03 | **[MISSING] Image upload** (drag a photo in the admin; stored in S3/Cloudflare R2/Cloudinary; resized automatically with `next/image`). Now you can only paste a link. | Real photos (U-03). | Admin product form + storage | P1 | M |
| C-04 | **[MISSING] Manage categories in the admin** (add, rename, reorder, set colour and short name). Categories exist only in the seed file today. | Adding "Frozen", "Fresh vegetables", "Pakistani", "Nepali" etc. later. The original plan lists a Categories admin section. | New admin page | P1 | S |
| C-05 | **[MISSING] Delete (not just hide) products and delivery areas** safely (only if never ordered; otherwise archive). | Clean-up. | Admin | P2 | S |
| C-06 | **[MISSING] Product descriptions.** All descriptions are empty; the product page falls back to a category sentence. | SEO and trust. | Content | P1 | M |
| C-07 | **[MISSING] Product variants** (e.g. same rice in 1 kg / 5 kg / 10 kg shown as one product with a size picker). | Cleaner shop. | Schema + product page | P3 | L |
| C-08 | **[MISSING] Best-before tracking** for short-life items (sweets, frozen, fresh). | Food safety, waste. | Stock batches | P3 | L |
| C-09 | **[BIZ] Wider South Asian range** (Pakistani, Bangladeshi, Nepali, Sri Lankan brands) to match the positioning "Indian & South Asian Groceries". | Brand promise. | Catalogue | P2 | — |

---

## 11. Admin and operations

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| A-01 | **[MISSING] Customers section** (list of customers built from orders: name, phone, number of orders, total spent, last order; merge by phone). The original plan lists "Customers". | Know your regulars; WhatsApp them. | New admin page | P1 | M |
| A-02 | **[MISSING] Settings page:** shop name, contact email, WhatsApp number (now baked into the build — changing it needs a rebuild), cut-off time, closed days, low-stock level. | Changing settings without a developer. | New admin page + `Settings` table | P1 | M |
| A-03 | **[MISSING] Print packing slip / delivery note** per order. | Packing. | Admin order page | P1 | S |
| A-04 | **[MISSING] Pagination on admin orders** (only the latest 200 are shown) and date-range filters. | After a few months you won't find older orders. | `admin/(panel)/orders/page.tsx` | P1 | S |
| A-05 | **[MISSING] Sales reports:** revenue by day/week/month, top products, average order value, orders by postcode. Planned for Version 3 ("Analytics"), but basic numbers help from week one. | Decisions. | New admin page | P2 | M |
| A-06 | **[MISSING] Admin on phones.** The admin works at small widths but was built for desktop; tables scroll sideways. A simple mobile order list would help on the road. | You'll check orders on your phone. | Admin CSS / views | P2 | M |
| A-07 | **[MISSING] Live refresh of new orders** in the admin (auto-refresh or sound). | Not missing orders (with N-01). | Admin dashboard/orders | P2 | S |
| A-08 | **[MISSING] Staff roles** (owner / packer / driver) with different permissions. | Needed once you hire. Depends on S-04. | Admin | P3 | M |
| A-09 | **[MISSING] Discounts section** (percentage or fixed, time-limited sales). Listed in the original plan. | Promotions. | Admin | P3 | M |

---

## 12. SEO and marketing

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| M-01 | **[MISSING] Share preview images (Open Graph)** for the homepage and each product, so links pasted into WhatsApp and Instagram show a picture, name and price. | Your main marketing channels are link-sharing apps. | `opengraph-image.tsx` per route, `metadata.openGraph` | P1 | S |
| M-02 | **[MISSING] `sitemap.xml` and `robots.txt`.** | Google indexing. | `src/app/sitemap.ts`, `src/app/robots.ts` | P1 | S |
| M-03 | **[MISSING] Product structured data** (JSON-LD `Product` with price and availability; `LocalBusiness` / `GroceryStore` on the homepage). | Rich results in Google. | Product page, layout | P2 | S |
| M-04 | **[MISSING] Per-category page titles and descriptions** ("Indian Rice & Grains delivered in Berlin"). All shop pages are titled just "Shop". | Search ranking for "indian grocery berlin". | `(shop)/shop/page.tsx` → `generateMetadata` | P2 | S |
| M-05 | **[BIZ] Google Business profile, Instagram, WhatsApp Business profile** (catalogue, opening hours, greeting message, quick replies). | Where customers find you. | Business | P1 | — |
| M-06 | **[MISSING] Analytics** (privacy-friendly, e.g. Plausible or Umami, which may not need a cookie banner) — visits, add-to-cart rate, checkout drop-off. | Know what works. | Layout + L-17 if needed | P2 | S |
| M-07 | **[MISSING] Newsletter / WhatsApp broadcast sign-up** with consent. | Weekly deals. | Footer + consent record | P3 | M |
| M-08 | **[MISSING] Content pages**: About us, the story behind "Three Tyres", recipes using your products. | Trust and SEO. | New pages | P3 | M |

---

## 13. Accessibility

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| X-01 | **[BUG] Saffron text is too faint on the light background.** Saffron `#F28C28` on warm white has a contrast of about 2.6 : 1; small text needs 4.5 : 1. Affects the "GROCERY" part of the logo, the hero eyebrow line ("Indian & South Asian groceries · Berlin"), section eyebrows and the top-strip highlight. | Readability; accessibility law (L-16). | `globals.css` (`.eyebrow`, `.logo-text small`, `.strip b`); use a darker saffron for text (around `#B35C00`) and keep the bright one for shapes | P1 | S |
| X-02 | **[BUG] Mobile menu doesn't keep keyboard focus inside** while open, and doesn't return focus to the menu button when closed. | Keyboard and screen-reader users. | `Chrome.tsx` menu sheet | P2 | S |
| X-03 | **[MISSING] Screen-reader pass** (VoiceOver/TalkBack) on the whole checkout, and automated checks (axe) in tests. | Accessibility. | Whole site | P2 | S |
| X-04 | **[DEBT] Drawn product packs are hidden from screen readers** (correct), but when real photos are added, alt texts must be meaningful. | | `PackArt.tsx` | P2 | S |
| X-05 | **[MISSING] "Skip to content" link.** | Keyboard users. | Shop layout | P2 | S |

---

## 14. Performance

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| F-01 | **[DEBT] Every page is rendered fresh on every request** (`force-dynamic`), and the shop layout queries categories and delivery areas each time. Cache catalogue data and clear the cache when the admin changes a product (tag-based revalidation). | Speed and database load when traffic grows. | `(shop)/**`, `lib/catalog.ts` | P2 | M |
| F-02 | **[DEBT] Homepage loads the whole product list** just to pick 5 products for the hero picture. | Wasted query. | `(shop)/page.tsx` (`heroAll`) | P2 | S |
| F-03 | **[DEBT] Product page fetches the product twice** (once for the page title, once for the page). Wrap `getProduct` in React `cache()`. | Wasted query. | `(shop)/product/[slug]/page.tsx`, `lib/catalog.ts` | P2 | S |
| F-04 | **[DEBT] Shop page runs an extra query** just to count deals. | Wasted query. | `(shop)/shop/page.tsx` | P3 | S |
| F-05 | **[MISSING] Database connection pooling** for serverless hosting (e.g. Neon/Supabase pooler or Prisma Accelerate) if deployed on Vercel. | Connection limits under load. | Hosting (Z-02) | P1 at deploy | S |
| F-06 | **[MISSING] Image optimisation** once photos exist (`next/image`, WebP/AVIF, sizes). | Mobile data and speed. | `PackArt.tsx` | P2 | S |

---

## 15. Code quality and technical debt

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| Q-01 | **[DEBT] Nothing is committed to git.** The repository still has only the "Initial commit from Create Next App". All work so far exists only on this disk. | One disk failure loses everything. | `web/` | P0 | S |
| Q-02 | **[DEBT] Push to a private remote** (GitHub/GitLab). | Backup and collaboration. | — | P0 | S |
| Q-03 | **[DEBT] Remove or decide on files added by `prisma init`:** `.agents/`, `.claude/`, `.windsurf/`, `skills-lock.json` (AI-assistant instruction files from Prisma). | Clutter; unknown instructions for coding assistants. | `web/` root | P2 | S |
| Q-04 | **[DEBT] README describes online payments as working** (see P-01). | Misleading for whoever works on it next. | `README.md` | P1 | S |
| Q-05 | **[DEBT] Old HTML prototype still branded "DesiBasket"** (`D:\software\delivery\prototype\index.html` and the published prototype page). Update or archive it. | Brand confusion. | `prototype/` | P3 | S |
| Q-06 | **[DEBT] Stray `package-lock.json` at the root of drive D:** made Next.js guess the wrong project root; worked around with `turbopack.root` in `next.config.ts`. Delete the stray file (check it's unused first) and remove the workaround. | Build surprises. | `D:\package-lock.json`, `next.config.ts` | P3 | S |
| Q-07 | **[DEBT] `startOfBerlinDay()` on the dashboard uses a date-string trick** that is fragile around daylight-saving changes. Use a proper timezone library (e.g. `date-fns-tz`) or a Postgres `AT TIME ZONE` query. | Wrong "today" numbers twice a year. | `admin/(panel)/page.tsx` | P2 | S |
| Q-08 | **[DEBT] Admin forms mix `useActionState` and plain form actions**; errors from plain actions (e.g. stock edit with a bad number) fail silently. Make all admin forms show success/error. | Silent failures. | `admin/(panel)/products/page.tsx`, `setStock`, `toggleActive`, `setPaymentStatus` | P2 | S |
| Q-09 | **[DEBT] Money is stored in cents (good), but prices are typed as euros with a dot or comma**; add clearer validation messages and a € prefix in the form. | Data entry mistakes. | `ProductForm.tsx` | P3 | S |
| Q-10 | **[DEBT] Phone numbers are stored as typed.** Normalise to international format (+49…) so WhatsApp links and search work reliably. The WhatsApp link builder assumes German numbers. | Broken WhatsApp links for foreign numbers. | `actions/order.ts`, `lib/whatsapp.ts` | P2 | S |
| Q-11 | **[DEBT] Prisma is pinned to 7.10.0** because `npm install prisma` pulled an 8.0 release candidate. Keep the pin until 8.0 is stable, then upgrade deliberately. | Surprise upgrades. | `package.json` | P3 | S |
| Q-12 | **[DEBT] The WhatsApp number is baked in at build time** (`NEXT_PUBLIC_WHATSAPP`). Changing it needs a rebuild. Move it to the settings table (A-02). | Operations. | `lib/whatsapp.ts` | P2 | S |

---

## 16. Testing

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| T-01 | **[MISSING] Automated end-to-end tests** (Playwright): browse → add to cart → checkout → order page; admin login → change status → cancel restocks. These were checked by hand in the browser during the build but nothing guards them now. | Catch breakage before customers do. | New `e2e/` folder | P1 | M |
| T-02 | **[MISSING] Unit tests** for the money and rules code: `findArea`, `deliveryFee`, `deliveryDate` (Sundays, cut-off, holidays), order total calculation, stock reservation. | These rules are easy to break. | Vitest | P1 | S |
| T-03 | **[MISSING] Concurrency test** for overselling (two orders for the last item at the same moment). The code is designed for it but it was not load-tested. | Stock correctness. | Test script | P2 | S |
| T-04 | **[MISSING] Continuous integration** running type-check, lint, tests and build on every push. | Quality gate. | GitHub Actions | P1 | S |
| T-05 | **[MISSING] Staging environment** (a copy of the shop with test data) to try changes before customers see them. | Safe releases. | Hosting | P2 | S |

---

## 17. Deployment and infrastructure

| ID | Item | Why it matters | Where | Pri | Size |
| --- | --- | --- | --- | --- | --- |
| Z-01 | **[MISSING] The shop is not online.** It runs only on this computer (`localhost:3100`). | Customers can't order. | — | P0 | M |
| Z-02 | **[MISSING] Choose hosting:** e.g. Vercel (app) + Neon/Supabase (Postgres, EU region), or one small server (Hetzner, Germany) running the app and Postgres in Docker. For GDPR, prefer EU data centres and sign data-processing agreements (AVV) with each provider. | Legal and practical. | — | P0 | S |
| Z-03 | **[BIZ] Domain name** (e.g. threetyres.de / threetyresgrocery.de) and business email (hello@…). Check trademark and name availability first, as the original plan advised. | Brand, trust, legal contact. | — | P0 | S |
| Z-04 | **[MISSING] HTTPS** (automatic on Vercel; Caddy/Traefik on a server). | Security; required for secure cookies. | Hosting | P0 | S |
| Z-05 | **[MISSING] Database backups** (daily, kept 30 days, restore tested once). | Orders are your business records. | Hosting | P0 | S |
| Z-06 | **[MISSING] Production migration step**: run `npm run db:deploy` on every release; never run `db:seed` against production (see O-11). | Safe releases. | Deploy script | P0 | S |
| Z-07 | **[MISSING] Error monitoring** (Sentry or similar) with alerts. Right now errors only print to the server console. | Know when checkout breaks. | App | P1 | S |
| Z-08 | **[MISSING] Uptime monitoring** (e.g. Better Stack, UptimeRobot) with an alert to your phone. | Know when the shop is down. | — | P1 | S |
| Z-09 | **[MISSING] Health-check endpoint** (`/api/health` that checks the database). | For monitoring and hosting. | New route | P2 | S |
| Z-10 | **[MISSING] Production environment variables** set on the host: strong `ADMIN_PASSWORD`, new `SESSION_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_CONTACT_EMAIL`, `APP_URL`. | Security, correct links. | Host settings | P0 | S |
| Z-11 | **[MISSING] Structured logging** of orders and errors (with no personal data in logs). | Troubleshooting. | App | P2 | S |

---

## 18. Business setup (not code, but blocks launch)

| ID | Item | Pri |
| --- | --- | --- |
| B-01 | **[BIZ] Register the business** (Gewerbeanmeldung at the Bezirksamt) and tell the Finanzamt (tax number; decide on Kleinunternehmer rules or VAT registration; get a VAT ID if needed for the Impressum). | P0 |
| B-02 | **[BIZ] Register as a food business** with the food safety authority (Veterinär- und Lebensmittelaufsicht) of your Bezirk before selling food. Follow basic hygiene (HACCP) rules for storage, especially frozen goods. | P0 |
| B-03 | **[BIZ] Packaging law registration:** register in the LUCID packaging register and sign up with a dual system (e.g. for cartons and bags you deliver in) before sending packaged goods to consumers. | P0 |
| B-04 | **[BIZ] Business liability insurance** (Betriebshaftpflicht), and vehicle insurance covering commercial deliveries. | P0 |
| B-05 | **[BIZ] Trademark and name check** for "Three Tyres Grocery" (DPMA register search) before printing bags and signs. | P1 |
| B-06 | **[BIZ] Decide real delivery rules** — fee, free-delivery threshold, minimum order, areas, days, times — then enter them in the admin. The current €3.99 / €49 / €20 are placeholders. | P0 |
| B-07 | **[BIZ] Card terminal** for pay-on-delivery (see P-03). | P0 |
| B-08 | **[BIZ] WhatsApp Business app** on the shop number, with a catalogue, away message and labels for order stages. | P1 |
| B-09 | **[BIZ] Supplier agreements** and a stock-counting routine so the website stock matches the shelf. | P1 |
| B-10 | **[BIZ] Customer service rules** — what you do when an item is missing, damaged or late (refund, substitute, credit). Put the answer in the AGB and FAQ. | P1 |

---

## 19. Suggested order of work

**Sprint 1 — make it safe and legal to launch (P0 code):**
1. Q-01, Q-02 — commit and push to a private repository.
2. S-01, S-03, Z-10 — strong passwords and secrets, login rate limit.
3. L-01 … L-08, L-10, L-11 — legal pages, order button text, unit prices, "incl. VAT" note, full food information fields.
4. O-01 — bundles reserve their component stock.
5. O-02 — auto-cancel unconfirmed orders.
6. S-02 — bot check + rate limit on orders.
7. D-01, D-02 — exact Berlin postcodes and an order cut-off time.
8. N-01, N-02 — new-order alert to you; confirmation email to the customer.
9. O-03 — create orders from the admin for WhatsApp customers.
10. U-02 — test on real phones.
11. Z-01 … Z-06 — hosting, domain, HTTPS, backups, safe migrations.
12. C-01 — real catalogue; B-01 … B-07 in parallel.

**Sprint 2 — run it smoothly (P1):**
O-04 edit orders · O-05 order prefix · O-06 dashboard wording · D-03 holidays · D-04 time slots · D-05 capacity · D-06 packing/route sheet · A-01 customers · A-02 settings · A-03 packing slip · A-04 order pagination · N-03 status messages · C-02 CSV import · C-03 image upload · C-04 categories admin · C-06 descriptions · U-01 lost taps · U-03 photos · U-04 error pages · U-11 social links · M-01 share previews · M-02 sitemap · X-01 contrast · S-04 staff accounts · S-07 security headers · L-09 30-day price rule · L-12 retention · L-13 save-details opt-in · L-15 VAT · P-01 Stripe decision · Q-04 README · T-01, T-02, T-04 tests and CI · Z-07, Z-08 monitoring.

**Sprint 3 onwards — grow (P2, then P3):** everything else, starting with online payment (P-02), German language (U-05), better search (U-06), reports (A-05), caching (F-01).

---

## 20. Master checklist by priority

Copy items into your task tracker in this order. IDs link back to the sections above.

### P0 — before launch (39)
- [ ] L-01 Impressum page
- [ ] L-02 Privacy policy (Datenschutzerklärung)
- [ ] L-03 Terms of sale (AGB) + link at checkout
- [ ] L-04 Withdrawal information (Widerrufsbelehrung)
- [ ] L-05 Order button "Zahlungspflichtig bestellen" / "Order and pay"
- [ ] L-06 Unit prices (€/kg, €/l)
- [ ] L-07 "incl. VAT, plus delivery" near prices
- [ ] L-08 Full food information (ingredients, allergens, nutrition, storage, operator)
- [ ] L-10 Remove placeholder texts; set contact email
- [ ] L-11 Legal texts in German
- [x] S-01 Change default admin password — done: random password in .env; production refuses weak passwords
- [x] S-02 Stop fake orders (rate limit + bot check) — done: 5/hour per IP, 4 per 6 h per phone; Turnstile when keys are set
- [x] S-03 Login rate limit / lockout — done: 5 wrong tries → 15 min lockout per IP
- [ ] S-10 Strong production database password
- [ ] O-01 Bundles reduce component stock
- [ ] O-02 Auto-cancel unconfirmed orders
- [ ] O-03 Create orders from the admin (WhatsApp/phone)
- [ ] N-01 New-order alert to shop owner
- [ ] N-02 Order confirmation email to customer
- [ ] P-03 Card terminal for pay-on-delivery
- [ ] D-01 Exact Berlin postcode list
- [ ] D-02 Order cut-off time
- [ ] U-02 Real-phone layout test
- [ ] C-01 Real catalogue, prices and stock
- [x] Q-01 Commit — done on branch launch-prep
- [ ] Q-02 Push to a private git remote (needs your GitHub/GitLab account)
- [ ] Z-01 … Z-06, Z-10 Hosting, domain, HTTPS, backups, safe migrations, production env vars
- [ ] B-01 … B-04, B-06, B-07 Business registration, food registration, packaging register, insurance, delivery rules, card terminal

### P1 — first weeks after launch (44)
- [ ] L-09 30-day lowest-price rule for deals
- [ ] L-12 Data retention and deletion
- [ ] L-13 Opt-in for remembering checkout details
- [ ] L-14 Bottle/can deposit (if selling such drinks)
- [ ] L-15 VAT rates and VAT on confirmations
- [ ] S-04 Individual admin accounts
- [ ] S-07 Security headers
- [ ] O-04 Edit orders
- [ ] O-05 Order number prefix TTG-
- [ ] O-06 Dashboard "revenue" wording
- [ ] O-11 Make seeding safe
- [ ] N-03 Status update messages to customers
- [ ] P-01 Decide on the switched-off Stripe code
- [ ] D-03 Public holidays and days off
- [ ] D-04 Delivery time slots
- [ ] D-05 Daily capacity limit
- [ ] D-06 Packing list and route sheet
- [ ] U-01 Taps lost before page loads
- [ ] U-03 Real product photos
- [ ] U-04 Branded 404 / error / loading pages
- [ ] U-11 Instagram / Google links in footer
- [ ] C-02 CSV import/export
- [ ] C-03 Image upload
- [ ] C-04 Categories admin
- [ ] C-06 Product descriptions
- [ ] A-01 Customers section
- [ ] A-02 Settings page
- [ ] A-03 Packing slip
- [ ] A-04 Order pagination and date filters
- [ ] M-01 Share preview images
- [ ] M-02 Sitemap and robots.txt
- [ ] M-05 Google Business / Instagram / WhatsApp Business profiles
- [ ] X-01 Saffron text contrast
- [ ] F-05 Database connection pooling (at deploy)
- [ ] Q-04 Update README
- [ ] T-01 End-to-end tests
- [ ] T-02 Unit tests for rules
- [ ] T-04 Continuous integration
- [ ] Z-07 Error monitoring
- [ ] Z-08 Uptime monitoring
- [ ] B-05 Trademark check
- [ ] B-08 WhatsApp Business setup
- [ ] B-09 Supplier and stock-count routine
- [ ] B-10 Customer service rules

### P2 — improvements (56)
- [ ] L-16 BFSG accessibility check · L-17 Consent banner if analytics added
- [ ] S-05 Two-factor login · S-06 Sign out everywhere · S-08 Audit log · S-09 Limit order-page data · S-11 Dependency scanning · S-12 Replace photo links with uploads
- [ ] O-07 Stock history · O-08 One low-stock setting · O-09 Max quantity / weight · O-10 Returns and partial refunds · O-13 Cost price and margin
- [ ] N-04 Low-stock alert · N-05 Back-in-stock sign-up · N-06 Daily summary
- [ ] P-02 Online payment · P-04 Record cash/card on delivery · P-05 Invoices (PDF) · P-06 Accountant export
- [ ] D-07 Fee by area/weight · D-08 Frozen goods handling
- [ ] U-05 German version · U-06 Smarter search · U-07 Pagination · U-08 Filters · U-09 Status timeline · U-10 Reorder button · U-12 More packs · U-13 Categories menu · U-19 Installable app (PWA)
- [ ] C-05 Safe delete · C-09 Wider South Asian range
- [ ] A-05 Sales reports · A-06 Admin on phones · A-07 Live order refresh
- [ ] M-03 Structured data · M-04 Category page titles · M-06 Analytics
- [ ] X-02 Menu focus trap · X-03 Screen-reader pass · X-04 Photo alt texts · X-05 Skip link
- [ ] F-01 Caching · F-02 Hero query · F-03 Duplicate product query · F-06 Image optimisation
- [ ] Q-03 Remove prisma-init extras · Q-07 Timezone-safe "today" · Q-08 Admin form feedback · Q-10 Phone normalisation · Q-12 WhatsApp number in settings
- [ ] T-03 Concurrency test · T-05 Staging environment
- [ ] Z-09 Health check · Z-11 Structured logging

### P3 — later (21 + 5 ideas)
- [ ] L-18 Dispute resolution statement (check if it applies)
- [ ] O-12 Suppliers and purchase orders
- [ ] D-09 Driver view · D-10 Address check · D-11 Click & collect
- [ ] U-14 Recommendations · U-15 Customer accounts · U-16 Coupons and referrals · U-17 Reviews · U-18 Loyalty, subscriptions, repeat deliveries
- [ ] C-07 Product variants · C-08 Best-before tracking
- [ ] A-08 Staff roles · A-09 Discounts section
- [ ] M-07 Newsletter / broadcast sign-up · M-08 About, story and recipe pages
- [ ] F-04 Deal-count query
- [ ] Q-05 Update or archive the old prototype · Q-06 Stray package-lock and root workaround · Q-09 Price input polish · Q-11 Prisma upgrade when 8.0 is stable
- [ ] Native Android/iOS app (Version 3 of the original plan)
- [ ] Multiple delivery slots per day with live availability (extends D-04)
- [ ] Personalised recommendations (extends U-14)
- [ ] Multi-city expansion (areas outside Berlin)
- [ ] Marketplace for other South Asian sellers (only if the business grows that way)

---

## 21. Reference: what exists today

**Customer pages** (`src/app/(shop)`): `/` home · `/shop` (category, search, sort, deals via URL) · `/product/[slug]` · `/cart` · `/checkout` · `/checkout/cancelled` (Stripe return link, unused while online payment is off) · `/order/[id]` private order page · `/info` how it works, delivery, FAQ, contact.

**Admin pages** (`src/app/admin`): `/admin/login` · `/admin` dashboard · `/admin/orders` and `/admin/orders/[id]` · `/admin/products` and `/admin/products/[id]` (`new` to create) · `/admin/delivery`.

**Server logic:** `src/app/actions/order.ts` (place order: validates input, re-reads prices and stock, checks postcode and minimum order, reserves stock in one transaction) · `src/app/actions/admin.ts` (login, order status with restock, products, stock, delivery areas) · `src/app/actions/cart.ts` (refresh cart prices/stock) · `src/app/api/stripe/webhook/route.ts` (unused while online payment is off).

**Data** (`prisma/schema.prisma`): Category · Product · DeliveryArea · Order · OrderItem. Money in cents. Two migrations: `init` and `online_payments`.

**Run locally:** see `README.md` (`npm run db:up`, `db:migrate`, `db:seed`, `dev`).
