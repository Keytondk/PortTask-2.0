/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@navo/ui', '@navo/shared', '@navo/design-tokens'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
