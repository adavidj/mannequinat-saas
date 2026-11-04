import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ModelBénin — Le mannequinat béninois, en confiance',
    template: '%s · ModelBénin',
  },
  description:
    'Plateforme de mise en relation sécurisée entre modèles, agences vérifiées et organismes de formation au Bénin.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
