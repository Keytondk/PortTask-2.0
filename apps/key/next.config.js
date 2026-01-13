/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@navo/ui', '@navo/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
