import path from 'node:path';

import type { NextConfig } from 'next';

import { buildSecurityHeaders } from './src/shared/lib/security-headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@modelbenin/shared'],
  // Le monorepo contient un pnpm-workspace.yaml à la racine : on fixe la racine
  // Turbopack pour éviter qu'elle ne remonte au dossier utilisateur.
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  experimental: {
    // Rappels de mise à jour de sécurité gérés par `next upgrade --agent`.
    agentUpgrade: 'security',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
