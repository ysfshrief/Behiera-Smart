import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite is a Node built-in; keep it out of the bundler graph.
  serverExternalPackages: [],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
