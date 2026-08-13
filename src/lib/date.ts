/** Hebrew date helpers. All functions accept an ISO string or a Date. */

const HE = 'he-IL';

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function startOfDay(value: string | Date): Date {
  const date = toDate(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from today; negative for the past. */
export function daysFromToday(value: string | Date): number {
  const target = startOfDay(value).getTime();
  const today = startOfDay(new Date()).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function isToday(value: string | Date): boolean {
  return daysFromToday(value) === 0;
}

export function isPast(value: string | Date): boolean {
  return daysFromToday(value) < 0;
}

/** "16 באוג׳" */
export function formatShortDate(value: string | Date): string {
  return new Intl.DateTimeFormat(HE, { day: 'numeric', month: 'short' }).format(toDate(value));
}

/** "16 באוגוסט 2026" */
export function formatLongDate(value: string | Date): string {
  return new Intl.DateTimeFormat(HE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(toDate(value));
}

/** "יום שישי" */
export function formatWeekday(value: string | Date): string {
  return new Intl.DateTimeFormat(HE, { weekday: 'long' }).format(toDate(value));
}

/** "05/08" — the compact form used on the timeline. */
export function formatDayMonth(value: string | Date): string {
  const date = toDate(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/** "14:30" */
export function formatTime(value: string | Date): string {
  return new Intl.DateTimeFormat(HE, { hour: '2-digit', minute: '2-digit' }).format(toDate(value));
}

/** "היום", "מחר", "יום שישי" or the full date when further out. */
export function formatRelativeDay(value: string | Date): string {
  const diff = daysFromToday(value);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff === -1) return 'אתמול';
  if (diff > 1 && diff < 7) return formatWeekday(value);
  if (diff < -1 && diff > -7) return `לפני ${Math.abs(diff)} ימים`;
  return formatShortDate(value);
}

/** "לפני 3 שעות" — used in the notification feed. */
export function formatAgo(value: string | Date): string {
  const minutes = Math.round((Date.now() - toDate(value).getTime()) / 60_000);
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'אתמול';
  if (days < 30) return `לפני ${days} ימים`;
  return formatShortDate(value);
}

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function dayName(day: number): string {
  return DAY_NAMES[day] ?? '';
}

export function addDays(value: string | Date, days: number): Date {
  const date = toDate(value);
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toISODate(value: string | Date): string {
  const date = startOfDay(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
