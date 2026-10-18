import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Dev only: also allow http://127.0.0.1:3000. Without this, Next.js blocks its dev scripts on that
  // origin and pages never hydrate (buttons like the password eye do nothing).
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
