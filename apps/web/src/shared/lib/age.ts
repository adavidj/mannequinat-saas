export function calculateAge(birthDate: string, now: Date = new Date()): number {
  const date = new Date(birthDate);
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

export function isAtLeast18(birthDate: string, now: Date = new Date()): boolean {
  return calculateAge(birthDate, now) >= 18;
}
