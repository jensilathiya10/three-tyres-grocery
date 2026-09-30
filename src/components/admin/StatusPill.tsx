export const STATUS_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  NEW: "New", CONFIRMED: "Confirmed", PREPARING: "Preparing", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

/** Statuses staff can set. "Awaiting payment" is set and cleared by Stripe only. */
export const STATUS_ORDER = ["NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;
export const STATUS_TABS = ["AWAITING_PAYMENT", ...STATUS_ORDER] as const;

export const PAYMENT_LABEL: Record<string, string> = { ONLINE: "Online", ON_DELIVERY: "On delivery", WHATSAPP: "WhatsApp" };

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill-${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}
