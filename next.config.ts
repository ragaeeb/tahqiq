import path from 'node:path';
import type { NextConfig } from 'next';

const transpilePackages: string[] = [];

const nextConfig: NextConfig = {
    reactStrictMode: false,
    ...(transpilePackages.length && {
        experimental: { turbopackUseSystemTlsCerts: true },
        transpilePackages,
        turbopack: { root: path.resolve(process.cwd(), '..') },
    }),
};

export default nextConfig;
