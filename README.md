# Three Tyres Grocery

Indian & South Asian groceries delivered across Berlin. Next.js 16 storefront with guest checkout, WhatsApp ordering, postcode-based delivery areas, and an admin for orders, products and delivery settings.

## Run it locally

Needs Node 20+ and Docker.

```bash
npm install            # also generates the Prisma client
cp .env.example .env   # then set ADMIN_PASSWORD and SESSION_SECRET
npm run db:up          # Postgres on localhost:5433
npm run db:migrate     # create tables
npm run db:seed        # sample catalogue + Berlin delivery area
npm run dev            # http://localhost:3000
```

Admin: http://localhost:3000/admin (password from `ADMIN_PASSWORD`).

## Settings (.env)

| Variable | What it does |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `ADMIN_PASSWORD` | Admin login password |
| `SESSION_SECRET` | Signs the admin session cookie. Long random string. |
| `NEXT_PUBLIC_WHATSAPP` | Shop's WhatsApp number, e.g. `4915112345678`. Empty opens WhatsApp's contact picker. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown on the contact page |

| `STRIPE_SECRET_KEY` | Turns on "Pay online now" at checkout. Use `sk_test_…` while testing. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret (`whsec_…`) of the webhook endpoint |
| `APP_URL` | Public address of the shop, used for Stripe's return links |

## Online payments (Stripe)

Checkout sends customers to Stripe's hosted payment page, so card details never touch this server. Which methods appear (cards, Apple Pay, Google Pay, PayPal, Klarna, SEPA…) is controlled in the Stripe Dashboard under Settings → Payment methods; no code change needed.

1. Create a Stripe account and copy the **test** secret key into `STRIPE_SECRET_KEY`. Restart the server.
2. Webhook: in the Dashboard add an endpoint `https://<your-domain>/api/stripe/webhook` with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
   Locally, use the Stripe CLI instead: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, which prints a `whsec_…` secret.
3. Pay with test card `4242 4242 4242 4242`, any future date, any CVC.
4. When you go live, swap in the live keys and a live webhook secret.

How an online order moves:
- Placing it reserves the stock and creates the order as **Awaiting payment** for up to 30 minutes.
- Payment succeeds → the order becomes **New** and is marked paid (from the webhook, or straight away when the customer lands back on the order page).
- Customer presses back, the session expires, or a bank payment fails → the order is cancelled and the stock is released.
- Cancelling a paid online order in the admin refunds it through Stripe automatically.

## How it fits together

- `src/app/(shop)` – storefront: home, `/shop` (category, search, sort, deals via URL), `/product/[slug]`, `/cart`, `/checkout`, `/order/[id]` (private receipt link), `/info`.
- `src/app/admin` – login, dashboard, orders (status changes; cancelling restocks), products (inline stock, create/edit), delivery areas.
- `src/app/actions` – server actions. `placeOrder` re-reads prices and stock from the database, checks the postcode and minimum order, and decrements stock inside one transaction, so the browser's cart is never trusted.
- `src/lib` – database client, catalogue queries, postcode rules, admin session signing.
- The cart lives in the browser (localStorage) and is refreshed from the server on each visit.
- Money is stored in cents. Products without a photo get a drawn pack in their own colours.

## Before launch

- Replace the sample catalogue (prices, stock, allergens, origin) with real data from each pack label.
- Set a strong `ADMIN_PASSWORD` and `SESSION_SECRET`, and your WhatsApp number.
- Add Impressum, Datenschutzerklärung and AGB pages (required in Germany).
- Switch to live Stripe keys and a live webhook, and turn on the payment methods you want in the Stripe Dashboard.
- Order confirmation emails are not sent yet.
