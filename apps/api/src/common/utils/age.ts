/**
 * Règles d'âge partagées par l'inscription et le profil modèle.
 *
 * La majorité civile béninoise est fixée à 18 ans : la plateforme refuse les
 * mineurs dès la création du compte ET à chaque écriture de la date de
 * naissance dans le profil (le profil ne doit pas permettre de contourner
 * l'inscription).
 */
export function calculateAge(birthDate: string | Date, now: Date = new Date()): number {
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (Number.isNaN(date.getTime())) {
    return Number.NaN;
  }

  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

export function isAtLeast18(birthDate: string | Date, now: Date = new Date()): boolean {
  return calculateAge(birthDate, now) >= 18;
}
