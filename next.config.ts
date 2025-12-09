import { resolve } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: { turbopackUseSystemTlsCerts: true },
    transpilePackages: ['flappa-doormal'],
    turbopack: { root: resolve(process.cwd(), '..') },
};

export default nextConfig;
