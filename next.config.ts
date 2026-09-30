import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json higher up the drive confuses root detection
  turbopack: { root: __dirname },
  // Legal texts are read from disk at request time; make sure hosting bundles include them
  outputFileTracingIncludes: { "/*": ["./content/**/*"] },
};

export default nextConfig;
