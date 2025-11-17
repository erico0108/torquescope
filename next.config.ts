import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  ...({
    experimental: {
      reactCompiler: true,
      serverActions: { bodySizeLimit: '5mb' },
    },
  } as NextConfig),
};

export default nextConfig;
