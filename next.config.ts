import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "@prisma/client": "./lib/generated/prisma/client",
    },
  },
};

export default withNextIntl(nextConfig);
