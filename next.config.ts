import path from 'node:path';
import type { NextConfig } from 'next';

const isShadowStaticExport = process.env.TAHQIQ_STATIC_EXPORT === '1';
const transpilePackages: string[] = [];

const nextConfig: NextConfig = {
    productionBrowserSourceMaps: false,
    reactCompiler: true,
    ...(isShadowStaticExport && { images: { unoptimized: true }, output: 'export' as const, trailingSlash: true }),
    ...(transpilePackages.length && {
        transpilePackages,
        turbopack: { root: path.resolve(process.cwd(), '..') },
        turbopackUseSystemTlsCerts: true,
    }),
};

export default nextConfig;
