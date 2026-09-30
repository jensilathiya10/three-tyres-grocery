const SHOP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

export const DEFAULT_WA_TEXT = "Hi! I'd like to order Indian groceries in Berlin.";

/** Link that opens a chat with the shop. With no number configured, WhatsApp asks who to send it to. */
export const waShopLink = (text = DEFAULT_WA_TEXT) =>
  `https://wa.me/${SHOP_NUMBER}?text=${encodeURIComponent(text)}`;

/** Link that opens a chat with a customer, used from the admin order page. */
export function waCustomerLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "49" + digits.slice(1); // German national format
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
