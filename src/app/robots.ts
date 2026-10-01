import type { MetadataRoute } from "next";
import { publicUrl } from "@/lib/public-url";

export default function robots(): MetadataRoute.Robots {
  return {
    // Admin, cart, checkout and personal order pages are of no use in search results
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/cart", "/checkout", "/order/", "/api/"] },
    sitemap: `${publicUrl()}/sitemap.xml`,
  };
}
