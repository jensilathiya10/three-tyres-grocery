import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "./db";
import { formatDay, money, orderNo } from "./format";

/*
 * Order notifications. Everything here is optional and switches on through .env:
 *   SMTP_URL            e.g. smtps://user:password@smtp.example.com:465 (or smtp://localhost:1025 for Mailpit)
 *   MAIL_FROM           e.g. "Three Tyres Grocery <orders@threetyres.de>"
 *   SHOP_NOTIFY_EMAIL   where new-order alerts go (your inbox)
 *   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID   push new-order alerts to your phone
 * A failed notification is logged and never blocks or undoes an order.
 */

let transport: Transporter | null = null;
function mailer() {
  if (!process.env.SMTP_URL) return null;
  transport ??= nodemailer.createTransport(process.env.SMTP_URL);
  return transport;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function sendMail(to: string, subject: string, text: string, html: string) {
  const m = mailer();
  if (!m) {
    console.info(`[mail not configured] would send "${subject}" to ${to}`);
    return;
  }
  await m.sendMail({ from: process.env.MAIL_FROM || "Three Tyres Grocery <no-reply@localhost>", to, subject, text, html });
}

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
}

const PAYMENT_TEXT: Record<string, string> = {
  ON_DELIVERY: "Pay the driver by card or cash on delivery.",
  WHATSAPP: "We'll confirm the order and payment with you on WhatsApp.",
  ONLINE: "Paid online.",
};

async function loadOrder(orderId: string) {
  return db.order.findUnique({ where: { id: orderId }, include: { items: true } });
}
type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function orderLines(o: LoadedOrder) {
  return o.items.map((i) => ({ label: `${i.quantity} × ${i.name} (${i.size})`, amount: money(i.priceCents * i.quantity) }));
}

function customerEmail(o: LoadedOrder, base: string) {
  const no = orderNo(o.number);
  const first = o.customerName.split(" ")[0];
  const address = `${o.street}${o.apartment ? ", " + o.apartment : ""}, ${o.postcode} ${o.city}`;
  const when = `${formatDay(o.deliveryDate)}, 16:00–21:00`;
  const link = `${base}/order/${o.id}`;
  const lines = orderLines(o);
  const fee = o.deliveryFeeCents ? money(o.deliveryFeeCents) : "Free";

  const text = [
    `Hi ${first},`,
    ``,
    `thank you for your order ${no} with Three Tyres Grocery.`,
    ``,
    ...lines.map((l) => `${l.label}  ${l.amount}`),
    ``,
    `Subtotal: ${money(o.subtotalCents)}`,
    `Delivery: ${fee}`,
    `Total (incl. VAT): ${money(o.totalCents)}`,
    ``,
    `Delivery: ${when}`,
    `Address: ${address}`,
    `Payment: ${PAYMENT_TEXT[o.paymentMethod] ?? ""}`,
    ``,
    `Your order page: ${link}`,
    ``,
    `Terms of sale: ${base}/agb`,
    `Right of withdrawal: ${base}/widerruf`,
    `Privacy policy: ${base}/datenschutz`,
  ].join("\n");

  const row = (a: string, b: string, bold = false) =>
    `<tr><td style="padding:6px 0;${bold ? "font-weight:700;" : ""}">${a}</td><td style="padding:6px 0;text-align:right;${bold ? "font-weight:700;" : ""}">${b}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#FFFDF8;font-family:Segoe UI,Arial,sans-serif;color:#202020">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <p style="font-size:13px;font-weight:800;letter-spacing:.08em;color:#176B45;margin:0 0 16px">THREE TYRES <span style="color:#B35C00">GROCERY</span></p>
  <h1 style="font-size:24px;margin:0 0 8px">Thank you, ${esc(first)}!</h1>
  <p style="margin:0 0 20px;color:#69635A">Your order <b>${no}</b> has been received.</p>
  <table style="width:100%;border-collapse:collapse;font-size:15px;border-top:1px solid #E8E5DF;border-bottom:1px solid #E8E5DF">
    ${lines.map((l) => row(esc(l.label), l.amount)).join("")}
  </table>
  <table style="width:100%;border-collapse:collapse;font-size:15px;margin-top:8px">
    ${row("Subtotal", money(o.subtotalCents))}${row("Delivery", fee)}${row("Total (incl. VAT)", money(o.totalCents), true)}
  </table>
  <div style="background:#E3EFE7;border-radius:12px;padding:14px 16px;margin:20px 0;font-size:15px">
    <b>Delivery:</b> ${esc(when)}<br><b>Address:</b> ${esc(address)}<br><b>Payment:</b> ${esc(PAYMENT_TEXT[o.paymentMethod] ?? "")}
  </div>
  <p style="margin:0 0 24px"><a href="${esc(link)}" style="display:inline-block;background:#176B45;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">View your order</a></p>
  <p style="font-size:13px;color:#69635A;margin:0">
    <a href="${esc(base)}/agb" style="color:#176B45">Terms of sale</a> ·
    <a href="${esc(base)}/widerruf" style="color:#176B45">Right of withdrawal</a> ·
    <a href="${esc(base)}/datenschutz" style="color:#176B45">Privacy policy</a>
  </p>
</div></body></html>`;

  return { subject: `Your order ${no} with Three Tyres Grocery`, text, html };
}

function ownerAlert(o: LoadedOrder, base: string) {
  const no = orderNo(o.number);
  const text = [
    `New order ${no} · ${money(o.totalCents)}`,
    `${o.customerName} · ${o.phone}`,
    `${o.street}${o.apartment ? ", " + o.apartment : ""}, ${o.postcode}`,
    `Delivery ${formatDay(o.deliveryDate)} · ${o.paymentMethod === "WHATSAPP" ? "confirm on WhatsApp" : "pay on delivery"}`,
    ...orderLines(o).map((l) => `• ${l.label}`),
    o.note ? `Note: ${o.note}` : "",
    `${base}/admin/orders/${o.id}`,
  ].filter(Boolean).join("\n");
  return { subject: `New order ${no} · ${money(o.totalCents)} · ${o.customerName}`, text };
}

/** Sends the customer's confirmation and the shop's new-order alert. Never throws. */
export async function notifyNewOrder(orderId: string, base: string) {
  const o = await loadOrder(orderId).catch(() => null);
  if (!o) return;
  const jobs: Promise<unknown>[] = [];
  const c = customerEmail(o, base);
  jobs.push(sendMail(o.email, c.subject, c.text, c.html));
  const a = ownerAlert(o, base);
  if (process.env.SHOP_NOTIFY_EMAIL) {
    jobs.push(sendMail(process.env.SHOP_NOTIFY_EMAIL, a.subject, a.text, `<pre style="font:15px/1.5 Segoe UI,Arial,sans-serif">${esc(a.text)}</pre>`));
  }
  jobs.push(sendTelegram(a.text));
  for (const r of await Promise.allSettled(jobs)) {
    if (r.status === "rejected") console.error(`Notification for order ${orderNo(o.number)} failed:`, r.reason);
  }
}
