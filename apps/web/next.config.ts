import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@modelbenin/shared'],
  // Le monorepo contient un pnpm-workspace.yaml à la racine : on fixe la racine
  // Turbopack pour éviter qu'elle ne remonte au dossier utilisateur.
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
