import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: { turbopackUseSystemTlsCerts: true },
    // turbopack.root: join(__dirname, '..') - needed if using npm link with shamela
};

export default nextConfig;
