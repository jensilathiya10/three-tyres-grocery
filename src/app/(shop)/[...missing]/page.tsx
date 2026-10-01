import { notFound } from "next/navigation";

// Sends unknown addresses to the shop's not-found page, so they keep the header, footer and cart
export default function Missing() {
  notFound();
}
