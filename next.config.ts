import path from 'node:path';
import type { NextConfig } from 'next';

const transpilePackages: string[] = [];

const nextConfig: NextConfig = {
    reactCompiler: true,
    ...(transpilePackages.length && {
        experimental: { turbopackUseSystemTlsCerts: true },
        transpilePackages,
        turbopack: { root: path.resolve(process.cwd(), '..') },
    }),
};

export default nextConfig;
