import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Free-licensed fighter photos from Wikimedia (see scripts/fetch-fighter-images.mjs).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
      // Google account profile photos (for signed-in users).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
