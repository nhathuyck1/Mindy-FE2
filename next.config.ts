import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Isolate a review build from the default preview when both run in this workspace.
  distDir: process.env.MINDY_DIST_DIR ?? '.next',
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  /* config options here */
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
