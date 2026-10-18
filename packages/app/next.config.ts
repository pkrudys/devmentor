import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default tracing root is this package's own directory; without this,
  // Next excludes the hoisted root node_modules from the build trace.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // Turbopack auto-transpiles workspace packages under the App Router, but
  // listing them keeps `next build --webpack` working the same way.
  transpilePackages: ["@devmentor/core", "@devmentor/db", "@devmentor/ui"],
};

export default nextConfig;
