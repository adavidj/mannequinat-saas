/**
 * Verrouillage progressif des comptes après des échecs de connexion répétés.
 *
 * Les premiers essais sont libres pour ne pas gêner une faute de frappe. À
 * partir du cinquième échec, chaque tentative supplémentaire multiplie le délai
 * par quatre, plafonné à 24 heures. Le calcul est isolé ici pour être testé
 * sans base de données ni horloge réelle.
 */
export const LOCKOUT_THRESHOLD = 5;
export const BASE_LOCK_MS = 30_000;
export const MAX_LOCK_MS = 24 * 60 * 60 * 1000;

export function loginLockDelayMs(failedAttempts: number): number {
  if (failedAttempts < LOCKOUT_THRESHOLD) {
    return 0;
  }
  const exponent = failedAttempts - LOCKOUT_THRESHOLD;
  return Math.min(BASE_LOCK_MS * 4 ** exponent, MAX_LOCK_MS);
}
