/** The site's public address for search engines: APP_URL when set, otherwise the free Vercel address. */
export const publicUrl = () => (process.env.APP_URL || "https://three-tyres-grocery.vercel.app").replace(/\/$/, "");
