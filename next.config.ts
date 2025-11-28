import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
