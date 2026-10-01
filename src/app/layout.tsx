import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "700", "800"] });
const body = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Three Tyres Grocery · Indian groceries. Delivered to Berlin.", template: "%s · Three Tyres Grocery" },
  description: "Indian & South Asian groceries delivered to your door in Berlin. Rice, atta, dal, spices, snacks and more. 1-day delivery, order online or on WhatsApp.",
  // Google Search Console ownership check; set GOOGLE_SITE_VERIFICATION to the code Google gives you
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#176B45",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
