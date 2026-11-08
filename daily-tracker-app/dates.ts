const pad = (n: number) => String(n).padStart(2, "0");

// Local-time YYYY-MM-DD (toISOString would shift the day for UTC+ zones like IST)
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
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
export const monthStart = (s: string) => `${s.slice(0, 7)}-01`;
export const monthEnd = (s: string) => {
  const d = fromISO(s);
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};
export const addMonths = (s: string, n: number) => {
  const d = fromISO(s);
  return toISO(new Date(d.getFullYear(), d.getMonth() + n, 1));
};
export const today = () => toISO(new Date());
