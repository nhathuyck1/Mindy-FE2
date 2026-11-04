import { readServerEnv } from './src/lib/env-config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Isolate a review build from the default preview when both run in this workspace.
  distDir: process.env.MINDY_DIST_DIR ?? '.next',
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: new URL('/socket.io/:path*', readServerEnv().apiBaseUrl).toString(),
      },
      {
        source: '/ws/whiteboards',
        destination: new URL('/ws/whiteboards', readServerEnv().apiBaseUrl).toString(),
      },
    ];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
