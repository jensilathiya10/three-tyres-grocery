import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json higher up the drive confuses root detection
  turbopack: { root: __dirname },
  // Hide the "N" badge in development; build or runtime errors still show
  devIndicators: false,
  // Legal texts are read from disk at request time; make sure hosting bundles include them
  outputFileTracingIncludes: { "/*": ["./content/**/*"] },
};

export default nextConfig;
