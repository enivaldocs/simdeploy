import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@simdeploy/shared",
    "@simdeploy/db",
    "@simdeploy/finance",
    "@simdeploy/framework-detector",
    "@simdeploy/project-analyzer",
    "@simdeploy/cost-engine",
    "@simdeploy/deployment-engine",
    "@simdeploy/provider-core",
    "@simdeploy/provider-local",
    "@simdeploy/provider-cloudflare",
    "@simdeploy/build-engine",
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
