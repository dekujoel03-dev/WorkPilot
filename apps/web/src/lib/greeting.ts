/** Salutation selon l'heure locale du navigateur. */
export function formatTimeGreeting(firstName?: string | null): string {
  const hour = new Date().getHours();
  const name = firstName?.trim();

  let prefix: string;
  if (hour < 12) prefix = 'Bonjour';
  else if (hour < 18) prefix = 'Bon après-midi';
  else prefix = 'Bonsoir';

  return name ? `${prefix}, ${name}` : prefix;
}
