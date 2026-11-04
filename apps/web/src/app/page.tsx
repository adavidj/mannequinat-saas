import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Accueil',
};

const parcours = [
  {
    title: 'Débutant',
    body: 'Trois photos guidées, sans filtre, et vos mensurations. Votre profil reste privé : seules les agences vérifiées peuvent le consulter.',
    points: ['Portrait + pied face + pied profil', 'Jamais public', 'Progression vers confirmé'],
  },
  {
    title: 'Confirmé',
    body: 'Ajoutez vos expériences professionnelles. Une expérience validée par notre équipe fait évoluer votre profil vers le niveau confirmé.',
    points: ['Expériences vérifiées', 'Visibilité élargie', 'Portfolio enrichi'],
  },
  {
    title: 'Agence vérifiée',
    body: 'Les agences et recruteurs présentent leur IFU ou RCCM. Après vérification, ils accèdent à la découverte et à la messagerie.',
    points: ['IFU / RCCM contrôlés', 'Messagerie encadrée', 'Signalement et blocage'],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-brand-800">
            ModelBénin
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5">
            <a
              href="#parcours"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
            >
              Parcours
            </a>
            <a
              href="#confiance"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
            >
              Confiance
            </a>
            <Link
              href="/connexion"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800 ring-1 ring-inset ring-brand-200">
              Bénin · Mannequinat & modèle photo
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Le mannequinat béninois, sans intermédiaire opaque.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Un profil unique, deux niveaux, des agences réellement vérifiées. Les débutants
              restent privés tant que leurs photos guidées ne sont pas validées.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
              >
                Créer mon profil
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                J’ai déjà un compte
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-600 p-1 shadow-xl">
            <div className="rounded-[22px] bg-white p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Ce qui change
              </h2>
              <ul className="mt-4 space-y-4">
                {[
                  ['Photos fiables', 'Consigne guidée, lumière naturelle, sans retouche.'],
                  ['Confidentialité par paliers', 'Privé, agences vérifiées, puis public.'],
                  ['Contact encadré', 'Quota anti-spam, blocage et signalement.'],
                  ['Données protégées', 'Date de naissance et mensurations chiffrées.'],
                ].map(([title, body]) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                      ✓
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{title}</p>
                      <p className="text-sm text-slate-600">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="parcours" className="border-y border-slate-200 bg-slate-50 py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Un seul profil, deux niveaux
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Un débutant devient confirmé en ajoutant des expériences vérifiées. La progression est
              visible, sans changer de plateforme.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {parcours.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  <ul className="mt-4 space-y-2">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="confiance" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                La confiance se construit dans les détails
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Chaque accès aux photos est journalisé. Les agences voient uniquement ce que le
                modèle a explicitement consenti à partager, et peuvent être bloquées à tout moment.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['18 ans et plus', 'Contrôle à l’inscription et à chaque mise à jour du profil.'],
                ['Modération humaine', 'Chaque photo est examinée avant publication.'],
                ['Stockage privé', 'URLs signées de courte durée, aucun fichier public.'],
                ['Signalements', 'Un canal dédié pour les comportements abusifs.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-brand-800 py-14">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Prêt à créer votre profil ?
              </h2>
              <p className="mt-2 text-sm text-brand-100">
                Inscription gratuite. Les trois photos guidées sont indispensables pour être visible
                par les agences vérifiées.
              </p>
            </div>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50"
            >
              Commencer maintenant
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ModelBénin — Cotonou, Bénin.</p>
          <nav className="flex flex-wrap gap-4">
            <Link
              className="font-medium text-slate-600 hover:text-slate-900"
              href="/mentions-legales"
            >
              Mentions légales
            </Link>
            <Link
              className="font-medium text-slate-600 hover:text-slate-900"
              href="/confidentialite"
            >
              Politique de confidentialité
            </Link>
            <span>CGU en cours de rédaction avant l’ouverture publique.</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
