const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Formats an ISO date (or timestamp) as German TT.MM.JJJJ. Returns '' for empty/invalid input. */
export function formatDate(value: string | null | undefined): string {
  const match = value ? ISO_DATE.exec(value) : null;
  if (!match) return '';
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}
