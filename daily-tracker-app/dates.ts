const pad = (n: number) => String(n).padStart(2, '0');

// Local-time YYYY-MM-DD (toISOString would shift the day for UTC+ zones like IST)
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: string, n: number) => {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

// Monday-based week containing the date
export const weekOf = (s: string) => {
  const d = fromISO(s);
  const offset = (d.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => addDays(s, i - offset));
};

export const today = () => toISO(new Date());