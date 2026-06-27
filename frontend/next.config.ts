import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', 'antd', 'recharts', '@ant-design/icons'],
  },
};

export default nextConfig;
