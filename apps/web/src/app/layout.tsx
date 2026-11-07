import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ModelBénin — La maison du mannequinat béninois',
    template: '%s · ModelBénin',
  },
  description:
    'La plateforme de mise en relation sécurisée entre les modèles du Bénin, les agences vérifiées et les organismes de formation.',
  applicationName: 'ModelBénin',
  keywords: ['mannequinat', 'Bénin', 'modèle', 'agence', 'Cotonou', 'casting'],
};

export const viewport: Viewport = {
  themeColor: '#0a0a09',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" className={`${manrope.variable} ${cormorant.variable}`}>
      <body className="font-sans">
        <noscript>
          {/* Sans JavaScript, les animations d'apparition ne se déclenchent jamais :
              on rend tout le contenu immédiatement visible. */}
          <style>{`.reveal{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
