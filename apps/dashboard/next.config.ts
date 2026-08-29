import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@autocloud/shared",
    "@autocloud/db",
    "@autocloud/framework-detector",
    "@autocloud/project-analyzer",
    "@autocloud/cost-engine",
    "@autocloud/deployment-engine",
    "@autocloud/provider-core",
    "@autocloud/provider-local",
    "@autocloud/provider-cloudflare",
    "@autocloud/build-engine",
  ],
  serverExternalPackages: ["@prisma/client", "tar"],
  webpack: (config) => {
    // Pacotes internos usam imports ESM "./x.js" apontando para fontes .ts
    // (estilo NodeNext); ensina o webpack a resolver.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
